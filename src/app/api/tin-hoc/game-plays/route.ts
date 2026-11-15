import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeHtmlGamePlayPayload } from "@/lib/game-play-recorder";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập để lưu kết quả lượt chơi." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const projectIdInput =
      typeof body.projectId === "string" ? body.projectId.trim() : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!projectIdInput && !slugInput) {
      return NextResponse.json(
        { error: "Thiếu định danh trò chơi (projectId hoặc slug)." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: projectIdInput ? { id: projectIdInput } : { slug: slugInput },
      select: { id: true, slug: true, title: true, gradeLevel: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Không tìm thấy trò chơi HTML cần ghi nhận lượt chơi." },
        { status: 404 }
      );
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { schoolClass: true },
    });

    if (!studentProfile) {
      return NextResponse.json(
        {
          recorded: false,
          reason: "NON_STUDENT_SESSION",
          message:
            "Tài khoản hiện tại không phải hồ sơ học sinh nên không ghi vào bảng điểm học sinh.",
        },
        { status: 200 }
      );
    }

    const subject =
      (await prisma.subject.findFirst({
        where: {
          OR: [
            { code: `TIN${project.gradeLevel}` },
            { code: "TIN7" },
            { name: { contains: "Tin học" } },
          ],
        },
      })) || (await prisma.subject.findFirst());

    if (!subject) {
      return NextResponse.json(
        { error: "Chưa có môn học trong cơ sở dữ liệu để gắn LearningRecord." },
        { status: 400 }
      );
    }

    const normalized = normalizeHtmlGamePlayPayload(body);

    const existingRecords = await prisma.learningRecord.findMany({
      where: {
        studentId: studentProfile.id,
        activityType: "HTML_GAME_PLAY",
      },
      orderBy: { recordedAt: "desc" },
      take: 200,
    });

    if (normalized.idempotencyKey) {
      const duplicate = existingRecords.find((rec) => {
        if (!rec.detailData) return false;
        try {
          const parsed = JSON.parse(rec.detailData);
          return parsed?.idempotencyKey === normalized.idempotencyKey;
        } catch {
          return false;
        }
      });

      if (duplicate) {
        let parsedDetail: Record<string, any> = {};
        try {
          parsedDetail = duplicate.detailData ? JSON.parse(duplicate.detailData) : {};
        } catch {}
        return NextResponse.json({
          recorded: true,
          deduplicated: true,
          recordId: duplicate.id,
          attemptNumber: parsedDetail.attemptNumber || 1,
          score10: duplicate.score,
        });
      }
    }

    const projectPlayCount = existingRecords.filter((rec) => {
      if (!rec.detailData) return false;
      try {
        const parsed = JSON.parse(rec.detailData);
        return parsed?.projectId === project.id || parsed?.projectSlug === project.slug;
      } catch {
        return false;
      }
    }).length;

    const attemptNumber = projectPlayCount + 1;

    const created = await prisma.learningRecord.create({
      data: {
        studentId: studentProfile.id,
        subjectId: subject.id,
        activityType: "HTML_GAME_PLAY",
        score: normalized.score10,
        accuracyRate: normalized.accuracyRate,
        timeSpentSeconds: normalized.timeSpentSeconds,
        detailData: JSON.stringify({
          projectId: project.id,
          projectSlug: project.slug,
          projectTitle: project.title,
          gradeLevel: project.gradeLevel,
          attemptNumber,
          rawScore: normalized.rawScore,
          maxScore: normalized.maxScore,
          wrongTopics: normalized.wrongTopics,
          eventType: normalized.eventType,
          idempotencyKey: normalized.idempotencyKey,
          studentCode: studentProfile.studentCode,
          className: studentProfile.schoolClass?.name || null,
        }),
      },
    });

    return NextResponse.json({
      recorded: true,
      deduplicated: false,
      recordId: created.id,
      attemptNumber,
      score10: created.score,
      accuracyRate: created.accuracyRate,
      timeSpentSeconds: created.timeSpentSeconds,
    });
  } catch (err: any) {
    console.error("[GAME_PLAY_RECORD_ERROR]", err?.message || err);
    return NextResponse.json(
      { error: "Không thể lưu kết quả lượt chơi HTML." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const isStaff = ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"].includes(session.role);

  let studentFilter: { studentId?: string } = {};
  if (!isStaff) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ records: [] });
    }
    studentFilter = { studentId: profile.id };
  }

  const rows = await prisma.learningRecord.findMany({
    where: {
      activityType: "HTML_GAME_PLAY",
      ...studentFilter,
    },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          schoolClass: { select: { name: true } },
        },
      },
    },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  const records = rows
    .map((row) => {
      let detail: Record<string, any> = {};
      try {
        detail = row.detailData ? JSON.parse(row.detailData) : {};
      } catch {}
      return {
        id: row.id,
        studentCode: row.student?.studentCode || detail.studentCode || "Chưa có dữ liệu",
        studentName: row.student?.user?.fullName || "Chưa có dữ liệu",
        className: row.student?.schoolClass?.name || detail.className || "Chưa có dữ liệu",
        projectId: detail.projectId || null,
        projectSlug: detail.projectSlug || null,
        projectTitle: detail.projectTitle || "Trò chơi HTML",
        attemptNumber: detail.attemptNumber || 1,
        score10: row.score,
        accuracyRate: row.accuracyRate,
        timeSpentSeconds: row.timeSpentSeconds,
        wrongTopics: Array.isArray(detail.wrongTopics) ? detail.wrongTopics : [],
        recordedAt: row.recordedAt,
      };
    })
    .filter((item) => (!projectId ? true : item.projectId === projectId));

  return NextResponse.json({ records });
}
