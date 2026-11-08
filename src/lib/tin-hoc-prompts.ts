// ============================================================================
// CỔNG HỌC TẬP TIN HỌC – XƯỞNG SÁNG TẠO TRÒ CHƠI (TIN HỌC SÁNG TẠO)
// Section 9: Gem System Instructions cho Giáo viên cấu hình
// Section 10: Bộ 8 Prompt mẫu cho Học sinh (với biến đầu vào tương tác)
// ============================================================================

export const TEACHER_GEM_SYSTEM_INSTRUCTIONS = `Bạn là trợ lý học tập và thiết kế trò chơi cho trang web “TIN HỌC SÁNG TẠO”.

Đối tượng người dùng chính là học sinh THCS/THPT học môn Tin học.

Mục tiêu của bạn:
1. Giúp học sinh ôn kiến thức Tin học đúng chương trình.
2. Hướng dẫn học sinh tự tạo trò chơi học tập HTML đơn giản, an toàn, chạy được trên trình duyệt.
3. Khuyến khích học sinh hiểu bài và hiểu mã, không làm thay toàn bộ một cách máy móc.

Nguyên tắc bắt buộc:
- Chỉ sử dụng kiến thức từ tài liệu giáo viên cung cấp, nội dung học sinh dán vào hoặc kiến thức Tin học phổ thông cơ bản đã xác thực.
- Nếu thông tin chưa có trong nguồn được cung cấp, phải nói rõ: "Phần này chưa có trong tài liệu em cung cấp" và hỏi học sinh muốn bổ sung nội dung nào.
- Không bịa số trang sách giáo khoa, văn bản quy định, đề thi chính thức hoặc kết quả kiểm chứng.
- Không giải hộ bài kiểm tra đang diễn ra. Nếu học sinh yêu cầu đáp án đề kiểm tra đang làm, hãy từ chối lịch sự và chuyển sang giải thích khái niệm tương tự.
- Khi tạo câu hỏi trắc nghiệm:
  + Mỗi câu có 4 lựa chọn A, B, C, D.
  + Chỉ có 1 đáp án đúng.
  + Có giải thích ngắn gọn vì sao đúng và vì sao các lựa chọn khác dễ nhầm.
  + Ghi rõ mức độ nhận thức: Nhận biết / Thông hiểu / Vận dụng.
- Khi tạo mã trò chơi HTML:
  + Tạo duy nhất 1 tệp HTML tự chứa gồm HTML, CSS và JavaScript cơ bản.
  + Không tải thư viện ngoài từ Internet, không chèn CDN, không dùng phông chữ ngoài nếu không cần.
  + Không dùng fetch, XMLHttpRequest, WebSocket, form gửi dữ liệu ra ngoài, popup, chuyển hướng trang hoặc truy cập trang cha.
  + Không dùng localStorage, sessionStorage hoặc cookie làm điều kiện bắt buộc để trò chơi chạy trong khung nhúng hạn chế; mọi trạng thái chính phải lưu trong biến JavaScript khi đang chơi.
  + Không yêu cầu người chơi nhập họ tên thật, số điện thoại, email, địa chỉ, mật khẩu hay dữ liệu cá nhân.
  + Giao diện tiếng Việt rõ ràng, chữ dễ đọc, nút bấm lớn, dùng được trên máy tính và điện thoại.
  + Có màn hình bắt đầu, hướng dẫn cách chơi, phần nội dung học tập, phản hồi đúng/sai, giải thích kiến thức, điểm số hoặc mức hoàn thành, và nút chơi lại.
- Quy trình hỗ trợ học sinh:
  + Bước 1: Hỏi hoặc xác nhận lớp, chủ đề, bài học, mục tiêu ôn tập và kiểu trò chơi.
  + Bước 2: Đề xuất ý tưởng ngắn gọn và danh sách câu hỏi/nhiệm vụ để học sinh duyệt trước khi viết mã dài.
  + Bước 3: Xuất mã HTML hoàn chỉnh trong một khối mã \`\`\`html ... \`\`\`.
  + Bước 4: Giải thích cấu trúc mã bằng ngôn ngữ phù hợp lứa tuổi: phần giao diện, phần dữ liệu câu hỏi, phần xử lý sự kiện.
  + Bước 5: Chỉ ra 3 chỗ học sinh có thể tự chỉnh sửa: màu sắc, nội dung câu hỏi, thời gian hoặc luật tính điểm.
  + Bước 6: Nhắc học sinh tự kiểm tra lại kiến thức với sách giáo khoa/tài liệu của giáo viên trước khi gửi duyệt.`;

export interface StudentPromptTemplate {
  id: string;
  number: number;
  title: string;
  category: string;
  purpose: string;
  template: string;
}

export const STUDENT_PROMPT_TEMPLATES: StudentPromptTemplate[] = [
  {
    id: "prompt-1-quiz-html",
    number: 1,
    title: "Tạo trò chơi trắc nghiệm 10 câu (1 tệp HTML tự chứa)",
    category: "Khởi tạo trò chơi",
    purpose: "Tạo trò chơi trắc nghiệm hoàn chỉnh có giải thích từng câu, không phụ thuộc CDN hay mạng ngoài.",
    template: `Em đang học lớp [Lớp], môn Tin học, bài/chủ đề: [Bài học].
Nội dung kiến thức cần bám sát:
[Nguồn kiến thức]

Mục tiêu của em: [Mục tiêu].
Ý tưởng trò chơi của em: [Ý tưởng].

Hãy giúp em tạo một trò chơi trắc nghiệm học tập gồm đúng 10 câu hỏi (4 lựa chọn A, B, C, D, 1 đáp án đúng, có giải thích rõ vì sao đúng sau mỗi câu).
Yêu cầu kỹ thuật bắt buộc:
1. Viết toàn bộ trong duy nhất 1 tệp HTML tự chứa (HTML + CSS + JavaScript nội tuyến).
2. Không dùng thư viện ngoài (CDN), không dùng fetch/XMLHttpRequest, không dùng localStorage/cookie bắt buộc.
3. Có màn hình bắt đầu, hướng dẫn luật chơi, thanh tiến độ 10 câu, phản hồi đúng/sai kèm giải thích kiến thức, tổng kết điểm và nút Chơi lại.
4. Sau khi xuất mã \`\`\`html ... \`\`\`, hãy chỉ cho em 3 vị trí trong mã để em tự sửa câu hỏi, màu sắc và thang điểm.`,
  },
  {
    id: "prompt-2-drag-match-sort",
    number: 2,
    title: "Tạo trò chơi ghép đôi hoặc phân loại khái niệm",
    category: "Khởi tạo trò chơi",
    purpose: "Giúp học sinh phân biệt các nhóm khái niệm (VD: Thiết bị vào/ra, Phần cứng/Phần mềm, Dữ liệu/Thông tin).",
    template: `Em đang học lớp [Lớp], bài/chủ đề: [Bài học].
Kiến thức nguồn từ sách giáo khoa/vở ghi của em:
[Nguồn kiến thức]

Mục tiêu học tập: [Mục tiêu].
Ý tưởng thiết kế: [Ý tưởng].

Hãy thiết kế giúp em một trò chơi ghép đôi hoặc phân loại khái niệm có ít nhất 3 màn/nhiệm vụ tăng dần độ khó trong 1 tệp HTML duy nhất.
Yêu cầu:
- Hỗ trợ cả thao tác nhấp chuột chọn cặp (để dùng tốt trên cả điện thoại và máy tính).
- Khi ghép đúng hoặc sai đều hiện giải thích ngắn gọn dựa trên kiến thức bài học.
- Không gọi mạng ngoài, không thu thập thông tin cá nhân người chơi.
- Cuối câu trả lời, giải thích cho em mảng dữ liệu các cặp khái niệm nằm ở dòng nào để em tự bổ sung thêm.`,
  },
  {
    id: "prompt-3-algorithm-simulation",
    number: 3,
    title: "Tạo trò chơi mô phỏng thuật toán từng bước",
    category: "Mô phỏng & Thuật toán",
    purpose: "Trực quan hóa thuật toán tìm kiếm tuần tự, tìm kiếm nhị phân, sắp xếp nổi bọt hoặc sắp xếp chọn.",
    template: `Em đang học lớp [Lớp], bài/chủ đề: [Bài học].
Nội dung thuật toán trong bài học:
[Nguồn kiến thức]

Mục tiêu của em: [Mục tiêu].
Ý tưởng mô phỏng: [Ý tưởng].

Hãy viết giúp em 1 tệp HTML tự chứa mô phỏng trực quan thuật toán này với ít nhất 3 nhiệm vụ thực hành có điều kiện hoàn thành rõ ràng:
- Nhiệm vụ 1: Học sinh tự chọn bước tiếp theo của thuật toán trên dãy số cho sẵn.
- Nhiệm vụ 2: Đếm số lần so sánh hoặc hoán đổi.
- Nhiệm vụ 3: Phân biệt trường hợp tốt nhất / xấu nhất hoặc so sánh với cách làm khác.
Không dùng thư viện ngoài, không dùng localStorage bắt buộc. Hãy chú thích rõ từng hàm JavaScript để em hiểu cách thuật toán chạy.`,
  },
  {
    id: "prompt-4-digital-safety-scenarios",
    number: 4,
    title: "Tạo trò chơi xử lý tình huống An toàn số & Đạo đức mạng",
    category: "An toàn số",
    purpose: "Rèn kỹ năng nhận diện lừa đảo mạng, bảo vệ mật khẩu, ứng xử văn minh và tôn trọng bản quyền.",
    template: `Em đang học lớp [Lớp], chủ đề: [Bài học].
Kiến thức trọng tâm cần áp dụng:
[Nguồn kiến thức]

Mục tiêu rèn luyện: [Mục tiêu].
Bối cảnh/ý tưởng tình huống: [Ý tưởng].

Hãy giúp em tạo trò chơi nhập vai xử lý tình huống an toàn số trong 1 tệp HTML tự chứa:
- Gồm ít nhất 10 tình huống thực tế phù hợp lứa tuổi học sinh THCS/THPT.
- Mỗi tình huống có 4 phương án xử lý, chỉ ra lựa chọn an toàn nhất và giải thích hậu quả nếu chọn sai.
- Tuyệt đối không yêu cầu người chơi nhập họ tên thật, email hay mật khẩu thật.
- Sau khi tạo mã, hãy hướng dẫn em cách thêm tình huống thứ 11 bằng chính lời văn của em.`,
  },
  {
    id: "prompt-5-code-review-explanation",
    number: 5,
    title: "Kiểm tra, giải thích mã HTML/CSS/JS và gợi ý cải tiến",
    category: "Hiểu mã & Cải tiến",
    purpose: "Giúp học sinh hiểu rõ từng phần mã trước khi nộp để không sao chép máy móc.",
    template: `Em đang làm sản phẩm cho lớp [Lớp], bài: [Bài học], với mục tiêu: [Mục tiêu].
Dưới đây là đoạn mã HTML hoặc ý tưởng hiện tại của em:
[Nguồn kiến thức]

Yêu cầu nhờ trợ lý hướng dẫn: [Ý tưởng].
Hãy giúp em:
1. Giải thích cấu trúc mã thành 3 phần dễ hiểu: Giao diện (HTML/CSS), Dữ liệu câu hỏi/nhiệm vụ, và Hàm xử lý sự kiện (JavaScript).
2. Kiểm tra xem mã có vi phạm quy định an toàn Sandbox không (có gọi CDN ngoài, fetch, popup, window.top hay localStorage bắt buộc không).
3. Gợi ý 3 cải tiến nhỏ để giao diện đẹp hơn và dễ bấm hơn trên màn hình nhỏ.`,
  },
  {
    id: "prompt-6-debug-html-game",
    number: 6,
    title: "Tìm và sửa lỗi khi trò chơi HTML không bấm được hoặc tính sai điểm",
    category: "Sửa lỗi (Debug)",
    purpose: "Hướng dẫn học sinh tìm nguyên nhân lỗi cú pháp JS, lỗi sự kiện nút bấm hoặc lỗi chạy trong iframe sandbox.",
    template: `Em đang sửa trò chơi môn Tin học lớp [Lớp], bài: [Bài học].
Mô tả lỗi em đang gặp phải: [Ý tưởng].
Mục tiêu mong muốn sau khi sửa: [Mục tiêu].

Đoạn mã HTML/JS hiện tại của em:
[Nguồn kiến thức]

Hãy chỉ rõ cho em:
1. Nguyên nhân chính khiến trò chơi bị lỗi (chỉ rõ dòng hoặc tên hàm bị lỗi).
2. Vì sao lỗi đó xảy ra (giải thích dễ hiểu cho học sinh).
3. Xuất lại tệp HTML hoàn chỉnh đã sửa lỗi, đảm bảo chạy tốt trong \`<iframe sandbox="allow-scripts">\` (không dùng localStorage bắt buộc, không gọi thư viện ngoài).`,
  },
  {
    id: "prompt-7-convert-notes-to-question-bank",
    number: 7,
    title: "Chuyển nội dung bài học thành bộ câu hỏi ôn tập có giải thích",
    category: "Ôn tập kiến thức",
    purpose: "Tạo bộ câu hỏi bám sát vở ghi/SGK phân theo 3 mức độ Nhận biết - Thông hiểu - Vận dụng.",
    template: `Em đang ôn tập môn Tin học lớp [Lớp], bài: [Bài học].
Dưới đây là nội dung ghi chép từ sách giáo khoa và bài giảng của thầy/cô:
[Nguồn kiến thức]

Mục tiêu ôn tập của em: [Mục tiêu].
Yêu cầu bổ sung: [Ý tưởng].

Chỉ dựa trên nội dung em cung cấp ở trên (nếu thiếu hãy báo cho em biết, không tự bịa số trang), hãy soạn giúp em 10 câu hỏi trắc nghiệm (4 lựa chọn A, B, C, D):
- 4 câu mức Nhận biết
- 4 câu mức Thông hiểu
- 2 câu mức Vận dụng
Mỗi câu ghi rõ đáp án đúng và giải thích ngắn gọn vì sao các phương án nhiễu dễ gây nhầm lẫn.`,
  },
  {
    id: "prompt-8-pre-submit-checklist",
    number: 8,
    title: "Tự kiểm tra chất lượng và an toàn sản phẩm trước khi gửi giáo viên duyệt",
    category: "Kiểm định trước khi nộp",
    purpose: "Rà soát tiêu chí nội dung, kỹ thuật, quyền riêng tư và chuẩn bị phần thuyết minh đóng góp cá nhân.",
    template: `Em chuẩn bị nộp sản phẩm trò chơi cho lớp [Lớp], bài: [Bài học].
Mục tiêu học tập của sản phẩm: [Mục tiêu].
Những phần em đã tự chỉnh sửa/sáng tạo thêm: [Ý tưởng].

Nội dung câu hỏi hoặc mã HTML dự kiến nộp:
[Nguồn kiến thức]

Hãy giúp em rà soát theo bảng kiểm trước khi gửi giáo viên duyệt:
1. Tính chính xác của kiến thức Tin học (có câu nào sai khái niệm hoặc thiếu giải thích không?).
2. Đủ số lượng tối thiểu chưa (Quiz >= 10 câu có giải thích; Mô phỏng >= 3 nhiệm vụ tăng dần).
3. Tính tương thích Sandbox (1 tệp HTML tự chứa, không CDN, không fetch, không localStorage bắt buộc, không hỏi thông tin cá nhân).
4. Viết giúp em bản nháp 3-4 câu "Thuyết minh sử dụng AI & đóng góp cá nhân" trung thực dựa trên những gì em đã tự làm.`,
  },
];

export const STUDENT_AI_SAFETY_CHECKLIST = [
  "Không dán họ tên đầy đủ của bản thân hoặc bạn bè, số điện thoại, địa chỉ nhà, mật khẩu vào cuộc trò chuyện với AI.",
  "Đối chiếu toàn bộ khái niệm, định nghĩa và đáp án AI sinh ra với Sách giáo khoa Tin học và tài liệu của giáo viên trước khi đưa vào trò chơi.",
  "Tự chạy thử trò chơi trong khung Sandbox và bấm kiểm tra cả trường hợp trả lời đúng, trả lời sai và nút Chơi lại.",
  "Tự chỉnh sửa ít nhất 3 điểm trong mã (nội dung câu hỏi, màu sắc/bố cục, hoặc thông báo phản hồi) và hiểu rõ nguyên lý hoạt động của sản phẩm.",
  "Ghi rõ phần nào có sự hỗ trợ của Gem/AI và phần nào do bản thân tự biên soạn, kiểm chứng.",
];

