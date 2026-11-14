# BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOFF) — EDUCARE AI

> **Cập nhật lần cuối**: `2026-11-14T09:57:00+07:00`
> **Trạng thái**: **ĐÃ SỬA LỖI GOOGLE OAUTH CALLBACK (`[GOOGLE_ID_TOKEN_INVALID] TOKEN_EXPIRED`) + HOÀN TẤT EDUCARE AI 3.0** — `prisma validate` PASS, `tsc --noEmit` PASS, `pnpm test` 37/37 PASS, `pnpm build` PASS.

## 0. Bản vá mới nhất (`fix(auth)` Google OAuth Callback)
- [src/lib/auth.ts](file:///d:/Educare_AI/src/lib/auth.ts): `validateGoogleIdTokenClaims` hỗ trợ ép kiểu `exp`/`iat` dạng `string` từ Google `tokeninfo`, kiểm tra `options.verifiedByGoogleTokenInfo` tránh hết hạn giả do lệch đồng hồ hệ thống, chuẩn hóa `.trim()` cho `aud`/`iss`, và `authenticateVerifiedGoogleUser` cho phép nâng cấp `googleSub` giả lập cũ (`google-oidc-sub-...`) sang Google `sub` thật dạng số (`/^\d+$/`).
- [src/app/api/auth/google/callback/route.ts](file:///d:/Educare_AI/src/app/api/auth/google/callback/route.ts): Truyền `{ verifiedByGoogleTokenInfo: tokenInfoRes.ok }`, lưu `googleSub` vào `GoogleConnection`, bọc `prisma.googleConnection.upsert` trong `try/catch` để không chặn luồng tạo phiên đăng nhập.
- [tests/submission-and-rbac.test.ts](file:///d:/Educare_AI/tests/submission-and-rbac.test.ts): Bổ sung 4 unit tests kiểm thử `validateGoogleIdTokenClaims` (37/37 PASS trên 7 suites).

## 1. Tiến độ EDUCARE AI 3.0 hiện tại
- **Phase A–C (`complete`)**: Cài `framer-motion@14.12.0`, nâng cấp `tailwind.config.ts` (đã gỡ alias `brand.teal` và hoàn thiện thang `ocean-50..950`), `globals.css`, `next.config.ts`, tạo `src/lib/motion.ts` & `src/lib/theme.ts`, dựng toàn bộ thư viện `src/components/ui/*` (20 components + `AuthSplitShell` + `RoleSwitcher`) và nâng cấp `AppShell`, `AppSidebar`, `AppHeader`, `FloatingAIAssistant`, `loading.tsx`.
- **Phase D & E (`complete`)**: Redesign Split-Screen Auth (`/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/khong-co-quyen`), Trang chủ `/` và 5 Role Dashboards (`/admin/overview`, `/quan-tri/tong-quan`, `/giao-vien/tong-quan`, `/hoc-sinh/tong-quan`, `/phu-huynh/tong-quan`).
- **Phase F (`complete`)**: Hoàn tất Batch 1–5 (`/privacy`, `/terms`, `/embed/tro-choi/[slug]`, `/admin/settings/integrations`, `quan-tri/*`, `giao-vien/*`, `hoc-sinh/*`, `phu-huynh/*`); sửa `giao-vien/lop-hoc`, `giao-vien/phan-tich`, `hoc-sinh/san-pham`, `phu-huynh/diem-manh-can-cai-thien` thay thế mọi fallback/chỉ số tĩnh bằng dữ liệu thật hoặc `"Chưa có dữ liệu"`; xác nhận `0` token `brand-teal`/`teal-*`/`#197C78`/`#146562`/`#E7F2F1` và `0` thẻ `<img>` thuần còn lại trong `src/`.
- **Phase G (`complete`)**: `LazyMotion features={domAnimation}` + `<MotionConfig reducedMotion="user">`, `@media (prefers-reduced-motion: reduce)` trong `globals.css`, lazy-load `SandboxedHtmlGamePlayer` (`xuong-tro-choi`, `duyet-tro-choi`) và `FloatingAIAssistant` (`AppShell`) qua `next/dynamic`.
- **Phase H (`complete` ngoại trừ `chrome_devtools` bị chặn)**:
  - `pnpm exec prisma validate` → **PASS**
  - `pnpm exec tsc --noEmit` → **PASS (0 errors)**
  - `pnpm test` → **33/33 PASS** (6 suites)
  - `pnpm build` (với quyền mạng cho `next/font/google`) → **PASS** (`First Load JS shared by all: 103 kB`; `/_next/static/css/d8ff7d670f8dc374.css`: 78,649 bytes, có `#2563eb` và `prefers-reduced-motion`, không còn `#197c78`)
  - Server production `pnpm start` đang chạy tại `http://localhost:3000`: 10/10 trang công khai trả HTTP 200 (`OldTeal=False`, `SecretLeak=False`, `FontVar=True`); 5/5 portal theo vai trò trả HTTP 307 redirect về `/dang-nhap`.
  - **OAuth env hardening**: [google-workspace.ts](file:///d:/Educare_AI/src/lib/google-workspace.ts) đã thêm `.trim()` + bỏ dấu ngoặc bao quanh cho `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`. Lưu ý đồng bộ biến môi trường Vercel & Google Cloud Console nếu trước đó gặp `invalid_client`.

## 1. Tóm tắt kết quả đã hoàn thành
Toàn bộ yêu cầu trong `docs/LMS_MASTER_PROMPT.md`, `docs/LMS_DATA_DESIGN.md` và `docs/LMS_QA_2026-11-12.md` đã được triển khai và kiểm chứng:
1. **Cô lập HTML Game & CSP (`T1.1`, `T1.2`)**:
   - `wrapHtmlWithStrictCsp` (`src/lib/html-game-sandbox.ts`) luôn đặt `<meta CSP>` ở đầu tài liệu trước mọi script/comment, loại bỏ `<meta http-equiv="refresh">` và `<base>`.
   - Route `/api/game-frame` trả HTTP header `Content-Security-Policy` chuẩn.
   - Đồng bộ tên sự kiện `postMessage` trong `src/components/game/SandboxedHtmlGamePlayer.tsx`.
   - `node scratch/lms-sandbox-audit.cjs`: **7/7 PASS**.
2. **Bảo mật RBAC, Chống IDOR & Chống Race Condition (`T1.5`, `T1.7`)**:
   - `src/lib/submission-guard.ts`: `withKeyLock`, `validateAssignmentSubmissionRules`, `verifyTeacherClassScope`, `submitAssignmentTransactional`.
   - Đã áp dụng trên `/api/submissions`, `/api/grading`, `/api/tin-hoc/assessments`, `/api/assets`, `/api/sheets/import`, và `syncClassTrackingSheet`.
3. **Loại bỏ dữ liệu giả & Chống Formula Injection (`T1.3`, `T1.4`, `T3.4`, `T3.5`)**:
   - `src/lib/google-workspace.ts`: `sanitizeSheetCell`, `sanitizeSheetRows`, `resolveGoogleIntegrationMode` (chỉ báo `DISCONNECTED`/`DEMO` khi chưa có Google API thật), lọc theo `classId` + `academicYearId`, nối đúng `StudentProfile.userId` cho `Attempt.studentId`, xóa toàn bộ `"8.45"`, `"83%"`, nhận xét giả, log AI giả.
   - Đã làm sạch các trang `/giao-vien/phan-tich`, `/hoc-sinh/ho-so-nang-luc`, `/phu-huynh/tong-quan`, `/phu-huynh/bai-tap-kiem-tra`, `/phu-huynh/diem-manh-can-cai-thien`.
4. **Kho Học liệu & Tải tệp Đa định dạng (`T2.1`, `T2.2`)**:
   - `src/lib/asset-validation.ts`, `/api/assets`, `/api/assets/[id]`, `src/components/assets/MultiFileAssetUploader.tsx`.
   - Tích hợp vào `AssignmentSubmissionForm.tsx` và `TeacherLessonsClient.tsx`.
5. **Pipeline Nhập Google Sheets & Công thức Đánh giá Minh bạch (`T3.1`, `T3.2`, `T3.3`)**:
   - `src/lib/sheets-import-pipeline.ts` và `/api/sheets/import`.
6. **Cổng Tích hợp `IntegrationSlot` & Hợp nhất Điều hướng AI (`T1.6`, `T4.1`, `T4.2`)**:
   - `src/lib/integration-slots.ts`, `/api/integrations/slots`, `src/components/ai/StudentAiCenterTabs.tsx`, `src/app/hoc-sinh/gemini-gems/GeminiGemsClient.tsx`, `src/components/layout/AppSidebar.tsx`.

## 2. Bằng chứng Kiểm thử & Build
- `node scratch/lms-sandbox-audit.cjs` → **7/7 PASS**
- `pnpm test` (`tsx --test tests/*.test.ts`) → **33/33 PASS** (6 suites)
- `pnpm exec prisma validate` → **PASS**
- `pnpm exec tsc --noEmit` → **PASS** (0 errors)
- `pnpm build` → **PASS** (Next.js 15 production build thành công toàn bộ routes)

## 3. Hướng dẫn cho model/phiên tiếp theo (nếu có yêu cầu mở rộng thêm)
1. Đọc `.agents/skills/educare-session-handoff/SKILL.md` và `docs/LMS_IMPLEMENTATION_REPORT.md`.
2. Chạy `git status --short` và `pnpm test` để kiểm tra trạng thái.
