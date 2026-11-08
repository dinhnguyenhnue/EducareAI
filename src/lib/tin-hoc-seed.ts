import { PrismaClient } from "@prisma/client";
import {
  SAMPLE_QUIZ_10_GAME_HTML,
  SAMPLE_SIMULATION_3_TASKS_HTML,
  analyzeStudentHtmlCode,
} from "./html-game-sandbox";

export const SAMPLE_TIN_HOC_QUESTIONS = [
  {
    code: "TH7-CD1-B1-Q01",
    gradeLevel: 7,
    topicName: "Chủ đề A: Máy tính và cộng đồng",
    lessonTitle: "Bài 1: Thiết bị vào và thiết bị ra",
    learningObjective: "Nhận biết được các thiết bị vào (Input) và thiết bị ra (Output) cơ bản của máy tính.",
    cognitiveLevel: "REMEMBER",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Thiết bị nào sau đây chỉ đóng vai trò là thiết bị vào (Input Device) của máy tính?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Bàn phím và chuột máy tính" },
      { id: "B", text: "Màn hình tinh thể lỏng (LCD)" },
      { id: "C", text: "Máy in laser đen trắng" },
      { id: "D", text: "Loa máy tính và tai nghe" },
    ]),
    correctAnswer: "A",
    explanation: "Bàn phím và chuột dùng để nhập dữ liệu và lệnh điều khiển vào máy tính nên là thiết bị vào. Màn hình, máy in, loa là thiết bị ra.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 6 - 8",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CD1-B1-Q02",
    gradeLevel: 7,
    topicName: "Chủ đề A: Máy tính và cộng đồng",
    lessonTitle: "Bài 1: Thiết bị vào và thiết bị ra",
    learningObjective: "Phân biệt được thiết bị vừa đóng vai trò thiết bị vào vừa đóng vai trò thiết bị ra.",
    cognitiveLevel: "UNDERSTAND",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Vì sao màn hình cảm ứng (Touchscreen) trên máy tính bảng được xếp vào nhóm thiết bị vừa vào vừa ra?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Vì vừa hiển thị hình ảnh ra cho người dùng xem, vừa nhận thao tác chạm tay làm dữ liệu đầu vào" },
      { id: "B", text: "Vì màn hình cảm ứng dùng pin sạc nên vừa tiêu thụ điện vừa phát sáng" },
      { id: "C", text: "Vì màn hình cảm ứng có thể kết nối với cả chuột và bàn phím rời" },
      { id: "D", text: "Vì màn hình cảm ứng có độ phân giải cao hơn màn hình thường" },
    ]),
    correctAnswer: "A",
    explanation: "Màn hình cảm ứng hiển thị thông tin (Output) đồng thời cảm biến vị trí chạm của ngón tay/bút cảm ứng để đưa lệnh vào máy tính (Input).",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 8",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CD1-B2-Q03",
    gradeLevel: 7,
    topicName: "Chủ đề A: Máy tính và cộng đồng",
    lessonTitle: "Bài 2: Phần mềm máy tính",
    learningObjective: "Phân biệt được phần mềm hệ thống (Hệ điều hành) và phần mềm ứng dụng.",
    cognitiveLevel: "UNDERSTAND",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Phương án nào dưới đây chỉ gồm các phần mềm hệ thống (Hệ điều hành)?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Windows 11, Ubuntu Linux, macOS, Android" },
      { id: "B", text: "Microsoft Word, Google Chrome, Scratch 3.0" },
      { id: "C", text: "Windows 10, Microsoft Excel, Zalo" },
      { id: "D", text: "Unikey, Paint, VLC Media Player" },
    ]),
    correctAnswer: "A",
    explanation: "Windows, Linux, macOS, Android là các hệ điều hành quản lý phần cứng và tạo môi trường cho phần mềm ứng dụng chạy.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 11 - 13",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CD1-B2-Q04",
    gradeLevel: 7,
    topicName: "Chủ đề A: Máy tính và cộng đồng",
    lessonTitle: "Bài 2: Phần mềm máy tính",
    learningObjective: "Nhận diện phần đuôi mở rộng tệp (File Extension) tương ứng với loại dữ liệu.",
    cognitiveLevel: "APPLY",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Bạn Minh Anh muốn gửi tệp trò chơi học tập chạy trực tiếp trên trình duyệt web cho thầy giáo duyệt. Tệp đó cần có phần mở rộng nào?",
    optionsJson: JSON.stringify([
      { id: "A", text: ".html" },
      { id: "B", text: ".mp3" },
      { id: "C", text: ".jpg" },
      { id: "D", text: ".xlsx" },
    ]),
    correctAnswer: "A",
    explanation: "Tệp siêu văn bản chạy trên trình duyệt web có phần mở rộng .html (hoặc .htm). .mp3 là âm thanh, .jpg là hình ảnh, .xlsx là bảng tính.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 14 - 16",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDC-B4-Q05",
    gradeLevel: 7,
    topicName: "Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
    lessonTitle: "Bài 4: Mạng xã hội và một số kênh trao đổi thông tin",
    learningObjective: "Vận dụng quy tắc bảo mật thông tin cá nhân trên môi trường mạng.",
    cognitiveLevel: "APPLY",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Khi tham gia diễn đàn học tập hoặc thử nghiệm trợ lý AI, thông tin nào tuyệt đối KHÔNG nên đăng công khai?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Mật khẩu tài khoản, địa chỉ nhà riêng và số điện thoại cá nhân" },
      { id: "B", text: "Tên bài học trong sách giáo khoa Tin học 7" },
      { id: "C", text: "Câu hỏi về thuật toán sắp xếp nổi bọt" },
      { id: "D", text: "Ý tưởng thiết kế màu sắc cho trò chơi trắc nghiệm" },
    ]),
    correctAnswer: "A",
    explanation: "Mật khẩu, địa chỉ nhà, số điện thoại là dữ liệu cá nhân nhạy cảm cần được bảo mật để phòng tránh rủi ro lừa đảo và xâm phạm quyền riêng tư.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 23 - 26",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDD-B5-Q06",
    gradeLevel: 7,
    topicName: "Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số",
    lessonTitle: "Bài 5: Ứng xử trên mạng",
    learningObjective: "Xử lý tình huống tin nhắn lừa đảo hoặc đường link lạ trên Internet.",
    cognitiveLevel: "APPLY",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Khi nhận được tin nhắn có đường link lạ yêu cầu nhập tài khoản và mật khẩu email trường học để 'nhận thưởng', em cần làm gì?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Không bấm vào link, không nhập mật khẩu và báo ngay cho thầy cô hoặc bố mẹ" },
      { id: "B", text: "Nhập thử mật khẩu xem có nhận được quà thật không" },
      { id: "C", text: "Chuyển tiếp tin nhắn đó cho tất cả các bạn trong lớp 7A1" },
      { id: "D", text: "Gửi số điện thoại của bạn thân vào biểu mẫu đó" },
    ]),
    correctAnswer: "A",
    explanation: "Đây là dấu hiệu tấn công giả mạo (Phishing) nhằm đánh cắp tài khoản. Tuyệt đối không nhấp link lạ và cần báo cho người lớn hỗ trợ.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 28 - 30",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDE-B7-Q07",
    gradeLevel: 7,
    topicName: "Chủ đề E: Ứng dụng tin học (Bảng tính điện tử)",
    lessonTitle: "Bài 7: Tính toán tự động trên trang tính",
    learningObjective: "Biết cú pháp đúng của công thức và hàm cơ bản trong phần mềm bảng tính.",
    cognitiveLevel: "REMEMBER",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Trong phần mềm bảng tính, công thức nào sau đây viết ĐÚNG cú pháp để tính trung bình cộng của vùng dữ liệu từ ô B2 đến ô B10?",
    optionsJson: JSON.stringify([
      { id: "A", text: "=AVERAGE(B2:B10)" },
      { id: "B", text: "AVERAGE(B2..B10)" },
      { id: "C", text: "=SUM(B2:B10)" },
      { id: "D", text: "=MAX(B2-B10)" },
    ]),
    correctAnswer: "A",
    explanation: "Mọi công thức trong bảng tính bắt đầu bằng dấu '='. Hàm AVERAGE dùng tính trung bình cộng và vùng địa chỉ phân cách bởi dấu hai chấm ':'.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 39 - 44",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDF-B14-Q08",
    gradeLevel: 7,
    topicName: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    lessonTitle: "Bài 14: Thuật toán tìm kiếm tuần tự",
    learningObjective: "Hiểu cách hoạt động và điều kiện dừng của thuật toán tìm kiếm tuần tự.",
    cognitiveLevel: "UNDERSTAND",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Cho dãy số [12, 25, 8, 30, 19]. Dùng thuật toán tìm kiếm tuần tự từ đầu dãy để tìm số 30, thuật toán sẽ dừng lại ở bước so sánh thứ mấy?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Bước thứ 4 (so sánh với phần tử có giá trị 30)" },
      { id: "B", text: "Bước thứ 1 (so sánh với phần tử 12)" },
      { id: "C", text: "Bước thứ 5 (phải duyệt hết cả dãy)" },
      { id: "D", text: "Không tìm thấy vì dãy chưa được sắp xếp tăng dần" },
    ]),
    correctAnswer: "A",
    explanation: "Tìm kiếm tuần tự kiểm tra lần lượt từ đầu dãy: 12 (sai) -> 25 (sai) -> 8 (sai) -> 30 (bằng giá trị cần tìm -> dừng ở bước 4). Không yêu cầu dãy phải sắp xếp trước.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 71 - 74",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDF-B15-Q09",
    gradeLevel: 7,
    topicName: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    lessonTitle: "Bài 15: Thuật toán tìm kiếm nhị phân",
    learningObjective: "Xác định điều kiện tiên quyết để áp dụng thuật toán tìm kiếm nhị phân.",
    cognitiveLevel: "UNDERSTAND",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Điều kiện bắt buộc để có thể áp dụng thuật toán tìm kiếm nhị phân (Binary Search) trên một danh sách là gì?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Danh sách phải được sắp xếp theo một thứ tự nhất định (tăng dần hoặc giảm dần)" },
      { id: "B", text: "Danh sách phải có số lượng phần tử là số chẵn" },
      { id: "C", text: "Danh sách không được chứa các số lớn hơn 100" },
      { id: "D", text: "Danh sách phải được lưu trong tệp văn bản .txt" },
    ]),
    correctAnswer: "A",
    explanation: "Tìm kiếm nhị phân dựa trên việc so sánh với phần tử ở giữa để loại bỏ một nửa phạm vi tìm kiếm, do đó danh sách bắt buộc phải được sắp xếp trước.",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 75 - 79",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-CDF-B16-Q10",
    gradeLevel: 7,
    topicName: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    lessonTitle: "Bài 16: Thuật toán sắp xếp",
    learningObjective: "Vận dụng tư duy thuật toán sắp xếp vào bài toán thực tế.",
    cognitiveLevel: "HIGH_APPLY",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU] Cho dãy điểm [8, 3, 9, 5]. Nếu dùng thuật toán sắp xếp chọn (Selection Sort) theo thứ tự tăng dần, sau lượt đổi chỗ đầu tiên dãy số sẽ thành:",
    optionsJson: JSON.stringify([
      { id: "A", text: "[3, 8, 9, 5]" },
      { id: "B", text: "[9, 8, 5, 3]" },
      { id: "C", text: "[8, 9, 3, 5]" },
      { id: "D", text: "[3, 5, 8, 9]" },
    ]),
    correctAnswer: "A",
    explanation: "Ở lượt đầu tiên, thuật toán sắp xếp chọn tìm phần tử nhỏ nhất trong toàn dãy [8, 3, 9, 5] là 3 và đổi chỗ với phần tử đầu tiên (8), thu được [3, 8, 9, 5].",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống",
    sourcePage: "Trang 80 - 84",
    status: "APPROVED",
    isAiDraft: false,
  },
  {
    code: "TH7-AI-DRAFT-Q11",
    gradeLevel: 7,
    topicName: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    lessonTitle: "Bài 15: Thuật toán tìm kiếm nhị phân",
    learningObjective: "Tính số bước chia đôi tối đa khi tìm kiếm nhị phân trên dãy đã sắp xếp.",
    cognitiveLevel: "HIGH_APPLY",
    questionType: "MULTIPLE_CHOICE",
    questionText: "[DỮ LIỆU MẪU - BẢN NHÁP AI CHỜ DUYỆT] Với danh sách gồm 15 từ tiếng Anh đã sắp xếp theo thứ tự bảng chữ cái, thuật toán tìm kiếm nhị phân cần tối đa bao nhiêu lần so sánh để kết luận một từ có trong danh sách hay không?",
    optionsJson: JSON.stringify([
      { id: "A", text: "Tối đa 4 lần so sánh" },
      { id: "B", text: "Tối đa 15 lần so sánh" },
      { id: "C", text: "Tối đa 2 lần so sánh" },
      { id: "D", text: "Tối đa 8 lần so sánh" },
    ]),
    correctAnswer: "A",
    explanation: "Mỗi lần so sánh thu hẹp phạm vi còn một nửa: 15 -> 7 -> 3 -> 1. Do đó cần tối đa 4 lần so sánh (log2(16) = 4).",
    sourceBook: "SGK Tin học 7 - Kết nối tri thức với cuộc sống (Gợi ý từ AI)",
    sourcePage: "Trang 77",
    status: "PENDING_REVIEW",
    isAiDraft: true,
  },
];

export async function seedTinHocDemoData(prisma: PrismaClient) {
  const teacher = await prisma.user.findUnique({ where: { email: "thay.tuan@unigo.edu.vn" } });
  const student1 = await prisma.user.findUnique({ where: { email: "minhanh.nguyen@unigo.edu.vn" } });
  const student2 = await prisma.user.findUnique({ where: { email: "giabao.tran@unigo.edu.vn" } });
  const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const class7A1 = year
    ? await prisma.schoolClass.findUnique({
        where: { name_academicYearId: { name: "7A1", academicYearId: year.id } },
      })
    : null;

  if (!teacher || !student1 || !student2 || !class7A1) {
    return { seeded: false, reason: "Missing base users or class 7A1" };
  }

  // 1. Upsert 10 Approved Questions + 1 AI Draft Question
  const approvedQuestions = [];
  for (const q of SAMPLE_TIN_HOC_QUESTIONS) {
    const saved = await prisma.question.upsert({
      where: { code: q.code },
      update: {
        ...q,
        isDemoData: true,
        approvedById: q.status === "APPROVED" ? teacher.id : null,
      },
      create: {
        ...q,
        points: 1.0,
        version: 1,
        isDemoData: true,
        authorId: teacher.id,
        approvedById: q.status === "APPROVED" ? teacher.id : null,
      },
    });
    if (saved.status === "APPROVED") {
      approvedQuestions.push(saved);
    }
  }

  // 2. Seed Practice Assessment (Bài luyện tập mẫu - làm nhiều lần, hiện giải thích ngay)
  const practiceAssessment = await prisma.assessment.upsert({
    where: { code: "DEMO-PRACTICE-TH7-01" },
    update: {
      title: "[DỮ LIỆU MẪU] Luyện tập: Máy tính, An toàn số & Thuật toán Lớp 7",
      isDemoData: true,
      status: "PUBLISHED",
    },
    create: {
      code: "DEMO-PRACTICE-TH7-01",
      title: "[DỮ LIỆU MẪU] Luyện tập: Máy tính, An toàn số & Thuật toán Lớp 7",
      description: "Bài tự luyện 10 câu có phản hồi đúng/sai và giải thích kiến thức ngay sau khi nộp. Không giới hạn số lần làm.",
      mode: "PRACTICE",
      gradeLevel: 7,
      classId: class7A1.id,
      lessonTitle: "Tổng hợp Tin học 7",
      timeLimitMinutes: null,
      maxAttempts: 0, // 0 = unlimited for PRACTICE
      revealAnswersMode: "IMMEDIATE",
      status: "PUBLISHED",
      isDemoData: true,
      createdById: teacher.id,
      publishedAt: new Date(),
    },
  });

  for (let i = 0; i < approvedQuestions.length; i++) {
    const q = approvedQuestions[i];
    await prisma.assessmentItem.upsert({
      where: {
        assessmentId_orderIndex: {
          assessmentId: practiceAssessment.id,
          orderIndex: i + 1,
        },
      },
      update: {
        questionId: q.id,
        questionVersion: q.version,
        points: 1.0,
        snapshotQuestionText: q.questionText,
        snapshotOptionsJson: q.optionsJson,
        snapshotCorrectAnswer: q.correctAnswer,
        snapshotExplanation: q.explanation,
        snapshotObjective: q.learningObjective,
      },
      create: {
        assessmentId: practiceAssessment.id,
        questionId: q.id,
        questionVersion: q.version,
        orderIndex: i + 1,
        points: 1.0,
        snapshotQuestionText: q.questionText,
        snapshotOptionsJson: q.optionsJson,
        snapshotCorrectAnswer: q.correctAnswer,
        snapshotExplanation: q.explanation,
        snapshotObjective: q.learningObjective,
      },
    });
  }

  // 3. Seed Official Exam Assessment (Đề kiểm tra mẫu - tính giờ máy chủ, 1 lần làm, ẩn đáp án)
  const examAssessment = await prisma.assessment.upsert({
    where: { code: "DEMO-EXAM-TH7-15M" },
    update: {
      title: "[DỮ LIỆU MẪU] Kiểm tra 15 phút: Thuật toán & Phần mềm Máy tính (Lớp 7A1)",
      isDemoData: true,
      status: "PUBLISHED",
    },
    create: {
      code: "DEMO-EXAM-TH7-15M",
      title: "[DỮ LIỆU MẪU] Kiểm tra 15 phút: Thuật toán & Phần mềm Máy tính (Lớp 7A1)",
      description: "Đề kiểm tra định kỳ tính giờ ở máy chủ (15 phút, tối đa 1 lượt nộp chính thức). Không gửi đáp án đúng về trình duyệt trong thời gian thi.",
      mode: "EXAM",
      gradeLevel: 7,
      classId: class7A1.id,
      lessonTitle: "Phần mềm & Thuật toán",
      timeLimitMinutes: 15,
      maxAttempts: 1,
      revealAnswersMode: "AFTER_CLOSED",
      status: "PUBLISHED",
      isDemoData: true,
      createdById: teacher.id,
      publishedAt: new Date(),
    },
  });

  for (let i = 0; i < approvedQuestions.length; i++) {
    const q = approvedQuestions[i];
    await prisma.assessmentItem.upsert({
      where: {
        assessmentId_orderIndex: {
          assessmentId: examAssessment.id,
          orderIndex: i + 1,
        },
      },
      update: {
        questionId: q.id,
        questionVersion: q.version,
        points: 1.0,
        snapshotQuestionText: q.questionText,
        snapshotOptionsJson: q.optionsJson,
        snapshotCorrectAnswer: q.correctAnswer,
        snapshotExplanation: q.explanation,
        snapshotObjective: q.learningObjective,
      },
      create: {
        assessmentId: examAssessment.id,
        questionId: q.id,
        questionVersion: q.version,
        orderIndex: i + 1,
        points: 1.0,
        snapshotQuestionText: q.questionText,
        snapshotOptionsJson: q.optionsJson,
        snapshotCorrectAnswer: q.correctAnswer,
        snapshotExplanation: q.explanation,
        snapshotObjective: q.learningObjective,
      },
    });
  }

  // 4. Seed HTML Game 1: Trò chơi Trắc nghiệm 10 câu (APPROVED)
  const scan1 = analyzeStudentHtmlCode(SAMPLE_QUIZ_10_GAME_HTML);
  const project1 = await prisma.project.upsert({
    where: { slug: "dau-truong-tin-hoc-7-quiz-10" },
    update: {
      title: "[DỮ LIỆU MẪU] Đấu Trường Tin Học 7: 10 Câu Trắc Nghiệm Cốt Lõi",
      status: "APPROVED",
      isDemoData: true,
    },
    create: {
      slug: "dau-truong-tin-hoc-7-quiz-10",
      title: "[DỮ LIỆU MẪU] Đấu Trường Tin Học 7: 10 Câu Trắc Nghiệm Cốt Lõi",
      authorId: student1.id,
      displayAuthorName: student1.fullName,
      classId: class7A1.id,
      className: "7A1",
      gradeLevel: 7,
      lessonTitle: "Ôn tập học kỳ Tin học 7",
      learningObjective: "Giúp các bạn lớp 7A1 tự kiểm tra nhanh 10 khái niệm trọng tâm và hiểu rõ lý do đúng/sai của từng phương án.",
      gameType: "QUIZ_10",
      howToPlay: "Nhấn nút 'Bắt đầu thử thách 10 câu', đọc kỹ tình huống và chọn 1 trong 4 đáp án A, B, C, D. Đọc kỹ hộp giải thích trước khi sang câu tiếp theo.",
      knowledgeSummary: "Tổng hợp 10 khái niệm cốt lõi: Thiết bị vào/ra, Hệ điều hành và phần mềm ứng dụng, Quy tắc an toàn thông tin cá nhân, Công thức bảng tính và Thuật toán tìm kiếm/sắp xếp.",
      referenceSources: "SGK Tin học 7 - Kết nối tri thức với cuộc sống (Trang 6 - 84)",
      aiToolsUsed: "Sử dụng Gem 'TIN HỌC SÁNG TẠO' do thầy Tuấn cấu hình để gợi ý bố cục khung HTML/CSS.",
      studentContribution: "Tự biên soạn và đối chiếu 10 câu hỏi/giải thích với SGK Tin học 7, tự chỉnh bảng màu xanh ngọc và kiểm thử nút Chơi lại.",
      status: "APPROVED",
      currentVersionNum: 1,
      playCount: 28,
      isDemoData: true,
    },
  });

  const pv1 = await prisma.projectVersion.upsert({
    where: {
      projectId_versionNumber: {
        projectId: project1.id,
        versionNumber: 1,
      },
    },
    update: {
      htmlSourceCode: SAMPLE_QUIZ_10_GAME_HTML,
      fileSizeBytes: scan1.fileSizeBytes,
      staticScanJson: JSON.stringify(scan1),
      status: "APPROVED",
      reviewedById: teacher.id,
      reviewedByName: teacher.fullName,
      reviewedAt: new Date(),
      teacherFeedback: "Đạt chuẩn xuất sắc: Đủ 10 câu hỏi có giải thích rõ ràng, mã HTML tự chứa an toàn 100%, không gọi mạng ngoài.",
    },
    create: {
      projectId: project1.id,
      versionNumber: 1,
      changelog: "Phiên bản v1 hoàn chỉnh 10 câu hỏi Tin học 7.",
      htmlSourceCode: SAMPLE_QUIZ_10_GAME_HTML,
      fileSizeBytes: scan1.fileSizeBytes,
      staticScanJson: JSON.stringify(scan1),
      status: "APPROVED",
      reviewedById: teacher.id,
      reviewedByName: teacher.fullName,
      reviewedAt: new Date(),
      teacherFeedback: "Đạt chuẩn xuất sắc: Đủ 10 câu hỏi có giải thích rõ ràng, mã HTML tự chứa an toàn 100%, không gọi mạng ngoài.",
    },
  });

  await prisma.project.update({
    where: { id: project1.id },
    data: { approvedVersionId: pv1.id },
  });

  // 5. Seed HTML Game 2: Trò chơi Mô phỏng 3 nhiệm vụ (v1 APPROVED, v2 PENDING_REVIEW để kiểm thử duyệt lại & khôi phục phiên bản)
  const scan2 = analyzeStudentHtmlCode(SAMPLE_SIMULATION_3_TASKS_HTML);
  const project2 = await prisma.project.upsert({
    where: { slug: "xuong-mo-phong-thuat-toan-tim-kiem-sap-xep" },
    update: {
      title: "[DỮ LIỆU MẪU] Xưởng Mô Phỏng: 3 Nhiệm Vụ Thuật Toán Tìm Kiếm & Sắp Xếp",
      status: "APPROVED",
      currentVersionNum: 2,
      isDemoData: true,
    },
    create: {
      slug: "xuong-mo-phong-thuat-toan-tim-kiem-sap-xep",
      title: "[DỮ LIỆU MẪU] Xưởng Mô Phỏng: 3 Nhiệm Vụ Thuật Toán Tìm Kiếm & Sắp Xếp",
      authorId: student2.id,
      displayAuthorName: student2.fullName,
      classId: class7A1.id,
      className: "7A1",
      gradeLevel: 7,
      lessonTitle: "Bài 14, 15, 16: Thuật toán tìm kiếm và sắp xếp",
      learningObjective: "Trực quan hóa cách con trỏ thuật toán di chuyển qua từng phần tử để hiểu bản chất thay vì học thuộc lòng.",
      gameType: "SIMULATION_3_TASKS",
      howToPlay: "Hoàn thành lần lượt Nhiệm vụ 1 (Tìm kiếm tuần tự), Nhiệm vụ 2 (Tìm kiếm nhị phân) và Nhiệm vụ 3 (Sắp xếp chọn).",
      knowledgeSummary: "So sánh tìm kiếm tuần tự (duyệt từ đầu dãy) với tìm kiếm nhị phân (chia đôi dãy đã sắp xếp) và quy tắc đổi chỗ phần tử nhỏ nhất trong sắp xếp chọn.",
      referenceSources: "SGK Tin học 7 - Kết nối tri thức với cuộc sống (Trang 71 - 84)",
      aiToolsUsed: "Nhờ Gem gợi ý hàm vẽ các ô số bằng thẻ div và hiệu ứng đổi màu khi so sánh.",
      studentContribution: "Tự thiết kế bộ dữ liệu mẫu, điều kiện hoàn thành 3 nhiệm vụ tăng dần và lời giải thích từng bước.",
      status: "APPROVED",
      currentVersionNum: 2,
      playCount: 19,
      isDemoData: true,
    },
  });

  const pv2_v1 = await prisma.projectVersion.upsert({
    where: {
      projectId_versionNumber: {
        projectId: project2.id,
        versionNumber: 1,
      },
    },
    update: {
      htmlSourceCode: SAMPLE_SIMULATION_3_TASKS_HTML,
      fileSizeBytes: scan2.fileSizeBytes,
      staticScanJson: JSON.stringify(scan2),
      status: "APPROVED",
      reviewedById: teacher.id,
      reviewedByName: teacher.fullName,
      reviewedAt: new Date(),
      teacherFeedback: "Mô phỏng 3 nhiệm vụ thuật toán rất trực quan, điều kiện hoàn thành rõ ràng.",
    },
    create: {
      projectId: project2.id,
      versionNumber: 1,
      changelog: "Phiên bản v1: 3 nhiệm vụ tìm kiếm và sắp xếp.",
      htmlSourceCode: SAMPLE_SIMULATION_3_TASKS_HTML,
      fileSizeBytes: scan2.fileSizeBytes,
      staticScanJson: JSON.stringify(scan2),
      status: "APPROVED",
      reviewedById: teacher.id,
      reviewedByName: teacher.fullName,
      reviewedAt: new Date(),
      teacherFeedback: "Mô phỏng 3 nhiệm vụ thuật toán rất trực quan, điều kiện hoàn thành rõ ràng.",
    },
  });

  // Create v2 as PENDING_REVIEW so teacher can review it while v1 remains the live approvedVersionId
  const v2Html = SAMPLE_SIMULATION_3_TASKS_HTML.replace(
    "Mô phỏng 3 nhiệm vụ thuật toán cốt lõi",
    "Mô phỏng 3 nhiệm vụ thuật toán cốt lõi (Bản cập nhật v2 đang chờ giáo viên duyệt)"
  );
  const scan2_v2 = analyzeStudentHtmlCode(v2Html);
  await prisma.projectVersion.upsert({
    where: {
      projectId_versionNumber: {
        projectId: project2.id,
        versionNumber: 2,
      },
    },
    update: {
      htmlSourceCode: v2Html,
      fileSizeBytes: scan2_v2.fileSizeBytes,
      staticScanJson: JSON.stringify(scan2_v2),
      status: "PENDING_REVIEW",
    },
    create: {
      projectId: project2.id,
      versionNumber: 2,
      changelog: "Phiên bản v2: Bổ sung chú thích bước chia đôi dãy nhị phân (đang chờ thầy duyệt).",
      htmlSourceCode: v2Html,
      fileSizeBytes: scan2_v2.fileSizeBytes,
      staticScanJson: JSON.stringify(scan2_v2),
      status: "PENDING_REVIEW",
    },
  });

  await prisma.project.update({
    where: { id: project2.id },
    data: { approvedVersionId: pv2_v1.id },
  });

  // 6. Seed Safe Comments & Moderation Log
  const existingComment = await prisma.comment.findFirst({
    where: { projectId: project1.id, isDemoData: true },
  });
  if (!existingComment) {
    await prisma.comment.create({
      data: {
        projectId: project1.id,
        authorId: student2.id,
        authorName: student2.fullName,
        authorRole: "STUDENT",
        content: "[DỮ LIỆU MẪU] Trò chơi rất dễ hiểu! Phần giải thích câu tìm kiếm nhị phân giúp mình nhớ ngay điều kiện dãy phải sắp xếp trước.",
        status: "VISIBLE",
        isDemoData: true,
      },
    });
  }

  const existingModLog = await prisma.moderationLog.findFirst({
    where: { targetId: project1.id },
  });
  if (!existingModLog) {
    await prisma.moderationLog.create({
      data: {
        moderatorId: teacher.id,
        moderatorName: teacher.fullName,
        moderatorRole: "TEACHER",
        targetType: "PROJECT",
        targetId: project1.id,
        action: "APPROVE",
        reason: "[DỮ LIỆU MẪU] Đã kiểm tra mã nguồn tĩnh và chơi thử đủ 10 câu hỏi trong Sandbox cô lập.",
        metadataJson: JSON.stringify({ isDemoData: true, approvedVersion: 1 }),
      },
    });
  }

  return {
    seeded: true,
    questionsCount: SAMPLE_TIN_HOC_QUESTIONS.length,
    assessmentsCount: 2,
    projectsCount: 2,
  };
}

export async function purgeTinHocDemoData(prisma: PrismaClient) {
  const demoProjects = await prisma.project.findMany({
    where: { isDemoData: true },
    select: { id: true },
  });
  const demoProjectIds = demoProjects.map((p) => p.id);

  if (demoProjectIds.length > 0) {
    await prisma.project.updateMany({
      where: { id: { in: demoProjectIds } },
      data: { approvedVersionId: null },
    });
  }

  const deletedComments = await prisma.comment.deleteMany({
    where: { OR: [{ isDemoData: true }, { projectId: { in: demoProjectIds } }] },
  });
  const deletedProjects = await prisma.project.deleteMany({
    where: { isDemoData: true },
  });
  const deletedAttempts = await prisma.attempt.deleteMany({
    where: { isDemoData: true },
  });
  const deletedAssessments = await prisma.assessment.deleteMany({
    where: { isDemoData: true },
  });
  const deletedQuestions = await prisma.question.deleteMany({
    where: { isDemoData: true },
  });

  return {
    purged: true,
    deletedQuestions: deletedQuestions.count,
    deletedAssessments: deletedAssessments.count,
    deletedAttempts: deletedAttempts.count,
    deletedProjects: deletedProjects.count,
    deletedComments: deletedComments.count,
  };
}
