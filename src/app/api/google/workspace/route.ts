import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  getGoogleOAuthConfig,
  getGeminiServerConfig,
  getWorkspaceAndGeminiServicesStatus,
  testWorkspaceOrGeminiConnection,
  disconnectGoogleWorkspace,
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
  syncLocalSgkToDrive,
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
      fallbackConnection,
      assignments,
      syncLogs,
      driveFolderNodes,
      classTrackingSheets,
      backupRecords,
      servicesStatus,
    ] = await Promise.all([
      prisma.googleConnection
        .findFirst({
          orderBy: { createdAt: "desc" },
        })
        .catch(() => null),
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
      getWorkspaceAndGeminiServicesStatus(session.user.id),
    ]);

    const oauthConfig = getGoogleOAuthConfig();
    const geminiConfig = getGeminiServerConfig();

    return NextResponse.json({
      oauthConfig: {
        isConfigured: oauthConfig.isConfigured,
        redirectUri: oauthConfig.redirectUri,
      },
      geminiConfig: {
        isConfigured: geminiConfig.isConfigured,
        modelName: geminiConfig.modelName,
      },
      servicesStatus,
      connection: session.user.googleConnection || fallbackConnection || null,
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
      case "TEST_SERVICE_CONNECTION": {
        const serviceCode = payload?.serviceCode || "GOOGLE_DRIVE";
        const result = await testWorkspaceOrGeminiConnection(actorId, serviceCode);
        await prisma.auditLog.create({
          data: {
            actorId,
            actorEmail,
            actorRole: session.role,
            action: "ADMIN_TEST_INTEGRATION_CONNECTION",
            resource: "GOOGLE_WORKSPACE_INTEGRATION",
            resourceId: result.serviceCode,
            status: result.connected ? "SUCCESS" : "NOT_CONFIGURED",
            details: JSON.stringify({
              serviceCode: result.serviceCode,
              status: result.status,
            }),
          },
        });
        return NextResponse.json({
          success: true,
          status: result.status,
          message: result.message,
          data: result,
        });
      }

      case "DISCONNECT_GOOGLE_OAUTH": {
        const result = await disconnectGoogleWorkspace(actorId);
        await prisma.auditLog.create({
          data: {
            actorId,
            actorEmail,
            actorRole: session.role,
            action: "ADMIN_DISCONNECT_GOOGLE_OAUTH",
            resource: "GOOGLE_WORKSPACE_INTEGRATION",
            status: "SUCCESS",
          },
        });
        return NextResponse.json({
          success: true,
          status: result.status,
          message: result.message,
          data: result,
        });
      }

      case "SYNC_SHEETS": {
        const result = await syncDatabaseToGoogleSheets(actorId);
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Sheets API — NOT_CONFIGURED] Đã tạo bản chụp dữ liệu 5 bảng cục bộ (${result.totalRowsExported} dòng). Chưa đẩy lên Google Sheets thật.`
            : `Đã đồng bộ ${result.tablesSynced} bảng tổng hợp và bảng EDUCARE_AI_Tracking_7A1 (6 tabs).`,
          data: result,
        });
      }

      case "SYNC_CLASS_TRACKING_SHEET": {
        const className = payload?.className || "7A1";
        const result = await syncClassTrackingSheet(actorId, className);
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Sheets API — NOT_CONFIGURED] Đã tổng hợp dữ liệu "${result.trackingSheet.spreadsheetTitle}" (6 tabs, ${result.totalRowsSynced} dòng) vào bộ nhớ đệm cục bộ.`
            : `Đã tự động khởi tạo & đồng bộ bảng "${result.trackingSheet.spreadsheetTitle}" (6 tabs) với ${result.totalRowsSynced} dòng dữ liệu.`,
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
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Drive API — NOT_CONFIGURED] Đã khởi tạo cấu trúc ${result.totalFoldersProvisioned} nút thư mục mẫu trong CSDL cục bộ. Khi nhà trường cung cấp GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET và cấp quyền OAuth, hệ thống sẽ tạo thư mục thật trên Google Drive.`
            : `Đã khởi tạo cấu trúc 6 thư mục gốc & ${result.totalFoldersProvisioned} nodes trên Google Drive.`,
          data: result,
        });
      }

      case "SYNC_LOCAL_SGK_TO_DRIVE": {
        const accountMode: GoogleAccountMode =
          payload?.accountMode === "WORKSPACE_DOMAIN"
            ? "WORKSPACE_DOMAIN"
            : "PERSONAL_GMAIL_HYBRID";
        const result = await syncLocalSgkToDrive(actorId, session.role, accountMode);
        return NextResponse.json({
          success: true,
          status:
            result.connectionState === "DISCONNECTED"
              ? "NOT_CONFIGURED"
              : result.syncState,
          message:
            result.localReadyCount > 0
              ? `Đã phân lớp & lập chỉ mục ${result.localReadyCount}/${result.totalExpectedCount} SGK KNTT lớp 6 vào kho Asset và cây thư mục 02_HOC_LIEU (trạng thái: ${result.syncState}; Google Drive API: ${result.connectionState} — chưa tải tệp nhị phân trực tiếp lên Google Drive).`
              : `Đã khởi tạo cây thư mục 02_HOC_LIEU cho SGK KNTT lớp 6 (trạng thái: ${result.connectionState}; không tìm thấy tệp PDF gốc trên máy chủ).`,
          data: result,
        });
      }

      case "CREATE_ENCRYPTED_BACKUP": {
        const backupRecord = await createEncryptedDatabaseBackup(actorId, actorEmail);
        return NextResponse.json({
          success: true,
          message: `Đã tạo bản sao lưu CSDL mã hóa AES-256-GCM (${backupRecord.backupCode}, SHA-256: ${backupRecord.sha256Checksum.slice(0, 12)}...).`,
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
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Classroom API — NOT_CONFIGURED] Đã lưu trạng thái bài tập trong CSDL cục bộ. Cần cấp quyền OAuth Classroom để phát hành lên Google Classroom.`
            : result.isIdempotentUpdate
            ? `Đã cập nhật đồng bộ (Idempotent) bài tập lên Google Classroom (${result.courseworkId}).`
            : `Đã phát hành bài tập mới lên Google Classroom (${result.courseworkId}).`,
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
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Docs API — NOT_CONFIGURED] Đã tạo bộ khung siêu dữ liệu cho "${result.title}". Cần cấu hình Google OAuth để nhân bản file trên Google Docs.`
            : `Đã khởi tạo tài liệu Google Docs "${result.title}" từ mẫu chuẩn.`,
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
        const isNotConfigured = result.connectionState === "DISCONNECTED";
        return NextResponse.json({
          success: true,
          status: isNotConfigured ? "NOT_CONFIGURED" : result.connectionState,
          message: isNotConfigured
            ? `[Chưa cấu hình Google Calendar API — NOT_CONFIGURED] Đã lưu cấu hình nhắc hẹn cho "${result.summary}". Cần kết nối Google Calendar OAuth để đẩy lên lịch thật.`
            : `Đã tạo sự kiện lịch và thiết lập nhắc việc tự động trên "${result.calendarName}".`,
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
