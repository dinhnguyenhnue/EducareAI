/**
 * HTML Game Isolation, CSP Injection, Static Analysis & Sample Games
 * Strictly adheres to Section 6 & Section 8 of TIN HỌC SÁNG TẠO specification.
 */

export const MAX_HTML_GAME_SIZE_BYTES = 256 * 1024; // 256 KB limit for single-file HTML games

export interface StaticScanFinding {
  code: string;
  severity: "INFO" | "WARNING" | "HIGH";
  description: string;
}

export interface StaticScanResult {
  fileSizeBytes: number;
  isWithinSizeLimit: boolean;
  isSelfContainedHtml: boolean;
  findings: StaticScanFinding[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  disclaimer: string;
}

export const STRICT_GAME_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none';";

/**
 * Performs static analysis on student-submitted HTML source code.
 * Note: Static analysis is ONLY a preliminary check; actual isolation is enforced
 * by <iframe sandbox="allow-scripts"> (without allow-same-origin) + STRICT_GAME_CSP.
 */
export function analyzeStudentHtmlCode(html: string): StaticScanResult {
  const fileSizeBytes = Buffer.byteLength(html || "", "utf-8");
  const isWithinSizeLimit =
    fileSizeBytes > 0 && fileSizeBytes <= MAX_HTML_GAME_SIZE_BYTES;
  const findings: StaticScanFinding[] = [];

  if (!isWithinSizeLimit) {
    findings.push({
      code: "FILE_SIZE_EXCEEDED",
      severity: "HIGH",
      description: `Kích thước file (${fileSizeBytes} bytes) vượt quá giới hạn cho phép (${MAX_HTML_GAME_SIZE_BYTES} bytes).`,
    });
  }

  const patterns: Array<{
    regex: RegExp;
    code: string;
    severity: "INFO" | "WARNING" | "HIGH";
    description: string;
  }> = [
    {
      regex: /<script[^>]+src\s*=\s*["']https?:/i,
      code: "EXTERNAL_SCRIPT_TAG",
      severity: "HIGH",
      description:
        "Phát hiện thẻ <script src='http...'> tải thư viện ngoài. Sẽ bị chặn bởi CSP connect-src/script-src 'none'.",
    },
    {
      regex: /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/i,
      code: "NETWORK_API_CALL",
      severity: "HIGH",
      description:
        "Phát hiện lệnh gọi mạng (fetch / XMLHttpRequest / WebSocket). Sẽ bị chặn bởi CSP connect-src 'none'.",
    },
    {
      regex: /\b(document\.cookie|localStorage|sessionStorage|indexedDB)\b/i,
      code: "STORAGE_OR_COOKIE_ACCESS",
      severity: "WARNING",
      description:
        "Phát hiện truy cập cookie/localStorage. Sẽ bị chặn bởi iframe sandbox opaque origin (không có allow-same-origin).",
    },
    {
      regex: /\b(window\.top|top\.location|parent\.document|window\.opener)\b/i,
      code: "PARENT_OR_TOP_NAVIGATION",
      severity: "HIGH",
      description:
        "Phát hiện truy cập cửa sổ cha (window.top / parent.document). Sẽ bị chặn bởi iframe sandbox.",
    },
    {
      regex: /\b(eval|new\s+Function)\s*\(/i,
      code: "DYNAMIC_CODE_EVAL",
      severity: "HIGH",
      description:
        "Phát hiện sử dụng eval() hoặc new Function(). Bị chặn theo chính sách CSP không có 'unsafe-eval'.",
    },
    {
      regex: /\bwindow\.open\s*\(/i,
      code: "POPUP_WINDOW_OPEN",
      severity: "WARNING",
      description:
        "Phát hiện lệnh mở cửa sổ popup (window.open). Sẽ bị chặn vì không cấp quyền allow-popups.",
    },
  ];

  for (const p of patterns) {
    if (p.regex.test(html)) {
      findings.push({
        code: p.code,
        severity: p.severity,
        description: p.description,
      });
    }
  }

  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasWarn = findings.some((f) => f.severity === "WARNING");

  return {
    fileSizeBytes,
    isWithinSizeLimit,
    isSelfContainedHtml: /<html|<!doctype|<body|<script/i.test(html),
    findings,
    riskLevel: hasHigh ? "HIGH" : hasWarn ? "MEDIUM" : "LOW",
    disclaimer:
      "Quét tĩnh chỉ là một bước kiểm tra sơ bộ, không được coi là bảo đảm mã an toàn tuyệt đối. Hệ thống thực thi cách ly bắt buộc bằng iframe sandbox='allow-scripts' (opaque origin) và CSP chặn mạng/điều hướng.",
  };
}

/**
 * Wraps student HTML with a strict Content-Security-Policy meta tag and a runtime
 * security harness so it runs purely self-contained inside <iframe sandbox="allow-scripts">.
 */
export function wrapHtmlWithStrictCsp(rawHtml: string): string {
  const cspMetaTag = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${STRICT_GAME_CSP}">`;

  if (/<head[^>]*>/i.test(rawHtml)) {
    return rawHtml.replace(/<head([^>]*)>/i, `<head$1>${cspMetaTag}`);
  }

  return `<!DOCTYPE html><html lang="vi"><head>${cspMetaTag}</head><body>${rawHtml}</body></html>`;
}

/**
 * Sample Game 1: Trò chơi dạng câu hỏi 10 câu (QUIZ_10)
 * Phản hồi đúng/sai ngay lập tức và giải thích chi tiết từng câu theo SGK Tin học 7.
 */
export const SAMPLE_QUIZ_10_GAME_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Điệp Viên An Toàn Số - Tin học 7 (10 Câu hỏi)</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 16px; background: #F6F7F8; color: #202428; }
    .card { max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E1E5E8; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .badge { display: inline-block; background: #E7F2F1; color: #197C78; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
    h1 { font-size: 18px; margin: 10px 0 6px; color: #202428; }
    .progress { font-size: 12px; color: #68717A; margin-bottom: 14px; display: flex; justify-content: space-between; }
    .q-box { font-size: 15px; font-weight: 700; margin-bottom: 14px; line-height: 1.5; }
    .options { display: flex; flex-direction: column; gap: 8px; }
    .opt-btn { text-align: left; padding: 11px 14px; border-radius: 8px; border: 1px solid #E1E5E8; background: #F6F7F8; cursor: pointer; font-size: 13px; color: #202428; transition: background 0.15s; }
    .opt-btn:hover:not(:disabled) { background: #E7F2F1; border-color: #197C78; }
    .opt-btn.correct { background: #E6F4EA; border-color: #1E8E3E; color: #137333; font-weight: 700; }
    .opt-btn.wrong { background: #FCE8E6; border-color: #D93025; color: #C5221F; }
    .explain { margin-top: 14px; padding: 12px; border-radius: 8px; background: #E7F2F1; border-left: 4px solid #197C78; font-size: 13px; line-height: 1.5; display: none; }
    .footer { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
    .next-btn { background: #197C78; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: none; }
    .disclaimer { font-size: 11px; color: #68717A; margin-top: 12px; border-top: 1px solid #E1E5E8; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">TRÒ CHƠI 10 CÂU HỎI • TIN HỌC 7 (CHỦ ĐỀ A & C)</span>
    <h1>Điệp Viên An Toàn Số & Thiết Bị Máy Tính</h1>
    <div class="progress">
      <span id="stepText">Câu 1 / 10</span>
      <span id="scoreText">Điểm tự luyện: 0 / 10 (Chưa xác minh)</span>
    </div>
    <div id="quizArea">
      <div class="q-box" id="qText"></div>
      <div class="options" id="optList"></div>
      <div class="explain" id="explainBox"></div>
      <div class="footer">
        <span id="statusHint" style="font-size:12px;color:#68717A;">Chọn 1 đáp án để kiểm tra và xem giải thích.</span>
        <button class="next-btn" id="nextBtn" onclick="nextQuestion()">Câu tiếp theo →</button>
      </div>
    </div>
    <div class="disclaimer">
      Lưu ý: Điểm trong trò chơi chỉ phục vụ tự luyện tập, không dùng làm điểm kiểm tra chính thức.
    </div>
  </div>
  <script>
    const QUESTIONS = [
      { q: "1. Thiết bị nào sau đây đóng vai trò vừa là thiết bị vào vừa là thiết bị ra của máy tính?", opts: ["A. Bàn phím cơ", "B. Màn hình cảm ứng", "C. Chuột quang", "D. Máy in laser"], ans: 1, exp: "Màn hình cảm ứng vừa hiển thị hình ảnh (thiết bị ra) vừa nhận thao tác chạm của người dùng (thiết bị vào) — SGK Tin học 7 Bài 1." },
      { q: "2. Phần mềm nào sau đây là phần mềm hệ thống (System Software)?", opts: ["A. Microsoft Word", "B. Google Chrome", "C. Hệ điều hành Windows / Linux", "D. Phần mềm đồ họa Canva"], ans: 2, exp: "Hệ điều hành quản lý phần cứng và cung cấp môi trường cho các phần mềm ứng dụng chạy — SGK Tin học 7 Bài 2." },
      { q: "3. Thao tác nào giúp bảo vệ dữ liệu cá nhân an toàn nhất khi dùng máy tính ở phòng thực hành?", opts: ["A. Lưu mật khẩu vào trình duyệt công cộng", "B. Đăng xuất tài khoản ngay sau khi kết thúc giờ học", "C. Chia sẻ mật khẩu cho bạn cùng bàn", "D. Tắt màn hình mà không đăng xuất"], ans: 1, exp: "Luôn đăng xuất tài khoản trên thiết bị dùng chung để tránh người khác truy cập trái phép." },
      { q: "4. Đuôi mở rộng (extension) nào thường là tệp chương trình thực thi có nguy cơ chứa mã độc nếu tải từ nguồn lạ?", opts: ["A. .txt", "B. .jpg", "C. .exe", "D. .mp3"], ans: 2, exp: "Tệp .exe là tệp thực thi chương trình; không nên mở tệp .exe không rõ nguồn gốc — SGK Tin học 7 Bài 3." },
      { q: "5. Mật khẩu nào sau đây được đánh giá là mạnh nhất?", opts: ["A. 12345678", "B. nguyenvana", "C. Unigo@Tin7#2026", "D. password123"], ans: 2, exp: "Mật khẩu mạnh gồm ít nhất 8 ký tự, kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt." },
      { q: "6. Khi nhận được tin nhắn trúng thưởng yêu cầu cung cấp mã OTP ngân hàng hoặc mật khẩu, em nên làm gì?", opts: ["A. Gửi mã OTP ngay để nhận quà", "B. Tuyệt đối không cung cấp và báo cho bố mẹ/thầy cô", "C. Chuyển tiếp tin nhắn cho 10 người bạn", "D. Bấm vào đường link lạ để điền thông tin"], ans: 1, exp: "Đây là dấu hiệu lừa đảo trực tuyến (Phishing). Tuyệt đối không chia sẻ mã OTP hoặc mật khẩu." },
      { q: "7. Trong phần mềm bảng tính điện tử, địa chỉ ô tính được viết theo thứ tự nào?", opts: ["A. Tên hàng trước, tên cột sau (VD: 5B)", "B. Tên cột trước, tên hàng sau (VD: B5)", "C. Chỉ cần viết số thứ tự", "D. Tên trang tính trước"], ans: 1, exp: "Địa chỉ ô tính gồm tên cột (chữ cái) ghép với tên hàng (chữ số), ví dụ B5 — SGK Tin học 7 Chủ đề E." },
      { q: "8. Hàm nào trong bảng tính dùng để tính trung bình cộng của một vùng dữ liệu số?", opts: ["A. =SUM()", "B. =MAX()", "C. =AVERAGE()", "D. =COUNT()"], ans: 2, exp: "Hàm AVERAGE dùng để tính giá trị trung bình cộng của các số trong vùng chọn." },
      { q: "9. Biểu đồ hình tròn (Pie Chart) phù hợp nhất cho mục đích nào sau đây?", opts: ["A. Thể hiện tỉ lệ phần trăm của từng thành phần trong tổng thể", "B. Theo dõi sự thay đổi nhiệt độ qua 30 ngày", "C. So sánh chiều cao của 50 học sinh", "D. Tính tổng điểm kiểm tra"], ans: 0, exp: "Biểu đồ hình tròn thích hợp nhất để biểu diễn cơ cấu tỉ lệ phần trăm của các phần trong một tổng thể 100%." },
      { q: "10. Khi đăng sản phẩm học tập lên mạng, hành vi nào thể hiện văn hóa ứng xử số văn minh?", opts: ["A. Sao chép nguyên văn bài người khác không ghi nguồn", "B. Ghi rõ nguồn tài liệu tham khảo và tôn trọng bản quyền", "C. Bình luận chê bai thiếu xây dựng", "D. Đăng thông tin cá nhân của bạn học khi chưa xin phép"], ans: 1, exp: "Tôn trọng bản quyền, trích dẫn nguồn trung thực và bảo vệ quyền riêng tư là nguyên tắc cốt lõi của công dân số." }
    ];
    let idx = 0;
    let score = 0;
    function render() {
      const item = QUESTIONS[idx];
      document.getElementById("stepText").textContent = "Câu " + (idx + 1) + " / " + QUESTIONS.length;
      document.getElementById("scoreText").textContent = "Điểm tự luyện: " + score + " / " + QUESTIONS.length + " (Chưa xác minh)";
      document.getElementById("qText").textContent = item.q;
      const optList = document.getElementById("optList");
      optList.innerHTML = "";
      document.getElementById("explainBox").style.display = "none";
      document.getElementById("nextBtn").style.display = "none";
      item.opts.forEach((optText, oIdx) => {
        const btn = document.createElement("button");
        btn.className = "opt-btn";
        btn.textContent = optText;
        btn.onclick = () => selectAnswer(oIdx, btn);
        optList.appendChild(btn);
      });
    }
    function selectAnswer(chosen, btnEl) {
      const item = QUESTIONS[idx];
      const allBtns = document.querySelectorAll(".opt-btn");
      allBtns.forEach((b, i) => {
        b.disabled = true;
        if (i === item.ans) b.classList.add("correct");
      });
      if (chosen === item.ans) {
        score++;
      } else {
        btnEl.classList.add("wrong");
      }
      document.getElementById("scoreText").textContent = "Điểm tự luyện: " + score + " / " + QUESTIONS.length + " (Chưa xác minh)";
      const expBox = document.getElementById("explainBox");
      expBox.innerHTML = "<strong>Giải thích kiến thức:</strong> " + item.exp;
      expBox.style.display = "block";
      const nextBtn = document.getElementById("nextBtn");
      nextBtn.textContent = idx < QUESTIONS.length - 1 ? "Câu tiếp theo →" : "Xem tổng kết";
      nextBtn.style.display = "inline-block";
    }
    function nextQuestion() {
      if (idx < QUESTIONS.length - 1) {
        idx++;
        render();
      } else {
        document.getElementById("quizArea").innerHTML =
          "<div class='q-box'>Hoàn thành 10/10 câu hỏi tự luyện!</div>" +
          "<p style='font-size:14px;'>Kết quả tự luyện của em: <strong>" + score + " / 10 câu đúng</strong>.</p>" +
          "<button class='next-btn' style='display:inline-block' onclick='location.reload()'>Chơi lại từ đầu</button>";
        try {
          window.parent.postMessage({ type: "TINHOC_GAME_PRACTICE_RESULT", score: score, maxScore: 10 }, "*");
        } catch (e) {}
      }
    }
    render();
  </script>
</body>
</html>`;

/**
 * Sample Game 2: Trò chơi mô phỏng thuật toán với 3 nhiệm vụ tăng dần (SIMULATION_3_TASKS)
 */
export const SAMPLE_SIMULATION_3_TASKS_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Xưởng Thuật Toán Tìm Kiếm & Sắp Xếp (3 Nhiệm vụ tăng dần)</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 16px; background: #F6F7F8; color: #202428; }
    .panel { max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #E1E5E8; border-radius: 12px; padding: 20px; }
    .badge { background: #E7F2F1; color: #197C78; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    h1 { font-size: 18px; margin: 10px 0 6px; }
    .task-tabs { display: flex; gap: 8px; margin: 12px 0; }
    .tab { padding: 8px 12px; border-radius: 8px; border: 1px solid #E1E5E8; font-size: 12px; font-weight: 600; background: #F6F7F8; }
    .tab.active { background: #197C78; color: #fff; border-color: #197C78; }
    .tab.done { border-color: #1E8E3E; color: #137333; background: #E6F4EA; }
    .array-row { display: flex; gap: 10px; margin: 18px 0; flex-wrap: wrap; }
    .cell { width: 58px; height: 58px; border-radius: 10px; border: 2px solid #197C78; background: #E7F2F1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; cursor: pointer; }
    .cell small { font-size: 10px; color: #68717A; font-weight: 400; }
    .msg { padding: 12px; border-radius: 8px; background: #F0F2F4; font-size: 13px; line-height: 1.5; }
    .btn { background: #197C78; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="panel">
    <span class="badge">MÔ PHỎNG THUẬT TOÁN • 3 NHIỆM VỤ TĂNG DẦN (TIN HỌC 7)</span>
    <h1>Thực Hành Thuật Toán Tìm Kiếm & Sắp Xếp</h1>
    <div class="task-tabs">
      <div id="t1" class="tab active">Nhiệm vụ 1: Tìm kiếm tuần tự</div>
      <div id="t2" class="tab">Nhiệm vụ 2: Tìm kiếm nhị phân</div>
      <div id="t3" class="tab">Nhiệm vụ 3: Đổi chỗ sắp xếp</div>
    </div>
    <p id="taskGoal" style="font-size:13px;font-weight:600;color:#197C78;"></p>
    <div id="board" class="array-row"></div>
    <div id="feedback" class="msg">Hãy thực hiện thao tác trên các ô dữ liệu theo đúng thứ tự thuật toán.</div>
    <button id="nextTaskBtn" class="btn" style="display:none;" onclick="advanceTask()">Chuyển sang nhiệm vụ tiếp theo →</button>
  </div>
  <script>
    let currentTask = 1;
    let seqStep = 0;
    const seqArr = [14, 28, 35, 42, 59];

    function initTask() {
      const board = document.getElementById("board");
      const nextBtn = document.getElementById("nextTaskBtn");
      nextBtn.style.display = "none";
      board.innerHTML = "";

      if (currentTask === 1) {
        seqStep = 0;
        document.getElementById("taskGoal").textContent = "Tiêu chí hoàn thành NV1: Nhấp kiểm tra lần lượt từ trái sang phải (vị trí 0 → 1 → 2) để tìm số 35 bằng Tìm kiếm tuần tự.";
        seqArr.forEach((val, idx) => {
          const el = document.createElement("div");
          el.className = "cell";
          el.innerHTML = "<span>?</span><small>Ô " + idx + "</small>";
          el.onclick = () => {
            if (idx !== seqStep) {
              document.getElementById("feedback").textContent = "Thuật toán tìm kiếm tuần tự phải xét lần lượt từ đầu danh sách! Hãy nhấp vào Ô " + seqStep + " trước.";
              return;
            }
            el.innerHTML = "<span>" + val + "</span><small>Ô " + idx + "</small>";
            seqStep++;
            if (val === 35) {
              document.getElementById("feedback").textContent = "Chính xác! Sau 3 bước so sánh tuần tự (14, 28, 35), em đã tìm thấy số 35 tại Ô 2.";
              document.getElementById("t1").className = "tab done";
              nextBtn.style.display = "inline-block";
            } else {
              document.getElementById("feedback").textContent = "Ô " + idx + " có giá trị " + val + " (chưa phải 35). Hãy xét tiếp ô kế tiếp!";
            }
          };
          board.appendChild(el);
        });
      } else if (currentTask === 2) {
        document.getElementById("t2").className = "tab active";
        document.getElementById("taskGoal").textContent = "Tiêu chí hoàn thành NV2: Dãy đã sắp xếp [10, 20, 30, 40, 50, 60, 70]. Hãy nhấp đúng phần tử Ở GIỮA (vị trí 3) để thực hiện bước chia đôi đầu tiên tìm số 60.";
        const binArr = [10, 20, 30, 40, 50, 60, 70];
        binArr.forEach((val, idx) => {
          const el = document.createElement("div");
          el.className = "cell";
          el.innerHTML = "<span>" + val + "</span><small>Vị trí " + idx + "</small>";
          el.onclick = () => {
            if (idx === 3) {
              document.getElementById("feedback").textContent = "Tuyệt vời! Phần tử giữa là 40 < 60, nhờ đó thuật toán Tìm kiếm nhị phân loại bỏ ngay nửa bên trái chỉ sau 1 phép so sánh!";
              document.getElementById("t2").className = "tab done";
              nextBtn.style.display = "inline-block";
            } else {
              document.getElementById("feedback").textContent = "Chưa đúng vị trí giữa! Từ vị trí 0 đến 6, phần tử chính giữa là vị trí (0 + 6) / 2 = 3.";
            }
          };
          board.appendChild(el);
        });
      } else {
        document.getElementById("t3").className = "tab active";
        document.getElementById("taskGoal").textContent = "Tiêu chí hoàn thành NV3: Dãy [25, 12, 40] đang ngược thứ tự ở 2 ô đầu. Nhấp vào nút 'Hoán đổi 25 và 12' để hoàn tất bước sắp xếp tăng dần.";
        const sortArr = [25, 12, 40];
        sortArr.forEach((val, idx) => {
          const el = document.createElement("div");
          el.className = "cell";
          el.innerHTML = "<span>" + val + "</span><small>Ô " + idx + "</small>";
          board.appendChild(el);
        });
        const swapBtn = document.createElement("button");
        swapBtn.className = "btn";
        swapBtn.textContent = "Hoán đổi Ô 0 (25) và Ô 1 (12)";
        swapBtn.onclick = () => {
          board.innerHTML = "<div class='cell'><span>12</span><small>Ô 0</small></div><div class='cell'><span>25</span><small>Ô 1</small></div><div class='cell'><span>40</span><small>Ô 2</small></div>";
          document.getElementById("feedback").textContent = "Chúc mừng! Em đã hoàn thành cả 3 nhiệm vụ mô phỏng thuật toán Tìm kiếm và Sắp xếp!";
          document.getElementById("t3").className = "tab done";
          try {
            window.parent.postMessage({ type: "TINHOC_GAME_PRACTICE_RESULT", score: 3, maxScore: 3 }, "*");
          } catch (e) {}
        };
        board.appendChild(swapBtn);
      }
    }

    function advanceTask() {
      currentTask++;
      initTask();
    }
    initTask();
  </script>
</body>
</html>`;

