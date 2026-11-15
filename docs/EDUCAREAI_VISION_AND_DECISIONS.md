# EDUCARE AI — Bộ nhớ quyết định sản phẩm

Cập nhật: **15/11/2026**, múi giờ Asia/Saigon. Đây là bản tóm tắt có nguồn; không phải cam kết ghi nhớ ngoài workspace hay chứng nhận nghiệm thu mới.

## 1. Nguồn và cách đọc

- Đã đọc phần văn bản hiển thị của cuộc trò chuyện [Học thiết kế từ repo](https://chatgpt.com/share/6af9deec-75dc-83ec-9112-58a4058dc913) bằng trình duyệt ngày 15/11/2026. Các hình/tệp đính kèm trong chat không được xem như nội dung đã xác minh.
- Đối chiếu `AGENTS.md`, skill UI/UX, `DESIGN.md`, `MOTION_SPEC.md`, `PRODUCT_SPEC.md`, phần cập nhật cuối `PRODUCT_REALITY_AUDIT.md`, `.planning/progress.md` và một số vị trí mã liên quan.
- Phân biệt **yêu cầu người dùng**, **hiện trạng được báo cáo**, **mã đã đọc**, **đề xuất mới**. Một câu trả lời của AI trong chat không tự chứng minh tính năng đã chạy.
- Tác vụ hiện tại chỉ lưu quyết định và soạn prompt redesign; không thực thi các yêu cầu xóa slide/cấu hình API nằm trong cuộc trò chuyện cũ.

## 2. Các yêu cầu cần giữ qua những lần redesign

| Chủ đề | Yêu cầu đã nêu | Hệ quả cho thiết kế |
|---|---|---|
| Mục tiêu LMS | Hỗ trợ giáo viên tổ chức học liệu, giao/chấm bài; học sinh học, luyện tập, sáng tạo; theo dõi tiến bộ bằng dữ liệu | Ưu tiên công việc dạy/học trên màn hình đầu tiên |
| Tài khoản học sinh | Chưa có email trường; tự cấp tài khoản bằng mã học sinh | Không ép nhập email, không tạo email `@unigo.edu.vn` giả; có cấp mật khẩu tạm và đổi lần đầu |
| Cấu hình Workspace/API | Có nơi nhập cấu hình trong website để lưu và sử dụng về sau | Trang quản trị có lưu cấu hình, cấp quyền, kiểm tra kết nối, xử lý lỗi; secret chỉ nhập, không đọc lại |
| Trạng thái tích hợp | Phân biệt chuẩn bị xong cấu hình với kết nối Google thành công | Nhãn trạng thái có bằng chứng kiểm tra, tài khoản/phạm vi quyền, thời gian và hành động tiếp theo |
| AI | Gemini API khác Gemini Gems | AI nội bộ, liên kết Gem ngoài và agent là các lựa chọn khác nhau; không mô tả liên kết Gem là một API đã kết nối |
| Bài học/bài tập/upload | Đủ học liệu, nộp bài và tệp; có HTML và prompt trò chơi | Kho học liệu dùng lại, upload có tiến trình/lỗi; học, nộp bài, kiểm tra và sáng tạo có ranh giới rõ |
| Dữ liệu đánh giá | Lưu điểm, số lượt, câu sai/mục tiêu cần ôn cho bài làm và lượt chơi | Không bịa số liệu; điểm game do client báo không mặc định thành điểm chính thức |
| CSDL/Sheets | Tái sử dụng CSDL chính; Sheets nhập/xuất báo cáo | Không gọi Sheets là CSDL dung lượng 5 TB; giữ nguồn gốc, chống trùng, phân quyền |
| Bảo mật | Không tiết lộ secret; không gửi dữ liệu học sinh tới AI chưa được duyệt | Quyền phía server, secret mã hóa, thông báo dễ hiểu, không nhờ người dùng dán khóa vào chat |
| Slide | Giới thiệu tính năng có bằng chứng; bộ cũ đã được yêu cầu loại bỏ | Giữ `Slide_Hien_Trang_EducareAI_Verified` và `screenshots_verified`; không xóa lại hoặc dựng số liệu để chụp ảnh |
| Ngữ cảnh agent | Nạp tài liệu chọn lọc, không lặp lại phần đã hoàn thành | Đọc theo tác vụ, giữ thay đổi chưa commit, kiểm tra thực tế trước khi sửa |

## 3. Hiện trạng ngày 15/11/2026 — không dùng báo cáo 12/11 làm trạng thái hiện tại

- `.planning/task_plan.md` đánh dấu các giai đoạn hardening, upload, Sheets, IntegrationSlot và Ocean Blue hoàn tất. `PRODUCT_REALITY_AUDIT.md` cuối file bổ sung tài khoản không email, cấu hình trong web, mã REST Google và ghi nhận game. Đây là báo cáo từ lượt trước, phải kiểm tra lại khi triển khai.
- Mã `src/app/api/admin/integrations/config/route.ts` đã được đọc: có nhánh cấu hình Workspace và Gemini, gọi `encryptSecret`, từ chối secret khi thiếu khóa mã hóa máy chủ, lưu trạng thái `CONFIGURED`/`PENDING_SECRET`. Vì vậy không yêu cầu xây lại trang cấu hình từ đầu.
- Graph hiện hành tìm thấy `studentCode`/`mustChangePassword` trong API session; hàm đồng bộ Sheets có nhánh gọi `values:batchUpdate`; có `IntegrationsDiagnosticsClient`. Đây là bằng chứng mã hiện diện, không phải kiểm thử Google thật.
- `AppSidebar.tsx` và `theme.ts` đã được đọc: có Ocean Blue, màu ngữ nghĩa, nhóm Trung tâm AI nhưng còn mục AI Tutor riêng; nhãn như `Sandbox`, `3 Tab` là ứng viên rút gọn theo ngôn ngữ người dùng.
- Tài liệu ghi nhận game qua `LearningRecord` và bài kiểm tra qua `Attempt`/`Answer`/`Grade`; lần redesign phải giữ các luồng này, xác minh mức tin cậy của điểm trước khi trình bày.
- Log cuối đã đọc báo cáo 51/51 tests, typecheck/build pass; HANDOFF cũ ghi 47/47. **Không chạy lại các kiểm thử này trong tác vụ soạn prompt.** Không khẳng định hiện tại Google đã kết nối: audit vẫn ghi thiếu credentials/consent cho kiểm chứng thật.
- Hai ảnh lưu trước đó đã xem: trang bài giảng rất trống khi không có dữ liệu, xưởng HTML có tiêu đề/nhãn kỹ thuật dài. Ảnh là nguồn tham khảo thị giác; không thay cho kiểm thử UI hiện tại. Cũng cần kiểm tra nhất quán sidebar, breadcrumb và vai trò xem trước vì ảnh có sidebar quản trị bên cạnh nội dung giáo viên/học sinh.
- `PRODUCT_SPEC.md` còn mô tả một số lỗi ở phần đầu mà các bản cập nhật sau nói đã sửa. Khi có mâu thuẫn, ưu tiên kết quả tái hiện và mã hiện tại; không lặp lại toàn bộ danh sách lỗi lịch sử.

## 4. Định hướng redesign mới — đề xuất để triển khai

Giữ Ocean Blue; nâng chất lượng bố cục, thứ bậc chữ và luồng công việc. Học sinh: thân thiện và tập trung vào học tiếp. Giáo viên: hiệu quả, chấm bài nhanh. Phụ huynh: rõ tiến bộ và cách hỗ trợ. Quản trị: vận hành, tài khoản, kết nối và lỗi cần xử lý.

- Nâng body đọc bài lên 16–18px, input mobile ưu tiên 16px, bảng desktop thường 14px; không lấy chữ 11–12px làm nội dung chính. Đây là điều chỉnh đề xuất so với DESIGN hiện tại, lý do là khả năng đọc tiếng Việt và sử dụng trên điện thoại.
- Bài soạn dài nên có trang biên tập riêng với trạng thái lưu; modal dành cho thao tác ngắn hoặc xác nhận. Đây là điều chỉnh đề xuất để giảm cuộn trong hộp thoại.
- Một hành động chính rõ trên mỗi màn hình; nhóm điều hướng theo công việc, giữ URL và RBAC. Không sao chép cùng một bố cục dashboard cho mọi vai trò.
- Chuyển dữ liệu kỹ thuật ra khỏi giao diện học sinh; chỉ giải thích chi tiết ở nơi người dùng thực sự cần cấu hình/quyết định.
- Hiệu ứng có mục đích, hỗ trợ reduced motion; không đánh đổi tốc độ/khả năng đọc để trang trí.

Đặc tả và prompt hoàn chỉnh: [EDUCAREAI_REDESIGN_PROMPT.md](EDUCAREAI_REDESIGN_PROMPT.md).

## 5. Cách cập nhật bộ nhớ

Chỉ bổ sung quyết định có nguồn/ngày; đánh dấu đề xuất chưa triển khai. Không biến kết quả QA cũ thành chứng nhận hiện hành. Nạp file này khi làm sản phẩm, tài khoản, Workspace, dữ liệu học tập, slide hoặc redesign; không cần nạp cho mọi thay đổi nhỏ.
