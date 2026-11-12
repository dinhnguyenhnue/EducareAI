# BÁO CÁO NGHIỆM THU KỸ THUẬT & HOÀN THIỆN HỆ THỐNG LMS (EDUCARE AI / UNIGO)

> **Ngày cập nhật**: 2026-11-12
> **Tài liệu đối chiếu**: `docs/LMS_MASTER_PROMPT.md`, `docs/LMS_DATA_DESIGN.md`, `docs/LMS_QA_2026-11-12.md`

---

## 1. Bảng đối chiếu hiện trạng & khắc phục từng lỗi (Mục 2 `LMS_MASTER_PROMPT.md`)

| Mã mục | Vấn đề gốc trong mã nguồn | Giải pháp đã triển khai | File thay đổi | Trạng thái & Bằng chứng kiểm thử |
|---|---|---|---|---|
| **2.1** | `wrapHtmlWithStrictCsp` dùng `regex.replace` đặt `<meta CSP>` sai vị trí khi HTML học sinh có `<script>` trước `<head>` hoặc `<!-- <head> -->`; thiếu HTTP header CSP. | Bọc toàn bộ mã HTML trong khung tài liệu chuẩn do máy chủ kiểm soát với `<meta http-equiv="Content-Security-Policy">` đặt ngay đầu `<head>`, loại bỏ `<meta http-equiv="refresh">` và `<base>`, đồng thời phục vụ qua route cô lập `/api/game-frame` kèm HTTP header `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. | `src/lib/html-game-sandbox.ts`, `src/app/api/game-frame/route.ts`, `src/components/game/SandboxedHtmlGamePlayer.tsx` | **PASS** (`node scratch/lms-sandbox-audit.cjs`: 7/7 pass; `tests/html-sandbox.test.ts`: 7/7 pass) |
| **2.2** | `syncClassTrackingSheet` lấy toàn bộ `StudentProfile`/`Attempt`/`Project`/`AIUsageLog` không lọc theo `classId`/`academicYearId`; nối sai `Attempt.studentId` (`User.id`) với `StudentProfile.id`; tự bịa `"8.45"`, `"83%"`, nhận xét mẫu, log AI mẫu; không khử công thức Sheets; báo `SYNCED` giả. | Lọc chặt theo `classId` và `academicYearId`, kiểm tra phân công giáo viên (`verifyTeacherClassScope`), ánh xạ `StudentProfile.userId` cho `Attempt.studentId`, thêm `sanitizeSheetCell` / `sanitizeSheetRows` (thêm dấu `'` trước `=`, `+`, `-`, `@`, `\t`, `\r`), trả trạng thái trung thực `DISCONNECTED` / `DEMO` qua `resolveGoogleIntegrationMode`, xóa toàn bộ dữ liệu bịa trên các trang Giáo viên/Học sinh/Phụ huynh. | `src/lib/google-workspace.ts`, `src/app/giao-vien/phan-tich/page.tsx`, `src/app/hoc-sinh/ho-so-nang-luc/page.tsx`, `src/app/phu-huynh/tong-quan/page.tsx`, `src/app/phu-huynh/bai-tap-kiem-tra/page.tsx`, `src/app/phu-huynh/diem-manh-can-cai-thien/page.tsx` | **PASS** (`tests/sheets-and-metrics.test.ts`, `tests/db-integration.test.ts`) |
| **2.3** | `SandboxedHtmlGamePlayer` gửi `TIN_HOC_GAME_PRACTICE_COMPLETE` nhưng listener chỉ nghe `TINHOC_GAME_PRACTICE_RESULT`. | Chuẩn hóa hằng sự kiện, chấp nhận cả hai tên sự kiện và kiểm tra biên hữu hạn cho `score`, `maxScore`, `tasksCompleted` trước khi ghi nhận. | `src/components/game/SandboxedHtmlGamePlayer.tsx` | **PASS** (`pnpm exec tsc --noEmit`) |
| **2.4** | `/hoc-sinh/gemini-gems` gán cứng `https://gemini.google.com/gems` và luôn hiển thị `"Đã cấu hình"` kể cả khi `isConfigured: false`; `/api/submissions` cho phép mạo danh qua `body.studentEmail` và không kiểm tra lớp/hạn nộp/số lần nộp; `/api/grading` không kiểm tra quyền giáo viên trên lớp. | Xây dựng `IntegrationSlot` (`src/lib/integration-slots.ts`, `/api/integrations/slots`), chặn hoàn toàn URL trang chủ chung, mặc định `DISCONNECTED` kèm nút sao chép Prompt Socratic dự phòng. Khóa `/api/submissions` theo `session.user.id` + `submitAssignmentTransactional`, và khóa `/api/grading` bằng `verifyTeacherClassScope`. | `src/lib/integration-slots.ts`, `src/app/api/integrations/slots/route.ts`, `src/app/hoc-sinh/gemini-gems/GeminiGemsClient.tsx`, `src/lib/submission-guard.ts`, `src/app/api/submissions/route.ts`, `src/app/api/grading/route.ts` | **PASS** (`tests/integration-slots.test.ts`, `tests/submission-and-rbac.test.ts`, `tests/db-integration.test.ts`) |
| **2.5** | `START_ATTEMPT` và `SUBMIT_ATTEMPT` trong `/api/tin-hoc/assessments` có nguy cơ race condition khi gửi 2 request song song. | Bọc trong khóa đồng bộ theo khóa tài nguyên (`withKeyLock`) kết hợp `prisma.$transaction` để chống tạo trùng lượt làm bài và chống chấm lặp (`idempotentReplay: true`). | `src/app/api/tin-hoc/assessments/route.ts`, `src/lib/submission-guard.ts` | **PASS** (`tests/submission-and-rbac.test.ts`, `tests/db-integration.test.ts`) |

---

## 2. Kho Học liệu & Tải tệp Đa định dạng (Mục 4 `LMS_MASTER_PROMPT.md`)

- **Mô hình dữ liệu**: Bảng `Asset` trong `prisma/schema.prisma` lưu `storageKey` ngẫu nhiên (UUID), `originalFilename` đã làm sạch, `mimeType`, `extension`, `sizeBytes`, `sha256Checksum`, `category`, `previewMode` (`INLINE_PREVIEW` | `DOWNLOAD_ONLY` | `SANDBOX_HTML`), `quarantineStatus` (`QUARANTINED` -> `CLEAN_PUBLISHED`), gắn phạm vi `classId`, `academicYearId`, `lessonId`, `assignmentId`, `submissionId`.
- **Kiểm tra an toàn (`src/lib/asset-validation.ts`)**:
  - Kiểm tra chữ ký nhị phân (Magic Bytes) cho PDF (`%PDF-`), PNG, JPG, WEBP, WAV, MP3, MP4 (`ftyp`), WEBM, Office/ZIP (`PK\x03\x04`), và chặn tệp thực thi giả danh (`MZ` PE / `ELF` / NUL bytes).
  - Kiểm tra cấu trúc tệp `.zip` (`inspectZipBuffer`) không giải nén mù ra đĩa: chặn đường dẫn thoát thư mục (`../` — Zip Slip), chặn tệp thực thi bên trong nén (`.exe`, `.bat`, `.ps1`, `.js`...), và chặn Zip Bomb (>100 mục hoặc >100MB dung lượng giải nén).
- **Giao diện kéo thả nhiều tệp (`src/components/assets/MultiFileAssetUploader.tsx`)**: Đã tích hợp vào cả trang nộp bài của học sinh (`AssignmentSubmissionForm.tsx`) và trang biên soạn bài giảng của giáo viên (`TeacherLessonsClient.tsx`), không bắt buộc phải có Google Drive.

---

## 3. Pipeline Nhập Google Sheets & Đánh giá Học sinh Minh bạch (Mục 7 & `LMS_DATA_DESIGN.md`)

- **Các bảng dữ liệu mới trong `prisma/schema.prisma`**:
  - `SheetImportSource`, `StudentExternalIdentity`, `AssessmentExternalIdentity`, `SheetImportRun`, `SheetImportRow`, `ImportedAttempt`, `AttemptCorrection`, `ImportedAssessmentSummary`, `StudentAssessmentMetric`, `StudentInsight`.
- **Định danh & Chống trùng lặp (`src/lib/sheets-import-pipeline.ts`)**:
  - Bắt buộc `record_id` bất biến (tuyệt đối không dùng `rowNumber` làm khóa chính, nên việc sắp xếp lại thứ tự dòng trên Google Sheets không bao giờ sinh bản ghi trùng).
  - Phân biệt rõ điểm `0` (`0.0` là điểm thật) với ô trống (`null` -> từ chối với mã `MISSING_SCORE`, không bao giờ tự biến ô trống thành `0`).
  - Chuẩn hóa điểm về thang 10 (`normalizedScore10 = 10 * rawScore / maxScore`) và thang 100 (`normalizedScore100 = 100 * rawScore / maxScore`), đảm bảo `8/10` và `80/100` đồng nhất.
  - Khi điểm trên Sheet thay đổi ở lần đồng bộ sau: tăng `revision` và lưu vết lịch sử chỉnh sửa vào `AttemptCorrection`.
  - Chống nhân đôi vòng lặp LMS -> Sheet -> LMS qua `nativeAttemptId` (`SKIPPED_NATIVE_DUPLICATE`).
  - Hàng tổng hợp (`row_type = "SUMMARY"`) chỉ lưu vào `ImportedAssessmentSummary` (`scoreMeaning = "AGGREGATE_ONLY"`), tuyệt đối không tự bịa các lượt làm bài chi tiết.
- **Công thức đánh giá minh bạch (`computeTransparentStudentMetrics`)**:
  - Tách biệt `PRACTICE` và `EXAM`.
  - Khi `validAttemptCount === 0`: trả về `null` cho toàn bộ chỉ số và `INSUFFICIENT_DATA` (`"Chưa có dữ liệu"`).
  - Chỉ tính `improvement = latestScore - firstScore` khi `validAttemptCount >= 2`.

---

## 4. Liên tục Đa Model / Đa Phiên làm việc (Cross-Model Session Continuity)

- Đã thiết lập rule tự động nạp cấp cao nhất tại `AGENTS.md` và `CLAUDE.md`, cùng skill `.agents/skills/educare-session-handoff/SKILL.md` và bộ 4 file trạng thái trong `.planning/` (`HANDOFF.md`, `task_plan.md`, `progress.md`, `findings.md`).

