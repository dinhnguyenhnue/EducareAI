import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { verifyTeacherClassScope, withKeyLock } from "@/lib/submission-guard";
import crypto from "crypto";

function isTeacherOrAdmin(role: string): boolean {
  return role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedStudentId = searchParams.get("studentId");
  const requestedClassId = searchParams.get("classId");

  // Section 3 & 12 #2: Block student from querying another student's attempts/results
  if (
    !isTeacherOrAdmin(session.role) &&
    requestedStudentId &&
    requestedStudentId !== session.user.id
  ) {
    return NextResponse.json(
      {
        error:
          "FORBIDDEN: Học sinh không được xem lượt làm bài hoặc kết quả kiểm tra của học sinh khác.",
      },
      { status: 403 }
    );
  }

  const teacherView =
    isTeacherOrAdmin(session.role) && session.activeViewRole !== "STUDENT";

  if (teacherView && requestedClassId && session.role === "TEACHER") {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      requestedClassId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  const assessments = await prisma.assessment.findMany({
    where: teacherView ? {} : { status: "PUBLISHED" },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
      },
      attempts: teacherView
        ? {
            orderBy: { createdAt: "desc" },
            include: { answers: true },
          }
        : {
            where: { studentId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: { answers: true },
          },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sanitize payload for Students (NEVER leak snapshotCorrectAnswer or snapshotExplanation in assessment items!)
  const sanitizedAssessments = assessments.map((assessment) => {
    const canRevealAnswersAfterSubmit =
      teacherView ||
      assessment.revealAnswersMode === "IMMEDIATE" ||
      (assessment.revealAnswersMode === "AFTER_CLOSED" &&
        assessment.status === "CLOSED");

    const safeItems = assessment.items.map((item) => {
      if (teacherView) {
        return item;
      }
      // Strictly strip snapshotCorrectAnswer & snapshotExplanation from items sent to browser!
      return {
        id: item.id,
        assessmentId: item.assessmentId,
        questionId: item.questionId,
        questionVersion: item.questionVersion,
        orderIndex: item.orderIndex,
        points: item.points,
        snapshotQuestionText: item.snapshotQuestionText,
        snapshotOptionsJson: item.snapshotOptionsJson,
        snapshotObjective: item.snapshotObjective,
      };
    });

    // Attach explanations only inside already-SUBMITTED attempts when policy allows (e.g., PRACTICE mode)
    const safeAttempts = assessment.attempts.map((attempt) => {
      const isSubmitted =
        attempt.status === "SUBMITTED" ||
        attempt.status === "EXPIRED_AUTO_SUBMITTED";

      return {
        ...attempt,
        answers: attempt.answers.map((ans) => {
          const item = assessment.items.find((i) => i.id === ans.assessmentItemId);
          return {
            id: ans.id,
            assessmentItemId: ans.assessmentItemId,
            studentResponse: ans.studentResponse,
            savedAt: ans.savedAt,
            isCorrect: isSubmitted ? ans.isCorrect : undefined,
            earnedPoints: isSubmitted ? ans.earnedPoints : undefined,
            correctAnswer:
              isSubmitted && canRevealAnswersAfterSubmit && item
                ? item.snapshotCorrectAnswer
                : undefined,
            explanation:
              isSubmitted && canRevealAnswersAfterSubmit && item
                ? item.snapshotExplanation
                : undefined,
          };
        }),
      };
    });

    return {
      ...assessment,
      items: safeItems,
      attempts: safeAttempts,
    };
  });

  return NextResponse.json({ assessments: sanitizedAssessments });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const action = body.action;

  // 1. TEACHER: Create Assessment from Approved Questions (with Version Pinning)
  if (action === "CREATE_ASSESSMENT") {
    if (!isTeacherOrAdmin(session.role)) {
      return NextResponse.json(
        { error: "FORBIDDEN: Chỉ Giáo viên mới được tạo đề luyện tập/kiểm tra." },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      mode = "PRACTICE",
      gradeLevel = 7,
      lessonTitle,
      timeLimitMinutes,
      maxAttempts,
      revealAnswersMode,
      questionIds = [],
    } = body;

    if (!title || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập tiêu đề và chọn ít nhất 1 câu hỏi đã duyệt." },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    // Reject if any question is an unapproved AI draft
    const unapproved = questions.filter((q) => q.status !== "APPROVED");
    if (unapproved.length > 0) {
      return NextResponse.json(
        {
          error: `Không thể đưa câu hỏi chưa duyệt (${unapproved.map((u) => u.code).join(", ")}) vào đề chính thức. Vui lòng duyệt câu hỏi trước.`,
        },
        { status: 400 }
      );
    }

    const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const defaultClass = year
      ? await prisma.schoolClass.findFirst({ where: { academicYearId: year.id } })
      : null;

    const code = `ASM-${mode}-${Date.now().toString(36).toUpperCase()}`;
    const created = await prisma.assessment.create({
      data: {
        code,
        title,
        description: description || "Đề bài môn Tin học",
        classId: body.classId || defaultClass?.id || "7A1",
        gradeLevel: Number(gradeLevel),
        lessonTitle: lessonTitle || "Tin học",
        mode: mode === "EXAM" ? "EXAM" : "PRACTICE",
        timeLimitMinutes:
          mode === "EXAM" ? Number(timeLimitMinutes || 15) : timeLimitMinutes ? Number(timeLimitMinutes) : null,
        maxAttempts: mode === "EXAM" ? Number(maxAttempts || 1) : Number(maxAttempts ?? 0),
        revealAnswersMode:
          revealAnswersMode || (mode === "EXAM" ? "AFTER_CLOSED" : "IMMEDIATE"),
        status: "PUBLISHED",
        createdById: session.user.id,
        publishedAt: new Date(),
        items: {
          create: questions.map((q, idx) => ({
            questionId: q.id,
            questionVersion: q.version,
            orderIndex: idx + 1,
            points: q.points || 1.0,
            snapshotQuestionText: q.questionText,
            snapshotOptionsJson: q.optionsJson,
            snapshotCorrectAnswer: q.correctAnswer,
            snapshotExplanation: q.explanation,
            snapshotObjective: q.learningObjective,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ assessment: created }, { status: 201 });
  }

  // 2. STUDENT: Start or Resume an Attempt (Handles Reload & Network Drop Recovery)
  if (action === "START_ATTEMPT") {
    const { assessmentId } = body;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { items: { orderBy: { orderIndex: "asc" } } },
    });

    if (!assessment || assessment.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Đề bài không tồn tại hoặc đã đóng." },
        { status: 404 }
      );
    }

    const now = new Date();
    if (assessment.dueAt && now > assessment.dueAt) {
      return NextResponse.json(
        { error: "DEADLINE_EXCEEDED: Đề bài đã quá hạn làm bài." },
        { status: 400 }
      );
    }

    // Verify class membership for STUDENT role when assessment specifies a classId
    if (session.role === "STUDENT" && assessment.classId) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          schoolClass: true,
          enrollments: { where: { status: "ACTIVE" }, include: { schoolClass: true } },
        },
      });
      if (profile) {
        const allowedKeys = new Set<string>();
        if (profile.classId) allowedKeys.add(profile.classId);
        if (profile.schoolClass?.name) allowedKeys.add(profile.schoolClass.name);
        for (const enr of profile.enrollments) {
          allowedKeys.add(enr.classId);
          if (enr.schoolClass?.name) allowedKeys.add(enr.schoolClass.name);
        }
        if (allowedKeys.size > 0 && !allowedKeys.has(assessment.classId)) {
          return NextResponse.json(
            {
              error: `FORBIDDEN_CLASS_SCOPE: Đề bài này thuộc lớp ${assessment.classId}, không thuộc lớp của bạn.`,
            },
            { status: 403 }
          );
        }
      }
    }

    const lockKey = `assessment-start:${session.user.id}:${assessment.id}`;
    return withKeyLock(lockKey, async () => {
      const existingAttempts = await prisma.attempt.findMany({
        where: {
          assessmentId: assessment.id,
          studentId: session.user.id,
        },
        include: { answers: true },
        orderBy: { createdAt: "desc" },
      });

      // Check if there is an active IN_PROGRESS attempt to resume on page reload
      const activeAttempt = existingAttempts.find((a) => a.status === "IN_PROGRESS");
      if (activeAttempt) {
        const currentNow = new Date();
        if (activeAttempt.expiresAt && currentNow > activeAttempt.expiresAt) {
          // Auto-expire and grade saved answers
          const graded = await finalizeAndGradeAttempt(activeAttempt.id, {}, true);
          return NextResponse.json({
            attempt: graded.attempt,
            resumed: false,
            expired: true,
            message: "Thời gian làm bài đã hết. Hệ thống đã tự động thu bài theo các câu đã lưu.",
          });
        }

        return NextResponse.json({
          attempt: activeAttempt,
          resumed: true,
          serverNow: currentNow.toISOString(),
          message: "Đã khôi phục phiên làm bài đang diễn ra và các câu trả lời đã lưu tạm.",
        });
      }

      // Enforce maxAttempts for EXAM mode
      const completedCount = existingAttempts.filter(
        (a) => a.status === "SUBMITTED" || a.status === "EXPIRED_AUTO_SUBMITTED"
      ).length;

      if (assessment.maxAttempts > 0 && completedCount >= assessment.maxAttempts) {
        return NextResponse.json(
          {
            error: `MAX_ATTEMPTS_REACHED: Bạn đã hoàn thành ${completedCount}/${assessment.maxAttempts} lượt làm bài cho phép của đề này.`,
          },
          { status: 400 }
        );
      }

      const startNow = new Date();
      const expiresAt = assessment.timeLimitMinutes
        ? new Date(startNow.getTime() + assessment.timeLimitMinutes * 60 * 1000)
        : null;

      const newAttempt = await prisma.attempt.create({
        data: {
          assessmentId: assessment.id,
          studentId: session.user.id,
          studentEmail: session.user.email,
          studentName: session.user.fullName,
          classId:
            session.user.studentProfile?.classId || assessment.classId || "7A1",
          attemptNumber: existingAttempts.length + 1,
          idempotencyKey: `INIT-${session.user.id}-${assessment.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          status: "IN_PROGRESS",
          startedAt: startNow,
          expiresAt,
          maxScore: 10.0,
          isDemoData: assessment.isDemoData,
        },
        include: { answers: true },
      });

      return NextResponse.json({
        attempt: newAttempt,
        resumed: false,
        serverNow: startNow.toISOString(),
      });
    });
  }

  // 3. STUDENT: Auto-save answers during attempt (Protects against reload / Wi-Fi drop)
  if (action === "AUTOSAVE_ANSWERS") {
    const { attemptId, responses = {} } = body;
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN: Không tìm thấy lượt làm bài hợp lệ của bạn." },
        { status: 403 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Lượt làm bài này đã kết thúc, không thể ghi đè câu trả lời." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (attempt.expiresAt && now > new Date(attempt.expiresAt.getTime() + 15000)) {
      const graded = await finalizeAndGradeAttempt(attempt.id, {}, true);
      return NextResponse.json(
        {
          error: "ATTEMPT_EXPIRED: Đã hết thời gian làm bài trên máy chủ.",
          attempt: graded.attempt,
        },
        { status: 400 }
      );
    }

    for (const [assessmentItemId, studentResponse] of Object.entries(responses)) {
      await prisma.answer.upsert({
        where: {
          attemptId_assessmentItemId: {
            attemptId: attempt.id,
            assessmentItemId,
          },
        },
        update: {
          studentResponse: String(studentResponse).trim(),
          savedAt: now,
        },
        create: {
          attemptId: attempt.id,
          assessmentItemId,
          studentResponse: String(studentResponse).trim(),
          savedAt: now,
        },
      });
    }

    return NextResponse.json({
      saved: true,
      savedAt: now.toISOString(),
    });
  }

  // 4. STUDENT: Idempotent Submit & Strict Server-Side Grading
  if (action === "SUBMIT_ATTEMPT") {
    const { attemptId, idempotencyKey, responses = {} } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Thiếu attemptId." },
        { status: 400 }
      );
    }

    const lockKey = `assessment-submit:${attemptId}`;
    return withKeyLock(lockKey, async () => {
      const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: { answers: true, assessment: { include: { items: true } } },
      });

      if (!attempt || attempt.studentId !== session.user.id) {
        return NextResponse.json(
          { error: "FORBIDDEN: Bạn không sở hữu lượt làm bài này." },
          { status: 403 }
        );
      }

      // Idempotency check: if already submitted (e.g., double click or retry), return the existing result!
      if (
        attempt.status === "SUBMITTED" ||
        attempt.status === "EXPIRED_AUTO_SUBMITTED"
      ) {
        return NextResponse.json({
          attempt: sanitizeAttemptResult(attempt, attempt.assessment),
          idempotentReplay: true,
          message: "Bài làm đã được ghi nhận trước đó (Chống nộp trùng Idempotent).",
        });
      }

      // Detect if client tried to spoof score in request body (Section 12 #6)
      const clientTriedToSpoofScore =
        typeof body.score !== "undefined" ||
        typeof body.totalScore !== "undefined" ||
        typeof body.earnedPoints !== "undefined";

      const now = new Date();
      // Allow 15s network latency buffer; if past that, mark EXPIRED_AUTO_SUBMITTED
      const isPastServerDeadline =
        attempt.expiresAt &&
        now.getTime() > new Date(attempt.expiresAt).getTime() + 15000;

      const graded = await finalizeAndGradeAttempt(
        attempt.id,
        responses,
        Boolean(isPastServerDeadline),
        idempotencyKey
      );

      return NextResponse.json({
        attempt: sanitizeAttemptResult(graded.attempt, graded.assessment),
        idempotentReplay: graded.idempotentReplay,
        ignoredClientScoreSpoof: clientTriedToSpoofScore,
        serverGradedAt: now.toISOString(),
      });
    });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

async function finalizeAndGradeAttempt(
  attemptId: string,
  incomingResponses: Record<string, string>,
  expiredAutoSubmit: boolean,
  idempotencyKey?: string
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
        answers: true,
        assessment: {
          include: { items: { orderBy: { orderIndex: "asc" } } },
        },
      },
    });

    if (
      attempt.status === "SUBMITTED" ||
      attempt.status === "EXPIRED_AUTO_SUBMITTED"
    ) {
      return {
        attempt,
        assessment: attempt.assessment,
        idempotentReplay: true,
      };
    }

    const existingAnswerMap = new Map<string, string>();
    for (const ans of attempt.answers) {
      existingAnswerMap.set(ans.assessmentItemId, ans.studentResponse);
    }

    // Merge incoming responses only if not expired beyond deadline
    if (!expiredAutoSubmit && incomingResponses) {
      for (const [itemId, val] of Object.entries(incomingResponses)) {
        if (typeof val === "string" && val.trim().length > 0) {
          existingAnswerMap.set(itemId, val.trim());
        }
      }
    }

    let totalEarnedPoints = 0;
    let totalPossiblePoints = 0;

    for (const item of attempt.assessment.items) {
      totalPossiblePoints += item.points;
      const rawStudentResp = (existingAnswerMap.get(item.id) || "").trim().toUpperCase();
      const expectedAnswer = item.snapshotCorrectAnswer.trim().toUpperCase();
      const isCorrect = rawStudentResp.length > 0 && rawStudentResp === expectedAnswer;
      const earnedPoints = isCorrect ? item.points : 0;
      totalEarnedPoints += earnedPoints;

      await tx.answer.upsert({
        where: {
          attemptId_assessmentItemId: {
            attemptId: attempt.id,
            assessmentItemId: item.id,
          },
        },
        update: {
          studentResponse: rawStudentResp,
          isCorrect,
          earnedPoints,
        },
        create: {
          attemptId: attempt.id,
          assessmentItemId: item.id,
          studentResponse: rawStudentResp,
          isCorrect,
          earnedPoints,
        },
      });
    }

    const normalizedScore10 =
      totalPossiblePoints > 0
        ? Math.round(((totalEarnedPoints / totalPossiblePoints) * 10 + Number.EPSILON) * 100) / 100
        : 0;

    const updatedAttempt = await tx.attempt.update({
      where: { id: attempt.id },
      data: {
        status: expiredAutoSubmit ? "EXPIRED_AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt: new Date(),
        totalScore: normalizedScore10,
        idempotencyKey:
          idempotencyKey && String(idempotencyKey).trim().length > 0
            ? String(idempotencyKey).trim()
            : attempt.idempotencyKey,
      },
      include: { answers: true },
    });

    return {
      attempt: updatedAttempt,
      assessment: attempt.assessment,
      idempotentReplay: false,
    };
  });
}

function sanitizeAttemptResult(
  attempt: {
    id: string;
    assessmentId: string;
    studentId: string;
    studentName: string;
    attemptNumber: number;
    idempotencyKey: string;
    status: string;
    startedAt: Date;
    expiresAt: Date | null;
    submittedAt: Date | null;
    totalScore: number | null;
    maxScore: number;
    answers: Array<{
      id: string;
      assessmentItemId: string;
      studentResponse: string;
      isCorrect: boolean | null;
      earnedPoints: number;
    }>;
  },
  assessment: {
    mode: string;
    revealAnswersMode: string;
    status: string;
    items: Array<{
      id: string;
      snapshotCorrectAnswer: string;
      snapshotExplanation: string;
    }>;
  }
) {
  const canRevealAnswers =
    assessment.revealAnswersMode === "IMMEDIATE" ||
    (assessment.revealAnswersMode === "AFTER_CLOSED" &&
      assessment.status === "CLOSED");

  return {
    ...attempt,
    answers: attempt.answers.map((ans) => {
      const item = assessment.items.find((i) => i.id === ans.assessmentItemId);
      return {
        id: ans.id,
        assessmentItemId: ans.assessmentItemId,
        studentResponse: ans.studentResponse,
        isCorrect: ans.isCorrect,
        earnedPoints: ans.earnedPoints,
        correctAnswer: canRevealAnswers && item ? item.snapshotCorrectAnswer : undefined,
        explanation: canRevealAnswers && item ? item.snapshotExplanation : undefined,
      };
    }),
  };
}

