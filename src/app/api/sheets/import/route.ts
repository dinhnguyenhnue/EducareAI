import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTeacherClassScope } from "@/lib/submission-guard";
import {
  computeTransparentStudentMetrics,
  executeSheetImportBatch,
  type RawSheetAttemptRow,
} from "@/lib/sheets-import-pipeline";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentUserId = searchParams.get("studentUserId");

  if (session.role === "STUDENT") {
    if (studentUserId && studentUserId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN: Học sinh không được xem dữ liệu đánh giá của học sinh khác." },
        { status: 403 }
      );
    }
  }

  if (session.role === "TEACHER" && classId) {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      classId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason, code: scopeCheck.code },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  const targetStudentId =
    session.role === "STUDENT" ? session.user.id : studentUserId;

  const [importedAttempts, summaries, nativeAttempts] = await Promise.all([
    prisma.importedAttempt.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(targetStudentId ? { studentUserId: targetStudentId } : {}),
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.importedAssessmentSummary.findMany({
      where: {
        ...(targetStudentId ? { studentUserId: targetStudentId } : {}),
      },
    }),
    prisma.attempt.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(targetStudentId ? { studentId: targetStudentId } : {}),
        status: { in: ["SUBMITTED", "EXPIRED_AUTO_SUBMITTED"] },
      },
      include: { assessment: { select: { mode: true } } },
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  const practiceAttempts = [
    ...nativeAttempts
      .filter((a) => a.assessment.mode === "PRACTICE")
      .map((a) => ({
        attemptNumber: a.attemptNumber,
        rawScore: a.totalScore,
        maxScore: a.maxScore,
        submittedAt: a.submittedAt || a.createdAt,
        status: a.status,
        isDemoData: a.isDemoData,
      })),
    ...importedAttempts
      .filter((a) => a.mode === "PRACTICE")
      .map((a, idx) => ({
        attemptNumber: idx + 1,
        rawScore: a.rawScore,
        maxScore: a.maxScore,
        submittedAt: a.submittedAt,
        status: a.status,
        assessmentVersion: a.assessmentVersion,
      })),
  ];

  const examAttempts = [
    ...nativeAttempts
      .filter((a) => a.assessment.mode === "EXAM")
      .map((a) => ({
        attemptNumber: a.attemptNumber,
        rawScore: a.totalScore,
        maxScore: a.maxScore,
        submittedAt: a.submittedAt || a.createdAt,
        status: a.status,
        isDemoData: a.isDemoData,
      })),
    ...importedAttempts
      .filter((a) => a.mode === "EXAM")
      .map((a, idx) => ({
        attemptNumber: idx + 1,
        rawScore: a.rawScore,
        maxScore: a.maxScore,
        submittedAt: a.submittedAt,
        status: a.status,
        assessmentVersion: a.assessmentVersion,
      })),
  ];

  return NextResponse.json({
    practiceMetrics: computeTransparentStudentMetrics(practiceAttempts, {
      includeDemo: true,
    }),
    examMetrics: computeTransparentStudentMetrics(examAttempts, {
      includeDemo: true,
    }),
    importedAttemptsCount: importedAttempts.length,
    summaries,
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

  const isTeacherOrAdmin =
    session.role === "TEACHER" ||
    session.role === "SCHOOL_ADMIN" ||
    session.role === "SUPER_ADMIN";

  if (!isTeacherOrAdmin) {
    return NextResponse.json(
      { error: "FORBIDDEN: Chỉ Giáo viên hoặc Quản trị viên mới được đồng bộ bảng điểm từ Google Sheets." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const classId = String(body.classId || "").trim();
  const academicYearId = String(body.academicYearId || "").trim();
  const spreadsheetId = String(body.spreadsheetId || "LOCAL-IMPORT-SHEET").trim();
  const sheetId = Number(body.sheetId ?? 0) || 0;
  const rows: RawSheetAttemptRow[] = Array.isArray(body.rows) ? body.rows : [];

  if (!classId || !academicYearId) {
    return NextResponse.json(
      { error: "Thiếu classId hoặc academicYearId khi nhập dữ liệu Google Sheets." },
      { status: 400 }
    );
  }

  if (session.role === "TEACHER") {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      classId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason, code: scopeCheck.code },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  const source = await prisma.sheetImportSource.upsert({
    where: {
      spreadsheetId_sheetId: {
        spreadsheetId,
        sheetId,
      },
    },
    update: {
      classId,
      academicYearId,
      enabled: true,
    },
    create: {
      classId,
      academicYearId,
      spreadsheetId,
      sheetId,
      direction: "IMPORT_READ_ONLY",
      mappingJson: JSON.stringify({
        sheetTabName: body.sheetTabName || "Attempt_Log",
      }),
      mappingVersion: 1,
      timezone: "Asia/Ho_Chi_Minh",
      enabled: true,
    },
  });

  const result = await executeSheetImportBatch({
    sourceId: source.id,
    rows,
    actorId: session.user.id,
  });

  return NextResponse.json({
    sourceId: source.id,
    ...result,
  });
}
