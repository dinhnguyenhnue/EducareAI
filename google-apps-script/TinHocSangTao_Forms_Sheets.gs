
/**
 * ============================================================================
 * CỔNG HỌC TẬP TIN HỌC – XƯỞNG SÁNG TẠO TRÒ CHƠI (TIN HỌC SÁNG TẠO)
 * Tệp Google Apps Script đính kèm Google Sheets Ngân hàng câu hỏi
 * ============================================================================
 * Nguyên tắc kỹ thuật bắt buộc (Mục 5 & Mục 11):
 * 1. KHÔNG dùng số thứ tự dòng (row index) làm khóa định danh (ID) cho câu hỏi/bài nộp.
 * 2. Luôn đọc/ghi theo lô (Batch getValues / setValues), tuyệt đối không gọi
 *    getValue/setValue lặp từng ô trong vòng lặp để tránh vượt hạn mức 6 phút của Apps Script.
 * 3. Dùng LockService.getScriptLock() cho mọi thao tác ghi/đồng bộ bảng tính để chống
 *    ghi đè khi có nhiều người dùng thao tác đồng thời.
 * 4. Chỉ đưa các câu hỏi có cột Status === "APPROVED" (Giáo viên đã duyệt) vào Google Forms.
 *    Câu hỏi do AI sinh (Status === "PENDING_REVIEW") không được tự động phát hành.
 */

const SHEET_QUESTIONS = "QuestionBank";
const SHEET_ASSESSMENTS = "GeneratedForms";

/**
 * Tạo menu tác vụ trực tiếp trên Google Sheets khi mở tệp
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Cổng Tin Học Sáng Tạo")
    .addItem("1. Khởi tạo cấu trúc Sheet & 10 câu hỏi mẫu (Lớp 7A1)", "initPilotQuestionBankSheet")
    .addItem("2. Tạo Google Form Kiểm tra từ các câu ĐÃ DUYỆT", "createGoogleFormFromApprovedQuestions")
    .addItem("3. Đồng bộ Ngân hàng câu hỏi về EDUCARE AI (Webhook)", "syncApprovedQuestionsToWebApp")
    .addSeparator()
    .addItem("4. Xóa riêng dữ liệu mẫu thử nghiệm (isDemoData = TRUE)", "purgeDemoDataRows")
    .addToUi();
}

/**
 * 1. Khởi tạo bảng QuestionBank với khóa ổn định (Code) và gắn nhãn isDemoData rõ ràng
 */
function initPilotQuestionBankSheet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_QUESTIONS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_QUESTIONS);
    }

    var headers = [[
      "Code",              // Col 0: Khóa ổn định (VD: TH7-CD1-B1-Q01) - KHÔNG dùng số dòng làm ID
      "GradeLevel",        // Col 1: Khối lớp
      "TopicName",         // Col 2: Chủ đề
      "LessonTitle",       // Col 3: Bài học
      "CognitiveLevel",    // Col 4: REMEMBER | UNDERSTAND | APPLY | HIGH_APPLY
      "QuestionText",      // Col 5: Nội dung câu hỏi
      "OptionA",           // Col 6
      "OptionB",           // Col 7
      "OptionC",           // Col 8
      "OptionD",           // Col 9
      "CorrectAnswer",     // Col 10: A | B | C | D
      "Explanation",       // Col 11: Giải thích đúng/sai
      "SourceReference",   // Col 12: Nguồn SGK & trang
      "Status",            // Col 13: APPROVED | PENDING_REVIEW
      "IsAiDraft",         // Col 14: TRUE | FALSE
      "IsDemoData"         // Col 15: TRUE | FALSE (Cho phép xóa riêng dữ liệu mẫu)
    ]];

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setFontWeight("bold");
    }

    var demoRows = [
      [
        "TH7-CD1-B1-Q01", 7, "Chủ đề A: Máy tính và cộng đồng", "Bài 1: Thiết bị vào và thiết bị ra",
        "REMEMBER", "[DỮ LIỆU MẪU] Thiết bị nào sau đây chỉ đóng vai trò là thiết bị vào (Input Device)?",
        "Bàn phím và chuột máy tính", "Màn hình tinh thể lỏng (LCD)", "Máy in laser", "Loa máy tính",
        "A", "Bàn phím và chuột dùng để nhập dữ liệu vào máy tính.", "SGK Tin học 7 - Trang 6-8",
        "APPROVED", false, true
      ],
      [
        "TH7-CDF-B15-Q09", 7, "Chủ đề F: Giải quyết vấn đề với máy tính", "Bài 15: Thuật toán tìm kiếm nhị phân",
        "UNDERSTAND", "[DỮ LIỆU MẪU] Điều kiện bắt buộc để áp dụng thuật toán tìm kiếm nhị phân là gì?",
        "Danh sách phải được sắp xếp theo thứ tự", "Danh sách có số phần tử chẵn", "Các số nhỏ hơn 100", "Lưu trong tệp .txt",
        "A", "Tìm kiếm nhị phân chia đôi phạm vi tìm kiếm nên danh sách bắt buộc phải được sắp xếp trước.", "SGK Tin học 7 - Trang 75-79",
        "APPROVED", false, true
      ],
      [
        "TH7-AI-DRAFT-Q11", 7, "Chủ đề F: Giải quyết vấn đề với máy tính", "Bài 15: Thuật toán tìm kiếm nhị phân",
        "HIGH_APPLY", "[DỮ LIỆU MẪU - BẢN NHÁP AI] Với 15 từ đã sắp xếp, tìm kiếm nhị phân cần tối đa mấy lần so sánh?",
        "Tối đa 4 lần so sánh", "Tối đa 15 lần so sánh", "Tối đa 2 lần so sánh", "Tối đa 8 lần so sánh",
        "A", "15 -> 7 -> 3 -> 1, tối đa 4 lần so sánh.", "SGK Tin học 7 - Trang 77 (AI gợi ý)",
        "PENDING_REVIEW", true, true
      ]
    ];

    // Ghi theo lô (Batch setValues)
    sheet.getRange(sheet.getLastRow() + 1, 1, demoRows.length, demoRows[0].length).setValues(demoRows);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 2. Tự động tạo Google Form chấm điểm từ các câu hỏi có Status === "APPROVED"
 */
function createGoogleFormFromApprovedQuestions() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_QUESTIONS);
    if (!sheet || sheet.getLastRow() < 2) {
      throw new Error("Chưa có dữ liệu trong trang tính QuestionBank.");
    }

    // Đọc toàn bộ dữ liệu trong 1 lệnh Batch duy nhất
    var allValues = sheet.getDataRange().getValues();
    var approvedRows = [];
    for (var i = 1; i < allValues.length; i++) {
      var row = allValues[i];
      var status = String(row[13] || "").trim().toUpperCase();
      if (status === "APPROVED") {
        approvedRows.push(row);
      }
    }

    if (approvedRows.length === 0) {
      throw new Error("Không có câu hỏi nào ở trạng thái APPROVED. Vui lòng duyệt câu hỏi trước khi tạo Form.");
    }

    var formTitle = "Đề Kiểm Tra Tin Học (Tạo tự động ngày " + Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm") + ")";
    var form = FormApp.create(formTitle);
    form.setIsQuiz(true);
    form.setCollectEmail(true);
    form.setLimitOneResponsePerUser(true);
    form.setDescription("Đề kiểm tra được sinh tự động từ Ngân hàng câu hỏi đã duyệt của Cổng Học Tập Tin Học.");

    for (var j = 0; j < approvedRows.length; j++) {
      var q = approvedRows[j];
      var code = String(q[0]);
      var stem = "[" + code + "] " + String(q[5]);
      var optA = String(q[6]);
      var optB = String(q[7]);
      var optC = String(q[8]);
      var optD = String(q[9]);
      var correctLetter = String(q[10]).trim().toUpperCase();
      var explanationText = String(q[11] || "");

      var item = form.addMultipleChoiceItem();
      item.setTitle(stem)
        .setPoints(1)
        .setRequired(true)
        .setChoices([
          item.createChoice("A. " + optA, correctLetter === "A"),
          item.createChoice("B. " + optB, correctLetter === "B"),
          item.createChoice("C. " + optC, correctLetter === "C"),
          item.createChoice("D. " + optD, correctLetter === "D")
        ]);

      if (explanationText) {
        var feedback = FormApp.createFeedback().setText(explanationText).build();
        item.setFeedbackForCorrect(feedback);
        item.setFeedbackForIncorrect(feedback);
      }
    }

    // Ghi log đường dẫn Google Form vào trang GeneratedForms
    var logSheet = ss.getSheetByName(SHEET_ASSESSMENTS);
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_ASSESSMENTS);
      logSheet.getRange(1, 1, 1, 5).setValues([["FormCode", "Title", "PublishedUrl", "EditUrl", "CreatedAt"]]).setFontWeight("bold");
    }

    var formCode = "FORM-" + Utilities.getUuid().slice(0, 8).toUpperCase();
    logSheet.appendRow([
      formCode,
      formTitle,
      form.getPublishedUrl(),
      form.getEditUrl(),
      new Date().toISOString()
    ]);

    return {
      formCode: formCode,
      publishedUrl: form.getPublishedUrl(),
      editUrl: form.getEditUrl(),
      questionCount: approvedRows.length
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. Xóa riêng các dòng dữ liệu mẫu thử nghiệm (IsDemoData === TRUE) mà không ảnh hưởng dữ liệu thật
 */
function purgeDemoDataRows() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_QUESTIONS);
    if (!sheet || sheet.getLastRow() < 2) return;

    var allValues = sheet.getDataRange().getValues();
    var header = allValues[0];
    var realRows = [header];

    for (var i = 1; i < allValues.length; i++) {
      var isDemo = allValues[i][15] === true || String(allValues[i][15]).toUpperCase() === "TRUE";
      if (!isDemo) {
        realRows.push(allValues[i]);
      }
    }

    sheet.clearContents();
    sheet.getRange(1, 1, realRows.length, header.length).setValues(realRows);
  } finally {
    lock.releaseLock();
  }
}

