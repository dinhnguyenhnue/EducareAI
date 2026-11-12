import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyTeacherClassScope,
  submitAssignmentTransactional,
} from "../src/lib/submission-guard";
import { executeSheetImportBatch } from "../src/lib/sheets-import-pipeline";

function createInMemoryLmsDb() {
  const teacherProfiles = new Map<string, any>();
  const studentProfilesByCode = new Map<string, any>();
  const studentProfilesById = new Map<string, any>();
  const usersByEmail = new Map<string, any>();
  const assignments = new Map<string, any>();
  const submissions: any[] = [];
  const selfAssessments: any[] = [];
  const auditLogs: any[] = [];
  const sources = new Map<string, any>();
  const runs = new Map<string, any>();
  const importRows: any[] = [];
  const nativeAttempts = new Map<string, any>();
  const importedAttempts = new Map<string, any>(); // key: `${sourceId}::${sourceRecordId}`
  const corrections: any[] = [];
  const summaries = new Map<string, any>(); // key: `${sourceId}::${sourceRecordId}`

  const db: any = {
    _state: {
      teacherProfiles,
      studentProfilesByCode,
      studentProfilesById,
      usersByEmail,
      assignments,
      submissions,
      selfAssessments,
      auditLogs,
      sources,
      runs,
      importRows,
      nativeAttempts,
      importedAttempts,
      corrections,
      summaries,
    },
    $transaction: async (arg: any) => {
      if (typeof arg === "function") {
        return arg(db);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    },
    teacherProfile: {
      findUnique: async ({ where }: any) => teacherProfiles.get(where.userId) || null,
    },
    assignment: {
      findUnique: async ({ where }: any) => assignments.get(where.id) || null,
    },
    submission: {
      findMany: async ({ where }: any) =>
        submissions
          .filter(
            (s) =>
              s.assignmentId === where.assignmentId &&
              s.studentId === where.studentId
          )
          .sort((a, b) => b.attemptNumber - a.attemptNumber),
      create: async ({ data }: any) => {
        const rec = {
          id: `sub-${crypto.randomUUID()}`,
          submittedAt: new Date(),
          ...data,
        };
        submissions.push(rec);
        return rec;
      },
      count: async ({ where }: any) =>
        submissions.filter(
          (s) =>
            s.assignmentId === where.assignmentId &&
            s.studentId === where.studentId
        ).length,
    },
    selfAssessment: {
      create: async ({ data }: any) => {
        const rec = { id: `sa-${crypto.randomUUID()}`, ...data };
        selfAssessments.push(rec);
        return rec;
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        const rec = { id: `audit-${crypto.randomUUID()}`, ...data };
        auditLogs.push(rec);
        return rec;
      },
    },
    sheetImportSource: {
      findUniqueOrThrow: async ({ where }: any) => {
        const s = sources.get(where.id);
        if (!s) throw new Error("Source not found");
        return s;
      },
    },
    sheetImportRun: {
      create: async ({ data }: any) => {
        const rec = { id: `run-${crypto.randomUUID()}`, ...data };
        runs.set(rec.id, rec);
        return rec;
      },
      update: async ({ where, data }: any) => {
        const existing = runs.get(where.id);
        const updated = { ...existing, ...data };
        runs.set(where.id, updated);
        return updated;
      },
    },
    sheetImportRow: {
      create: async ({ data }: any) => {
        const rec = { id: `row-${crypto.randomUUID()}`, ...data };
        importRows.push(rec);
        return rec;
      },
    },
    studentExternalIdentity: {
      findFirst: async () => null,
    },
    studentProfile: {
      findUnique: async ({ where }: any) => {
        if (where.studentCode) return studentProfilesByCode.get(where.studentCode) || null;
        if (where.id) return studentProfilesById.get(where.id) || null;
        return null;
      },
    },
    user: {
      findUnique: async ({ where }: any) => usersByEmail.get(where.email) || null,
    },
    attempt: {
      findUnique: async ({ where }: any) => nativeAttempts.get(where.id) || null,
    },
    importedAssessmentSummary: {
      upsert: async ({ where, update, create }: any) => {
        const key = `${where.sourceId_sourceRecordId.sourceId}::${where.sourceId_sourceRecordId.sourceRecordId}`;
        const existing = summaries.get(key);
        const next = existing
          ? { ...existing, ...update }
          : { id: `sum-${crypto.randomUUID()}`, ...create };
        summaries.set(key, next);
        return next;
      },
      findUniqueOrThrow: async ({ where }: any) => {
        const key = `${where.sourceId_sourceRecordId.sourceId}::${where.sourceId_sourceRecordId.sourceRecordId}`;
        const rec = summaries.get(key);
        if (!rec) throw new Error("Summary not found");
        return rec;
      },
    },
    importedAttempt: {
      findUnique: async ({ where }: any) => {
        if (where.sourceId_sourceRecordId) {
          const key = `${where.sourceId_sourceRecordId.sourceId}::${where.sourceId_sourceRecordId.sourceRecordId}`;
          return importedAttempts.get(key) || null;
        }
        return null;
      },
      findUniqueOrThrow: async ({ where }: any) => {
        const key = `${where.sourceId_sourceRecordId.sourceId}::${where.sourceId_sourceRecordId.sourceRecordId}`;
        const rec = importedAttempts.get(key);
        if (!rec) throw new Error("ImportedAttempt not found");
        return {
          ...rec,
          corrections: corrections.filter((c) => c.importedAttemptId === rec.id),
        };
      },
      create: async ({ data }: any) => {
        const rec = { id: `imp-${crypto.randomUUID()}`, ...data };
        importedAttempts.set(`${data.sourceId}::${data.sourceRecordId}`, rec);
        return rec;
      },
      update: async ({ where, data }: any) => {
        for (const [key, val] of importedAttempts.entries()) {
          if (val.id === where.id) {
            const next = { ...val, ...data };
            importedAttempts.set(key, next);
            return next;
          }
        }
        throw new Error("ImportedAttempt id not found");
      },
      count: async ({ where }: any) => {
        let count = 0;
        for (const val of importedAttempts.values()) {
          if (!where?.sourceId || val.sourceId === where.sourceId) count += 1;
        }
        return count;
      },
    },
    attemptCorrection: {
      create: async ({ data }: any) => {
        const rec = { id: `corr-${crypto.randomUUID()}`, ...data };
        corrections.push(rec);
        return rec;
      },
    },
  };

  return db;
}

describe("Transactional Pipeline & RBAC Acceptance Suite (Section 8)", () => {
  it("enforces Teacher Class Scope (7A1 teacher denied 403 on 7A2), blocks concurrent duplicate submissions, and executes idempotent Google Sheets Import + Revisions + Summary + Native Dedupe", async () => {
    const db = createInMemoryLmsDb();

    // 1. Seed Teacher assigned to 7A1 (not 7A2)
    db._state.teacherProfiles.set("teacher-user-1", {
      id: "tp-1",
      userId: "teacher-user-1",
      homeroomClasses: [{ id: "class-7a1", name: "7A1" }],
      assignments: [{ classId: "class-7a1" }],
    });

    const allowed7A1 = await verifyTeacherClassScope(
      "teacher-user-1",
      "TEACHER",
      "class-7a1",
      db
    );
    assert.equal(allowed7A1.allowed, true);

    const denied7A2 = await verifyTeacherClassScope(
      "teacher-user-1",
      "TEACHER",
      "class-7a2",
      db
    );
    assert.equal(denied7A2.allowed, false);
    assert.equal(denied7A2.code, "FORBIDDEN_CLASS_SCOPE");
    assert.equal(denied7A2.status, 403);

    // 2. Seed Student in 7A1 and Assignment with maxSubmissions = 1
    db._state.studentProfilesByCode.set("HS7A1_001", {
      id: "sp-1",
      userId: "student-user-1",
      studentCode: "HS7A1_001",
      classId: "class-7a1",
    });

    db._state.assignments.set("asg-1", {
      id: "asg-1",
      classId: "class-7a1",
      schoolClass: { id: "class-7a1", name: "7A1" },
      status: "ASSIGNED",
      type: "PRACTICE",
      dueAt: new Date(Date.now() + 86400_000),
      maxSubmissions: 1,
    });

    // Concurrent Submissions Test: 2 parallel requests for maxSubmissions=1 -> 1 succeeds, 1 rejected
    const [sub1, sub2] = await Promise.all([
      submitAssignmentTransactional({
        actorUserId: "student-user-1",
        actorEmail: "minhanh@unigo.edu.vn",
        actorRole: "STUDENT",
        studentProfileId: "sp-1",
        studentCode: "HS7A1_001",
        studentClassId: "class-7a1",
        studentClassName: "7A1",
        assignmentId: "asg-1",
        content: "Bài nộp 1",
        attachmentsJson: null,
        db,
      }),
      submitAssignmentTransactional({
        actorUserId: "student-user-1",
        actorEmail: "minhanh@unigo.edu.vn",
        actorRole: "STUDENT",
        studentProfileId: "sp-1",
        studentCode: "HS7A1_001",
        studentClassId: "class-7a1",
        studentClassName: "7A1",
        assignmentId: "asg-1",
        content: "Bài nộp 2 gửi đồng thời",
        attachmentsJson: null,
        db,
      }),
    ]);

    assert.equal(sub1.ok, true);
    assert.equal(sub2.ok, false);
    if (!sub2.ok) {
      assert.equal(sub2.errorCode, "MAX_SUBMISSIONS_REACHED");
    }
    assert.equal(
      await db.submission.count({
        where: { assignmentId: "asg-1", studentId: "sp-1" },
      }),
      1
    );

    // 3. Google Sheets Import Pipeline Test
    db._state.sources.set("src-7a1", {
      id: "src-7a1",
      classId: "class-7a1",
      academicYearId: "2026-2027",
      spreadsheetId: "SHEET_7A1",
      sheetId: 0,
    });

    db._state.nativeAttempts.set("NATIVE-ATTEMPT-UUID-001", {
      id: "NATIVE-ATTEMPT-UUID-001",
      studentId: "student-user-1",
      totalScore: 9.0,
    });

    // Run 1: 1 valid attempt (80/100 -> 8.0), 1 native LMS duplicate, 1 aggregate summary row, 1 empty score row
    const run1 = await executeSheetImportBatch({
      sourceId: "src-7a1",
      actorId: "teacher-user-1",
      db,
      rows: [
        {
          rowNumber: 2,
          record_id: "EXT-REC-001",
          student_code: "HS7A1_001",
          assessment_code: "QUIZ_SHEET_01",
          assessment_mode: "PRACTICE",
          attempt_number: 1,
          raw_score: "80",
          max_score: "100",
          submitted_at: "2026-11-11T09:00:00+07:00",
        },
        {
          rowNumber: 3,
          record_id: "EXT-REC-NATIVE-DUP",
          native_attempt_id: "NATIVE-ATTEMPT-UUID-001",
          student_code: "HS7A1_001",
          assessment_code: "ASM_NATIVE_01",
          raw_score: "9.0",
          max_score: "10",
          submitted_at: "2026-11-10T15:00:00+07:00",
        },
        {
          rowNumber: 4,
          record_id: "EXT-SUM-001",
          row_type: "SUMMARY",
          student_code: "HS7A1_001",
          assessment_code: "QUIZ_AGGREGATE_ONLY",
          attempt_count: 5,
          raw_score: "8,5",
          max_score: "10",
          submitted_at: "2026-11-11T10:00:00+07:00",
        },
        {
          rowNumber: 5,
          record_id: "EXT-EMPTY-SCORE",
          student_code: "HS7A1_001",
          assessment_code: "QUIZ_SHEET_01",
          raw_score: "",
          max_score: "10",
        },
      ],
    });

    assert.equal(run1.importedCount, 1);
    assert.equal(run1.skippedNativeDuplicateCount, 1);
    assert.equal(run1.summaryCount, 1);
    assert.equal(run1.invalidRows, 1);

    // Run 2: Reorder row (rowNumber changed from 2 to 99, same record_id & payload) -> SKIPPED_UNCHANGED
    const run2 = await executeSheetImportBatch({
      sourceId: "src-7a1",
      actorId: "teacher-user-1",
      db,
      rows: [
        {
          rowNumber: 99,
          record_id: "EXT-REC-001",
          student_code: "HS7A1_001",
          assessment_code: "QUIZ_SHEET_01",
          assessment_mode: "PRACTICE",
          attempt_number: 1,
          raw_score: "80",
          max_score: "100",
          submitted_at: "2026-11-11T09:00:00+07:00",
        },
      ],
    });
    assert.equal(run2.importedCount, 0);
    assert.equal(run2.skippedUnchangedCount, 1);

    // Run 3: Teacher updates score in Sheet from 80/100 to 95/100 -> UPDATED_REVISION + AttemptCorrection audit log
    const run3 = await executeSheetImportBatch({
      sourceId: "src-7a1",
      actorId: "teacher-user-1",
      db,
      rows: [
        {
          rowNumber: 99,
          record_id: "EXT-REC-001",
          student_code: "HS7A1_001",
          assessment_code: "QUIZ_SHEET_01",
          assessment_mode: "PRACTICE",
          attempt_number: 1,
          raw_score: "95",
          max_score: "100",
          submitted_at: "2026-11-11T09:00:00+07:00",
        },
      ],
    });
    assert.equal(run3.updatedCount, 1);

    const updatedAttempt = await db.importedAttempt.findUniqueOrThrow({
      where: {
        sourceId_sourceRecordId: {
          sourceId: "src-7a1",
          sourceRecordId: "EXT-REC-001",
        },
      },
    });
    assert.equal(updatedAttempt.revision, 2);
    assert.equal(updatedAttempt.normalizedScore, 9.5);
    assert.equal(updatedAttempt.normalizedScore100, 95.0);
    assert.equal(updatedAttempt.corrections.length, 1);

    // Ensure SUMMARY row did NOT fabricate any ImportedAttempt rows
    const totalImportedAttempts = await db.importedAttempt.count({
      where: { sourceId: "src-7a1" },
    });
    assert.equal(totalImportedAttempts, 1);

    const summaryRecord = await db.importedAssessmentSummary.findUniqueOrThrow({
      where: {
        sourceId_sourceRecordId: {
          sourceId: "src-7a1",
          sourceRecordId: "EXT-SUM-001",
        },
      },
    });
    assert.equal(summaryRecord.reportedAttemptCount, 5);
    assert.equal(summaryRecord.reportedScore, 8.5);
    assert.equal(summaryRecord.scoreMeaning, "AGGREGATE_ONLY");
  });
});
