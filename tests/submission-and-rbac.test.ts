import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateAssignmentSubmissionRules,
  withKeyLock,
} from "../src/lib/submission-guard";

describe("Submission Rules & Concurrency Guard (Section 2.4 & 2.5)", () => {
  const baseAssignment = {
    id: "asg-1",
    classId: "class-7a1",
    className: "7A1",
    status: "ASSIGNED",
    type: "INDIVIDUAL",
    dueAt: new Date("2026-12-01T10:00:00Z"),
    maxSubmissions: 2,
  };

  it("allows valid submission from enrolled student within deadline and maxSubmissions", () => {
    const res = validateAssignmentSubmissionRules({
      studentClassId: "class-7a1",
      studentClassName: "7A1",
      enrolledClassIds: ["class-7a1"],
      assignment: baseAssignment,
      existingSubmissionCount: 0,
      now: new Date("2026-11-30T10:00:00Z"),
    });
    assert.equal(res.allowed, true);
    assert.equal(res.submissionStatus, "SUBMITTED");
    assert.equal(res.nextAttemptNumber, 1);
  });

  it("rejects submission when assignment is DRAFT or CLOSED", () => {
    const res = validateAssignmentSubmissionRules({
      studentClassId: "class-7a1",
      assignment: { ...baseAssignment, status: "CLOSED" },
      existingSubmissionCount: 0,
      now: new Date("2026-11-30T10:00:00Z"),
    });
    assert.equal(res.allowed, false);
    assert.equal(res.errorCode, "ASSIGNMENT_NOT_OPEN");
  });

  it("rejects cross-class submission (student in 7A2 submitting to 7A1 assignment)", () => {
    const res = validateAssignmentSubmissionRules({
      studentClassId: "class-7a2",
      studentClassName: "7A2",
      enrolledClassIds: ["class-7a2"],
      assignment: baseAssignment,
      existingSubmissionCount: 0,
      now: new Date("2026-11-30T10:00:00Z"),
    });
    assert.equal(res.allowed, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.errorCode, "FORBIDDEN_CLASS_MEMBERSHIP");
  });

  it("rejects late submission for EXAM mode and marks non-EXAM late submission as LATE", () => {
    const lateNow = new Date("2026-12-02T10:00:00Z");

    const examRes = validateAssignmentSubmissionRules({
      studentClassId: "class-7a1",
      assignment: { ...baseAssignment, type: "EXAM" },
      existingSubmissionCount: 0,
      now: lateNow,
    });
    assert.equal(examRes.allowed, false);
    assert.equal(examRes.errorCode, "ASSIGNMENT_PAST_DUE");

    const practiceRes = validateAssignmentSubmissionRules({
      studentClassId: "class-7a1",
      assignment: { ...baseAssignment, type: "PRACTICE" },
      existingSubmissionCount: 0,
      now: lateNow,
    });
    assert.equal(practiceRes.allowed, true);
    assert.equal(practiceRes.submissionStatus, "LATE");
  });

  it("rejects submission when maxSubmissions is reached", () => {
    const res = validateAssignmentSubmissionRules({
      studentClassId: "class-7a1",
      assignment: baseAssignment,
      existingSubmissionCount: 2,
      now: new Date("2026-11-30T10:00:00Z"),
    });
    assert.equal(res.allowed, false);
    assert.equal(res.errorCode, "MAX_SUBMISSIONS_REACHED");
  });

  it("serializes concurrent operations on the same key via withKeyLock to prevent race conditions", async () => {
    let completedAttempts = 0;
    const maxAllowed = 1;
    const results: string[] = [];

    const simulateAttemptSubmit = async (reqId: string) => {
      return withKeyLock("student-1:exam-1", async () => {
        if (completedAttempts >= maxAllowed) {
          results.push(`${reqId}:IDEMPOTENT_BLOCKED`);
          return;
        }
        await new Promise((r) => setTimeout(r, 25));
        completedAttempts += 1;
        results.push(`${reqId}:ACCEPTED`);
      });
    };

    await Promise.all([
      simulateAttemptSubmit("REQ_A"),
      simulateAttemptSubmit("REQ_B"),
      simulateAttemptSubmit("REQ_C"),
    ]);

    assert.equal(completedAttempts, 1);
    assert.deepEqual(results, [
      "REQ_A:ACCEPTED",
      "REQ_B:IDEMPOTENT_BLOCKED",
      "REQ_C:IDEMPOTENT_BLOCKED",
    ]);
  });
});

