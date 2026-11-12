import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { submitAssignmentTransactional } from "@/lib/submission-guard";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập để nộp bài tập." },
        { status: 401 }
      );
    }

    if (session.role !== "STUDENT" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN: Chỉ tài khoản Học sinh mới được phép nộp bài tập." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      assignmentId,
      content,
      driveUrl,
      assetIds,
      selfAssessment,
      studentEmail,
      idempotencyKey,
    } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Thiếu mã bài tập (assignmentId)." },
        { status: 400 }
      );
    }

    // If STUDENT, strictly enforce their own profile; if SUPER_ADMIN testing Student View, allow studentEmail
    const targetEmail =
      session.role === "STUDENT"
        ? session.user.email
        : studentEmail || session.user.email;

    const studentUser = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: {
        studentProfile: {
          include: {
            schoolClass: true,
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!studentUser || !studentUser.studentProfile) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ học sinh tương ứng." },
        { status: 404 }
      );
    }

    const attachmentItems: Array<Record<string, unknown>> = [];
    if (driveUrl && String(driveUrl).trim()) {
      attachmentItems.push({
        url: String(driveUrl).trim(),
        type: "DRIVE_LINK",
        title: "Sản phẩm nộp đính kèm (Drive)",
      });
    }
    if (Array.isArray(assetIds) && assetIds.length > 0) {
      for (const id of assetIds) {
        attachmentItems.push({
          assetId: String(id),
          type: "ASSET_FILE",
          title: "Tệp tải lên kho học liệu",
        });
      }
    }

    const attachmentsJson =
      attachmentItems.length > 0 ? JSON.stringify(attachmentItems) : null;

    const fullContent = selfAssessment
      ? `${content || ""}\n\n[TỰ ĐÁNH GIÁ CỦA HỌC SINH]:\n${selfAssessment}`
      : String(content || "");

    const enrolledClassIds = studentUser.studentProfile.enrollments.map(
      (e) => e.classId
    );

    const result = await submitAssignmentTransactional({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.role,
      studentProfileId: studentUser.studentProfile.id,
      studentCode: studentUser.studentProfile.studentCode,
      studentClassId: studentUser.studentProfile.classId,
      studentClassName: studentUser.studentProfile.schoolClass?.name || null,
      enrolledClassIds,
      assignmentId: String(assignmentId),
      content: fullContent,
      attachmentsJson,
      selfAssessment: selfAssessment ? String(selfAssessment) : null,
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      idempotentReplay: result.idempotentReplay,
      submission: result.submission,
    });
  } catch (err: any) {
    console.error("Submission API Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi server" },
      { status: 500 }
    );
  }
}
