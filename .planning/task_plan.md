# Kế hoạch Thực thi Toàn diện EDUCARE AI (LMS Hardening & Feature Completion)

> **Cập nhật lần cuối**: `2026-11-12T22:42:10+07:00`
> **Trạng thái tổng thể**: `complete` (Tất cả các Phase 0 -> Phase 5 đã hoàn tất và vượt qua kiểm thử)

## Phase 0 — Hạ tầng bàn giao đa model & Khảo sát cơ sở (`complete`)
- [x] **T0.1** (`complete`): Tạo `AGENTS.md`, `CLAUDE.md`, `.agents/skills/educare-session-handoff/SKILL.md` (ưu tiên cao nhất) và `.planning/{HANDOFF,task_plan,progress,findings}.md`.
- [x] **T0.2** (`complete`): Cài đặt dependencies (`pnpm install --frozen-lockfile`) và cấu hình test runner (`pnpm test` qua `tsx --test tests/*.test.ts`).
- [x] **T0.3** (`complete`): Kiểm tra baseline (`prisma validate`, `tsc --noEmit`).
- [x] **T0.4** (`complete`): Lập bảng ánh xạ đầy đủ yêu cầu từ `docs/LMS_MASTER_PROMPT.md`, `docs/LMS_DATA_DESIGN.md`, `docs/LMS_QA_2026-11-12.md` vào `.planning/findings.md`.

## Phase 1 — Tính đúng đắn, Bảo mật & Chống dữ liệu giả (`complete`)
- [x] **T1.1** (`complete`): Sửa `wrapHtmlWithStrictCsp` trong `src/lib/html-game-sandbox.ts` và thêm route `/api/game-frame` trả HTTP header `Content-Security-Policy` chuẩn. (`node scratch/lms-sandbox-audit.cjs`: **7/7 PASS**).
- [x] **T1.2** (`complete`): Chuẩn hóa tên sự kiện `postMessage` trong `src/components/game/SandboxedHtmlGamePlayer.tsx` (hỗ trợ cả `TIN_HOC_GAME_PRACTICE_COMPLETE` và `TINHOC_GAME_PRACTICE_RESULT` kèm kiểm tra biên điểm).
- [x] **T1.3** (`complete`): Sửa `syncClassTrackingSheet` trong `src/lib/google-workspace.ts`: lọc theo `classId` + `academicYearId`, ánh xạ đúng `StudentProfile.userId` cho `Attempt.studentId`, thêm `sanitizeSheetCell`/`sanitizeSheetRows` chống Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`).
- [x] **T1.4** (`complete`): Loại bỏ toàn bộ số liệu bịa (`"8.45"`, `"83%"`, nhận xét mẫu, log AI mẫu) trong `src/lib/google-workspace.ts`, `/giao-vien/phan-tich`, `/hoc-sinh/ho-so-nang-luc`, `/phu-huynh/tong-quan`, `/phu-huynh/bai-tap-kiem-tra`, `/phu-huynh/diem-manh-can-cai-thien`.
- [x] **T1.5** (`complete`): Khóa `/api/submissions` và `/api/tin-hoc/assessments` bằng `withKeyLock` + `prisma.$transaction`, kiểm tra đăng ký lớp, hạn nộp (`dueAt`), giới hạn số lần nộp (`maxSubmissions`/`maxAttempts`) và không tin `studentEmail` từ client.
- [x] **T1.6** (`complete`): Sửa `/hoc-sinh/gemini-gems` và `/hoc-sinh/sang-tao-cung-ai` để không bao giờ gán cứng `https://gemini.google.com/gems` hoặc báo `"Đã cấu hình"` giả khi chưa có URL Gem xác thực.
- [x] **T1.7** (`complete`): Kiểm tra phân quyền lớp (`verifyTeacherClassScope`) trên `/api/grading`, `/api/assets`, `/api/sheets/import`, `/api/tin-hoc/assessments`, và `syncClassTrackingSheet`.

## Phase 2 — Kho Học liệu & Tải tệp Đa định dạng (`complete`)
- [x] **T2.1** (`complete`): Thêm bảng `Asset` vào `prisma/schema.prisma`, xây dựng `src/lib/asset-validation.ts` (kiểm tra allowlist MIME, Magic Bytes, giới hạn dung lượng, kiểm tra cấu trúc ZIP chống Zip Slip `../`, chặn thực thi `.exe`/`.bat`/`.ps1`/`.js`, chống Zip Bomb, sinh `storageKey` UUID ngẫu nhiên) và API `/api/assets`, `/api/assets/[id]`.
- [x] **T2.2** (`complete`): Tạo component `src/components/assets/MultiFileAssetUploader.tsx` (kéo thả nhiều tệp, thanh tiến trình, thử lại, hủy, xem trực tiếp/chạy sandbox/tải về) và tích hợp vào `AssignmentSubmissionForm.tsx` và `TeacherLessonsClient.tsx`.

## Phase 3 — Pipeline Nhập Google Sheets & Đánh giá Minh bạch (`complete`)
- [x] **T3.1** (`complete`): Thêm các bảng `SheetImportSource`, `StudentExternalIdentity`, `AssessmentExternalIdentity`, `SheetImportRun`, `SheetImportRow`, `ImportedAttempt`, `AttemptCorrection`, `ImportedAssessmentSummary`, `StudentAssessmentMetric`, `StudentInsight` vào `prisma/schema.prisma` và cập nhật RLS trong `prisma/supabase-postgres-rls.sql`.
- [x] **T3.2** (`complete`): Triển khai `src/lib/sheets-import-pipeline.ts` và `/api/sheets/import` (khóa bất biến `record_id`, chống nhân đôi khi đảo thứ tự dòng, phân biệt `0.0` và `null`, chuẩn hóa `8/10` và `80/100`, lưu lịch sử sửa điểm `AttemptCorrection`, chống lặp `nativeAttemptId`, lưu tổng hợp `ImportedAssessmentSummary` không bịa lượt làm bài).
- [x] **T3.3** (`complete`): Triển khai công thức đánh giá minh bạch `computeTransparentStudentMetrics` (tách `PRACTICE` và `EXAM`, chỉ tính `improvement = latestScore - firstScore` khi `validAttemptCount >= 2`).
- [x] **T3.4 & T3.5** (`complete`): Sửa `ClassTrackingSheet` dùng khóa phức hợp `@@unique([classId, academicYearId, purpose])` và trả trạng thái trung thực `DISCONNECTED` / `DEMO` khi chưa kết nối Google API thật.

## Phase 4 — Tiện ích AI, `IntegrationSlot` & Thu gọn Điều hướng (`complete`)
- [x] **T4.1** (`complete`): Tạo bảng `IntegrationSlot`, module `src/lib/integration-slots.ts` và API `/api/integrations/slots` cho phép cấu hình từng khe tích hợp (`LESSON_HINT`, `ASSIGNMENT_EXPLAIN`, `GAME_CREATOR`, `TEACHER_ASSISTANT`, `ANALYTICS_INSIGHT`, `GEM_TIN7`, `GEM_TOAN7`, `GEM_VAN7`, `GEM_TIN6`) với Prompt Socratic dự phòng.
- [x] **T4.2** (`complete`): Hợp nhất trải nghiệm Trung tâm Trợ lý & Học liệu AI qua `src/components/ai/StudentAiCenterTabs.tsx` trên `/hoc-sinh/gemini-gems`, `/hoc-sinh/prompt-lab`, `/hoc-sinh/sang-tao-cung-ai` và thu gọn thanh bên `src/components/layout/AppSidebar.tsx` mà vẫn giữ nguyên mọi URL được bookmark.

## Phase 5 — Kiểm thử Nghiệm thu, Build & Báo cáo (`complete`)
- [x] **T5.1** (`complete`): Viết 33 ca kiểm thử tự động trong `tests/` (`html-sandbox.test.ts`, `submission-and-rbac.test.ts`, `asset-validation.test.ts`, `integration-slots.test.ts`, `sheets-and-metrics.test.ts`, `db-integration.test.ts`). Kết quả: **33/33 PASS**.
- [x] **T5.2** (`complete`): Chạy `pnpm exec prisma validate` (**PASS**), `pnpm exec tsc --noEmit` (**PASS**), `pnpm build` (**PASS**), và xuất báo cáo `docs/LMS_IMPLEMENTATION_REPORT.md`.


---

# Kế hoạch Thực thi EDUCARE AI 3.0 — Ocean Blue Design System & Fluid Motion

> **Cập nhật lần cuối**: `2026-11-13T17:22:00+07:00`
> **Trạng thái tổng thể**: `complete` (Đã hoàn tất toàn bộ EDUCARE AI 3.0 Phase A -> Phase H; riêng kiểm thử giao diện trực quan qua `chrome_devtools` MCP tạm chặn do Chrome chưa bật `chrome://inspect/#remote-debugging`)

- [x] **Phase A — Audit (`complete`)**: Kiểm tra toàn bộ layout, CSS, tailwind, font, `framer-motion` (đã cài `14.12.0`), chụp ảnh BEFORE, ghi nhận điểm yếu vào `.planning/findings.md`.
- [x] **Phase B — Design Tokens & Typography (`complete`)**: Cấu hình `next/font/google`, cập nhật `tailwind.config.ts`, `globals.css`, tạo `src/lib/theme.ts` (Ocean Blue + bảng màu ngữ nghĩa theo module) và `src/lib/motion.ts` (easing `cubic-bezier(0.22, 1, 0.36, 1)`, timing chuẩn, `reducedMotion`).
- [x] **Phase C — Core Component Library & Navigation (`complete`)**: Tạo `src/components/ui/*` (`PageTransition`, `PageHeader`, `StatCard`, `FeatureCard`, `CourseCard`, `ProgressCard`, `DataTable`, `ChartCard`, `Modal`, `Drawer`, `Tabs`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `AIWidget`, `RoleSwitcher`, `MotionProvider`), nâng cấp `AppShell`, `AppSidebar` (active `layoutId` indicator, module icon tints), `AppHeader` (fix OAuth link, `RoleSwitcher`, animated search modal), `FloatingAIAssistant`, và `loading.tsx` skeletons.
- [x] **Phase D — Authentication Pages & Home Portal (`complete` cho Auth & Home; legal pages ở Phase F)**: Redesign `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/khong-co-quyen`, và `/` với bố cục Split-Screen Ocean Blue + minh họa SVG 3D giáo dục + motion mượt mà (`tsc --noEmit` PASS).
- [x] **Phase E — Role Dashboards (Admin, Teacher, Student, Parent) (`complete`)**: Thiết kế lại `/admin/overview` (+ `SuperAdminViewCards`), `/quan-tri/tong-quan`, `/giao-vien/tong-quan`, `/hoc-sinh/tong-quan`, `/phu-huynh/tong-quan` theo đúng định vị SaaS Admin / Productivity Teacher / Gamified Student / Trust Parent dùng dữ liệu thực + biểu đồ tương tác `ChartCard` (`tsc --noEmit` PASS).
- [x] **Phase F — Functional Pages & Sub-routes (`complete`)**: Hoàn tất Batch 1–5 (`StudentAiCenterTabs`, `MultiFileAssetUploader`, `SandboxedHtmlGamePlayer`, `html-game-sandbox`, `/privacy`, `/terms`, `/embed/tro-choi/[slug]`, `/admin/settings/integrations`, `quan-tri/*`, `giao-vien/*`, `hoc-sinh/*`, `phu-huynh/*`), xóa hoàn toàn 0/0 token teal cũ khỏi `src/`, gỡ bỏ alias `brand.teal` khỏi `tailwind.config.ts` và bổ sung đầy đủ thang màu `ocean-*`.
- [x] **Phase G — Motion & Performance Optimization (`complete`)**: `LazyMotion features={domAnimation}` + `<MotionConfig reducedMotion="user">`, `next/font/google`, GPU-friendly `transform`/`opacity`, `next/dynamic` lazy-loading cho `SandboxedHtmlGamePlayer` (`xuong-tro-choi`, `duyet-tro-choi`) và `FloatingAIAssistant` (`AppShell`), `@media (prefers-reduced-motion: reduce)` trong `globals.css`.
- [x] **Phase H — QA & Visual Comparison (`complete` cho build/unit/HTTP/RBAC checks; Chrome DevTools MCP blocked)**: `prisma validate` PASS, `tsc --noEmit` PASS, `pnpm test` 33/33 PASS, `pnpm build` PASS (shared JS 103 kB, CSS `d8ff7d670f8dc374.css` 78,649 bytes). Live `next start` (`http://localhost:3000`): 10/10 public routes HTTP 200, 5/5 protected portals HTTP 307 redirect. Subagent `chrome_devtools` bị chặn do thiếu `DevToolsActivePort` (Chrome chưa bật `chrome://inspect/#remote-debugging`).
