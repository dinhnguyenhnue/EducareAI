import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

function isTeacherOrAdmin(role: string): boolean {
  return role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập để truy cập." },
      { status: 401 }
    );
  }

  // Strictly block students from querying the raw Question Bank (Section 3 & Section 5)
  if (!isTeacherOrAdmin(session.role)) {
    return NextResponse.json(
      {
        error:
          "FORBIDDEN: Học sinh không có quyền truy cập trực tiếp Ngân hàng câu hỏi và đáp án gốc.",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get("subjectCode");
  const gradeLevel = searchParams.get("gradeLevel");
  const status = searchParams.get("status");
  const cognitiveLevel = searchParams.get("cognitiveLevel");

  const where: Record<string, unknown> = {};
  if (subjectCode && subjectCode !== "ALL") {
    where.subjectCode = subjectCode;
  }
  if (gradeLevel && gradeLevel !== "ALL") {
    where.gradeLevel = Number(gradeLevel);
  }
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (cognitiveLevel && cognitiveLevel !== "ALL") {
    where.cognitiveLevel = cognitiveLevel;
  }

  const questions = await prisma.question.findMany({
    where,
    orderBy: [{ isAiDraft: "desc" }, { code: "asc" }],
  });

  return NextResponse.json({
    questions,
    summary: {
      total: questions.length,
      approved: questions.filter((q) => q.status === "APPROVED").length,
      pendingAiDrafts: questions.filter((q) => q.status !== "APPROVED" && q.isAiDraft).length,
      demoCount: questions.filter((q) => q.isDemoData).length,
    },
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

  if (!isTeacherOrAdmin(session.role)) {
    return NextResponse.json(
      { error: "FORBIDDEN: Chỉ Giáo viên hoặc Quản trị viên mới được quản lý Ngân hàng câu hỏi." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const action = body.action || "CREATE_QUESTION";

  if (action === "CREATE_QUESTION") {
    const {
      code,
      subjectCode = "TIN7",
      subjectName = "Tin học",
      gradeLevel = 7,
      topicName,
      lessonTitle,
      learningObjective,
      cognitiveLevel = "UNDERSTAND",
      sourceBook,
      sourcePage,
      questionText,
      options,
      correctAnswer,
      explanation,
      isAiDraft = false,
    } = body;

    if (!questionText || !correctAnswer || !explanation || !lessonTitle) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ nội dung câu hỏi, bài học, đáp án đúng và giải thích." },
        { status: 400 }
      );
    }

    const stableCode =
      (code && String(code).trim()) ||
      `${subjectCode}-${Date.now().toString(36).toUpperCase()}`;

    const normalizedOptions = Array.isArray(options)
      ? JSON.stringify(options)
      : typeof options === "string"
      ? options
      : JSON.stringify([
          { id: "A", text: "Phương án A" },
          { id: "B", text: "Phương án B" },
          { id: "C", text: "Phương án C" },
          { id: "D", text: "Phương án D" },
        ]);

    // Section 5 rule: AI-generated questions must be saved as PENDING_REVIEW until Teacher approves
    const initialStatus = isAiDraft ? "PENDING_REVIEW" : "APPROVED";

    const created = await prisma.question.create({
      data: {
        code: stableCode,
        subjectCode,
        subjectName,
        gradeLevel: Number(gradeLevel),
        topicName: topicName || `Chủ đề ${subjectName}`,
        lessonTitle,
        learningObjective: learningObjective || "Nắm vững kiến thức trọng tâm bài học",
        cognitiveLevel,
        sourceBook: sourceBook || `SGK ${subjectName} - Kết nối tri thức với cuộc sống`,
        sourcePage: sourcePage || "",
        questionText,
        questionType: "MULTIPLE_CHOICE",
        optionsJson: normalizedOptions,
        correctAnswer: String(correctAnswer).trim().toUpperCase(),
        explanation,
        points: 1.0,
        version: 1,
        status: initialStatus,
        isAiDraft: Boolean(isAiDraft),
        isDemoData: false,
        authorId: session.user.id,
        approvedById: initialStatus === "APPROVED" ? session.user.id : null,
      },
    });

    return NextResponse.json({ question: created }, { status: 201 });
  }

  if (action === "UPDATE_QUESTION") {
    const { id, questionText, optionsJson, correctAnswer, explanation, learningObjective, cognitiveLevel } = body;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
    }

    // Increment version so any already-published AssessmentItem remains pinned to its snapshot version!
    const updated = await prisma.question.update({
      where: { id },
      data: {
        questionText: questionText ?? existing.questionText,
        optionsJson: optionsJson ?? existing.optionsJson,
        correctAnswer: correctAnswer ? String(correctAnswer).trim().toUpperCase() : existing.correctAnswer,
        explanation: explanation ?? existing.explanation,
        learningObjective: learningObjective ?? existing.learningObjective,
        cognitiveLevel: cognitiveLevel ?? existing.cognitiveLevel,
        version: existing.version + 1,
      },
    });

    return NextResponse.json({
      question: updated,
      message: `Đã cập nhật câu hỏi sang phiên bản v${updated.version}. Các đề kiểm tra đã phát hành trước đó vẫn giữ nguyên bản chốt cũ.`,
    });
  }

  if (action === "APPROVE_AI_DRAFT") {
    const { id } = body;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
      },
    });

    await prisma.moderationLog.create({
      data: {
        moderatorId: session.user.id,
        moderatorName: session.user.fullName,
        moderatorRole: session.role,
        targetType: "QUESTION",
        targetId: updated.id,
        action: "APPROVE",
        reason: "Giáo viên đã kiểm duyệt câu hỏi nháp do AI gợi ý để đưa vào Ngân hàng câu hỏi chính thức.",
      },
    });

    return NextResponse.json({ question: updated });
  }

  if (action === "IMPORT_CSV_BATCH") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "Danh sách câu hỏi nhập trống." }, { status: 400 });
    }

    const imported = [];
    for (const r of rows) {
      if (!r.questionText || !r.correctAnswer) continue;
      const code =
        r.code && String(r.code).trim().length >= 3
          ? String(r.code).trim()
          : `IMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const optionsJson = Array.isArray(r.options)
        ? JSON.stringify(r.options)
        : r.optionsJson ||
          JSON.stringify([
            { id: "A", text: r.optionA || "Phương án A" },
            { id: "B", text: r.optionB || "Phương án B" },
            { id: "C", text: r.optionC || "Phương án C" },
            { id: "D", text: r.optionD || "Phương án D" },
          ]);

      const saved = await prisma.question.upsert({
        where: { code },
        update: {
          gradeLevel: Number(r.gradeLevel || 7),
          topicName: r.topicName || "Chủ đề Tin học",
          lessonTitle: r.lessonTitle || "Bài học Tin học",
          learningObjective: r.learningObjective || "Mục tiêu bài học",
          cognitiveLevel: r.cognitiveLevel || "UNDERSTAND",
          sourceBook: r.sourceBook || "SGK Tin học",
          sourcePage: r.sourcePage || "",
          questionText: r.questionText,
          optionsJson,
          correctAnswer: String(r.correctAnswer).trim().toUpperCase(),
          explanation: r.explanation || "Giải thích theo SGK Tin học.",
          status: r.isAiDraft ? "PENDING_REVIEW" : "APPROVED",
          isAiDraft: Boolean(r.isAiDraft),
        },
        create: {
          code,
          gradeLevel: Number(r.gradeLevel || 7),
          topicName: r.topicName || "Chủ đề Tin học",
          lessonTitle: r.lessonTitle || "Bài học Tin học",
          learningObjective: r.learningObjective || "Mục tiêu bài học",
          cognitiveLevel: r.cognitiveLevel || "UNDERSTAND",
          sourceBook: r.sourceBook || "SGK Tin học",
          sourcePage: r.sourcePage || "",
          questionText: r.questionText,
          optionsJson,
          correctAnswer: String(r.correctAnswer).trim().toUpperCase(),
          explanation: r.explanation || "Giải thích theo SGK Tin học.",
          status: r.isAiDraft ? "PENDING_REVIEW" : "APPROVED",
          isAiDraft: Boolean(r.isAiDraft),
          authorId: session.user.id,
          approvedById: r.isAiDraft ? null : session.user.id,
        },
      });
      imported.push(saved);
    }

    return NextResponse.json({
      importedCount: imported.length,
      questions: imported,
    });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

