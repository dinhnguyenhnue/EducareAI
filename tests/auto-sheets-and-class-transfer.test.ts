import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { submitAssignmentTransactional } from "../src/lib/submission-guard";
import {
  syncClassTrackingSheet,
  autoSyncClassTrackingSheetNonBlocking,
} from "../src/lib/google-workspace";
import { updateStudentClassTransactional } from "../src/lib/student-class-transfer";

/**
 * Isolated in-memory Prisma-compatible DB for testing auto-Sheets sync and student class transfer
 * without touching any real database or real student PII.
 */
function createIsolatedAcademyDb() {
  const academicYears = new Map<string, any>();
  const schoolClasses = new Map<string, any>();
  const users = new Map<string, any>();
  const studentProfiles = new Map<string, any>();
  const teacherProfiles = new Map<string, any>();
  const enrollments = new Map<string, any>(); // key: `${studentId}::${classId}::${academicYearId}`
  const subjects = new Map<string, any>();
  const assignments = new Map<string, any>();
  const submissions: any[] = [];
  const attempts: any[] = [];
  const projects: any[] = [];
  const aiLogs: any[] = [];
  const learningRecords: any[] = [];
  const selfAssessments: any[] = [];
  const auditLogs: any[] = [];
  const trackingSheets = new Map<string, any>(); // key: `${classId}::${academicYearId}::${purpose}`
  const syncLogs: any[] = [];

  const hydrateStudentProfile = (sp: any) => {
    if (!sp) return null;
    const user = users.get(sp.userId);
    const schoolClass = sp.classId ? schoolClasses.get(sp.classId) || null : null;
    const spEnrollments = Array.from(enrollments.values())
      .filter((e) => e.studentId === sp.id)
      .map((e) => ({
        ...e,
        schoolClass: schoolClasses.get(e.classId) || null,
      }));
    return {
      ...sp,
      user,
      schoolClass,
      enrollments: spEnrollments,
      progressRecords: [],
      grades: [],
    };
  };

  const db: any = {
    _state: {
      academicYears,
      schoolClasses,
      users,
      studentProfiles,
      teacherProfiles,
      enrollments,
      subjects,
      assignments,
      submissions,
      attempts,
      auditLogs,
      trackingSheets,
      syncLogs,
    },
    $transaction: async (arg: any) => {
      if (typeof arg === "function") return arg(db);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    },
    academicYear: {
      findFirst: async ({ where }: any = {}) => {
        const list = Array.from(academicYears.values());
        if (!where) return list[0] || null;
        if (where.isCurrent) return list.find((y) => y.isCurrent) || null;
        if (where.OR) {
          return (
            list.find((y) =>
              where.OR.some(
                (cond: any) =>
                  (cond.id && y.id === cond.id) ||
                  (cond.name && y.name === cond.name)
              )
            ) || null
          );
        }
        return list[0] || null;
      },
    },
    schoolClass: {
      findFirst: async ({ where }: any) => {
        const list = Array.from(schoolClasses.values());
        const match = list.find((c) => {
          if (where.OR) {
            return where.OR.some((cond: any) => {
              if (cond.id && c.id === cond.id) return true;
              if (cond.name && c.name === cond.name) {
                if (cond.academicYearId && c.academicYearId !== cond.academicYearId) {
                  return false;
                }
                return true;
              }
              return false;
            });
          }
          return false;
        });
        if (!match) return null;
        return {
          ...match,
          academicYear: academicYears.get(match.academicYearId) || null,
          homeroomTeacher: null,
        };
      },
      findMany: async ({ where }: any) => {
        const list = Array.from(schoolClasses.values());
        return list
          .filter((c) => {
            if (!where?.OR) return true;
            return where.OR.some((cond: any) => {
              if (cond.id && c.id === cond.id) return true;
              if (cond.name && c.name === cond.name) {
                if (cond.academicYearId && c.academicYearId !== cond.academicYearId) {
                  return false;
                }
                return true;
              }
              return false;
            });
          })
          .map((c) => ({
            ...c,
            academicYear: academicYears.get(c.academicYearId) || null,
          }));
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        const u = users.get(where.id);
        if (!u) return null;
        const sp = Array.from(studentProfiles.values()).find(
          (p) => p.userId === u.id
        );
        const tp = teacherProfiles.get(u.id) || null;
        return {
          ...u,
          studentProfile: hydrateStudentProfile(sp),
          teacherProfile: tp,
          parentProfile: null,
        };
      },
    },
    teacherProfile: {
      findUnique: async ({ where }: any) => {
        return teacherProfiles.get(where.userId) || null;
      },
    },
    studentProfile: {
      findFirst: async ({ where }: any) => {
        const list = Array.from(studentProfiles.values());
        const found = list.find((p) => {
          if (where?.OR) {
            return where.OR.some(
              (cond: any) => cond.studentCode && p.studentCode === cond.studentCode
            );
          }
          if (where?.studentCode) return p.studentCode === where.studentCode;
          return false;
        });
        return hydrateStudentProfile(found);
      },
      findMany: async ({ where }: any = {}) => {
        const list = Array.from(studentProfiles.values());
        const filtered = list.filter((p) => {
          if (!where) return true;
          if (where.userId?.in) {
            return where.userId.in.includes(p.userId);
          }
          if (where.OR) {
            return where.OR.some((cond: any) => {
              if (cond.classId && p.classId === cond.classId) return true;
              if (cond.enrollments?.some) {
                const subCond = cond.enrollments.some;
                return Array.from(enrollments.values()).some(
                  (e) =>
                    e.studentId === p.id &&
                    e.classId === subCond.classId &&
                    e.academicYearId === subCond.academicYearId &&
                    e.status === subCond.status
                );
              }
              return false;
            });
          }
          return true;
        });
        return filtered
          .map(hydrateStudentProfile)
          .sort((a, b) => a.studentCode.localeCompare(b.studentCode));
      },
      update: async ({ where, data }: any) => {
        const p = studentProfiles.get(where.id);
        if (!p) throw new Error("StudentProfile not found");
        Object.assign(p, data);
        return hydrateStudentProfile(p);
      },
    },
    enrollment: {
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const enr of enrollments.values()) {
          if (
            enr.studentId === where.studentId &&
            enr.academicYearId === where.academicYearId &&
            enr.status === where.status &&
            (!where.NOT?.classId || enr.classId !== where.NOT.classId)
          ) {
            Object.assign(enr, data);
            count += 1;
          }
        }
        return { count };
      },
      upsert: async ({ where, update, create }: any) => {
        const k = where.studentId_classId_academicYearId;
        const mapKey = `${k.studentId}::${k.classId}::${k.academicYearId}`;
        const existing = enrollments.get(mapKey);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const rec = { id: `enr-${crypto.randomUUID()}`, enrolledAt: new Date(), ...create };
        enrollments.set(mapKey, rec);
        return rec;
      },
    },
    assignment: {
      findUnique: async ({ where }: any) => {
        const a = assignments.get(where.id);
        if (!a) return null;
        return {
          ...a,
          schoolClass: schoolClasses.get(a.classId) || null,
          subject: subjects.get(a.subjectId) || { name: "Tin học" },
        };
      },
    },
    submission: {
      findMany: async ({ where }: any = {}) => {
        return submissions
          .filter((s) => {
            if (where?.assignmentId && s.assignmentId !== where.assignmentId) {
              return false;
            }
            if (where?.studentId && s.studentId !== where.studentId) {
              return false;
            }
            if (where?.status?.not && s.status === where.status.not) {
              return false;
            }
            if (where?.assignment?.classId) {
              const a = assignments.get(s.assignmentId);
              if (!a || a.classId !== where.assignment.classId) return false;
            }
            return true;
          })
          .map((s) => {
            const a = assignments.get(s.assignmentId);
            const sp = studentProfiles.get(s.studentId);
            return {
              ...s,
              student: hydrateStudentProfile(sp),
              assignment: a
                ? { ...a, subject: subjects.get(a.subjectId) || { name: "Tin học" } }
                : null,
            };
          });
      },
      create: async ({ data }: any) => {
        const rec = {
          id: `sub-${crypto.randomUUID()}`,
          score: null,
          teacherComment: null,
          submittedAt: new Date(),
          ...data,
        };
        submissions.push(rec);
        return rec;
      },
    },
    attempt: {
      findMany: async ({ where }: any = {}) => {
        return attempts.filter((att) => {
          if (where?.status?.in && !where.status.in.includes(att.status)) {
            return false;
          }
          if (
            where?.isDemoData !== undefined &&
            Boolean(att.isDemoData) !== where.isDemoData
          ) {
            return false;
          }
          if (where?.OR) {
            return where.OR.some((cond: any) => {
              if (cond.classId && att.classId === cond.classId) return true;
              return false;
            });
          }
          return true;
        });
      },
    },
    project: {
      findMany: async () => projects,
    },
    aIUsageLog: {
      findMany: async () => aiLogs,
    },
    learningRecord: {
      findMany: async () => learningRecords,
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
        const rec = { id: `audit-${crypto.randomUUID()}`, createdAt: new Date(), ...data };
        auditLogs.push(rec);
        return rec;
      },
    },
    classTrackingSheet: {
      findUnique: async ({ where }: any) => {
        const k = where.classId_academicYearId_purpose;
        return trackingSheets.get(`${k.classId}::${k.academicYearId}::${k.purpose}`) || null;
      },
      upsert: async ({ where, update, create }: any) => {
        const k = where.classId_academicYearId_purpose;
        const mapKey = `${k.classId}::${k.academicYearId}::${k.purpose}`;
        const existing = trackingSheets.get(mapKey);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const rec = { id: `sheet-${crypto.randomUUID()}`, ...create };
        trackingSheets.set(mapKey, rec);
        return rec;
      },
    },
    syncLog: {
      create: async ({ data }: any) => {
        const rec = { id: `slog-${crypto.randomUUID()}`, createdAt: new Date(), ...data };
        syncLogs.push(rec);
        return rec;
      },
    },
  };

  return db;
}

/**
 * Mock Google Sheets API v4 server supporting create, values:batchGet, values:batchUpdate,
 * toggleable network/503 outage, and simulated direct teacher edits on the Sheet.
 */
function createMockGoogleSheetsTransport() {
  const spreadsheets = new Map<string, { title: string; tabs: Record<string, string[][]> }>();
  let failNextRequests = false;
  let batchUpdateCallCount = 0;

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || "GET").toUpperCase();

    if (failNextRequests) {
      return new Response(JSON.stringify({ error: "Service Unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create spreadsheet
    if (method === "POST" && url.endsWith("/v4/spreadsheets")) {
      const body = JSON.parse(String(init?.body || "{}"));
      const id = `mock-sheet-${spreadsheets.size + 1}`;
      spreadsheets.set(id, { title: body.properties?.title || id, tabs: {} });
      return new Response(
        JSON.stringify({
          spreadsheetId: id,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read existing live teacher notes (batchGet)
    const getMatch = url.match(/\/v4\/spreadsheets\/([^/]+)\/values:batchGet/);
    if (method === "GET" && getMatch) {
      const id = decodeURIComponent(getMatch[1]);
      const sheet = spreadsheets.get(id);
      const detailRows = sheet?.tabs["Chi tiết lượt nộp"]?.slice(1) || [];
      const summaryRows = sheet?.tabs["Tổng hợp HS - Bài - Chế độ"]?.slice(1) || [];
      return new Response(
        JSON.stringify({
          valueRanges: [{ values: detailRows }, { values: summaryRows }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Batch update tabs
    const updateMatch = url.match(/\/v4\/spreadsheets\/([^/]+)\/values:batchUpdate/);
    if (method === "POST" && updateMatch) {
      batchUpdateCallCount += 1;
      const id = decodeURIComponent(updateMatch[1]);
      const sheet = spreadsheets.get(id);
      if (!sheet) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      }
      const body = JSON.parse(String(init?.body || "{}"));
      for (const item of body.data || []) {
        const tabMatch = String(item.range).match(/^'([^']+)'!/);
        const tabName = tabMatch ? tabMatch[1] : String(item.range);
        sheet.tabs[tabName] = item.values;
      }
      return new Response(JSON.stringify({ updatedTabs: (body.data || []).length }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unhandled mock URL" }), { status: 400 });
  }) as typeof fetch;

  return {
    fetchImpl,
    spreadsheets,
    setOutage: (down: boolean) => {
      failNextRequests = down;
    },
    getBatchUpdateCalls: () => batchUpdateCallCount,
  };
}

function seedTwoClasses(db: any) {
  db._state.academicYears.set("ay-2627", {
    id: "ay-2627",
    name: "2026-2027",
    isCurrent: true,
  });
  db._state.schoolClasses.set("cls-7a", {
    id: "cls-7a",
    name: "7A",
    gradeLevel: 7,
    academicYearId: "ay-2627",
  });
  db._state.schoolClasses.set("cls-7b", {
    id: "cls-7b",
    name: "7B",
    gradeLevel: 7,
    academicYearId: "ay-2627",
  });
  db._state.subjects.set("subj-tin7", {
    id: "subj-tin7",
    name: "Tin học 7",
    code: "TIN7",
    gradeLevel: 7,
  });
  db._state.users.set("u-admin", {
    id: "u-admin",
    email: "admin@test.local",
    fullName: "Quản trị viên Thử nghiệm",
    role: "SCHOOL_ADMIN",
    isActive: true,
  });
  db._state.users.set("u-hs-1", {
    id: "u-hs-1",
    email: "HS26-7A-01",
    passwordHash: "scrypt:mock-stable-hash-001",
    fullName: "Học sinh Giả lập 01",
    role: "STUDENT",
    isActive: true,
  });
  db._state.studentProfiles.set("sp-hs-1", {
    id: "sp-hs-1",
    userId: "u-hs-1",
    studentCode: "HS26-7A-01",
    gradeLevel: 7,
    classId: "cls-7a",
  });
  db._state.enrollments.set("sp-hs-1::cls-7a::ay-2627", {
    id: "enr-1",
    studentId: "sp-hs-1",
    classId: "cls-7a",
    academicYearId: "ay-2627",
    status: "ACTIVE",
  });
}

describe("Auto Google Sheets Sync & Student Class Transfer Acceptance Tests", () => {
  it("Criterion 1: 2 exam attempts (6/10 -> 8/10) produce 2 detail rows, summary '2 lần' & latest 8/10; idempotent replay does not add a 3rd row", async () => {
    const db = createIsolatedAcademyDb();
    seedTwoClasses(db);
    const mockSheets = createMockGoogleSheetsTransport();

    const examMeta = {
      code: "EXAM-TIN7-GK1",
      title: "Kiểm tra giữa kì 1 Tin học 7",
      subjectName: "Tin học 7",
      mode: "EXAM",
    };

    // Attempt 1: 6/10
    db._state.attempts.push({
      id: "att-001",
      assessmentId: "asm-1",
      studentId: "u-hs-1",
      studentEmail: "HS26-7A-01",
      studentName: "Học sinh Giả lập 01",
      classId: "cls-7a",
      attemptNumber: 1,
      status: "SUBMITTED",
      submittedAt: new Date("2026-11-19T02:00:00Z"),
      totalScore: 6,
      maxScore: 10,
      isDemoData: false,
      assessment: examMeta,
    });

    // Attempt 2: 8/10
    db._state.attempts.push({
      id: "att-002",
      assessmentId: "asm-1",
      studentId: "u-hs-1",
      studentEmail: "HS26-7A-01",
      studentName: "Học sinh Giả lập 01",
      classId: "cls-7a",
      attemptNumber: 2,
      status: "SUBMITTED",
      submittedAt: new Date("2026-11-19T02:15:00Z"),
      totalScore: 8,
      maxScore: 10,
      isDemoData: false,
      assessment: examMeta,
    });

    // Duplicate replay of Attempt 2 (same id) + IN_PROGRESS draft must NOT increase count
    db._state.attempts.push({
      id: "att-002",
      assessmentId: "asm-1",
      studentId: "u-hs-1",
      studentEmail: "HS26-7A-01",
      studentName: "Học sinh Giả lập 01",
      classId: "cls-7a",
      attemptNumber: 2,
      status: "SUBMITTED",
      submittedAt: new Date("2026-11-19T02:15:00Z"),
      totalScore: 8,
      maxScore: 10,
      isDemoData: false,
      assessment: examMeta,
    });
    db._state.attempts.push({
      id: "att-draft",
      assessmentId: "asm-1",
      studentId: "u-hs-1",
      studentEmail: "HS26-7A-01",
      studentName: "Học sinh Giả lập 01",
      classId: "cls-7a",
      attemptNumber: 3,
      status: "IN_PROGRESS",
      submittedAt: null,
      totalScore: null,
      maxScore: 10,
      isDemoData: false,
      assessment: examMeta,
    });

    const syncRes = await syncClassTrackingSheet("u-hs-1", "cls-7a", {
      academicYearId: "ay-2627",
      skipActorScopeCheck: true,
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    assert.equal(syncRes.connectionState, "SYNCED");
    const sheet = mockSheets.spreadsheets.get(syncRes.trackingSheet.spreadsheetId!)!;
    const detailRows = sheet.tabs["Chi tiết lượt nộp"].slice(1);
    const summaryRows = sheet.tabs["Tổng hợp HS - Bài - Chế độ"].slice(1);

    assert.equal(detailRows.length, 2);
    assert.equal(detailRows[0][0], "att-001");
    assert.equal(detailRows[0][1], "HS26-7A-01");
    assert.equal(detailRows[0][2], "7A");
    assert.equal(detailRows[0][7], "1");
    assert.equal(detailRows[0][9], "6");
    assert.equal(detailRows[0][13], "Học sinh Giả lập 01");
    assert.equal(detailRows[0][14], "Kiểm tra giữa kì 1 Tin học 7");

    assert.equal(detailRows[1][0], "att-002");
    assert.equal(detailRows[1][7], "2");
    assert.equal(detailRows[1][9], "8");

    assert.equal(summaryRows.length, 1);
    assert.equal(summaryRows[0][6], "2");
    assert.equal(summaryRows[0][7], "8");
    assert.equal(summaryRows[0][14], "2 lần");
  });

  it("Criterion 2: Essay submission starts as 'Chờ chấm' with blank score, updates to 0/10 when graded without adding a 2nd attempt, and preserves teacher notes on Sheets", async () => {
    const db = createIsolatedAcademyDb();
    seedTwoClasses(db);
    const mockSheets = createMockGoogleSheetsTransport();

    db._state.assignments.set("asg-essay-1", {
      id: "asg-essay-1",
      subjectId: "subj-tin7",
      classId: "cls-7a",
      title: "Bài tự luận: Thiết bị vào ra",
      type: "INDIVIDUAL",
      maxScore: 10,
      dueAt: new Date(Date.now() + 86_400_000),
      maxSubmissions: 3,
      status: "ASSIGNED",
    });

    // Student submits essay with explicit idempotencyKey
    const sub1 = await submitAssignmentTransactional({
      actorUserId: "u-hs-1",
      actorEmail: "HS26-7A-01",
      actorRole: "STUDENT",
      studentProfileId: "sp-hs-1",
      studentCode: "HS26-7A-01",
      studentClassId: "cls-7a",
      studentClassName: "7A",
      enrolledClassIds: ["cls-7a"],
      assignmentId: "asg-essay-1",
      content: "Bài làm tự luận của học sinh",
      attachmentsJson: null,
      idempotencyKey: "idem-essay-01",
      db,
    });
    assert.equal(sub1.ok, true);
    assert.equal(sub1.idempotentReplay, false);

    // Resend exact same idempotencyKey -> must NOT create a 2nd submission
    const subReplay = await submitAssignmentTransactional({
      actorUserId: "u-hs-1",
      actorEmail: "HS26-7A-01",
      actorRole: "STUDENT",
      studentProfileId: "sp-hs-1",
      studentCode: "HS26-7A-01",
      studentClassId: "cls-7a",
      studentClassName: "7A",
      enrolledClassIds: ["cls-7a"],
      assignmentId: "asg-essay-1",
      content: "Bài làm tự luận của học sinh (retry)",
      attachmentsJson: null,
      idempotencyKey: "idem-essay-01",
      db,
    });
    assert.equal(subReplay.ok, true);
    assert.equal(subReplay.idempotentReplay, true);
    assert.equal(db._state.submissions.length, 1);

    // Auto-sync right after submission -> "Chờ chấm", blank score, 1 attempt
    const syncPendingGrade = await syncClassTrackingSheet("u-hs-1", "cls-7a", {
      academicYearId: "ay-2627",
      skipActorScopeCheck: true,
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });
    const sheetId = syncPendingGrade.trackingSheet.spreadsheetId!;
    const sheetBefore = mockSheets.spreadsheets.get(sheetId)!;
    const detailBefore = sheetBefore.tabs["Chi tiết lượt nộp"].slice(1);
    const summaryBefore = sheetBefore.tabs["Tổng hợp HS - Bài - Chế độ"].slice(1);

    assert.equal(detailBefore.length, 1);
    assert.equal(detailBefore[0][9], "");
    assert.equal(detailBefore[0][15], "Chờ chấm");
    assert.equal(summaryBefore[0][6], "1");
    assert.equal(summaryBefore[0][14], "1 lần");
    assert.equal(summaryBefore[0][7], "");
    assert.equal(summaryBefore[0][15], "Chờ chấm");

    // Simulate teacher editing the teacher_note column directly on Google Sheets
    sheetBefore.tabs["Chi tiết lượt nộp"][1][12] = "GV ghi chú trực tiếp trên Sheet";

    // Teacher grades the essay as 0/10
    db._state.submissions[0].score = 0;
    db._state.submissions[0].status = "GRADED";

    // Auto-sync right after grading -> same row updates to "0", "Đã chấm", count still 1, teacher note preserved!
    await syncClassTrackingSheet("u-admin", "cls-7a", {
      academicYearId: "ay-2627",
      skipActorScopeCheck: true,
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    const sheetAfter = mockSheets.spreadsheets.get(sheetId)!;
    const detailAfter = sheetAfter.tabs["Chi tiết lượt nộp"].slice(1);
    const summaryAfter = sheetAfter.tabs["Tổng hợp HS - Bài - Chế độ"].slice(1);

    assert.equal(detailAfter.length, 1);
    assert.equal(detailAfter[0][0], sub1.submission!.id);
    assert.equal(detailAfter[0][9], "0");
    assert.equal(detailAfter[0][12], "GV ghi chú trực tiếp trên Sheet");
    assert.equal(detailAfter[0][15], "Đã chấm");
    assert.equal(summaryAfter[0][6], "1");
    assert.equal(summaryAfter[0][7], "0");
    assert.equal(summaryAfter[0][15], "Đã chấm");
  });

  it("Criterion 3: Sheets outage does not block DB submission; saves ERROR status and retries cleanly with zero duplicates once recovered", async () => {
    const db = createIsolatedAcademyDb();
    seedTwoClasses(db);
    const mockSheets = createMockGoogleSheetsTransport();

    db._state.assignments.set("asg-outage", {
      id: "asg-outage",
      subjectId: "subj-tin7",
      classId: "cls-7a",
      title: "Bài thực hành khi mạng Sheets gián đoạn",
      type: "INDIVIDUAL",
      maxScore: 10,
      dueAt: new Date(Date.now() + 86_400_000),
      maxSubmissions: 3,
      status: "ASSIGNED",
    });

    // Save to DB first
    const subRes = await submitAssignmentTransactional({
      actorUserId: "u-hs-1",
      actorEmail: "HS26-7A-01",
      actorRole: "STUDENT",
      studentProfileId: "sp-hs-1",
      studentCode: "HS26-7A-01",
      studentClassId: "cls-7a",
      studentClassName: "7A",
      enrolledClassIds: ["cls-7a"],
      assignmentId: "asg-outage",
      content: "Nội dung bài làm",
      attachmentsJson: null,
      idempotencyKey: "idem-outage-1",
      db,
    });
    assert.equal(subRes.ok, true);

    // Simulate Google Sheets outage (HTTP 503)
    mockSheets.setOutage(true);
    const failedSync = await autoSyncClassTrackingSheetNonBlocking("u-hs-1", "cls-7a", {
      academicYearId: "ay-2627",
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    assert.equal(failedSync.syncStatus, "ERROR");
    assert.equal(db._state.submissions.length, 1); // DB record intact!
    assert.equal(db._state.syncLogs[db._state.syncLogs.length - 1].status, "FAILED");

    // Sheets recovers -> retry twice to verify idempotency (each record appears once)
    mockSheets.setOutage(false);
    const retry1 = await autoSyncClassTrackingSheetNonBlocking("u-admin", "cls-7a", {
      academicYearId: "ay-2627",
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });
    const retry2 = await autoSyncClassTrackingSheetNonBlocking("u-admin", "cls-7a", {
      academicYearId: "ay-2627",
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    assert.equal(retry1.syncStatus, "SYNCED");
    assert.equal(retry2.syncStatus, "SYNCED");
    const sheet = mockSheets.spreadsheets.get(retry2.spreadsheetId!)!;
    const detailRows = sheet.tabs["Chi tiết lượt nộp"].slice(1);
    assert.equal(detailRows.length, 1);
    assert.equal(detailRows[0][0], subRes.submission!.id);
  });

  it("Criterion 4: Transfer student 7A -> 7B preserves login & 7A history in Sheet 7A, routes new 7B work to Sheet 7B, enforces source+target RBAC, and rejects unknown code/class", async () => {
    const db = createIsolatedAcademyDb();
    seedTwoClasses(db);
    const mockSheets = createMockGoogleSheetsTransport();

    // Teacher who only manages 7A (NOT 7B)
    db._state.users.set("u-gv-7a", {
      id: "u-gv-7a",
      email: "gv7a@test.local",
      fullName: "GV Lớp 7A",
      role: "TEACHER",
      isActive: true,
    });
    db._state.teacherProfiles.set("u-gv-7a", {
      id: "tp-7a",
      userId: "u-gv-7a",
      homeroomClasses: [{ id: "cls-7a", name: "7A" }],
      assignments: [],
    });

    // Teacher who manages BOTH 7A and 7B
    db._state.users.set("u-gv-both", {
      id: "u-gv-both",
      email: "gvboth@test.local",
      fullName: "GV Bộ môn 7A & 7B",
      role: "TEACHER",
      isActive: true,
    });
    db._state.teacherProfiles.set("u-gv-both", {
      id: "tp-both",
      userId: "u-gv-both",
      homeroomClasses: [{ id: "cls-7a", name: "7A" }],
      assignments: [{ classId: "cls-7b" }],
    });

    // Old attempt submitted while student was in 7A
    db._state.attempts.push({
      id: "att-old-7a",
      assessmentId: "asm-7a",
      studentId: "u-hs-1",
      studentEmail: "HS26-7A-01",
      studentName: "Học sinh Giả lập 01",
      classId: "cls-7a",
      attemptNumber: 1,
      status: "SUBMITTED",
      submittedAt: new Date("2026-11-18T08:00:00Z"),
      totalScore: 7,
      maxScore: 10,
      isDemoData: false,
      assessment: {
        code: "EXAM-7A-01",
        title: "Bài kiểm tra lớp 7A",
        subjectName: "Tin học 7",
        mode: "EXAM",
      },
    });

    // 1) Unauthorized STUDENT cannot transfer
    const deniedStudent = await updateStudentClassTransactional({
      actorUserId: "u-hs-1",
      actorEmail: "HS26-7A-01",
      actorRole: "STUDENT",
      studentCode: "HS26-7A-01",
      targetClassIdOrName: "7B",
      academicYearId: "ay-2627",
      db,
      autoSyncSheets: false,
    });
    assert.equal(deniedStudent.ok, false);
    assert.equal(deniedStudent.statusCode, 403);

    // 2) Teacher with only 7A scope (missing 7B target scope) is BLOCKED
    const deniedTeacherTarget = await updateStudentClassTransactional({
      actorUserId: "u-gv-7a",
      actorEmail: "gv7a@test.local",
      actorRole: "TEACHER",
      studentCode: "HS26-7A-01",
      targetClassIdOrName: "7B",
      academicYearId: "ay-2627",
      db,
      autoSyncSheets: false,
    });
    assert.equal(deniedTeacherTarget.ok, false);
    assert.equal(deniedTeacherTarget.statusCode, 403);
    assert.equal(deniedTeacherTarget.errorCode, "FORBIDDEN_TARGET_CLASS_SCOPE");

    // 3) Unknown studentCode & unknown targetClass report clear 404 errors
    const missingStudent = await updateStudentClassTransactional({
      actorUserId: "u-admin",
      actorEmail: "admin@test.local",
      actorRole: "SCHOOL_ADMIN",
      studentCode: "HS-KHONG-TON-TAI",
      targetClassIdOrName: "7B",
      academicYearId: "ay-2627",
      db,
      autoSyncSheets: false,
    });
    assert.equal(missingStudent.ok, false);
    assert.equal(missingStudent.statusCode, 404);
    assert.equal(missingStudent.errorCode, "STUDENT_NOT_FOUND");

    const missingClass = await updateStudentClassTransactional({
      actorUserId: "u-admin",
      actorEmail: "admin@test.local",
      actorRole: "SCHOOL_ADMIN",
      studentCode: "HS26-7A-01",
      targetClassIdOrName: "9Z9",
      academicYearId: "ay-2627",
      db,
      autoSyncSheets: false,
    });
    assert.equal(missingClass.ok, false);
    assert.equal(missingClass.statusCode, 404);
    assert.equal(missingClass.errorCode, "TARGET_CLASS_NOT_FOUND");

    // 4) Authorized teacher managing BOTH 7A and 7B transfers student 7A -> 7B
    const transferRes = await updateStudentClassTransactional({
      actorUserId: "u-gv-both",
      actorEmail: "gvboth@test.local",
      actorRole: "TEACHER",
      studentCode: "HS26-7A-01",
      targetClassIdOrName: "7B",
      academicYearId: "ay-2627",
      db,
      autoSyncSheets: true,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    assert.equal(transferRes.ok, true);
    assert.equal(transferRes.transfer?.fromClassName, "7A");
    assert.equal(transferRes.transfer?.toClassName, "7B");

    // Login credentials preserved 100%
    const hsUser = db._state.users.get("u-hs-1");
    assert.equal(hsUser.email, "HS26-7A-01");
    assert.equal(hsUser.passwordHash, "scrypt:mock-stable-hash-001");

    // Profile & Enrollment consistency
    const hsProfile = db._state.studentProfiles.get("sp-hs-1");
    assert.equal(hsProfile.classId, "cls-7b");
    assert.equal(
      db._state.enrollments.get("sp-hs-1::cls-7a::ay-2627").status,
      "TRANSFERRED"
    );
    assert.equal(
      db._state.enrollments.get("sp-hs-1::cls-7b::ay-2627").status,
      "ACTIVE"
    );

    // 5) Student submits new work for 7B -> appears ONLY in Sheet 7B, while old 7A work stays ONLY in Sheet 7A
    db._state.assignments.set("asg-7b-1", {
      id: "asg-7b-1",
      subjectId: "subj-tin7",
      classId: "cls-7b",
      title: "Bài tập lớp 7B",
      type: "INDIVIDUAL",
      maxScore: 10,
      dueAt: new Date(Date.now() + 86_400_000),
      maxSubmissions: 3,
      status: "ASSIGNED",
    });

    const newSub7B = await submitAssignmentTransactional({
      actorUserId: "u-hs-1",
      actorEmail: "HS26-7A-01",
      actorRole: "STUDENT",
      studentProfileId: "sp-hs-1",
      studentCode: "HS26-7A-01",
      studentClassId: hsProfile.classId,
      studentClassName: "7B",
      enrolledClassIds: ["cls-7b"],
      assignmentId: "asg-7b-1",
      content: "Bài nộp ở lớp mới 7B",
      attachmentsJson: null,
      idempotencyKey: "idem-7b-1",
      db,
    });
    assert.equal(newSub7B.ok, true);

    const sync7A = await syncClassTrackingSheet("u-admin", "cls-7a", {
      academicYearId: "ay-2627",
      skipActorScopeCheck: true,
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });
    const sync7B = await syncClassTrackingSheet("u-admin", "cls-7b", {
      academicYearId: "ay-2627",
      skipActorScopeCheck: true,
      db,
      fetchImpl: mockSheets.fetchImpl,
      accessTokenOverride: "mock-oauth-token",
    });

    const rows7A = mockSheets.spreadsheets
      .get(sync7A.trackingSheet.spreadsheetId!)!
      .tabs["Chi tiết lượt nộp"].slice(1);
    const rows7B = mockSheets.spreadsheets
      .get(sync7B.trackingSheet.spreadsheetId!)!
      .tabs["Chi tiết lượt nộp"].slice(1);

    // Sheet 7A has ONLY the old 7A attempt (with preserved studentCode & class_name = 7A)
    assert.equal(rows7A.length, 1);
    assert.equal(rows7A[0][0], "att-old-7a");
    assert.equal(rows7A[0][1], "HS26-7A-01");
    assert.equal(rows7A[0][2], "7A");

    // Sheet 7B has ONLY the new 7B submission (NO leak of old 7A attempt!)
    assert.equal(rows7B.length, 1);
    assert.equal(rows7B[0][0], newSub7B.submission!.id);
    assert.equal(rows7B[0][1], "HS26-7A-01");
    assert.equal(rows7B[0][2], "7B");
  });
});
