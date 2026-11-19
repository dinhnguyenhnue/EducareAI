import crypto from "crypto";
import { prisma } from "./prisma";

// In-process async mutex keyed by resource (e.g. `attempt:${studentId}:${assessmentId}`)
// Combined with database transactions to prevent race conditions under concurrent requests.
const keyLocks = new Map<string, Promise<unknown>>();

export async function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = keyLocks.get(key) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => current);
  keyLocks.set(key, chained);

  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (keyLocks.get(key) === chained) {
      keyLocks.delete(key);
    }
  }
}

export interface SubmissionValidationInput {
  studentClassId: string | null;
  studentClassName?: string | null;
  enrolledClassIds?: string[];
  assignment: {
    id: string;
    classId: string;
    className?: string | null;
    status: string;
    type: string;
    dueAt: Date;
    maxSubmissions: number;
  };
  existingSubmissionCount: number;
  now?: Date;
}

export interface SubmissionValidationResult {
  allowed: boolean;
  statusCode: number;
  errorCode?: string;
  errorMessage?: string;
  submissionStatus: "SUBMITTED" | "LATE";
  nextAttemptNumber: number;
}

/**
 * Pure validation helper for assignment submissions (testable with fixtures).
 * Checks:
 * 1. Published / Assigned status
 * 2. Class membership (student must belong to the assignment's class)
 * 3. Deadline policy (EXAM blocks late submission; other types mark LATE)
 * 4. Max attempts limit
 */
export function validateAssignmentSubmissionRules(
  input: SubmissionValidationInput
): SubmissionValidationResult {
  const now = input.now || new Date();
  const { assignment } = input;

  if (assignment.status !== "PUBLISHED" && assignment.status !== "ASSIGNED") {
    return {
      allowed: false,
      statusCode: 400,
      errorCode: "ASSIGNMENT_NOT_OPEN",
      errorMessage: `Bài tập chưa phát hành hoặc đã đóng (Trạng thái: ${assignment.status}).`,
      submissionStatus: "SUBMITTED",
      nextAttemptNumber: input.existingSubmissionCount + 1,
    };
  }

  const allStudentClasses = new Set<string>(
    [
      input.studentClassId,
      input.studentClassName,
      ...(input.enrolledClassIds || []),
    ].filter((v): v is string => Boolean(v))
  );

  const matchesClass =
    allStudentClasses.has(assignment.classId) ||
    (assignment.className ? allStudentClasses.has(assignment.className) : false);

  if (!matchesClass) {
    return {
      allowed: false,
      statusCode: 403,
      errorCode: "FORBIDDEN_CLASS_MEMBERSHIP",
      errorMessage: "Học sinh không thuộc lớp được giao bài tập này.",
      submissionStatus: "SUBMITTED",
      nextAttemptNumber: input.existingSubmissionCount + 1,
    };
  }

  const isPastDue = now.getTime() > new Date(assignment.dueAt).getTime();
  if (isPastDue && assignment.type === "EXAM") {
    return {
      allowed: false,
      statusCode: 400,
      errorCode: "ASSIGNMENT_PAST_DUE",
      errorMessage: "Đã quá thời hạn nộp đối với bài kiểm tra.",
      submissionStatus: "LATE",
      nextAttemptNumber: input.existingSubmissionCount + 1,
    };
  }

  if (
    assignment.maxSubmissions > 0 &&
    input.existingSubmissionCount >= assignment.maxSubmissions
  ) {
    return {
      allowed: false,
      statusCode: 400,
      errorCode: "MAX_SUBMISSIONS_REACHED",
      errorMessage: `Đã vượt quá số lượt nộp cho phép (${input.existingSubmissionCount}/${assignment.maxSubmissions}).`,
      submissionStatus: isPastDue ? "LATE" : "SUBMITTED",
      nextAttemptNumber: input.existingSubmissionCount + 1,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    submissionStatus: isPastDue ? "LATE" : "SUBMITTED",
    nextAttemptNumber: input.existingSubmissionCount + 1,
  };
}

/**
 * Checks whether a Teacher is authorized to access/grade a specific classId.
 */
export async function verifyTeacherClassScope(
  userId: string,
  role: string,
  targetClassId: string,
  db: Pick<typeof prisma, "teacherProfile"> = prisma
): Promise<{
  allowed: boolean;
  reason?: string;
  message?: string;
  code?: string;
  status?: number;
}> {
  if (role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "ADMIN") {
    return { allowed: true, status: 200 };
  }
  if (role !== "TEACHER") {
    const msg = "Vai trò không phải Giáo viên.";
    return {
      allowed: false,
      reason: msg,
      message: msg,
      code: "FORBIDDEN_ROLE",
      status: 403,
    };
  }

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId },
    include: {
      homeroomClasses: { select: { id: true, name: true } },
      assignments: { select: { classId: true } },
    },
  });

  if (!teacherProfile) {
    const msg = "Không tìm thấy hồ sơ giáo viên.";
    return {
      allowed: false,
      reason: msg,
      message: msg,
      code: "TEACHER_PROFILE_NOT_FOUND",
      status: 403,
    };
  }

  const allowedIds = new Set<string>([
    ...teacherProfile.homeroomClasses.map((c) => c.id),
    ...teacherProfile.homeroomClasses.map((c) => c.name),
    ...teacherProfile.assignments.map((a) => a.classId),
  ]);

  if (!allowedIds.has(targetClassId)) {
    const msg = `FORBIDDEN_CLASS_SCOPE: Giáo viên không được phân công phụ trách lớp (${targetClassId}).`;
    return {
      allowed: false,
      reason: msg,
      message: msg,
      code: "FORBIDDEN_CLASS_SCOPE",
      status: 403,
    };
  }

  return { allowed: true, status: 200 };
}

/**
 * Transactional, concurrency-safe assignment submission with idempotency protection.
 */
export async function submitAssignmentTransactional(params: {
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  studentProfileId: string;
  studentCode: string;
  studentClassId: string | null;
  studentClassName?: string | null;
  enrolledClassIds?: string[];
  assignmentId: string;
  content: string;
  attachmentsJson: string | null;
  selfAssessment?: string | null;
  idempotencyKey?: string | null;
  db?: typeof prisma;
}) {
  const db = params.db || prisma;
  const lockKey = `submission:${params.studentProfileId}:${params.assignmentId}`;

  return withKeyLock(lockKey, async () => {
    return db.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: params.assignmentId },
        include: { schoolClass: true },
      });

      if (!assignment) {
        return {
          ok: false as const,
          statusCode: 404,
          errorCode: "ASSIGNMENT_NOT_FOUND",
          error: "Không tìm thấy bài tập.",
        };
      }

      const existingSubmissions = await tx.submission.findMany({
        where: {
          assignmentId: assignment.id,
          studentId: params.studentProfileId,
        },
        orderBy: { attemptNumber: "desc" },
      });

      const completedSubmissions = existingSubmissions.filter(
        (s) => s.status !== "DRAFT"
      );

      const normalizedIdemKey = params.idempotencyKey
        ? String(params.idempotencyKey).trim()
        : null;

      // 1) Explicit idempotencyKey replay check (safe across retries and time gaps)
      if (normalizedIdemKey) {
        const matchedByKey = completedSubmissions.find((s) => {
          if (!s.attachments) return false;
          try {
            const parsed = JSON.parse(s.attachments);
            if (Array.isArray(parsed)) {
              return parsed.some(
                (item) =>
                  item &&
                  typeof item === "object" &&
                  item.type === "IDEMPOTENCY_KEY" &&
                  item.key === normalizedIdemKey
              );
            }
          } catch {
            // ignore non-JSON attachments
          }
          return false;
        });
        if (matchedByKey) {
          return {
            ok: true as const,
            statusCode: 200,
            idempotentReplay: true,
            submission: matchedByKey,
            assignmentClassId: assignment.classId,
            academicYearId: assignment.schoolClass?.academicYearId || null,
          };
        }
      }

      // 2) Short-window identical content double-click guard (15s)
      const latest = completedSubmissions[0];
      if (
        latest &&
        latest.content === params.content &&
        Date.now() - new Date(latest.submittedAt).getTime() < 15_000
      ) {
        return {
          ok: true as const,
          statusCode: 200,
          idempotentReplay: true,
          submission: latest,
          assignmentClassId: assignment.classId,
          academicYearId: assignment.schoolClass?.academicYearId || null,
        };
      }

      const validation = validateAssignmentSubmissionRules({
        studentClassId: params.studentClassId,
        studentClassName: params.studentClassName,
        enrolledClassIds: params.enrolledClassIds,
        assignment: {
          id: assignment.id,
          classId: assignment.classId,
          className: assignment.schoolClass?.name,
          status: assignment.status,
          type: assignment.type,
          dueAt: assignment.dueAt,
          maxSubmissions: assignment.maxSubmissions,
        },
        existingSubmissionCount: completedSubmissions.length,
      });

      if (!validation.allowed) {
        return {
          ok: false as const,
          statusCode: validation.statusCode,
          errorCode: validation.errorCode,
          error: validation.errorMessage || "Không đủ điều kiện nộp bài.",
        };
      }

      // Attach normalizedIdemKey metadata inside attachments JSON so retries are idempotent without schema breakage
      let finalAttachmentsJson = params.attachmentsJson;
      if (normalizedIdemKey) {
        let items: Array<Record<string, unknown>> = [];
        if (params.attachmentsJson) {
          try {
            const parsed = JSON.parse(params.attachmentsJson);
            if (Array.isArray(parsed)) items = parsed;
          } catch {
            items = [];
          }
        }
        items.push({ type: "IDEMPOTENCY_KEY", key: normalizedIdemKey });
        finalAttachmentsJson = JSON.stringify(items);
      }

      const created = await tx.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: params.studentProfileId,
          content: params.content,
          attachments: finalAttachmentsJson,
          status: validation.submissionStatus,
          attemptNumber: validation.nextAttemptNumber,
        },
      });

      if (params.selfAssessment) {
        await tx.selfAssessment.create({
          data: {
            studentId: params.studentProfileId,
            assignmentId: assignment.id,
            responses: JSON.stringify({ selfAssessment: params.selfAssessment }),
            reflection: params.selfAssessment,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: params.actorUserId,
          actorEmail: params.actorEmail,
          actorRole: params.actorRole,
          action: "ASSIGNMENT_SUBMISSION_CREATED",
          resource: "SUBMISSION",
          resourceId: created.id,
          status: "SUCCESS",
          details: JSON.stringify({
            assignmentId: assignment.id,
            classId: assignment.classId,
            studentCode: params.studentCode,
            attemptNumber: validation.nextAttemptNumber,
            submissionStatus: validation.submissionStatus,
            idempotencyKey:
              normalizedIdemKey ||
              crypto
                .createHash("sha256")
                .update(`${params.studentProfileId}:${assignment.id}:${validation.nextAttemptNumber}`)
                .digest("hex")
                .slice(0, 16),
          }),
        },
      });

      return {
        ok: true as const,
        statusCode: 200,
        idempotentReplay: false,
        submission: created,
        assignmentClassId: assignment.classId,
        academicYearId: assignment.schoolClass?.academicYearId || null,
      };
    });
  });
}
