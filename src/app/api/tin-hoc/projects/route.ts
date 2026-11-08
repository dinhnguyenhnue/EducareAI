import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  analyzeStudentHtmlCode,
  MAX_HTML_GAME_SIZE_BYTES,
} from "@/lib/html-game-sandbox";
import {
  purgeTinHocDemoData,
  seedTinHocDemoData,
} from "@/lib/tin-hoc-seed";

function isTeacherOrAdmin(role: string): boolean {
  return role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";
}

// In-memory rate limiter per user for submissions & comments (Section 7 & 11)
const rateLimitBucket = new Map<string, number[]>();
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimitBucket.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    rateLimitBucket.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitBucket.set(key, timestamps);
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const projectId = searchParams.get("projectId");
  const mode = searchParams.get("mode"); // "EMBED" | "LIBRARY" | "MODERATION"

  const session = await getServerSession();

  // 1. Standalone Embed Mode (/embed/tro-choi/[slug]) for Google Sites
  if (slug && mode === "EMBED") {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: { versions: true },
    });

    if (!project || project.status !== "APPROVED" || !project.approvedVersionId) {
      return NextResponse.json(
        { error: "Trò chơi chưa được duyệt công khai hoặc đã tạm ẩn." },
        { status: 404 }
      );
    }

    const approvedVersion = project.versions.find(
      (v) => v.id === project.approvedVersionId && v.status === "APPROVED"
    );

    if (!approvedVersion) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên bản đã duyệt hợp lệ." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        displayAuthorName: project.displayAuthorName,
        className: project.className,
        gradeLevel: project.gradeLevel,
        lessonTitle: project.lessonTitle,
        learningObjective: project.learningObjective,
        gameType: project.gameType,
        howToPlay: project.howToPlay,
        knowledgeSummary: project.knowledgeSummary,
        referenceSources: project.referenceSources,
        isDemoData: project.isDemoData,
        approvedVersion: {
          id: approvedVersion.id,
          versionNumber: approvedVersion.versionNumber,
          htmlSourceCode: approvedVersion.htmlSourceCode,
          fileSizeBytes: approvedVersion.fileSizeBytes,
          staticScanJson: approvedVersion.staticScanJson,
        },
      },
    });
  }

  // All other modes require authentication
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const teacherView =
    isTeacherOrAdmin(session.role) &&
    session.activeViewRole !== "STUDENT" &&
    mode !== "STUDENT_VIEW";

  // Check if a student is trying to inspect a specific projectId that belongs to someone else and is not APPROVED
  if (projectId) {
    const target = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        comments: { where: { status: "VISIBLE" }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
    }

    if (!teacherView && target.authorId !== session.user.id && target.status !== "APPROVED") {
      return NextResponse.json(
        {
          error:
            "FORBIDDEN: Học sinh không được xem bản nháp hoặc sản phẩm chờ duyệt của học sinh khác.",
        },
        { status: 403 }
      );
    }
  }

  if (teacherView) {
    const [allProjects, moderationLogs] = await Promise.all([
      prisma.project.findMany({
        include: {
          versions: { orderBy: { versionNumber: "desc" } },
          comments: { orderBy: { createdAt: "desc" } },
          reports: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.moderationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      projects: allProjects,
      moderationLogs,
    });
  }

  // Student view: Only query APPROVED projects or the student's own projects at the database level
  const visibleProjects = await prisma.project.findMany({
    where: {
      OR: [
        { status: "APPROVED", approvedVersionId: { not: null } },
        { authorId: session.user.id },
      ],
    },
    include: {
      versions: { orderBy: { versionNumber: "desc" } },
      comments: {
        where: { status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const publicApprovedProjects = visibleProjects
    .filter((p) => p.status === "APPROVED" && p.approvedVersionId)
    .map((p) => {
      const approvedVer = p.versions.find((v) => v.id === p.approvedVersionId);
      return {
        ...p,
        // Never leak unapproved v2 HTML to other students while v2 is PENDING_REVIEW!
        versions: approvedVer ? [approvedVer] : [],
        activePlayableVersion: approvedVer || null,
      };
    });

  const myOwnProjects = visibleProjects.filter((p) => p.authorId === session.user.id);

  return NextResponse.json({
    projects: publicApprovedProjects,
    myProjects: myOwnProjects,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const action = body.action;

  // 1. STUDENT / TEACHER: Create or Update Project / Submit New Version
  if (action === "SUBMIT_PROJECT_OR_VERSION") {
    if (!checkRateLimit(`submit:${session.user.id}`, 6, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED: Bạn thao tác nộp quá nhanh. Vui lòng đợi 1 phút." },
        { status: 429 }
      );
    }

    const {
      projectId,
      title,
      lessonTitle,
      learningObjective,
      gameType = "QUIZ_10",
      howToPlay,
      knowledgeSummary,
      referenceSources,
      aiToolsUsed,
      studentContribution,
      htmlSourceCode,
      changelog,
      submitForReview = true,
    } = body;

    if (
      !title ||
      !lessonTitle ||
      !learningObjective ||
      !howToPlay ||
      !referenceSources ||
      !aiToolsUsed ||
      !studentContribution ||
      !htmlSourceCode
    ) {
      return NextResponse.json(
        {
          error:
            "Vui lòng điền đầy đủ thông tin bắt buộc: Tên trò chơi, Bài học, Mục tiêu, Cách chơi, Nguồn kiến thức, Khai báo sử dụng AI, Đóng góp cá nhân và Mã HTML.",
        },
        { status: 400 }
      );
    }

    const scan = analyzeStudentHtmlCode(String(htmlSourceCode));
    if (!scan.isWithinSizeLimit) {
      return NextResponse.json(
        {
          error: `FILE_TOO_LARGE: Dung lượng mã HTML (${scan.fileSizeBytes} bytes) vượt quá giới hạn ${MAX_HTML_GAME_SIZE_BYTES} bytes (256 KB).`,
        },
        { status: 400 }
      );
    }

    // If updating an existing project: verify ownership!
    if (projectId) {
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      if (!existing) {
        return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
      }

      if (existing.authorId !== session.user.id && !isTeacherOrAdmin(session.role)) {
        return NextResponse.json(
          { error: "FORBIDDEN: Bạn không có quyền chỉnh sửa sản phẩm của học sinh khác." },
          { status: 403 }
        );
      }

      const nextVerNum = (existing.versions[0]?.versionNumber || existing.currentVersionNum) + 1;
      const newVerStatus = submitForReview ? "PENDING_REVIEW" : "DRAFT";

      const createdVersion = await prisma.projectVersion.create({
        data: {
          projectId: existing.id,
          versionNumber: nextVerNum,
          changelog: changelog || `Cập nhật phiên bản v${nextVerNum}`,
          htmlSourceCode: String(htmlSourceCode),
          fileSizeBytes: scan.fileSizeBytes,
          staticScanJson: JSON.stringify(scan),
          status: newVerStatus,
        },
      });

      // CRITICAL RULE (Section 7 & 12 #8):
      // If the project already has an approvedVersionId, keep project.status = "APPROVED" and keep approvedVersionId intact
      // so the previously approved v1 remains live while v2 is PENDING_REVIEW!
      const nextProjectStatus = existing.approvedVersionId
        ? "APPROVED"
        : newVerStatus;

      const updatedProject = await prisma.project.update({
        where: { id: existing.id },
        data: {
          title,
          lessonTitle,
          learningObjective,
          gameType,
          howToPlay,
          knowledgeSummary: knowledgeSummary || learningObjective,
          referenceSources,
          aiToolsUsed,
          studentContribution,
          currentVersionNum: nextVerNum,
          status: nextProjectStatus,
        },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      return NextResponse.json({
        project: updatedProject,
        newVersion: createdVersion,
        scan,
        message: existing.approvedVersionId
          ? `Đã tạo phiên bản v${nextVerNum} (${newVerStatus}). Phiên bản đã duyệt trước đó vẫn được giữ nguyên trên Thư viện cho tới khi Giáo viên duyệt bản mới.`
          : `Đã lưu phiên bản v${nextVerNum} (${newVerStatus}).`,
      });
    }

    // Create brand new Project + Version 1
    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);
    const uniqueSlug = `${baseSlug || "tro-choi-tin-hoc"}-${Date.now().toString(36)}`;
    const initialStatus = submitForReview ? "PENDING_REVIEW" : "DRAFT";

    const createdProject = await prisma.project.create({
      data: {
        slug: uniqueSlug,
        title,
        authorId: session.user.id,
        displayAuthorName: session.user.fullName,
        classId: session.user.studentProfile?.classId || "7A1",
        className: session.user.studentProfile?.schoolClass?.name || "7A1",
        gradeLevel: session.user.studentProfile?.gradeLevel || 7,
        lessonTitle,
        learningObjective,
        gameType,
        howToPlay,
        knowledgeSummary: knowledgeSummary || learningObjective,
        referenceSources,
        aiToolsUsed,
        studentContribution,
        status: initialStatus,
        currentVersionNum: 1,
        isDemoData: false,
        versions: {
          create: {
            versionNumber: 1,
            changelog: changelog || "Phiên bản khởi tạo v1",
            htmlSourceCode: String(htmlSourceCode),
            fileSizeBytes: scan.fileSizeBytes,
            staticScanJson: JSON.stringify(scan),
            status: initialStatus,
          },
        },
      },
      include: { versions: true },
    });

    return NextResponse.json(
      {
        project: createdProject,
        scan,
      },
      { status: 201 }
    );
  }

  // 2. TEACHER / ADMIN ONLY: Moderate Project & Versions (APPROVE, REQUEST_REVISION, HIDE, RESTORE_VERSION)
  if (action === "MODERATE_PROJECT") {
    // Strictly block students from approving their own or anyone else's game (Section 3 & 12 #3)
    if (!isTeacherOrAdmin(session.role)) {
      return NextResponse.json(
        {
          error:
            "FORBIDDEN: Học sinh không có quyền tự duyệt, ẩn hoặc khôi phục phiên bản trò chơi.",
        },
        { status: 403 }
      );
    }

    const { projectId, versionId, decision, feedback } = body;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
    }

    const targetVersion = versionId
      ? project.versions.find((v) => v.id === versionId)
      : project.versions[0];

    if (decision === "APPROVE") {
      if (!targetVersion) {
        return NextResponse.json({ error: "Không tìm thấy phiên bản cần duyệt." }, { status: 404 });
      }

      await prisma.projectVersion.update({
        where: { id: targetVersion.id },
        data: {
          status: "APPROVED",
          teacherFeedback: feedback || "Đã kiểm duyệt nội dung và an toàn Sandbox.",
          reviewedById: session.user.id,
          reviewedByName: session.user.fullName,
          reviewedAt: new Date(),
        },
      });

      const updated = await prisma.project.update({
        where: { id: project.id },
        data: {
          status: "APPROVED",
          approvedVersionId: targetVersion.id,
        },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      await prisma.moderationLog.create({
        data: {
          moderatorId: session.user.id,
          moderatorName: session.user.fullName,
          moderatorRole: session.role,
          targetType: "PROJECT_VERSION",
          targetId: targetVersion.id,
          action: "APPROVE",
          reason: feedback || `Duyệt công khai phiên bản v${targetVersion.versionNumber}`,
          metadataJson: JSON.stringify({
            projectId: project.id,
            versionNumber: targetVersion.versionNumber,
          }),
        },
      });

      return NextResponse.json({ project: updated });
    }

    if (decision === "REQUEST_REVISION") {
      if (targetVersion) {
        await prisma.projectVersion.update({
          where: { id: targetVersion.id },
          data: {
            status: "NEEDS_REVISION",
            teacherFeedback:
              feedback || "Cần chỉnh sửa lại nội dung câu hỏi hoặc giao diện trước khi công bố.",
            reviewedById: session.user.id,
            reviewedByName: session.user.fullName,
            reviewedAt: new Date(),
          },
        });
      }

      // If there was already an older approved version, keep it live; otherwise mark project NEEDS_REVISION
      const updated = await prisma.project.update({
        where: { id: project.id },
        data: {
          status: project.approvedVersionId ? "APPROVED" : "NEEDS_REVISION",
        },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      await prisma.moderationLog.create({
        data: {
          moderatorId: session.user.id,
          moderatorName: session.user.fullName,
          moderatorRole: session.role,
          targetType: "PROJECT_VERSION",
          targetId: targetVersion?.id || project.id,
          action: "REQUEST_REVISION",
          reason: feedback || "Yêu cầu học sinh chỉnh sửa lại phiên bản mới",
        },
      });

      return NextResponse.json({ project: updated });
    }

    if (decision === "HIDE") {
      const updated = await prisma.project.update({
        where: { id: project.id },
        data: { status: "HIDDEN" },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      await prisma.moderationLog.create({
        data: {
          moderatorId: session.user.id,
          moderatorName: session.user.fullName,
          moderatorRole: session.role,
          targetType: "PROJECT",
          targetId: project.id,
          action: "HIDE",
          reason: feedback || "Tạm ẩn trò chơi khỏi thư viện công khai.",
        },
      });

      return NextResponse.json({ project: updated });
    }

    if (decision === "RESTORE_VERSION") {
      if (!targetVersion || targetVersion.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Chỉ có thể khôi phục về một phiên bản đã từng được duyệt (APPROVED)." },
          { status: 400 }
        );
      }

      const updated = await prisma.project.update({
        where: { id: project.id },
        data: {
          status: "APPROVED",
          approvedVersionId: targetVersion.id,
        },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      });

      await prisma.moderationLog.create({
        data: {
          moderatorId: session.user.id,
          moderatorName: session.user.fullName,
          moderatorRole: session.role,
          targetType: "PROJECT",
          targetId: project.id,
          action: "RESTORE_VERSION",
          reason:
            feedback ||
            `Khôi phục phiên bản hiển thị công khai về v${targetVersion.versionNumber}`,
        },
      });

      return NextResponse.json({ project: updated });
    }

    return NextResponse.json({ error: "Quyết định kiểm duyệt không hợp lệ." }, { status: 400 });
  }

  // 3. SAFE PLAIN-TEXT COMMENT WITH RATE LIMIT
  if (action === "ADD_COMMENT") {
    if (!checkRateLimit(`comment:${session.user.id}`, 8, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED: Bạn gửi bình luận quá nhanh. Vui lòng đợi 1 phút." },
        { status: 429 }
      );
    }

    const { projectId, content } = body;
    const rawText = String(content || "").trim();
    if (!projectId || rawText.length < 2 || rawText.length > 500) {
      return NextResponse.json(
        { error: "Nội dung bình luận phải từ 2 đến 500 ký tự." },
        { status: 400 }
      );
    }

    // Strip angle brackets so stored text is strictly safe plain text (never rendered as HTML)
    const plainSafeContent = rawText.replace(/[<>]/g, "");

    const comment = await prisma.comment.create({
      data: {
        projectId,
        authorId: session.user.id,
        authorName: session.user.fullName,
        authorRole: session.role,
        content: plainSafeContent,
        status: "VISIBLE",
        isDemoData: false,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  }

  // 4. REPORT INAPPROPRIATE / BROKEN CONTENT
  if (action === "REPORT_CONTENT") {
    if (!checkRateLimit(`report:${session.user.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED: Vui lòng đợi 1 phút trước khi gửi báo cáo tiếp theo." },
        { status: 429 }
      );
    }

    const { projectId, commentId, reason, details } = body;
    if (!reason || !details) {
      return NextResponse.json(
        { error: "Vui lòng chọn lý do và mô tả chi tiết vấn đề cần báo cáo." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        projectId: projectId || null,
        commentId: commentId || null,
        reporterId: session.user.id,
        reporterName: session.user.fullName,
        reason: String(reason),
        details: String(details).replace(/[<>]/g, "").slice(0, 600),
        status: "OPEN",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  }

  // 5. TEACHER / ADMIN: PURGE OR RESTORE PILOT DEMO DATA (Section 2 & 12 #10)
  if (action === "PURGE_DEMO_DATA" || action === "RESTORE_DEMO_DATA") {
    if (!isTeacherOrAdmin(session.role)) {
      return NextResponse.json(
        { error: "FORBIDDEN: Chỉ Giáo viên hoặc Quản trị viên mới được xóa/khôi phục dữ liệu mẫu." },
        { status: 403 }
      );
    }

    if (action === "PURGE_DEMO_DATA") {
      const result = await purgeTinHocDemoData(prisma);
      await prisma.moderationLog.create({
        data: {
          moderatorId: session.user.id,
          moderatorName: session.user.fullName,
          moderatorRole: session.role,
          targetType: "DEMO_DATA",
          targetId: "PILOT_7A1_DEMO",
          action: "PURGE_DEMO_DATA",
          reason: "Xóa riêng toàn bộ dữ liệu mẫu thử nghiệm [DỮ LIỆU MẪU], giữ nguyên dữ liệu thật.",
          metadataJson: JSON.stringify(result),
        },
      });
      return NextResponse.json(result);
    } else {
      const result = await seedTinHocDemoData(prisma);
      return NextResponse.json(result);
    }
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

