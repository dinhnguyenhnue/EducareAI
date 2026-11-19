import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveGeminiServerConfig,
  redactStudentPiiForExternalAi,
} from "@/lib/google-workspace";
import {
  resolveTutorCatalogForClass,
  buildVerifiedSocraticSystemPrompt,
} from "@/lib/ai-tutor-config";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const requestedClass = searchParams.get("className");
  const requestedGrade = searchParams.get("grade");

  const isStudentOnly =
    session.role === "STUDENT" && !session.isSuperAdmin;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { schoolClass: true },
  });

  if (
    isStudentOnly &&
    requestedClass &&
    profile?.schoolClass?.name &&
    requestedClass.trim().toUpperCase() !==
      profile.schoolClass.name.toUpperCase()
  ) {
    return NextResponse.json(
      {
        error: `FORBIDDEN_CLASS_SCOPE: Tài khoản của em thuộc lớp ${profile.schoolClass.name}, không có quyền truy cập gia sư của lớp ${requestedClass}.`,
      },
      { status: 403 }
    );
  }

  const resolvedGrade =
    profile?.gradeLevel ||
    (requestedGrade && [6, 7, 8].includes(Number(requestedGrade))
      ? Number(requestedGrade)
      : 6);
  const resolvedClassName =
    profile?.schoolClass?.name ||
    (requestedClass ? requestedClass.trim().toUpperCase() : `${resolvedGrade}A1`);

  const activeExamAttempt = await prisma.attempt.findFirst({
    where: {
      studentId: session.user.id,
      status: "IN_PROGRESS",
      assessment: { mode: "EXAM" },
    },
    include: { assessment: true },
  });

  const catalog = resolveTutorCatalogForClass(resolvedGrade, resolvedClassName);
  const geminiConfig = await getEffectiveGeminiServerConfig();

  return NextResponse.json({
    studentId: session.user.id,
    studentName: session.user.fullName,
    role: session.role,
    isTeacherOrAdminPreview: !isStudentOnly,
    gradeLevel: resolvedGrade,
    className: resolvedClassName,
    activeExamInProgress: Boolean(activeExamAttempt),
    activeExamTitle: activeExamAttempt?.assessment?.title || null,
    geminiConfigured: geminiConfig.isConfigured,
    catalog,
  });
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập để sử dụng Trợ lý AI." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      message,
      subjectCode,
      className: requestedClassName,
      gradeLevel: requestedGradeLevel,
      lessonTitle: customLessonTitle,
      objective: customObjective,
      history = [],
      roleContext,
      featureModule,
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung câu hỏi." },
        { status: 400 }
      );
    }

    const isStudentOnly =
      session.role === "STUDENT" && !session.isSuperAdmin;
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { schoolClass: true },
    });

    if (
      isStudentOnly &&
      requestedClassName &&
      profile?.schoolClass?.name &&
      String(requestedClassName).trim().toUpperCase() !==
        profile.schoolClass.name.toUpperCase()
    ) {
      return NextResponse.json(
        {
          error: `FORBIDDEN_CLASS_SCOPE: Em thuộc lớp ${profile.schoolClass.name}, không được phép gửi yêu cầu gia sư dưới danh nghĩa lớp ${requestedClassName}.`,
        },
        { status: 403 }
      );
    }

    const resolvedGrade =
      profile?.gradeLevel ||
      (typeof requestedGradeLevel === "number" &&
      [6, 7, 8].includes(requestedGradeLevel)
        ? requestedGradeLevel
        : 6);
    const resolvedClassName =
      profile?.schoolClass?.name ||
      (typeof requestedClassName === "string" && requestedClassName.trim()
        ? requestedClassName.trim().toUpperCase()
        : `${resolvedGrade}A1`);

    const catalog = resolveTutorCatalogForClass(
      resolvedGrade,
      resolvedClassName
    );
    const matchedSubject =
      catalog.find(
        (c) =>
          c.subjectCode.toUpperCase() ===
          String(subjectCode || "").toUpperCase()
      ) || catalog[0];

    const resolvedSubjectCode = matchedSubject.subjectCode;
    const resolvedSubjectName = matchedSubject.subjectName;
    const resolvedLessonTitle =
      (typeof customLessonTitle === "string" && customLessonTitle.trim()) ||
      matchedSubject.defaultLessonTitle;
    const resolvedObjective =
      (typeof customObjective === "string" && customObjective.trim()) ||
      matchedSubject.defaultObjective;

    // Check if an EXAM attempt is currently in progress on the server
    const activeExamAttempt = await prisma.attempt.findFirst({
      where: {
        studentId: session.user.id,
        status: "IN_PROGRESS",
        assessment: { mode: "EXAM" },
      },
    });

    const serverModeLabel = activeExamAttempt
      ? "KIỂM TRA ĐANG DIỄN RA (Chỉ hướng dẫn khái niệm chung, giữ kín lời giải và đáp án đề kiểm tra)"
      : "HỌC TẬP & TỰ LUYỆN THÔNG THƯỜNG";

    // Build anonymous class label so student/class PII is not leaked to external model
    const anonymousClassLabel = `Khối ${resolvedGrade} (Nhóm lớp chuẩn THCS)`;

    const systemPrompt = buildVerifiedSocraticSystemPrompt({
      subjectName: resolvedSubjectName,
      gradeLevel: resolvedGrade,
      anonymousClassLabel,
      lessonTitle: resolvedLessonTitle,
      objective: resolvedObjective,
      serverModeLabel,
      knowledgeContext: matchedSubject.knowledgeExcerpt,
    });

    const sanitizedUserMessage = redactStudentPiiForExternalAi(message);
    const sanitizedHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .filter(
            (h: any) =>
              h &&
              (h.role === "user" || h.role === "assistant") &&
              typeof h.text === "string"
          )
          .map((h: any) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: redactStudentPiiForExternalAi(h.text) }],
          }))
      : [];

    const geminiConfig = await getEffectiveGeminiServerConfig();
    const apiKey = geminiConfig.apiKey;
    const activeRole = roleContext || session.activeViewRole || session.role;

    const resolvedModule =
      featureModule ||
      (activeRole === "TEACHER"
        ? "AI_TEACHER_ASSISTANT"
        : activeRole === "PARENT"
        ? "AI_PARENT_COMPANION"
        : "AI_TUTOR");

    let reply = "";
    let isLiveGeminiApi = false;

    if (geminiConfig.isConfigured && apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            geminiConfig.modelName
          )}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [
                ...sanitizedHistory,
                { role: "user", parts: [{ text: sanitizedUserMessage }] },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (reply) {
            isLiveGeminiApi = true;
          }
        }
      } catch {
        // Fall back to deterministic Socratic engine below if network fails
      }
    }

    if (!reply) {
      if (activeExamAttempt) {
        reply = `[Gia sư ${resolvedSubjectName} • Chế độ Bảo mật Kiểm tra]: Hiện tại hệ thống ghi nhận em đang trong thời gian làm đề kiểm tra chính thức nên thầy/cô chỉ nhắc lại khái niệm chung của "${resolvedLessonTitle}": ${matchedSubject.knowledgeExcerpt}. Theo em, từ khái niệm này, em nên loại trừ phương án nào trước?`;
      } else {
        reply = `[Gia sư ${resolvedSubjectName} • Lớp ${resolvedClassName} • ${resolvedLessonTitle}]: Thầy/cô ghi nhận câu hỏi của em: "${sanitizedUserMessage}". Điểm đáng khen là em đã chủ động liên hệ tới mục tiêu "${resolvedObjective}". Gợi ý vừa đủ từ SGK: ${matchedSubject.knowledgeExcerpt} Vậy bước tiếp theo, em hãy thử nêu 1 ví dụ cụ thể trong bài để kiểm tra xem suy luận của mình đã khớp chưa nhé?`;
      }
    }

    const promptTokens = Math.max(
      45,
      Math.ceil(String(sanitizedUserMessage || "").length / 3) + 60
    );
    const completionTokens = Math.max(60, Math.ceil(reply.length / 3));
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = Number((totalTokens * 0.0000003).toFixed(6));

    await prisma.aIUsageLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: activeRole,
        className: resolvedClassName,
        subjectCode: resolvedSubjectCode,
        featureModule: resolvedModule,
        modelName: isLiveGeminiApi
          ? geminiConfig.modelName
          : "socratic-pedagogical-engine",
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        latencyMs: Date.now() - startedAt,
        status: "SUCCESS",
        summaryNote: `${resolvedSubjectName} (${resolvedClassName}) - ${resolvedLessonTitle}`,
      },
    });

    return NextResponse.json({
      success: true,
      integrationStatus: isLiveGeminiApi ? "CONNECTED" : "NOT_CONFIGURED",
      isLiveGeminiApi,
      modelName: isLiveGeminiApi
        ? geminiConfig.modelName
        : "socratic-pedagogical-engine",
      missingEnvVar: geminiConfig.isConfigured ? null : "GEMINI_API_KEY",
      piiRedacted: sanitizedUserMessage !== String(message || ""),
      contextUsed: {
        gradeLevel: resolvedGrade,
        className: resolvedClassName,
        subjectCode: resolvedSubjectCode,
        subjectName: resolvedSubjectName,
        lessonTitle: resolvedLessonTitle,
        objective: resolvedObjective,
        serverModeLabel,
        externalGemUrl: matchedSubject.externalGemUrl,
      },
      systemPromptPreview: systemPrompt,
      usage: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
      reply,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
