# Prompt triển khai và kế hoạch hoàn thiện EDUCARE AI

Ngày rà soát: 12/11/2026. Đây là đặc tả triển khai, không phải xác nhận hệ thống đã hoàn thiện. Đọc cùng LMS_QA_2026-11-12.md và LMS_DATA_DESIGN.md.

## Prompt chính — sao chép toàn bộ phần dưới

Bạn là nhóm chuyên gia phối hợp gồm kiến trúc sư LMS, giáo viên thiết kế học tập, kỹ sư full-stack, kỹ sư dữ liệu PostgreSQL/Prisma, chuyên gia Google Workspace, bảo mật ứng dụng và QA. Hãy hoàn thiện dự án EDUCARE AI hiện có, ưu tiên sửa lỗi thực tế trước khi thêm tính năng. Không viết lại toàn bộ dự án; không coi dữ liệu demo, màn hình đẹp hoặc nút bấm là bằng chứng chức năng đã hoạt động.

### 1. Quy trình và tiêu chuẩn

- Đọc AGENTS.md; ưu tiên knowledge graph cho khám phá mã. Kiểm tra schema, route, API, quyền truy cập và các luồng dữ liệu thực tế.
- Lập ma trận yêu cầu: đã có và chạy được / có mã nhưng chưa kiểm chứng / giả lập / còn thiếu. Mỗi kết luận phải có đường dẫn và bằng chứng.
- Cài dependencies theo lockfile trong môi trường phù hợp; chạy kiểm tra TypeScript, lint, Prisma validate, production build và bộ kiểm thử thực sự. Không chạy script seed/purge trên dữ liệu thật.
- Giữ dữ liệu thật, thực hiện thay đổi schema bằng migration có kiểm thử và phương án phục hồi. Không đọc hoặc xuất khóa bí mật vào báo cáo.
- Không tuyên bố không có lỗi tuyệt đối. Chỉ nghiệm thu khi các ca kiểm thử trong phạm vi đã chạy đều đạt, không còn lỗi nghiêm trọng đã biết và công khai giới hạn kiểm chứng.

### 2. Các lỗi phải xử lý trước

- syncClassTrackingSheet trong src/lib/google-workspace.ts: giới hạn Attempt và AIUsageLog theo lớp/trường/năm học được cấp quyền; không dùng className làm định danh duy nhất cho mọi năm học.
- Loại bỏ điểm 8.45, tiến độ 83%, nhận xét và AI usage tự điền khi thiếu dữ liệu. Hiển thị “Chưa có dữ liệu”, giữ null khác với 0.
- Không tự tạo ID Google Drive/Sheets rồi ghi SYNCED/SUCCESS. Lưu ID thật trả về từ Google API; trạng thái chỉ thành công sau khi đọc lại xác nhận. Khi chưa cấu hình, hiển thị DISCONNECTED hoặc DEMO rõ ràng.
- Khắc phục chèn CSP bằng regex trong HTML sandbox: chính sách phải được áp dụng trước mọi nội dung không tin cậy. Kiểm thử script trước head, head giả trong comment, tài liệu HTML lỗi cú pháp, mạng ngoài và điều hướng. Ưu tiên origin riêng cùng CSP response header nếu kiến trúc cho phép.
- Kiểm tra nộp bài: thành viên lớp, bài đã phát hành, thời hạn, số lượt, quyền sở hữu và chống nộp trùng trong transaction. Đánh giá cạnh tranh khi hai request cùng đến.
- Gems chưa cấu hình không được hiển thị “đã cấu hình”; không dùng liên kết trang chủ Gems thay cho Gem chuyên biệt.

### 3. Phân biệt trang và điều hướng

Giữ URL hiện có khi hợp lý; dùng chuyển hướng nếu hợp nhất trang để không phá bookmark.

| Khu vực | Mục đích duy nhất | Thành phần chính |
|---|---|---|
| Học sinh /hoc-sinh/mon-hoc | Học kiến thức | Môn → chương → bài; nội dung, tài liệu, tiến độ |
| Học sinh /hoc-sinh/bai-tap | Làm và nộp sản phẩm | Giao việc, hạn nộp, tệp, rubric, phản hồi, lịch sử |
| Học sinh /hoc-sinh/kiem-tra | Luyện tập và đánh giá | Hai chế độ riêng, lượt làm, thời gian, kết quả |
| Học sinh /hoc-sinh/xuong-tro-choi | Tạo và thử HTML | Soạn mã, tải HTML, xem thử, gửi duyệt, phiên bản |
| Thư viện trò chơi + /embed/tro-choi/[slug] | Chơi nội dung đã duyệt | Tìm theo môn/bài, mở toàn màn hình, nhúng |
| Trung tâm AI | Prompt, Gems, Agents | Hợp nhất điều hướng sang-tao-cung-ai, prompt-lab, gemini-gems bằng các tab rõ ràng |
| Học sinh /hoc-sinh/ho-so-nang-luc | Theo dõi tiến bộ | Điểm đầu/cuối/tốt nhất, lượt hợp lệ, nhận xét có căn cứ |
| Giáo viên /giao-vien/bai-giang | Biên soạn học liệu | Bài học, khối nội dung, tệp dùng lại, lịch xuất bản |
| Giáo viên /giao-vien/bai-tap và /cham-bai | Giao việc và chấm | Tách tạo yêu cầu khỏi hàng đợi chấm/nhận xét |
| Giáo viên /giao-vien/ngan-hang-cau-hoi | Quản lý câu hỏi/đề | Phiên bản, mục tiêu, độ khó, duyệt AI draft |
| Giáo viên /giao-vien/phan-tich | Đánh giá theo dữ liệu | Lọc lớp/môn/kỳ, độ đầy đủ dữ liệu, hỗ trợ học sinh |
| Giáo viên /giao-vien/duyet-tro-choi | Kiểm duyệt sản phẩm | Duyệt, trả sửa, ẩn, phục hồi phiên bản |
| Quản trị tích hợp | Cấu hình kết nối | Google Sheets/Drive, Gem/Agent, quyền, log, lỗi |

### 4. Bài học, bài tập và upload

- Bài học có mục tiêu, nội dung theo khối, ví dụ, hoạt động, bài liên quan, học liệu và điều kiện hoàn thành. Tiến độ phải dựa trên sự kiện thực tế.
- Bài tập hỗ trợ cá nhân/nhóm/dự án/luyện tập/kiểm tra, rubric, lịch giao/hạn nộp, số lần làm, nộp lại và phản hồi riêng.
- Xây kho Asset dùng chung: nhiều tệp, kéo thả, tiến độ upload, thử lại, hủy, xem trước, tải xuống, phiên bản, chủ sở hữu và phạm vi lớp. Liên kết Drive là một lựa chọn bổ sung, không thay cho upload từ máy.
- Hỗ trợ PDF, DOCX, PPTX, XLSX, CSV, TXT, ảnh, âm thanh, video và HTML theo allowlist cấu hình; nêu rõ loại nào xem trước được, loại nào chỉ tải xuống. ZIP chỉ lưu/tải khi được phép; nếu giải nén phải chống zip bomb/path traversal.
- Kiểm tra MIME/nội dung/dung lượng phía server; tên object ngẫu nhiên, metadata riêng, quét tệp, quarantine trước công bố, URL có thời hạn. Không cho truy cập chéo lớp bằng cách đổi ID. Giới hạn dung lượng theo loại tệp và quyền.

### 5. Nhúng HTML và trò chơi

- Cho tải .html hoặc dán mã vào xưởng; xem trước bằng iframe sandbox="allow-scripts", không cấp allow-same-origin. Không render HTML người dùng trực tiếp vào DOM của LMS.
- Chặn mạng ngoài, form, popup, truy cập storage và điều hướng ngoài phạm vi bằng chính sách phù hợp đã kiểm thử; tài nguyên đóng gói trong tệp. Tách origin với ứng dụng chính khi triển khai.
- Tạo GameProject/GameVersion bằng cách tái sử dụng Project/ProjectVersion hiện có. Giữ bản được duyệt trong khi bản mới chờ duyệt. Cho giáo viên trả sửa, ẩn và khôi phục.
- Điểm tự báo từ JavaScript trò chơi chỉ là telemetry luyện tập chưa tin cậy; không dùng làm điểm chính thức. Điểm chính thức chấm ở server, không gửi đáp án cho client trước thời điểm được phép.

### 6. Chỗ chờ Gems và Agents

- Tạo IntegrationSlot có mã chức năng, tên hiển thị, kind GEM_LINK/AGENT_API, provider, externalUrl hoặc endpointRef, cấu hình JSON có schema, secretRef, allowedRoles, classScope, trạng thái DISCONNECTED/CONFIGURED/HEALTHY/ERROR/DISABLED, phiên bản và lần kiểm tra cuối.
- Đặt slot theo ngữ cảnh: gợi ý bài học, giải thích bài tập, tạo trò chơi, hỗ trợ giáo viên, phân tích dữ liệu. Mặc định tắt khi chưa cấu hình, giải thích rõ và có prompt sao chép dự phòng.
- Gem là liên kết ngoài trừ khi có giao diện tích hợp chính thức đã xác minh; không giả định Gem có API hoặc nhúng được. Agent API chạy phía server, có timeout, giới hạn quyền công cụ, ngân sách, log đã giảm dữ liệu cá nhân và kiểm duyệt thao tác ghi.
- AI không tự đổi điểm chính thức, không tự gửi thông tin học sinh ra dịch vụ bên ngoài; lựa chọn dữ liệu đầu vào theo quyền và mục đích đã cấu hình.

### 7. CSDL và Google Sheets

- PostgreSQL là dữ liệu chuẩn; Sheets là nguồn nhập có kiểm tra và nơi xuất báo cáo, không phải hai hệ thống cùng tự ghi đè điểm.
- Tái sử dụng User, StudentProfile, SchoolClass, Assessment, Attempt, Answer và ClassTrackingSheet; bổ sung nguồn Sheets, mapping cột, batch đồng bộ, raw rows, attempt nguồn ngoài, snapshot phân tích và bản nháp nhận xét giáo viên. Xem LMS_DATA_DESIGN.md.
- Mỗi dòng lượt làm có sourceAttemptId ổn định, mã học sinh, mã đề và phiên bản, lớp/kỳ, mode, thời gian hoàn tất, scoreRaw/maxScore, trạng thái. Nếu chỉ có tổng điểm và tổng lượt thì lưu mức tổng hợp, không bịa các lượt chi tiết.
- Nhập theo chuỗi đọc nguồn → staging → xác thực → khớp định danh → loại trùng → transaction → tính chỉ số → giáo viên xem → công bố. Không lấy số dòng Sheets làm khóa vì người dùng có thể sắp xếp lại.
- Chống trùng khi retry; phát hiện cùng lượt nhưng điểm sửa đổi; giữ nguồn gốc, audit và phiên bản sửa điểm. Không âm thầm xóa dữ liệu chuẩn khi dòng biến mất trên Sheets.
- Chuẩn hóa điểm = 100 × scoreRaw/maxScore với maxScore > 0. Thống kê theo cùng đề/phiên bản: điểm đầu, gần nhất, tốt nhất, mức cải thiện và lượt hoàn tất hợp lệ; tách PRACTICE/EXAM. Không tính mỗi request autosave thành lượt làm.
- Làm nhiều lần không mặc định học yếu. Ít dữ liệu hiển thị “Chưa đủ dữ liệu”; không suy ra năng lực từng kỹ năng nếu chỉ có tổng điểm. AI nêu bằng chứng, giới hạn và đề xuất hỗ trợ; giáo viên duyệt trước khi gửi học sinh/phụ huynh.
- Quyền dữ liệu theo trường/lớp/phân công và phụ huynh-con; API kiểm tra quyền server, bảng exposed có RLS phù hợp. Prisma dùng tài khoản đặc quyền cần kiểm tra quyền server vì có thể vượt RLS.

### 8. Nghiệm thu bắt buộc

1. Đăng nhập các vai trò; chặn đổi ID để xem lớp/người học khác.
2. Tạo bài học → upload nhiều tệp → học sinh được cấp quyền xem/tải.
3. Giao bài → nộp → nộp lại → chấm rubric → học sinh nhận đúng phản hồi.
4. Thi: autosave, rớt mạng, tải lại, hết giờ, nộp đôi, giới hạn lượt và bảo vệ đáp án.
5. HTML: file hợp lệ hoạt động; payload phá CSP, network, popup và điều hướng bị chặn; phiên bản chờ duyệt không thay bản công khai.
6. Sheets: thực sự đọc/ghi và đọc lại; nhập cùng dữ liệu hai lần không tăng lượt; xử lý mã HS thiếu, sai lớp, điểm lỗi, timezone, hàng sắp xếp lại, sửa điểm và Google hết hạn quyền/429/5xx.
7. Gems/Agents chưa cấu hình không báo thành công; lỗi provider có fallback, không mất dữ liệu.
8. Dashboard không bịa điểm/tiến độ, công thức kiểm chứng bằng fixture có kết quả mong đợi.
9. Kiểm tra điện thoại, bàn phím, nhãn truy cập, trạng thái trống/loading/lỗi và chữ tiếng Việt.
10. Kiểm tra tải theo số người dùng mục tiêu được công bố; sao lưu và diễn tập phục hồi trên dữ liệu thử.

Kết quả giao: mã đã sửa, migration, cấu hình mẫu không chứa secret, tài liệu vận hành, báo cáo lệnh kiểm thử kèm pass/fail/blocked, danh sách hạn chế còn lại. Triển khai theo thứ tự: tính đúng đắn và bảo mật → học liệu/upload → Sheets và đánh giá → tiện ích AI.

## Prompt mẫu tạo trò chơi từ bài tập

Bạn là giáo viên môn [MÔN], khối [KHỐI] và lập trình viên trò chơi học tập. Chuyển bài tập [DÁN NỘI DUNG] thành trò chơi phục vụ mục tiêu [MỤC TIÊU], thời lượng [PHÚT], cho học sinh có mức độ [MỨC ĐỘ]. Chọn quiz/ghép đôi/kéo thả/mô phỏng phù hợp nội dung, không thêm kiến thức chưa có căn cứ. Giữ đúng đáp án do giáo viên cung cấp; chỗ chưa chắc phải ghi cần giáo viên xác nhận. Không tự sinh thêm câu chỉ để đạt số lượng.

Đầu ra gồm: (1) bảng đối chiếu câu gốc–mục tiêu–hoạt động–đáp án; (2) một file HTML UTF-8 độc lập có CSS/JS nội tuyến, không thư viện/CDN/API/mạng ngoài, không cookie/storage, không dữ liệu cá nhân; (3) checklist kiểm thử và hướng dẫn giáo viên. Có màn hình hướng dẫn, tiến độ, phản hồi giải thích sau từng câu, tổng kết theo mục tiêu, chơi lại và tắt âm; hỗ trợ màn hình điện thoại, bàn phím và không phụ thuộc màu sắc. Không dùng popup, chuyển trang hoặc yêu cầu quyền thiết bị. Chạy được trong iframe sandbox="allow-scripts". Điểm trong trò chơi là điểm luyện tập tham khảo; không giả định được phép ghi điểm vào LMS. Nếu LMS có giao thức sự kiện đã công bố, chỉ dùng đúng schema đó, không tự tạo kết nối.

## Nguồn kỹ thuật kiểm tra khi lập đề xuất

- Cô lập iframe: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- RLS và lưu ý views: https://supabase.com/docs/guides/database/postgres/row-level-security
- Changelog nền tảng: https://supabase.com/changelog.md
