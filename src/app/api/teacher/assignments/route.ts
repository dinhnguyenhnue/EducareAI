import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  syncAssignmentToClassroom,
  syncAssignmentDeadlineToCalendar,
} from "@/lib/google-workspace";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (
      session.role !== "TEACHER" &&
      session.role !== "SCHOOL_ADMIN" &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "FORBIDDEN: Chỉ Giáo viên mới có quyền tạo và giao bài tập." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      instructions,
      classId,
      subjectId,
      dueAt,
      type,
      syncClassroom,
      syncCalendar,
    } = body;

    if (!title || !description || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ tiêu đề, mô tả, lớp và môn học." },
        { status: 400 }
      );
    }

    // Resolve teacherProfileId
    const teacherProfileId =
      session.user.teacherProfile?.id ||
      (await prisma.teacherProfile.findFirst())?.id;
    if (!teacherProfileId) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ giáo viên trong CSDL." },
        { status: 404 }
      );
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    const created = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions?.trim() || null,
        classId,
        subjectId,
        teacherId: teacherProfileId,
        type: type || "PROJECT",
        maxScore: 10.0,
        dueAt: dueAt ? new Date(dueAt) : new Date(Date.now() + 5 * 86400000),
        status: "ASSIGNED",
        syncStatus: syncClassroom ? "PENDING" : "NONE",
      },
      include: {
        subject: true,
        schoolClass: true,
        submissions: true,
      },
    });

    if (syncClassroom) {
      await syncAssignmentToClassroom(session.user.id, created.id);
    }

    if (syncCalendar && schoolClass) {
      const calRes = await syncAssignmentDeadlineToCalendar(session.user.id, {
        title: created.title,
        dueDate: created.dueAt.toISOString(),
        className: schoolClass.name,
        reminder1Day: true,
        reminder1Hour: true,
      });
      await prisma.assignment.update({
        where: { id: created.id },
        data: { calendarEventId: calRes.eventId },
      });
    }

    const refreshed = await prisma.assignment.findUnique({
      where: { id: created.id },
      include: {
        subject: true,
        schoolClass: true,
        submissions: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.role,
        action: "TEACHER_ASSIGNMENT_CREATED",
        resource: "ASSIGNMENT",
        resourceId: created.id,
        status: "SUCCESS",
        details: JSON.stringify({
          title: created.title,
          syncClassroom: Boolean(syncClassroom),
          syncCalendar: Boolean(syncCalendar),
        }),
      },
    });

    return NextResponse.json({ success: true, assignment: refreshed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
