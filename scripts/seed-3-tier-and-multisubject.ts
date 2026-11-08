import { prisma } from "../src/lib/prisma";
import {
  provisionEducareDriveTree,
  syncClassTrackingSheet,
  createEncryptedDatabaseBackup,
  verifyBackupRestoreDrill,
} from "../src/lib/google-workspace";

async function main() {
  console.log("=================================================================");
  console.log("KHỞI TẠO KIẾN TRÚC 3 TẦNG (SUPABASE + SHEETS 6 TABS + DRIVE 6 NHÁNH)");
  console.log("& MỞ RỘNG NGÂN HÀNG CÂU HỎI / ĐỀ THI ĐA MÔN THCS (SRS v1.0)");
  console.log("=================================================================");

  const superAdmin = await prisma.user.findFirst({
    where: { email: "dinhnguyenhnue@gmail.com" },
  });
  const teacher = await prisma.user.findFirst({
    where: { email: "thay.tuan@unigo.edu.vn" },
  });
  const actorId = superAdmin?.id || teacher?.id || "system";
  const actorEmail = superAdmin?.email || teacher?.email || "dinhnguyenhnue@gmail.com";

  const class7A1 = await prisma.schoolClass.findFirst({
    where: { name: "7A1" },
  });

  // 1. Seed Multi-Subject Questions (Toán 7, Ngữ văn 7, KHTN 7) alongside Tin học 7
  const multiSubjectQuestions = [
    {
      code: "TOAN7-C1-Q01",
      subjectCode: "TOAN7",
      subjectName: "Toán học",
      gradeLevel: 7,
      topicName: "Chương I: Số hữu tỉ",
      lessonTitle: "Bài 1: Tập hợp các số hữu tỉ",
      learningObjective: "Nhận biết được số hữu tỉ và biểu diễn số hữu tỉ trên trục số",
      cognitiveLevel: "REMEMBER",
      sourceBook: "SGK Toán 7 - Kết nối tri thức với cuộc sống (Tập 1)",
      sourcePage: "Trang 5-9",
      questionText: "Số nào sau đây là số hữu tỉ âm?",
      optionsJson: JSON.stringify([
        { id: "A", text: "3/5" },
        { id: "B", text: "-4/7" },
        { id: "C", text: "0" },
        { id: "D", text: "-5/-8" },
      ]),
      correctAnswer: "B",
      explanation: "Số hữu tỉ âm là số hữu tỉ nhỏ hơn 0. Vì -4/7 < 0 nên -4/7 là số hữu tỉ âm (còn -5/-8 = 5/8 > 0).",
    },
    {
      code: "TOAN7-C1-Q02",
      subjectCode: "TOAN7",
      subjectName: "Toán học",
      gradeLevel: 7,
      topicName: "Chương VI: Tỉ lệ thức và đại lượng tỉ lệ",
      lessonTitle: "Bài 20: Tỉ lệ thức",
      learningObjective: "Vận dụng tính chất của tỉ lệ thức để tìm thành phần chưa biết",
      cognitiveLevel: "APPLY",
      sourceBook: "SGK Toán 7 - Kết nối tri thức với cuộc sống (Tập 2)",
      sourcePage: "Trang 4-7",
      questionText: "Cho tỉ lệ thức x / 6 = 5 / 3. Giá trị của x bằng bao nhiêu?",
      optionsJson: JSON.stringify([
        { id: "A", text: "x = 10" },
        { id: "B", text: "x = 9" },
        { id: "C", text: "x = 15" },
        { id: "D", text: "x = 2,5" },
      ]),
      correctAnswer: "A",
      explanation: "Áp dụng tính chất cơ bản của tỉ lệ thức: 3x = 6 . 5 = 30 => x = 30 / 3 = 10.",
    },
    {
      code: "VAN7-B1-Q01",
      subjectCode: "VAN7",
      subjectName: "Ngữ văn",
      gradeLevel: 7,
      topicName: "Bài 1: Bầu trời tuổi thơ",
      lessonTitle: "Đọc hiểu văn bản: Bầy chim chìa vôi (Nguyễn Quang Thiều)",
      learningObjective: "Nhận biết ngôi kể và tác dụng của lời đối thoại trong truyện ngắn",
      cognitiveLevel: "UNDERSTAND",
      sourceBook: "SGK Ngữ văn 7 - Kết nối tri thức với cuộc sống (Tập 1)",
      sourcePage: "Trang 11-17",
      questionText: "Truyện ngắn 'Bầy chim chìa vôi' của nhà văn Nguyễn Quang Thiều được kể theo ngôi thứ mấy?",
      optionsJson: JSON.stringify([
        { id: "A", text: "Ngôi thứ nhất (nhân vật Mon xưng 'tôi')" },
        { id: "B", text: "Ngôi thứ ba (người kể chuyện giấu mình)" },
        { id: "C", text: "Ngôi thứ hai" },
        { id: "D", text: "Kết hợp ngôi thứ nhất và ngôi thứ hai" },
      ]),
      correctAnswer: "B",
      explanation: "Văn bản được kể theo ngôi thứ ba (người kể chuyện giấu mình), giúp miêu tả khách quan hành động và tâm trạng của hai anh em Mên và Mon.",
    },
    {
      code: "KHTN7-B1-Q01",
      subjectCode: "KHTN7",
      subjectName: "Khoa học tự nhiên",
      gradeLevel: 7,
      topicName: "Chương I: Nguyên tử và Sơ lược bảng tuần hoàn",
      lessonTitle: "Bài 2: Nguyên tử",
      learningObjective: "Trình bày được cấu tạo nguyên tử gồm hạt nhân và vỏ nguyên tử",
      cognitiveLevel: "REMEMBER",
      sourceBook: "SGK Khoa học tự nhiên 7 - Kết nối tri thức với cuộc sống",
      sourcePage: "Trang 14-18",
      questionText: "Hạt nhân nguyên tử được cấu tạo bởi những loại hạt nào?",
      optionsJson: JSON.stringify([
        { id: "A", text: "Proton và electron" },
        { id: "B", text: "Proton và neutron" },
        { id: "C", text: "Neutron và electron" },
        { id: "D", text: "Chỉ có các hạt electron mang điện tích âm" },
      ]),
      correctAnswer: "B",
      explanation: "Hạt nhân nguyên tử nằm ở tâm nguyên tử, tạo bởi các hạt proton (mang điện dương) và neutron (không mang điện).",
    },
  ];

  for (const q of multiSubjectQuestions) {
    await prisma.question.upsert({
      where: { code: q.code },
      update: {
        subjectCode: q.subjectCode,
        subjectName: q.subjectName,
        questionText: q.questionText,
      },
      create: {
        ...q,
        points: 2.5,
        version: 1,
        status: "APPROVED",
        isAiDraft: false,
        isDemoData: true,
        authorId: actorId,
        approvedById: actorId,
      },
    });
  }
  console.log(`1. Đã nạp bổ sung ${multiSubjectQuestions.length} câu hỏi đa môn (Toán 7, Ngữ văn 7, KHTN 7).`);

  // 2. Create a Multi-Subject Assessment for Toán 7 if not exists
  const mathQuestions = await prisma.question.findMany({
    where: { subjectCode: "TOAN7" },
    orderBy: { code: "asc" },
  });

  if (mathQuestions.length >= 2) {
    const mathAsg = await prisma.assessment.upsert({
      where: { code: "TOAN7-PRACTICE-01" },
      update: {
        subjectCode: "TOAN7",
        subjectName: "Toán học",
      },
      create: {
        code: "TOAN7-PRACTICE-01",
        subjectCode: "TOAN7",
        subjectName: "Toán học",
        title: "Luyện tập Toán 7: Số hữu tỉ & Tỉ lệ thức",
        description: "Phiếu luyện tập tự đánh giá môn Toán 7 có giải thích từng bước ngay sau khi nộp bài.",
        classId: class7A1?.id || "7A1",
        gradeLevel: 7,
        lessonTitle: "Ôn tập Số hữu tỉ & Tỉ lệ thức",
        mode: "PRACTICE",
        timeLimitMinutes: null,
        maxAttempts: 0,
        revealAnswersMode: "IMMEDIATE",
        status: "PUBLISHED",
        isDemoData: true,
        createdById: actorId,
        publishedAt: new Date(),
      },
    });

    for (let i = 0; i < mathQuestions.length; i++) {
      const mq = mathQuestions[i];
      await prisma.assessmentItem.upsert({
        where: {
          assessmentId_orderIndex: {
            assessmentId: mathAsg.id,
            orderIndex: i + 1,
          },
        },
        update: {},
        create: {
          assessmentId: mathAsg.id,
          questionId: mq.id,
          questionVersion: mq.version,
          orderIndex: i + 1,
          points: 5.0,
          snapshotQuestionText: mq.questionText,
          snapshotOptionsJson: mq.optionsJson,
          snapshotCorrectAnswer: mq.correctAnswer,
          snapshotExplanation: mq.explanation,
          snapshotObjective: mq.learningObjective,
        },
      });
    }
    console.log("2. Đã tạo bài luyện tập môn Toán 7 (TOAN7-PRACTICE-01) trên cùng Engine đánh giá thống nhất.");
  }

  // 3. Seed AIUsageLog entries if empty
  const existingAiLogs = await prisma.aIUsageLog.count();
  if (existingAiLogs === 0) {
    await prisma.aIUsageLog.createMany({
      data: [
        {
          userId: actorId,
          userEmail: "minhanh.nguyen@unigo.edu.vn",
          userRole: "STUDENT",
          className: "7A1",
          subjectCode: "TIN7",
          featureModule: "AI_TUTOR",
          modelName: "gemini-2.5-flash",
          promptTokens: 320,
          completionTokens: 520,
          totalTokens: 840,
          estimatedCostUsd: 0.000252,
          latencyMs: 640,
          status: "SUCCESS",
          summaryNote: "Phiên gợi mở Socratic (Bảo mật nội dung hội thoại riêng tư theo SRS §4.5)",
        },
        {
          userId: actorId,
          userEmail: "thay.tuan@unigo.edu.vn",
          userRole: "TEACHER",
          className: "7A1",
          subjectCode: "TIN7",
          featureModule: "AI_ASSESSMENT_ANALYZER",
          modelName: "gemini-2.5-flash",
          promptTokens: 610,
          completionTokens: 810,
          totalTokens: 1420,
          estimatedCostUsd: 0.000426,
          latencyMs: 890,
          status: "SUCCESS",
          summaryNote: "Phân tích phổ điểm & phân nhóm 4 mức độ sau kiểm tra lớp 7A1",
        },
        {
          userId: actorId,
          userEmail: "thay.tuan@unigo.edu.vn",
          userRole: "TEACHER",
          className: "7A1",
          subjectCode: "TOAN7",
          featureModule: "AI_TEACHER_ASSISTANT",
          modelName: "gemini-2.5-flash",
          promptTokens: 450,
          completionTokens: 670,
          totalTokens: 1120,
          estimatedCostUsd: 0.000336,
          latencyMs: 720,
          status: "SUCCESS",
          summaryNote: "Gợi ý nhận xét cá nhân hóa môn Toán 7 (Chờ giáo viên duyệt)",
        },
      ],
    });
    console.log("3. Đã khởi tạo nhật ký sử dụng & chi phí AI (AIUsageLog).");
  }

  // 4. Provision the 21 standardized Google Drive Folder Nodes (01_QUAN_TRI .. 06_BACKUP)
  const driveResult = await provisionEducareDriveTree(actorId, "PERSONAL_GMAIL_HYBRID");
  console.log(`4. Đã khởi tạo cây thư mục chuẩn Google Drive (${driveResult.totalFoldersProvisioned} nodes, Root ID: ${driveResult.rootFolderId}).`);

  // 5. Sync EDUCARE_AI_Tracking_7A1 (6 tabs)
  const sheetResult = await syncClassTrackingSheet(actorId, "7A1");
  console.log(
    `5. Đã đồng bộ bảng Google Sheets ${sheetResult.trackingSheet.spreadsheetTitle} (${sheetResult.tabsCount} tabs, ${sheetResult.totalRowsSynced} dòng).`
  );

  // 6. Create Encrypted Database Backup & Run Restore Drill Verification
  const backup = await createEncryptedDatabaseBackup(actorId, actorEmail);
  const drill = await verifyBackupRestoreDrill(actorId, backup.id);
  console.log(`6. ${drill.message}`);

  console.log("=================================================================");
  console.log("HOÀN TẤT KHỞI TẠO KIẾN TRÚC 3 TẦNG & ĐA MÔN THCS!");
  console.log("=================================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

