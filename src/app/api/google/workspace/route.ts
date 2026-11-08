import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  getGoogleOAuthConfig,
  UNIGO_DRIVE_FOLDERS,
  EDUCARE_DRIVE_FOLDER_TREE,
  UNIGO_SYNC_CADENCE_POLICY,
  provisionEducareDriveTree,
  syncClassTrackingSheet,
  stageOrConfirmSheetTeacherNotes,
  createEncryptedDatabaseBackup,
  verifyBackupRestoreDrill,
  syncDatabaseToGoogleSheets,
  syncAssignmentToClassroom,
  createGoogleDocFromTemplate,
  syncAssignmentDeadlineToCalendar,
  type GoogleAccountMode,
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

    const [
      teacher,
      assignments,
      syncLogs,
      driveFolderNodes,
      classTrackingSheets,
      backupRecords,
    ] = await Promise.all([
      prisma.user.findFirst({
        where: { email: "thay.tuan@unigo.edu.vn" },
        include: { googleConnection: true },
      }),
      prisma.assignment.findMany({
        include: { subject: true, schoolClass: true, submissions: true },
        orderBy: { dueAt: "asc" },
      }),
      prisma.syncLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.driveFolderNode.findMany({
        orderBy: { folderPath: "asc" },
      }),
      prisma.classTrackingSheet.findMany({
        orderBy: { className: "asc" },
      }),
      prisma.systemBackupRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const oauthConfig = getGoogleOAuthConfig();

    return NextResponse.json({
      oauthConfig: {
        isConfigured: oauthConfig.isConfigured,
        redirectUri: oauthConfig.redirectUri,
      },
      connection: session.user.googleConnection || teacher?.googleConnection || null,
      driveFolders: UNIGO_DRIVE_FOLDERS,
      driveFolderTreeTemplate: EDUCARE_DRIVE_FOLDER_TREE,
      driveFolderNodes,
      classTrackingSheets,
      backupRecords,
      syncCadencePolicy: UNIGO_SYNC_CADENCE_POLICY,
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
        {
          error:
            "FORBIDDEN: Chỉ Giáo viên và Quản trị viên mới được thực thi đồng bộ Google Workspace.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    const actorId = session.user.id;
    const actorEmail = session.user.email;

    switch (action) {
      case "SYNC_SHEETS": {
        const result = await syncDatabaseToGoogleSheets(actorId);
        return NextResponse.json({
          success: true,
          message: `Đã đồng bộ thành công ${result.tablesSynced} bảng tổng hợp và bảng EDUCARE_AI_Tracking_7A1 (6 tabs) sang Google Sheets bằng batchUpdate.`,
          data: result,
        });
      }

      case "SYNC_CLASS_TRACKING_SHEET": {
        const className = payload?.className || "7A1";
        const result = await syncClassTrackingSheet(actorId, className);
        return NextResponse.json({
          success: true,
          message: `Đã tự động khởi tạo & đồng bộ bảng "${result.trackingSheet.spreadsheetTitle}" (6 tabs: Tổng quan, Danh sách HS, Tiến độ học tập, Điểm & Rubric, Sản phẩm sáng tạo, Báo cáo AI) với ${result.totalRowsSynced} dòng dữ liệu.`,
          data: result,
        });
      }

      case "STAGE_SHEET_TEACHER_NOTES":
      case "CONFIRM_SHEET_TEACHER_NOTES": {
        const className = payload?.className || "7A1";
        const confirmImport = action === "CONFIRM_SHEET_TEACHER_NOTES";
        const incomingNotes = payload?.incomingNotes || [
          {
            studentCode: "HS2026001",
            studentName: "Nguyễn Minh Anh",
            sheetNote:
              "Ghi chú từ Google Sheets: Minh Anh hoàn thành tốt trò chơi HTML và bài kiểm tra Tin học, khuyến khích thử sức thêm bài Toán nâng cao.",
            attemptedScoreChange: payload?.simulateScoreTamper ? 10.0 : null,
          },
          {
            studentCode: "HS2026002",
            studentName: "Lê Hoàng Nam",
            sheetNote:
              "Ghi chú từ Google Sheets: Nam cần ôn lại phần cấu trúc rẽ nhánh và hoàn thành phiếu bài tập Ngữ văn đúng hạn.",
            attemptedScoreChange: null,
          },
        ];

        const result = await stageOrConfirmSheetTeacherNotes(
          actorId,
          className,
          incomingNotes,
          confirmImport
        );

        return NextResponse.json({
          success: true,
          message: result.message,
          data: result,
        });
      }

      case "PROVISION_DRIVE_6_FOLDERS":
      case "INIT_DRIVE_FOLDERS": {
        const accountMode: GoogleAccountMode =
          payload?.accountMode === "WORKSPACE_DOMAIN"
            ? "WORKSPACE_DOMAIN"
            : "PERSONAL_GMAIL_HYBRID";
        const result = await provisionEducareDriveTree(actorId, accountMode);
        return NextResponse.json({
          success: true,
          message: `Đã khởi tạo cấu trúc 6 thư mục gốc & 15 thư mục con (${result.totalFoldersProvisioned} nodes) trên Google Drive theo chế độ ${accountMode === "WORKSPACE_DOMAIN" ? "Google Workspace Trường (@unigo.edu.vn)" : "Tài khoản Gmail Cá nhân / Hybrid"} và lưu folderId vào Supabase.`,
          data: result,
        });
      }

      case "CREATE_ENCRYPTED_BACKUP": {
        const backupRecord = await createEncryptedDatabaseBackup(actorId, actorEmail);
        return NextResponse.json({
          success: true,
          message: `Đã tạo bản sao lưu CSDL mã hóa AES-256-GCM (${backupRecord.backupCode}, SHA-256: ${backupRecord.sha256Checksum.slice(0, 12)}...) và lưu vào EDUCARE_AI/06_BACKUP/Database_Encrypted.`,
          data: backupRecord,
        });
      }

      case "VERIFY_RESTORE_DRILL": {
        const result = await verifyBackupRestoreDrill(actorId, payload?.backupId);
        return NextResponse.json({
          success: true,
          message: result.message,
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

      default:
        return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
