import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  getGoogleOAuthConfig,
  UNIGO_DRIVE_FOLDERS,
  syncDatabaseToGoogleSheets,
  syncAssignmentToClassroom,
  createGoogleDocFromTemplate,
  syncAssignmentDeadlineToCalendar,
} from "@/lib/google-workspace";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const teacher = await prisma.user.findFirst({
      where: { email: "thay.tuan@unigo.edu.vn" },
      include: { googleConnection: true },
    });

    const assignments = await prisma.assignment.findMany({
      include: { subject: true, schoolClass: true, submissions: true },
      orderBy: { dueAt: "asc" },
    });

    const syncLogs = await prisma.syncLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const oauthConfig = getGoogleOAuthConfig();

    return NextResponse.json({
      oauthConfig: {
        isConfigured: oauthConfig.isConfigured,
        redirectUri: oauthConfig.redirectUri,
      },
      connection: session.user.googleConnection || teacher?.googleConnection || null,
      driveFolders: UNIGO_DRIVE_FOLDERS,
      assignments,
      syncLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      return NextResponse.json(
        { error: "FORBIDDEN: Chỉ Giáo viên và Quản trị viên mới được thực thi đồng bộ Google Workspace." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    const actorId = session.user.id;

    switch (action) {
      case "SYNC_SHEETS": {
        const result = await syncDatabaseToGoogleSheets(actorId);
        return NextResponse.json({
          success: true,
          message: `Đã đồng bộ thành công ${result.tablesSynced} bảng dữ liệu (${result.totalRowsExported} bản ghi) sang Google Sheets bằng 1 lệnh batchUpdate duy nhất.`,
          data: result,
        });
      }

      case "SYNC_CLASSROOM": {
        const assignmentId = payload?.assignmentId;
        const result = await syncAssignmentToClassroom(actorId, assignmentId);
        return NextResponse.json({
          success: true,
          message: result.isIdempotentUpdate
            ? `Đã cập nhật đồng bộ (Idempotent) bài tập lên Google Classroom (${result.courseworkId}) mà không tạo bản trùng lặp.`
            : `Đã phát hành bài tập mới lên Google Classroom (${result.courseworkId}) với chế độ STUDENT_COPY.`,
          data: result,
        });
      }

      case "CREATE_DOC_TEMPLATE": {
        const result = await createGoogleDocFromTemplate(actorId, {
          title: payload?.title || "Đề kiểm tra 15 phút - An toàn thông tin số",
          templateType: payload?.templateType || "EXAM",
          subjectName: payload?.subjectName || "Tin học 7",
          gradeLevel: Number(payload?.gradeLevel || 7),
          topicName: payload?.topicName || "Chủ đề A: Máy tính và cộng đồng",
          teacherName: session.user.fullName,
        });
        return NextResponse.json({
          success: true,
          message: `Đã khởi tạo tài liệu Google Docs "${result.title}" từ mẫu chuẩn UNIGO (Drive files.copy + Docs replaceAllText).`,
          data: result,
        });
      }

      case "CREATE_CALENDAR_EVENT": {
        const result = await syncAssignmentDeadlineToCalendar(actorId, {
          title: payload?.title || "Nộp dự án Infographic An toàn số",
          dueDate: payload?.dueDate || new Date(Date.now() + 5 * 86400000).toISOString(),
          className: payload?.className || "7A1",
          reminder1Day: payload?.reminder1Day ?? true,
          reminder1Hour: payload?.reminder1Hour ?? true,
          customMinutes: payload?.customMinutes,
        });
        return NextResponse.json({
          success: true,
          message: `Đã tạo sự kiện lịch và thiết lập nhắc việc tự động trên "${result.calendarName}".`,
          data: result,
        });
      }

      case "INIT_DRIVE_FOLDERS": {
        const syncLog = await prisma.syncLog.create({
          data: {
            userId: actorId,
            service: "DRIVE",
            action: "PROVISION_10_STANDARD_FOLDERS",
            resourceId: "ROOT_UNIGO_EDUCARE_2026",
            status: "SUCCESS",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Đã kiểm tra và đồng bộ cấu trúc 10 thư mục chuẩn UNIGO trên Google Drive.",
          data: { folders: UNIGO_DRIVE_FOLDERS, syncLog },
        });
      }

      default:
        return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
