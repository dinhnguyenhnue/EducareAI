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

---

# Kế hoạch Thực thi Phase 6 — Skill UI/UX & Performance (`educare-uiux-performance`) + Audit & Nâng cấp Toàn diện

> **Cập nhật lần cuối**: `2026-11-15T10:59:00+07:00`
> **Trạng thái tổng thể**: `complete` (Tất cả các bước T6.0 -> T6.4 đã hoàn tất và vượt qua 43/43 unit tests + Next.js build)

- [x] **T6.0 — Lập kế hoạch & Kiểm tra nguồn tham khảo (`complete`)**: Xác nhận đường dẫn 3 nguồn (`Impeccable` tại `D:\AI\Repos\impeccable` thay vì `D:\AI\impeccable`; `UI UX Pro Max` tại `D:\AI\Skills\ui-ux-pro-max-skill`; `EvondevKit` tại `D:\AI\Repos\evondevKit`), tạo `uiux_plan.md` và được người dùng phê duyệt.
- [x] **T6.1 — Giai đoạn 1: Khảo sát hiện trạng & 3 nguồn tham khảo (`complete`)**: Đọc chi tiết `Impeccable` (`D:\AI\Repos\impeccable`, Apache-2.0), `UI UX Pro Max` (`D:\AI\Skills\ui-ux-pro-max-skill`, MIT), `EvondevKit` (`D:\AI\Repos\evondevKit`, MIT); khảo sát toàn diện `d:\Educare_AI` về điều hướng, phân cấp thị giác, responsive, trạng thái giao diện (loading/empty/error/disabled/forbidden), khả năng truy cập (bàn phím, skip-link, `aria-*`, focus), hiệu năng và motion.
- [x] **T6.2 — Giai đoạn 2: Tạo Skill & Bộ 4 Đặc tả (`complete`)**: Tạo `.agents/skills/educare-uiux-performance/SKILL.md`, `PRODUCT_SPEC.md`, `DESIGN.md`, `MOTION_SPEC.md`, `AUDIT_REPORT.md` (điểm tự đánh giá ban đầu 1–5 kèm bằng chứng `file:line`).
- [x] **T6.3 — Giai đoạn 3: Triển khai các cải thiện tác động cao (`complete`)**: Sửa lỗi chặn công việc (`error.tsx`, `not-found.tsx`, thay thế toàn bộ `alert()` chặn luồng bằng `useToast()` + banner `role="alert"`), nâng cấp điều hướng & khả năng truy cập (skip-to-content `#main-content`, `aria-current="page"`, nút tìm kiếm nhanh `Ctrl+K` trên mobile `<768px`, `role="dialog" aria-modal="true"` trên mọi modal, `Escape` thu gọn `FloatingAIAssistant`, liên kết `htmlFor`/`id`), và loại bỏ `bg-clip-text text-transparent` trên tiêu đề Hero trang chủ.
- [x] **T6.4 — Giai đoạn 4: Kiểm tra, Tự thẩm định & Báo cáo cuối (`complete`)**: Tạo `tests/uiux-accessibility.test.ts`; chạy `prisma validate` (PASS), `tsc --noEmit` (PASS), `pnpm test` (43/43 PASS trên 7 suites), `pnpm build` (PASS, First Load JS shared = 103 kB); cập nhật điểm trước/sau 1–5 trong `AUDIT_REPORT.md` và `.planning/HANDOFF.md`.


## REDESIGN-PROMPT — 2026-11-15
- [x] (complete) Read shared conversation, reconciled current product changes, persisted decisions in docs/EDUCAREAI_VISION_AND_DECISIONS.md and created docs/EDUCAREAI_REDESIGN_PROMPT.md. Documentation only; completed implementation phases preserved. Application redesign has not been executed in this task.

---

# Kế hoạch Triển khai Redesign EDUCARE AI (theo docs/EDUCAREAI_REDESIGN_PROMPT.md)

> **Cập nhật**: `2026-11-15T23:48:00+07:00`
> **Trạng thái tổng thể**: `in_progress`

- [x] **TR-1 — Audit Hiện trạng & Chốt Hướng Thiết kế (`complete`)**: Đối chiếu sitemap 4 cổng, khảo sát các điểm thừa, chốt bảng ánh xạ route/nhóm điều hướng, wireframe, type scale (body 16px, input 16px, table 14px, heading 20-28px).
- [x] **TR-2 — Nền tảng Component & Navigation Dùng chung (`complete`)**: Nâng cấp `src/lib/theme.ts`, `globals.css`, `AppSidebar` (nhóm menu theo mục đích, bỏ nhãn kỹ thuật "Sandbox"/"3 Tab", active state rõ), `AppHeader` (breadcrumb gọn, search, user menu), tạo `BottomNav` mobile cho Học sinh/Phụ huynh (≤2 thao tác tới tác vụ chính), chuẩn hóa `PageHeader`, `OceanButton` (vùng chạm 44px), `DataTable`, `EmptyState`.
- [x] **TR-3 — Nhóm 1: Không gian Học sinh & Luồng Mẫu Chuẩn (`complete`)**: Redesign `/hoc-sinh/tong-quan` (nửa trên: "Hôm nay em cần làm gì?", bài học tiếp tục, bài cần nộp, phản hồi; nửa dưới: tiến độ thật, không bịa KPI), `/hoc-sinh/mon-hoc` & `mon-hoc/[id]` (mục tiêu -> nội dung -> bài tập), `/hoc-sinh/bai-tap` & `bai-tap/[id]` (rubric, nộp bài, upload tệp, xác nhận, thay thế tên gán cứng bằng chức danh sư phạm).
- [x] **TR-4 — Nhóm 2: Bàn làm việc Giáo viên & Chấm bài Rubric (`complete`)**: Redesign `/giao-vien/tong-quan` (hàng đợi cần xử lý: bài nộp chờ chấm, duyệt game, lịch dạy), `/giao-vien/cham-bai` & `TeacherGradingWorkspace` (danh sách học sinh, bài làm, rubric 4 mức, chuyển bài không mất dữ liệu), `/giao-vien/bai-giang` (biên tập bài giảng rõ ràng, tạo bài kèm liên kết Docs), `/giao-vien/ngan-hang-cau-hoi` (chuẩn hóa bảng và nút thao tác).
- [x] **TR-5 — Nhóm 3: Xưởng Trò chơi HTML, Sáng tạo & Trung tâm AI (`complete`)**: Redesign `/hoc-sinh/xuong-tro-choi` (tách tab "Chơi trò đã duyệt" và "Tạo trò chơi của em", sandbox an toàn, nhãn điểm tự luyện trung thực), `/giao-vien/duyet-tro-choi`, `/hoc-sinh/sang-tao-cung-ai` / `ai-tutor` (gợi ý theo ý định: giải thích, luyện tập, sáng tạo; không che khuất nội dung).
- [x] **TR-6 — Nhóm 4: Báo cáo Tiến bộ & Cổng Phụ huynh (`complete`)**: Redesign `/giao-vien/phan-tich` (dữ liệu thật từ Attempt & LearningRecord), `/hoc-sinh/ho-so-nang-luc`, `/phu-huynh/*` (chọn con, điểm mạnh & cần rèn luyện ngôn ngữ dễ hiểu, trung thực, không bịa xếp loại).
- [x] **TR-7 — Nhóm 5: Quản trị Hệ thống, Tài khoản & Tích hợp (`complete`)**: Redesign `/quan-tri/tong-quan`, `/quan-tri/nguoi-dung` (cấp mã HS không email, nhập Excel/CSV, hiển thị mật khẩu tạm an toàn 1 lần), `/admin/settings/integrations` (chia nhóm Google Workspace, Gemini Server API, Gems theo luồng rõ ràng, secret write-only).
- [x] **TR-8 — Nhóm 6: Trang Công khai & Xác thực (`complete`)**: Redesign `/`, `/dang-nhap` (đăng nhập bằng mã HS hoặc email, hướng dẫn lấy lại mật khẩu liên hệ giáo viên/quản trị), `/dang-ky`, `/dat-lai-mat-khau`, `/khong-co-quyen`, `/privacy`, `/terms`.
- [x] **TR-9 — Kiểm thử Toàn diện, Đối chiếu Responsive & Nghiệm thu (`complete`)**: `prisma validate` (PASS), `tsc --noEmit` (PASS), `pnpm test` (53/53 PASS trên 8 suites), `pnpm build` (PASS, First Load JS 103 kB), 27/27 static/dynamic pages compiled cleanly, responsive typography và touch targets tuân thủ chuẩn WCAG 2.2 AA.

## SGK và demo lớp 6 (Bộ Kết nối tri thức với cuộc sống) — 2026-11-14 / Hợp nhất `8ba7f7c` ngày 2026-11-16
- [x] **S1 (`complete`)**: Phân lớp 2 SGK KNTT Lớp 6 Tập 1 vào `SGK/Lop_6/{Toan,Ngu_van}/Tap_1/` và `D:\UNIGO\SGK\Lớp_6\{Toan,Ngu_van}\Tap_1\`, tạo `SGK/sgk-kntt-manifest.json`, bổ sung node `Lop_6/Tap_1` vào `EDUCARE_DRIVE_FOLDER_TREE` và action `SYNC_LOCAL_SGK_TO_DRIVE` (`src/lib/google-workspace.ts`, `src/app/api/google/workspace/route.ts`).
- [x] **S2 (`complete`)**: Cập nhật học liệu, bài tập, đề cương ôn HK1, đề kiểm tra thử, đáp án và 2 trò chơi HTML × 8 câu/môn (`src/lib/grade6-demo.ts`, `src/lib/review-prompts.ts`) đối chiếu chính xác Mục lục KNTT Tập 1 (`trang PDF = trang in + 1`).
- [x] **S3 (`complete`)**: Nâng cấp `ReviewStudio.tsx` (`/giao-vien/on-tap`, `/hoc-sinh/on-tap`), `/api/review/generate`, xuất lại `output/grade6-demo/` (`scripts/export-grade6-demo.ts`), cập nhật `tests/grade6-demo.test.ts` và hợp nhất sạch với `origin/main` (`8ba7f7c`).

- [x] (complete) Soạn prompt triển khai luồng học sinh, trò chơi, Drive, Sheets và chatbot theo lớp/môn (18/11/2026). Tệp bàn giao: `docs/PROMPT_TRIEN_KHAI_LUONG_HOC_SINH.md`.


---

# Kế hoạch Thực thi Trải nghiệm Học sinh & Đồng bộ Giáo viên (`docs/PROMPT_TRIEN_KHAI_LUONG_HOC_SINH.md`) — 2026-11-18

> **Bắt đầu**: `2026-11-18T16:28:00+07:00`
> **Hoàn tất**: `2026-11-18T19:50:00+07:00`
> **Trạng thái**: `complete`

- [x] **SL-1 — Mục 1: Cho học sinh tìm được bài học và bài kiểm tra (`complete`)**:
  - Từ `/hoc-sinh/tong-quan` có nút **Kiểm tra** dễ thấy trên mobile & desktop dẫn thẳng tới `/hoc-sinh/kiem-tra?mode=EXAM` (<= 2 thao tác), tách biệt rõ với **Luyện tập** (`PRACTICE`) và **Bài tập & Nộp bài** (`/hoc-sinh/bai-tap`).
  - Từ `/hoc-sinh/tong-quan` có đường **Học tiếp** tới đúng môn/bài của học sinh; trong bài đặt tên bài + mục tiêu ngắn phía trên học liệu, tiếp theo là **Luyện bằng trò chơi**, **Hỏi gia sư môn này** và **Bài kiểm tra liên quan** (giữ ngữ cảnh lớp, môn, bài qua query/state).
  - Trong `/hoc-sinh/kiem-tra`: trước khi làm hiện môn, thời lượng, số lượt được phép, trạng thái; sau khi nộp hiện số lần đã nộp, điểm/thang điểm, chính sách xem đáp án, hành động tiếp theo; khôi phục lượt đang làm (`IN_PROGRESS`) sau tải lại; khi chưa có đề hiện `"Lớp em chưa có bài kiểm tra được giao"` + nút quay lại học; lỗi tải có nút thử lại; ngừng gọi API lặp vô hạn.
- [x] **SL-2 — Mục 2: Dán link Google Drive và xem ảnh ngay trong bài (`complete`)**:
  - Đưa **Dán liên kết Drive** lên làm cách thêm học liệu chính trong `TeacherLessonsClient.tsx` (kèm tên tài liệu, mô tả ảnh, xem trước ngay trước khi lưu, báo lỗi cạnh ô link, fallback sang dán link ngay khi upload tệp gặp lỗi).
  - Tạo bộ phân tích & chuẩn hóa URL Google Drive (`src/lib/drive-url.ts`): chỉ nhận HTTPS hostname Google hợp lệ, hỗ trợ `drive.google.com/file/d/<id>/view`, `drive.google.com/open?id=<id>`, giữ `resourcekey`, nhận diện `IMAGE`, `PDF`, `DOC_SLIDE_SHEET`, `FOLDER`, `OTHER_FILE`.
  - Hiển thị nội dung ảnh Drive trực tiếp trong bài (`/hoc-sinh/mon-hoc/[id]` & `PilotLearningHub.tsx`) với khung giữ chỗ responsive, mô tả ảnh, fallback sang trình xem nhúng hoặc nút **Mở trong Drive** và lời giải thích có điều kiện khi trình duyệt chặn nhúng / thiếu quyền (không báo giả "tệp đã bị xóa").
- [x] **SL-3 — Mục 3: Ghi điểm và số lần làm từ ứng dụng sang Sheets (`complete`)**:
  - Chuẩn hóa quy tắc đếm lượt trong `/api/tin-hoc/assessments/route.ts` và `/api/tin-hoc/game-plays/route.ts` (và nối `PilotLearningHub.tsx` gọi `/api/tin-hoc/game-plays` khi hoàn tất lượt chơi với nhãn **Tự luyện**): lưu `attemptNumber` khi bắt đầu, `"Số lần đã nộp"` chỉ tính lượt hoàn tất hợp lệ cùng học sinh + bài + chế độ; mở lại/lưu nháp/nhấn nộp 2 lần/retry mạng vẫn giữ cùng 1 `Attempt.id`; điểm `0` là hợp lệ, chưa chấm để `null`.
  - Mở rộng `syncClassTrackingSheet` (`src/lib/google-workspace.ts`) với `buildClassTrackingAttemptSheets`: xuất bảng chi tiết **mỗi lượt đã nộp một dòng** (`tab7_ChiTietLuotNop`) + bảng tổng hợp theo `HS/bài/chế độ` (`tab8_TongHopKetQua`), đối soát theo `record_id` khi retry, bảo toàn ghi chú giáo viên, chống Formula Injection, chỉ báo `SYNCED` khi Google API xác nhận.
- [x] **SL-4 — Mục 4: Thiết kế lại trò chơi HTML và mở rộng ngân hàng câu hỏi (`complete`)**:
  - Thiết kế lại bộ sinh HTML game (`src/lib/demo-game-html.ts` & `PilotLearningHub.tsx`) theo chuẩn Ocean Blue: màn vào có mục tiêu + nút **Bắt đầu**, trong lượt chơi nổi bật câu hỏi `"Câu 3/10"`, vùng chạm >= 44px, hỗ trợ cả bàn phím và chạm cho 3 dạng tương tác (Chọn đáp án `MCQ`, Ghép cặp `MATCH`, Sắp xếp thứ tự `ORDER`), màn cuối có điểm, câu cần ôn, **Chơi lại** và **Về bài học**.
  - Mở rộng ngân hàng câu hỏi cho 3 bài Tin học thí điểm khối 6, 7, 8 trong `src/lib/pilot-curriculum.ts` & `src/lib/pilot-questions-bank.ts`: mỗi bài có **20 câu riêng biệt** đã đối chiếu SGK (tổng **60 câu**), mỗi lượt chơi rút 10 câu không lặp.
- [x] **SL-5 — Mục 5: Tách gia sư Gemini theo lớp và môn (`complete`)**:
  - Nâng cấp `/api/ai/chat/route.ts`, `src/lib/ai-tutor-config.ts` và `/hoc-sinh/ai-tutor/page.tsx`: lấy lớp thực, khối, môn, bài từ session + dữ liệu server; chọn cấu hình theo `lớp cụ thể + môn` -> fallback `khối + môn`; điền đúng mẫu System Prompt tiếng Việt chuẩn (kèm chế độ server xác định, khóa đáp án khi đang có bài kiểm tra, lọc PII); cô lập lịch sử hội thoại theo `studentId + className + subject + lessonTitle`, hủy/bỏ qua phản hồi mạng về muộn khi chuyển môn; hỗ trợ 3 nút gợi ý (**Giải thích khái niệm**, **Gợi ý bước tiếp theo**, **Cho em luyện một câu**) và câu mở đầu mẫu; xử lý IME-safe Enter khi gõ dấu tiếng Việt; hiển thị nút **Mở Gem** + **Sao chép câu hỏi** theo lớp/môn hoặc báo `"Lớp em chưa có Gem môn này"`.
- [x] **SL-6 — Kiểm thử Tự động, Kiểm chứng CSDL Thực & Lưu vết Bàn giao (`complete`)**:
  - Đã viết `tests/student-journey-e2e.test.ts` kiểm chứng cả 5 mục: `prisma validate` PASS, `tsc --noEmit` PASS (0 lỗi), `pnpm test` **67/67 PASS (10 suites)**, `pnpm build` **PASS (28/28 routes, shared JS 103 kB)**.
  - Đã chạy kiểm chứng E2E trực tiếp trên CSDL với tài khoản học sinh thí điểm (`HS26-6A1-01`, `HS26-7A1-01`), xác nhận đối soát 2 lượt làm bài (`6/10` rồi `8/10`) + 1 lượt chơi game tự luyện sang `tab7_ChiTietLuotNop` và `tab8_TongHopKetQua`.
