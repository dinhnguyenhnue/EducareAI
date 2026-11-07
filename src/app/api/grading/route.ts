import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (
      session.role !== "TEACHER" &&
      session.role !== "SCHOOL_ADMIN" &&
      session.role !== "SUPER_ADMIN"
    ) {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "UNAUTHORIZED_GRADING_ATTEMPT",
          resource: "GRADE",
          status: "DENIED",
        },
      });
      return NextResponse.json(
        { error: "FORBIDDEN: Học sinh và Phụ huynh không có quyền chấm điểm." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { submissionId, score, teacherComment, rubricScores, gradedBy } = body;
    const numericScore = parseFloat(score);

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: numericScore,
        teacherComment,
        rubricScores: JSON.stringify(rubricScores),
        gradedBy: gradedBy || session.user.fullName,
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    const assignment = await prisma.assignment.findUnique({
      where: { id: updated.assignmentId },
      include: { schoolClass: true },
    });

    if (assignment) {
      // Upsert official Grade record
      const existingGrade = await prisma.grade.findFirst({
        where: { submissionId: updated.id },
      });

      if (existingGrade) {
        await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            score: numericScore,
            gradedBy: gradedBy || session.user.fullName,
            feedback: teacherComment,
            recordedAt: new Date(),
          },
        });
      } else {
        await prisma.grade.create({
          data: {
            studentId: updated.studentId,
            subjectId: assignment.subjectId,
            academicYearId: assignment.schoolClass.academicYearId,
            assignmentId: assignment.id,
            submissionId: updated.id,
            score: numericScore,
            maxScore: assignment.maxScore,
            gradeType: assignment.type,
            gradedBy: gradedBy || session.user.fullName,
            feedback: teacherComment,
          },
        });
      }

      await prisma.learningRecord.create({
        data: {
          studentId: updated.studentId,
          subjectId: assignment.subjectId,
          activityType: "ASSIGNMENT",
          score: numericScore,
          accuracyRate: numericScore * 10,
          detailData: JSON.stringify({
            assignmentId: updated.assignmentId,
            rubricScores,
          }),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.role,
        action: "SUBMISSION_GRADED",
        resource: "GRADE",
        resourceId: updated.id,
        status: "SUCCESS",
        details: JSON.stringify({
          submissionId: updated.id,
          score: numericScore,
        }),
      },
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: any) {
    console.error("Grading API Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi server" },
      { status: 500 }
    );
  }
}
