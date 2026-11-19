# HANDOFF CHECKPOINT — EDUCARE AI (Cập nhật: 2026-11-18 19:50 +07:00)

## 1. Trạng thái tổng thể
- **Toàn bộ 5 hạng mục trong `docs/PROMPT_TRIEN_KHAI_LUONG_HOC_SINH.md` (`SL-1` -> `SL-5`) và bộ kiểm thử tự động + đối soát CSDL (`SL-6`) ĐÃ HOÀN TẤT 100% (`67/67 tests PASS`, `tsc --noEmit PASS`, `prisma validate PASS`, `pnpm build PASS`)**.
- **25 tài khoản học sinh thí điểm Khối 6, 7, 8** (`HS26-6A1-01..08`, `HS26-7A1-01..07`, `HS26-8A1-01..10`) đã sẵn sàng trong CSDL ở trạng thái `ACTIVE` (vào học trực tiếp, không bắt đổi mật khẩu lần đầu). File danh sách gửi phụ huynh đã xuất tại `C:\Users\bmngu\Downloads\Danh_sach_tai_khoan_hoc_sinh_Khoi6_7_8_2026_2027.xlsx`.

## 2. Tóm tắt những gì đã triển khai và đóng gói trong phiên này
1. **Mục 1 (`SL-1` — Tìm bài học & Bài kiểm tra)**:
   - Thêm nút **Kiểm tra** nổi bật trên `/hoc-sinh/tong-quan` và thanh `BottomNav` trên mobile (đi tới `/hoc-sinh/kiem-tra?mode=EXAM` trong **1 thao tác**).
   - Sửa dứt điểm lỗi gọi API lặp vô hạn ở `/hoc-sinh/kiem-tra/page.tsx`; tách rõ 3 chế độ **Đề kiểm tra được giao (`EXAM`)**, **Bài tự luyện (`PRACTICE`)** và **Bài tập & Nộp bài (`/hoc-sinh/bai-tap`)**.
   - Hiển thị `"Lớp em chưa có bài kiểm tra được giao"` khi trống, nút **Thử lại** khi lỗi mạng, thông tin trước khi làm (môn, thời lượng, số lượt cho phép, trạng thái) và sau khi nộp (số lần đã nộp, điểm/thang điểm, chính sách đáp án, hành động tiếp theo), tự động khôi phục lượt `IN_PROGRESS` sau khi tải lại trang.
   - Trong `/hoc-sinh/mon-hoc/[id]/page.tsx`: kiểm tra phạm vi khối/lớp của học sinh, đặt Tên bài + Mục tiêu ngắn phía trên học liệu, và 3 nút hành động tiếp theo giữ nguyên ngữ cảnh (**1. Luyện bằng trò chơi**, **2. Hỏi gia sư môn này**, **3. Vào bài kiểm tra**).
2. **Mục 2 (`SL-2` — Dán link Google Drive & Xem ảnh trực tiếp trong bài)**:
   - Tạo `src/lib/drive-url.ts` chuẩn hóa URL HTTPS từ `drive.google.com` / `docs.google.com` (`file/d/<id>/view`, `open?id=<id>`, `folders/<id>`, Docs/Slides/Sheets, giữ `resourcekey`, chặn SSRF/non-HTTPS) và tương thích ngược với bài cũ (`/api/assets/<id>`).
   - Tạo `src/components/materials/DriveMaterialViewer.tsx` hiển thị trực tiếp hình ảnh trong bài kèm mô tả và fallback sang khung `/preview` + lời giải thích có điều kiện trung thực (không báo giả "tệp đã bị xóa").
   - Nâng cấp `src/app/giao-vien/bai-giang/TeacherLessonsClient.tsx` & `/api/teacher/lessons/route.ts`: đưa **Dán liên kết Google Drive** lên làm cách chính, có xem trước trực tiếp trước khi lưu.
3. **Mục 3 (`SL-3` — Ghi điểm & Số lần làm từ ứng dụng sang Sheets)**:
   - Chuẩn hóa quy tắc đếm lượt trong `/api/tin-hoc/assessments/route.ts` và `/api/tin-hoc/game-plays/route.ts` (gắn nhãn **Tự luyện**, nối `PilotLearningHub.tsx` lưu lượt chơi khi hoàn thành).
   - Bổ sung `buildClassTrackingAttemptSheets` vào `syncClassTrackingSheet` (`src/lib/google-workspace.ts`): xuất `tab7_ChiTietLuotNop` (**mỗi lượt đã nộp 1 dòng** với `record_id` ổn định) và `tab8_TongHopKetQua` (tổng hợp theo `HS/bài/chế độ`: `submitted_count`, `latest_score`, `best_score`, tách riêng `practice_game_plays`, bảo toàn `teacher_note`).
4. **Mục 4 (`SL-4` — Thiết kế lại trò chơi HTML & Ngân hàng 20 câu/bài x 3 khối)**:
   - Nâng cấp `src/lib/demo-game-html.ts` chuẩn Ocean Blue + `postMessage`.
   - Tạo `src/lib/pilot-questions-bank.ts` và cập nhật `src/lib/pilot-curriculum.ts`: mỗi bài Tin học Khối 6, 7, 8 có đủ **20 câu hỏi riêng biệt** đã đối chiếu SGK (tổng **60 câu**), hỗ trợ **3 dạng tương tác** (`MCQ` chọn đáp án, `MATCH` ghép cặp bằng chạm/phím, `ORDER` sắp xếp thứ tự bằng nút Lên/Xuống >= 44px).
   - Nâng cấp `src/app/hoc-sinh/thi-diem/PilotLearningHub.tsx`: màn hình **Bắt đầu**, rút 10 câu không lặp mỗi lượt, hiển thị `"Câu 3/10"`, màn hình cuối hiển thị điểm, danh sách **Các câu cần ôn lại**, nút **Chơi lại** và **Về bài học**.
5. **Mục 5 (`SL-5` — Tách gia sư Gemini theo Lớp & Môn)**:
   - Tạo `src/lib/ai-tutor-config.ts`, nâng cấp `/api/ai/chat/route.ts` và `/hoc-sinh/ai-tutor/page.tsx`: lấy lớp/khối thực từ session, ưu tiên cấu hình `lớp + môn` -> `khối + môn`, điền đúng mẫu System Prompt tiếng Việt chuẩn (khóa đáp án khi đang làm đề `EXAM`, lọc PII cả lịch sử), cô lập lịch sử theo `HS + lớp + môn + bài`, hủy phản hồi mạng về muộn bằng `AbortController`, hỗ trợ IME-safe Enter khi gõ dấu tiếng Việt, 3 nút gợi ý nhanh, câu mở đầu mẫu và nút **Mở Gem** / **Sao chép câu hỏi** (hoặc báo `"Lớp em chưa có Gem môn này"`).

## 3. Kết quả kiểm tra đã chạy
- `pnpm exec prisma validate`: **PASS**
- `pnpm exec tsc --noEmit`: **PASS (0 lỗi)**
- `pnpm test`: **PASS (67/67 tests trên 10 suites, bao gồm `tests/student-journey-e2e.test.ts` và `tests/pilot-grade6-8.test.ts`)**

## 4. Việc có thể làm tiếp ở phiên sau (khi Thầy/Cô quay lại)
- Nếu muốn xem trực tiếp trên trình duyệt: chạy `pnpm dev` và đăng nhập thử bằng tài khoản học sinh (`HS26-6A1-01` / `HS26-7A1-01` / `HS26-8A1-01`).
- Nếu muốn đẩy toàn bộ thay đổi mới lên GitHub: chỉ cần nhắn `"push"` ở phiên làm việc tiếp theo.
