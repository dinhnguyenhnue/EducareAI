import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface RawSheetAttemptRow {
  rowNumber: number;
  record_id?: string | null;
  row_type?: "ATTEMPT" | "SUMMARY" | string | null;
  student_code?: string | null;
  student_email?: string | null;
  student_name?: string | null;
  class_code?: string | null;
  academic_year?: string | null;
  assessment_code?: string | null;
  assessment_title?: string | null;
  assessment_mode?: "PRACTICE" | "EXAM" | string | null;
  assessment_version?: number | string | null;
  attempt_number?: number | string | null;
  attempt_count?: number | string | null;
  raw_score?: number | string | null;
  max_score?: number | string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  duration_seconds?: number | string | null;
  status?: string | null;
  native_attempt_id?: string | null;
}

export type SheetRowValidationErrorCode =
  | "MISSING_RECORD_ID"
  | "MISSING_STUDENT_IDENTITY"
  | "MISSING_ASSESSMENT_CODE"
  | "MISSING_SCORE"
  | "INVALID_SCORE_NUMBER"
  | "INVALID_MAX_SCORE"
  | "SCORE_OUT_OF_RANGE"
  | "INVALID_TIMESTAMP"
  | "INVALID_TIME_ORDER";

export interface ParsedSheetAttemptRow {
  kind: "ATTEMPT" | "SUMMARY";
  rowNumber: number;
  sourceRecordId: string;
  studentCode: string | null;
  studentEmail: string | null;
  classCode: string | null;
  academicYear: string | null;
  assessmentCode: string;
  assessmentTitle: string | null;
  assessmentMode: "PRACTICE" | "EXAM";
  assessmentVersion: number;
  attemptNumber: number;
  attemptCount: number;
  rawScore: number;
  maxScore: number;
  normalizedScore10: number;
  normalizedScore100: number;
  startedAt: Date | null;
  submittedAt: Date;
  durationSeconds: number | null;
  status: "VALID" | "INVALID" | "LATE";
  nativeAttemptId: string | null;
}

export interface SheetRowParseResult {
  ok: boolean;
  errorCode?: SheetRowValidationErrorCode;
  errorMessage?: string;
  parsed?: ParsedSheetAttemptRow;
}

/**
 * Parses a decimal number supporting both dot ("8.5") and comma ("8,5").
 * Returns null if empty/blank, NaN if non-numeric.
 * NEVER coerces empty/blank/null to 0!
 */
export function parseStrictScore(val: unknown): number | null {
  if (val === null || typeof val === "undefined") return null;
  if (typeof val === "number") {
    return Number.isFinite(val) ? val : Number.NaN;
  }
  const raw = String(val).trim();
  if (raw === "" || raw === "-" || raw.toLowerCase() === "null" || raw.toLowerCase() === "n/a") {
    return null;
  }
  const normalized = raw.replace(",", ".");
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) {
    return Number.NaN;
  }
  return Number(normalized);
}

/**
 * Parses timestamp string, defaulting to Asia/Ho_Chi_Minh (+07:00) if no timezone offset is included.
 */
export function parseVietnamTimestamp(raw?: string | null): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasExplicitTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  let candidate = trimmed;

  const vnMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (vnMatch) {
    const day = vnMatch[1].padStart(2, "0");
    const month = vnMatch[2].padStart(2, "0");
    const year = vnMatch[3];
    const hour = (vnMatch[4] || "00").padStart(2, "0");
    const minute = (vnMatch[5] || "00").padStart(2, "0");
    const second = (vnMatch[6] || "00").padStart(2, "0");
    candidate = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
  } else if (!hasExplicitTz) {
    const normalizedIso = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(/\s+/, "T");
    candidate = `${normalizedIso}+07:00`;
  }

  const d = new Date(candidate);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeScore(rawScore: number, maxScore: number): {
  normalizedScore10: number;
  normalizedScore100: number;
} {
  const normalizedScore10 =
    Math.round(((10 * rawScore) / maxScore + Number.EPSILON) * 100) / 100;
  const normalizedScore100 =
    Math.round(((100 * rawScore) / maxScore + Number.EPSILON) * 100) / 100;
  return { normalizedScore10, normalizedScore100 };
}

export function parseAndValidateSheetRow(
  row: RawSheetAttemptRow
): SheetRowParseResult {
  const recordId = row.record_id ? String(row.record_id).trim() : "";
  if (!recordId) {
    return {
      ok: false,
      errorCode: "MISSING_RECORD_ID",
      errorMessage:
        "Thiếu mã định danh bất biến `record_id` của bản ghi (tuyệt đối không dùng số dòng rowNumber làm khóa chính).",
    };
  }

  const studentCode = row.student_code ? String(row.student_code).trim() : null;
  const studentEmail = row.student_email
    ? String(row.student_email).trim().toLowerCase()
    : null;

  if (!studentCode && !studentEmail) {
    return {
      ok: false,
      errorCode: "MISSING_STUDENT_IDENTITY",
      errorMessage: "Thiếu cả `student_code` và `student_email` để định danh học sinh.",
    };
  }

  const assessmentCode = row.assessment_code
    ? String(row.assessment_code).trim()
    : "";
  if (!assessmentCode) {
    return {
      ok: false,
      errorCode: "MISSING_ASSESSMENT_CODE",
      errorMessage: "Thiếu mã bài đánh giá `assessment_code`.",
    };
  }

  const rawScore = parseStrictScore(row.raw_score);
  if (rawScore === null) {
    return {
      ok: false,
      errorCode: "MISSING_SCORE",
      errorMessage:
        "Ô điểm `raw_score` đang để trống (null). Hệ thống từ chối tự động biến ô trống thành điểm 0.",
    };
  }
  if (Number.isNaN(rawScore)) {
    return {
      ok: false,
      errorCode: "INVALID_SCORE_NUMBER",
      errorMessage: `Giá trị điểm raw_score "${row.raw_score}" không phải là số hợp lệ.`,
    };
  }

  const maxScore = parseStrictScore(row.max_score ?? 10);
  if (maxScore === null || Number.isNaN(maxScore) || maxScore <= 0) {
    return {
      ok: false,
      errorCode: "INVALID_MAX_SCORE",
      errorMessage: `Thang điểm tối đa max_score "${row.max_score}" phải lớn hơn 0.`,
    };
  }

  if (rawScore < 0 || rawScore > maxScore) {
    return {
      ok: false,
      errorCode: "SCORE_OUT_OF_RANGE",
      errorMessage: `Điểm số ${rawScore} nằm ngoài khoảng hợp lệ [0, ${maxScore}].`,
    };
  }

  const startedAt = row.started_at ? parseVietnamTimestamp(row.started_at) : null;
  if (row.started_at && !startedAt) {
    return {
      ok: false,
      errorCode: "INVALID_TIMESTAMP",
      errorMessage: `Thời gian bắt đầu "${row.started_at}" không đúng định dạng.`,
    };
  }

  const submittedAt = row.submitted_at
    ? parseVietnamTimestamp(row.submitted_at)
    : new Date();
  if (!submittedAt) {
    return {
      ok: false,
      errorCode: "INVALID_TIMESTAMP",
      errorMessage: `Thời gian nộp bài "${row.submitted_at}" không đúng định dạng.`,
    };
  }

  if (startedAt && startedAt.getTime() > submittedAt.getTime()) {
    return {
      ok: false,
      errorCode: "INVALID_TIME_ORDER",
      errorMessage: "Thời gian bắt đầu (`started_at`) lớn hơn thời gian nộp bài (`submitted_at`).",
    };
  }

  const { normalizedScore10, normalizedScore100 } = normalizeScore(
    rawScore,
    maxScore
  );

  const isSummary =
    String(row.row_type || "").toUpperCase() === "SUMMARY" ||
    (typeof row.attempt_count !== "undefined" &&
      row.attempt_count !== null &&
      String(row.attempt_count).trim() !== "" &&
      typeof row.attempt_number === "undefined");

  const attemptNumber = Math.max(1, Number(row.attempt_number || 1) || 1);
  const attemptCount = Math.max(1, Number(row.attempt_count || 1) || 1);
  const assessmentVersion = Math.max(1, Number(row.assessment_version || 1) || 1);
  const assessmentMode =
    String(row.assessment_mode || "PRACTICE").toUpperCase() === "EXAM"
      ? "EXAM"
      : "PRACTICE";

  const durationSeconds =
    row.duration_seconds !== null &&
    typeof row.duration_seconds !== "undefined" &&
    String(row.duration_seconds).trim() !== ""
      ? Math.max(0, Math.round(Number(row.duration_seconds)))
      : startedAt
      ? Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000))
      : null;

  const rawStatus = String(row.status || "VALID").toUpperCase();
  const status: "VALID" | "INVALID" | "LATE" =
    rawStatus === "INVALID"
      ? "INVALID"
      : rawStatus === "LATE"
      ? "LATE"
      : "VALID";

  return {
    ok: true,
    parsed: {
      kind: isSummary ? "SUMMARY" : "ATTEMPT",
      rowNumber: row.rowNumber,
      sourceRecordId: recordId,
      studentCode,
      studentEmail,
      classCode: row.class_code ? String(row.class_code).trim() : null,
      academicYear: row.academic_year ? String(row.academic_year).trim() : null,
      assessmentCode,
      assessmentTitle: row.assessment_title
        ? String(row.assessment_title).trim()
        : null,
      assessmentMode,
      assessmentVersion,
      attemptNumber,
      attemptCount,
      rawScore,
      maxScore,
      normalizedScore10,
      normalizedScore100,
      startedAt,
      submittedAt,
      durationSeconds,
      status,
      nativeAttemptId: row.native_attempt_id
        ? String(row.native_attempt_id).trim()
        : null,
    },
  };
}

export function computeAttemptPayloadHash(params: {
  studentUserId: string;
  assessmentCode: string;
  assessmentVersion: number;
  attemptNumber: number;
  rawScore: number;
  maxScore: number;
  submittedAtIso: string;
  status: string;
}): string {
  const canonical = JSON.stringify({
    u: params.studentUserId,
    a: params.assessmentCode,
    v: params.assessmentVersion,
    n: params.attemptNumber,
    r: params.rawScore,
    m: params.maxScore,
    t: params.submittedAtIso,
    s: params.status,
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export interface AttemptForMetrics {
  attemptNumber?: number;
  rawScore: number | null;
  maxScore: number;
  submittedAt: Date | string;
  status: string;
  assessmentVersion?: number;
  isDemoData?: boolean;
}

export interface TransparentStudentMetrics {
  validAttemptCount: number;
  firstScore: number | null;
  latestScore: number | null;
  bestScore: number | null;
  meanScore: number | null;
  improvement: number | null;
  insightType: "NEEDS_ATTENTION" | "IMPROVING" | "STEADY_HIGH" | "INSUFFICIENT_DATA";
  explanationText: string;
}

/**
 * Pure, transparent formula calculator for Student Evaluation Metrics (Section 7.2 & LMS_DATA_DESIGN.md).
 * - Never fabricates numbers when validAttemptCount === 0 (returns null for all scores).
 * - Preserves 0.0 as a real score (never confuses 0 with null).
 * - Normalizes every attempt to scale 10 (`10 * rawScore / maxScore`) before aggregating so 8/10 and 80/100 are identical.
 * - Computes `improvement = latestScore - firstScore` ONLY when `validAttemptCount >= 2`.
 */
export function computeTransparentStudentMetrics(
  attempts: AttemptForMetrics[],
  options?: {
    targetVersion?: number;
    includeDemo?: boolean;
  }
): TransparentStudentMetrics {
  const validStatuses = new Set([
    "VALID",
    "ACCEPTED",
    "SUBMITTED",
    "EXPIRED_AUTO_SUBMITTED",
    "LATE",
  ]);

  const filtered = attempts.filter((a) => {
    if (!validStatuses.has(a.status)) return false;
    if (a.rawScore === null || typeof a.rawScore !== "number" || Number.isNaN(a.rawScore)) {
      return false;
    }
    if (!a.maxScore || a.maxScore <= 0) return false;
    if (!options?.includeDemo && a.isDemoData) return false;
    if (
      options?.targetVersion &&
      a.assessmentVersion &&
      a.assessmentVersion !== options.targetVersion
    ) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return {
      validAttemptCount: 0,
      firstScore: null,
      latestScore: null,
      bestScore: null,
      meanScore: null,
      improvement: null,
      insightType: "INSUFFICIENT_DATA",
      explanationText: "Chưa có dữ liệu lượt làm bài hợp lệ đã xác thực.",
    };
  }

  const sorted = [...filtered].sort((a, b) => {
    const timeA = new Date(a.submittedAt).getTime();
    const timeB = new Date(b.submittedAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.attemptNumber ?? 1) - (b.attemptNumber ?? 1);
  });

  const normalizedScores = sorted.map(
    (a) => normalizeScore(a.rawScore!, a.maxScore).normalizedScore10
  );

  const validAttemptCount = normalizedScores.length;
  const firstScore = normalizedScores[0];
  const latestScore = normalizedScores[normalizedScores.length - 1];
  const bestScore = Math.max(...normalizedScores);
  const sum = normalizedScores.reduce((acc, s) => acc + s, 0);
  const meanScore =
    Math.round((sum / validAttemptCount + Number.EPSILON) * 100) / 100;

  const improvement =
    validAttemptCount >= 2
      ? Math.round((latestScore - firstScore + Number.EPSILON) * 100) / 100
      : null;

  let insightType: TransparentStudentMetrics["insightType"] = "STEADY_HIGH";
  let explanationText = "";

  if (latestScore < 5.0 || (improvement !== null && improvement < -1.0)) {
    insightType = "NEEDS_ATTENTION";
    explanationText =
      improvement !== null && improvement < -1.0
        ? `Điểm lần gần nhất (${latestScore}/10) giảm ${Math.abs(improvement)} điểm so với lần đầu (${firstScore}/10) qua ${validAttemptCount} lần làm bài.`
        : `Điểm lần gần nhất (${latestScore}/10) dưới ngưỡng đạt (5.0/10). Cần giáo viên hỗ trợ ôn tập lại.`;
  } else if (improvement !== null && improvement >= 1.0) {
    insightType = "IMPROVING";
    explanationText = `Tiến bộ rõ rệt (+${improvement} điểm: từ ${firstScore}/10 lên ${latestScore}/10 qua ${validAttemptCount} lần làm bài).`;
  } else {
    insightType = "STEADY_HIGH";
    explanationText =
      validAttemptCount >= 2
        ? `Duy trì kết quả ổn định (Trung bình ${meanScore}/10, Cao nhất ${bestScore}/10 qua ${validAttemptCount} lần làm bài).`
        : `Đã hoàn thành 1 lượt làm bài với điểm ${latestScore}/10 (chưa tính độ tiến bộ do cần tối thiểu 2 lượt).`;
  }

  return {
    validAttemptCount,
    firstScore,
    latestScore,
    bestScore,
    meanScore,
    improvement,
    insightType,
    explanationText,
  };
}

export interface SheetImportBatchResult {
  runId: string;
  totalRows: number;
  validRows: number;
  importedCount: number;
  updatedCount: number;
  skippedUnchangedCount: number;
  skippedNativeDuplicateCount: number;
  summaryCount: number;
  invalidRows: number;
  quarantinedRows: number;
  rowResults: Array<{
    rowNumber: number;
    recordId: string | null;
    status:
      | "IMPORTED"
      | "UPDATED_REVISION"
      | "SKIPPED_UNCHANGED"
      | "SKIPPED_NATIVE_DUPLICATE"
      | "IMPORTED_SUMMARY"
      | "INVALID"
      | "QUARANTINED";
    errorCode?: string;
    errorMessage?: string;
  }>;
}

/**
 * Executes an idempotent, auditable Google Sheets import run against Prisma.
 */
export async function executeSheetImportBatch(params: {
  sourceId: string;
  rows: RawSheetAttemptRow[];
  actorId?: string | null;
  idempotencyKey?: string;
  db?: typeof prisma;
}): Promise<SheetImportBatchResult> {
  const { sourceId, rows, actorId, idempotencyKey } = params;
  const db = params.db || prisma;

  const source = await db.sheetImportSource.findUniqueOrThrow({
    where: { id: sourceId },
  });

  const runKey =
    idempotencyKey ||
    `RUN-${source.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  const run = await db.sheetImportRun.create({
    data: {
      sourceId: source.id,
      idempotencyKey: runKey,
      status: "RUNNING",
      readCount: rows.length,
    },
  });

  let validRows = 0;
  let importedCount = 0;
  let updatedCount = 0;
  let skippedUnchangedCount = 0;
  let skippedNativeDuplicateCount = 0;
  let summaryCount = 0;
  let invalidRows = 0;
  let quarantinedRows = 0;

  const rowResults: SheetImportBatchResult["rowResults"] = [];

  for (const rawRow of rows) {
    const parseRes = parseAndValidateSheetRow(rawRow);
    const rawRowHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(rawRow))
      .digest("hex");

    if (!parseRes.ok || !parseRes.parsed) {
      invalidRows += 1;
      await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: rawRow.record_id
            ? String(rawRow.record_id)
            : `INVALID-ROW-${rawRow.rowNumber}`,
          payloadHash: rawRowHash,
          rawJson: JSON.stringify(rawRow),
          status: "REJECTED",
          errorCodes: JSON.stringify([parseRes.errorCode || "INVALID_ROW"]),
        },
      });
      rowResults.push({
        rowNumber: rawRow.rowNumber,
        recordId: rawRow.record_id ? String(rawRow.record_id) : null,
        status: "INVALID",
        errorCode: parseRes.errorCode,
        errorMessage: parseRes.errorMessage,
      });
      continue;
    }

    const parsed = parseRes.parsed;

    // Resolve Student Identity (via StudentExternalIdentity -> StudentProfile.studentCode -> User.email)
    let studentUserId: string | null = null;
    if (parsed.studentCode) {
      const extStudent = await db.studentExternalIdentity.findFirst({
        where: {
          sourceId: source.id,
          externalStudentId: parsed.studentCode,
        },
      });
      if (extStudent) {
        const prof = await db.studentProfile.findUnique({
          where: { id: extStudent.studentProfileId },
        });
        if (prof) studentUserId = prof.userId;
      }
      if (!studentUserId) {
        const profile = await db.studentProfile.findUnique({
          where: { studentCode: parsed.studentCode },
        });
        if (profile) studentUserId = profile.userId;
      }
    }
    if (!studentUserId && parsed.studentEmail) {
      const user = await db.user.findUnique({
        where: { email: parsed.studentEmail },
      });
      if (user) studentUserId = user.id;
    }

    if (!studentUserId) {
      quarantinedRows += 1;
      await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: parsed.sourceRecordId,
          payloadHash: rawRowHash,
          rawJson: JSON.stringify(rawRow),
          status: "REJECTED",
          errorCodes: JSON.stringify(["UNMAPPED_STUDENT"]),
        },
      });
      rowResults.push({
        rowNumber: parsed.rowNumber,
        recordId: parsed.sourceRecordId,
        status: "QUARANTINED",
        errorCode: "UNMAPPED_STUDENT",
        errorMessage: "Chưa ánh xạ được danh tính học sinh trong hệ thống.",
      });
      continue;
    }

    // Check native LMS attempt deduplication (prevent Sheet -> LMS loop double-counting)
    const candidateNativeId = parsed.nativeAttemptId || parsed.sourceRecordId;
    const existingNativeAttempt = await db.attempt.findUnique({
      where: { id: candidateNativeId },
    });
    if (existingNativeAttempt) {
      validRows += 1;
      skippedNativeDuplicateCount += 1;
      await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: parsed.sourceRecordId,
          payloadHash: rawRowHash,
          rawJson: JSON.stringify(rawRow),
          status: "UNCHANGED",
          mappedStudentId: studentUserId,
          mappedAssessmentId: parsed.assessmentCode,
        },
      });
      rowResults.push({
        rowNumber: parsed.rowNumber,
        recordId: parsed.sourceRecordId,
        status: "SKIPPED_NATIVE_DUPLICATE",
      });
      continue;
    }

    // Handle Summary Row (aggregate count/score only -> store in ImportedAssessmentSummary, NEVER fabricate individual attempts!)
    if (parsed.kind === "SUMMARY") {
      validRows += 1;
      summaryCount += 1;
      await db.importedAssessmentSummary.upsert({
        where: {
          sourceId_sourceRecordId: {
            sourceId: source.id,
            sourceRecordId: parsed.sourceRecordId,
          },
        },
        update: {
          reportedAttemptCount: parsed.attemptCount,
          reportedScore: parsed.normalizedScore10,
          maxScore: parsed.maxScore,
          asOf: parsed.submittedAt,
        },
        create: {
          sourceId: source.id,
          sourceRecordId: parsed.sourceRecordId,
          studentUserId,
          assessmentId: parsed.assessmentCode,
          reportedAttemptCount: parsed.attemptCount,
          reportedScore: parsed.normalizedScore10,
          maxScore: parsed.maxScore,
          scoreMeaning: "AGGREGATE_ONLY",
          asOf: parsed.submittedAt,
        },
      });

      await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: parsed.sourceRecordId,
          payloadHash: rawRowHash,
          rawJson: JSON.stringify(rawRow),
          status: "ACCEPTED",
          mappedStudentId: studentUserId,
          mappedAssessmentId: parsed.assessmentCode,
        },
      });

      rowResults.push({
        rowNumber: parsed.rowNumber,
        recordId: parsed.sourceRecordId,
        status: "IMPORTED_SUMMARY",
      });
      continue;
    }

    // Detailed Attempt Row
    const payloadHash = computeAttemptPayloadHash({
      studentUserId,
      assessmentCode: parsed.assessmentCode,
      assessmentVersion: parsed.assessmentVersion,
      attemptNumber: parsed.attemptNumber,
      rawScore: parsed.rawScore,
      maxScore: parsed.maxScore,
      submittedAtIso: parsed.submittedAt.toISOString(),
      status: parsed.status,
    });

    const existingImported = await db.importedAttempt.findUnique({
      where: {
        sourceId_sourceRecordId: {
          sourceId: source.id,
          sourceRecordId: parsed.sourceRecordId,
        },
      },
    });

    validRows += 1;

    if (existingImported) {
      const existingCanonHash = computeAttemptPayloadHash({
        studentUserId: existingImported.studentUserId,
        assessmentCode: existingImported.assessmentId,
        assessmentVersion: existingImported.assessmentVersion,
        attemptNumber: parsed.attemptNumber,
        rawScore: existingImported.rawScore,
        maxScore: existingImported.maxScore,
        submittedAtIso: existingImported.submittedAt.toISOString(),
        status: parsed.status,
      });

      if (existingCanonHash === payloadHash) {
        skippedUnchangedCount += 1;
        await db.sheetImportRow.create({
          data: {
            runId: run.id,
            sourceRecordId: parsed.sourceRecordId,
            payloadHash,
            rawJson: JSON.stringify(rawRow),
            status: "UNCHANGED",
            mappedStudentId: studentUserId,
            mappedAssessmentId: parsed.assessmentCode,
          },
        });
        rowResults.push({
          rowNumber: parsed.rowNumber,
          recordId: parsed.sourceRecordId,
          status: "SKIPPED_UNCHANGED",
        });
        continue;
      }

      const stagedRow = await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: parsed.sourceRecordId,
          sourceRevision: existingImported.revision + 1,
          payloadHash,
          rawJson: JSON.stringify(rawRow),
          status: "ACCEPTED",
          mappedStudentId: studentUserId,
          mappedAssessmentId: parsed.assessmentCode,
        },
      });

      await db.$transaction([
        db.attemptCorrection.create({
          data: {
            importedAttemptId: existingImported.id,
            oldPayload: JSON.stringify({
              rawScore: existingImported.rawScore,
              maxScore: existingImported.maxScore,
              normalizedScore: existingImported.normalizedScore,
            }),
            newPayload: JSON.stringify({
              rawScore: parsed.rawScore,
              maxScore: parsed.maxScore,
              normalizedScore: parsed.normalizedScore10,
            }),
            reason: "Cập nhật điểm từ lần đồng bộ Google Sheets",
            actorId: actorId || "SHEET_IMPORT_PIPELINE",
            sourceRevision: existingImported.revision + 1,
          },
        }),
        db.importedAttempt.update({
          where: { id: existingImported.id },
          data: {
            rawScore: parsed.rawScore,
            maxScore: parsed.maxScore,
            normalizedScore: parsed.normalizedScore10,
            normalizedScore100: parsed.normalizedScore100,
            submittedAt: parsed.submittedAt,
            mode: parsed.assessmentMode,
            revision: existingImported.revision + 1,
            importRowId: stagedRow.id,
          },
        }),
      ]);

      updatedCount += 1;
      rowResults.push({
        rowNumber: parsed.rowNumber,
        recordId: parsed.sourceRecordId,
        status: "UPDATED_REVISION",
      });
    } else {
      const stagedRow = await db.sheetImportRow.create({
        data: {
          runId: run.id,
          sourceRecordId: parsed.sourceRecordId,
          sourceRevision: 1,
          payloadHash,
          rawJson: JSON.stringify(rawRow),
          status: "ACCEPTED",
          mappedStudentId: studentUserId,
          mappedAssessmentId: parsed.assessmentCode,
        },
      });

      await db.importedAttempt.create({
        data: {
          sourceId: source.id,
          sourceRecordId: parsed.sourceRecordId,
          studentUserId,
          classId: source.classId,
          academicYearId: source.academicYearId,
          assessmentId: parsed.assessmentCode,
          assessmentVersion: parsed.assessmentVersion,
          mode: parsed.assessmentMode,
          rawScore: parsed.rawScore,
          maxScore: parsed.maxScore,
          normalizedScore: parsed.normalizedScore10,
          normalizedScore100: parsed.normalizedScore100,
          submittedAt: parsed.submittedAt,
          status: "ACCEPTED",
          revision: 1,
          importRowId: stagedRow.id,
          nativeAttemptId: parsed.nativeAttemptId,
        },
      });
      importedCount += 1;
      rowResults.push({
        rowNumber: parsed.rowNumber,
        recordId: parsed.sourceRecordId,
        status: "IMPORTED",
      });
    }
  }

  await db.sheetImportRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      acceptedCount: importedCount + updatedCount + summaryCount,
      rejectedCount: invalidRows + quarantinedRows,
      unchangedCount: skippedUnchangedCount + skippedNativeDuplicateCount,
      completedAt: new Date(),
    },
  });

  return {
    runId: run.id,
    totalRows: rows.length,
    validRows,
    importedCount,
    updatedCount,
    skippedUnchangedCount,
    skippedNativeDuplicateCount,
    summaryCount,
    invalidRows,
    quarantinedRows,
    rowResults,
  };
}
