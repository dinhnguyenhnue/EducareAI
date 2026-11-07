import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

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
    const { assignmentId, content, driveUrl, selfAssessment, studentEmail } = body;

    // If STUDENT, enforce their own profile; if SUPER_ADMIN testing Student View, allow studentEmail or default student
    const targetEmail =
      session.role === "STUDENT"
        ? session.user.email
        : studentEmail || "minhanh.nguyen@unigo.edu.vn";

    const studentUser = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: { studentProfile: true },
    });

    if (!studentUser || !studentUser.studentProfile) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ học sinh tương ứng." },
        { status: 404 }
      );
    }

    const attachments = driveUrl
      ? JSON.stringify([
        { url: driveUrl, type: "DRIVE_LINK", title: "Sản phẩm nộp đính kèm" },
      ])
      : null;

    const fullContent = selfAssessment
      ? `${content}\n\n[TỰ ĐÁNH GIÁ CỦA HỌC SINH]:\n${selfAssessment}`
      : content;

    const existingCount = await prisma.submission.count({
      where: {
        assignmentId,
        studentId: studentUser.studentProfile.id,
      },
    });

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: studentUser.studentProfile.id,
        content: fullContent,
        attachments,
        status: "SUBMITTED",
        attemptNumber: existingCount + 1,
      },
    });

    if (selfAssessment) {
      await prisma.selfAssessment.create({
        data: {
          studentId: studentUser.studentProfile.id,
          assignmentId,
          responses: JSON.stringify({ selfAssessment }),
          reflection: selfAssessment,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.role,
        action: "ASSIGNMENT_SUBMISSION_CREATED",
        resource: "SUBMISSION",
        resourceId: submission.id,
        status: "SUCCESS",
        details: JSON.stringify({
          assignmentId,
          studentCode: studentUser.studentProfile.studentCode,
        }),
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error("Submission API Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi server" },
      { status: 500 }
    );
  }
}
