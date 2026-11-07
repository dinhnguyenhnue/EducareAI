import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createGoogleDocFromTemplate } from "@/lib/google-workspace";

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
        { error: "FORBIDDEN: Chỉ Giáo viên mới có quyền tạo bài giảng." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      topicId,
      title,
      summaryParagraph,
      activityContent,
      driveFileUrl,
      createGoogleDoc,
    } = body;

    if (!topicId || !title) {
      return NextResponse.json(
        { error: "Vui lòng chọn Chủ đề và nhập Tiêu đề bài giảng." },
        { status: 400 }
      );
    }

    const teacherProfileId =
      session.user.teacherProfile?.id ||
      (await prisma.teacherProfile.findFirst())?.id;
    if (!teacherProfileId) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ giáo viên." },
        { status: 404 }
      );
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    });

    let googleDocId: string | null = null;
    if (createGoogleDoc && topic) {
      const docRes = await createGoogleDocFromTemplate(session.user.id, {
        title,
        templateType: "LESSON_PLAN",
        subjectName: topic.subject.name,
        gradeLevel: topic.subject.gradeLevel,
        topicName: topic.name,
        teacherName: session.user.fullName,
      });
      googleDocId = docRes.docId;
    }

    const contentBlocks = [
      { type: "heading", content: "1. Nội dung trọng tâm" },
      {
        type: "paragraph",
        content:
          summaryParagraph ||
          "Học sinh tự nghiên cứu học liệu, đặt câu hỏi phản biện và thực hành tạo sản phẩm số.",
      },
      ...(activityContent
        ? [
            {
              type: "activity",
              title: "Nhiệm vụ thực hành trên lớp",
              content: activityContent,
            },
          ]
        : []),
    ];

    const driveLinks = driveFileUrl
      ? JSON.stringify([{ title: "Tài liệu Google Drive đính kèm", url: driveFileUrl }])
      : null;

    const lesson = await prisma.lesson.create({
      data: {
        topicId,
        teacherId: teacherProfileId,
        title: title.trim(),
        contentBlocks: JSON.stringify(contentBlocks),
        status: "PUBLISHED",
        publishedAt: new Date(),
        googleDocId,
        driveFileLinks: driveLinks,
      },
      include: {
        topic: { include: { subject: true } },
        teacher: { include: { user: true } },
      },
    });

    return NextResponse.json({ success: true, lesson });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
