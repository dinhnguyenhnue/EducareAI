---
name: educare-uiux-performance
description: >-
  Quy trình tái sử dụng để khảo sát ngữ cảnh sản phẩm, thiết kế hệ thống UI Ocean Blue có bản sắc
  (anti-AI-slop), bảo đảm khả năng truy cập (WCAG 2.1/2.2 AA), responsive (320px–1440px), biểu mẫu
  an toàn bộ gõ tiếng Việt (IME-safe), tối ưu hiệu năng Core Web Vitals (LCP, CLS, INP) và tự thẩm định
  bằng bằng chứng (tĩnh & trình duyệt thật) cho hệ sinh thái học tập số EDUCARE AI (Next.js 15 App Router,
  React 19, Tailwind CSS, Framer Motion).
---

# EDUCARE AI — Skill Thiết kế UI/UX, Khả năng Truy cập & Hiệu năng Hiện đại (`educare-uiux-performance`)

> **Lưu ý tương thích**: Skill này bổ trợ cho `.agents/skills/educare-session-handoff/SKILL.md` (luôn chạy trước tiên ở đầu phiên). Mọi quyết định về dữ liệu và bảo mật phải tuân thủ `AGENTS.md` (không bịa số liệu, không chạy seed/purge trên DB thật, không lộ secret).

---

## 1. Nguồn Tham khảo Đã Khảo sát & Bản quyền

Skill này tổng hợp nguyên tắc từ **4 nguồn tham khảo** đã khảo sát trực tiếp trên máy cục bộ. Chỉ chắt lọc quy trình, tiêu chuẩn kỹ thuật và quy tắc kiểm chứng phù hợp với kiến trúc EDUCARE AI; **tuyệt đối không** sao chép nguyên văn tài liệu, mã nguồn mẫu, biểu tượng hay tài sản có bản quyền:

| Nguồn tham khảo | Đường dẫn thực tế & Phiên bản đã khảo sát | Giấy phép | Tài liệu nguồn tiêu biểu đã đối chiếu | Đóng góp cốt lõi cho EDUCARE AI |
|---|---|---|---|---|
| **1. Google Chrome Modern Web Guidance** | `D:\AI\Repos\modern-web-guidance`<br>Commit: `4dd9683` (`Release v1.0.0`)<br>Skill version: `2026_11_09-5bcc021b` | **Apache-2.0** | • `README.md`, `LICENSE`, `CONTRIBUTING.md`<br>• `skills/modern-web-guidance/SKILL.md`<br>• `skills/modern-web-guidance/guides/user-experience/content-first-noise-reduction.md`<br>• `skills/modern-web-guidance/guides/user-experience/form-factor-adaptation.md`<br>• `skills/modern-web-guidance/guides/user-experience/natural-interactions.md`<br>• `skills/modern-web-guidance/guides/visual-design/color.md`<br>• `skills/modern-web-guidance/guides/visual-design/typography.md`<br>• `skills/modern-web-guidance/guides/visual-design/visually-stable-font-fallbacks.md`<br>• `skills/modern-web-guidance/guides/css/responsive-design.md`<br>• `skills/modern-web-guidance/guides/accessibility/accessibility.md`<br>• `skills/modern-web-guidance/guides/accessibility/accessible-error-announcement.md`<br>• `skills/modern-web-guidance/guides/ui-components/dialog.md`<br>• `skills/modern-web-guidance/guides/ui-components/tabs.md`<br>• `skills/modern-web-guidance/guides/ui-behaviors/physics-based-easing.md`<br>• `skills/modern-web-guidance/guides/performance/defer-rendering-heavy-content.md`<br>• `skills/modern-web-guidance/guides/performance/break-up-long-tasks.md`<br>• `skills/modern-web-guidance/guides/forms/ime-safe-enter-submit.md` | • **Content-First & Interruption Budget**: Thanh dính `<12%` chiều cao viewport; khớp mức độ ngắt quãng với rủi ro nghiệp vụ (chỉ dùng modal chặn trang cho hành động hệ trọng).<br>• **Typography & Reflow**: Đảm bảo chữ phóng to được tới **200%** mà không mất nội dung/chức năng (WCAG 1.4.4) và không tràn ngang ở `320px–375px` (WCAG 1.4.10); kỹ thuật hướng dẫn khi dùng `clamp()` là giữ `max <= 2.5 * min` với đơn vị `rem`; dùng `min-block-size`/`min-h-*` thay vì `height` cứng trên nút/thẻ chứa chữ (WCAG 1.4.12).<br>• **Color & Non-text Contrast (WCAG 1.4.1, 1.4.11)**: Viền ô nhập/control độc lập và vòng `:focus-visible` đạt tương phản `>= 3:1`; hỗ trợ `@media (forced-colors: active)`; ưu tiên token màu định sẵn thay vì tự dịch kênh `L` trong OKLCH chưa có gamut mapping.<br>• **IME-Safe Enter Submit**: Kiểm tra `event.nativeEvent.isComposing || event.keyCode === 229` trên mọi ô chat/tìm kiếm bắt phím `Enter` để không gửi nhầm khi người dùng đang gõ dấu tiếng Việt (Telex/VNI).<br>• **Core Web Vitals (LCP, CLS, INP)**: Giữ chỗ kích thước media (`aspect-ratio`), chống nhảy bố cục khi đổi font (`font-size-adjust` / metric overrides), trì hoãn render dưới màn hình (`content-visibility: auto` + `contain-intrinsic-size`), chia nhỏ tác vụ dài `>50ms` (`scheduler.yield()` kèm fallback `setTimeout`). |
| **2. Impeccable** | `D:\AI\Repos\impeccable`<br>*(Đường dẫn dự kiến cũ `D:\AI\impeccable` không tồn tại)* | **Apache-2.0** | • `.agents/skills/impeccable/SKILL.md`<br>• `reference/product.md`<br>• `reference/audit.md` | • **Product Register (Earned Familiarity)**: Giao diện cổng trường học phải phục vụ công việc dạy và học — rõ ràng, nhất quán, không đánh đố.<br>• **Anti-AI-Slop Bans**: Cấm chữ tô gradient (`bg-clip-text text-transparent`), cấm viền lệch một bên (`border-l-4`) làm trang trí thẻ, cấm bo góc quá đà (`>24px` cho panel), cấm lạm dụng `backdrop-blur` trên thẻ tĩnh.<br>• **Severity Tagging**: Phân loại phát hiện `P0` (chặn luồng) → `P1` (vi phạm WCAG AA / lỗi chức năng) → `P2` (bất tiện nhỏ) → `P3` (đánh bóng). |
| **3. UI UX Pro Max** | `D:\AI\Skills\ui-ux-pro-max-skill` | **MIT** | • `.claude/skills/ui-ux-pro-max/SKILL.md`<br>• `.claude/skills/design-system/SKILL.md` | • **Thứ tự ưu tiên 10 tầng**: Accessibility → Touch & Interaction → Performance → Style Selection → Layout & Responsive → Typography & Color → Animation → Forms & Feedback → Navigation → Charts & Data.<br>• **Kiến trúc Token 3 lớp**: `Primitive` (`--ocean-primary`, `#2563EB`) → `Semantic` (`--canvas`, `--surface`, `--ink`, `--status-*`) → `Component` (`MODULE_THEMES` trong `src/lib/theme.ts`). |
| **4. EvondevKit** | `D:\AI\Repos\evondevKit` | **MIT** | • `skills/ui-ux/SKILL.md`<br>• `skills/ui-ux/references/principles.md`<br>• `skills/ui-ux/references/checklist.md` | • **Cổng chặn Audit trước khi viết code**: Kiểm kê `src/components/ui/*` và `src/lib/theme.ts` trước khi dựng màn hình; tái sử dụng `Modal`, `Drawer`, `DataTable`, `Tabs`, `PageHeader`, `StatCard`, `OceanButton`, `EmptyState`, `ErrorState`.<br>• **Đủ 8 trạng thái & Ca biên tiếng Việt**: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `empty`, `error`; kiểm thử tên tiếng Việt dài 4–6 từ và trường hợp `0` bản ghi. |

---

## 2. Phân tích Ngữ cảnh Sản phẩm & Hệ thống Vai trò Trước Khi Chọn Hướng Thị giác

Trước khi tạo hoặc sửa bất kỳ trang nào, agent **bắt buộc** đối chiếu đúng mô hình vai trò và phân hệ thực tế trong mã nguồn (`src/lib/session-token.ts`, `src/context/RoleContext.tsx`, `src/middleware.ts`, `src/app/page.tsx`, `src/app/dang-ky/page.tsx`) để tránh áp dụng mẫu giao diện rập khuôn:

1. **Bản chất sản phẩm (Product Register)**:
   - EDUCARE AI là **Hệ sinh thái Học tập Số & LMS AI Socratic (Trường Tiểu học & THCS UNIGO)** với trọng tâm triển khai hiện tại là môn Tin học THCS (Khối 6, 7, 8) kết hợp đồng bộ Google Workspace (Classroom, Sheets, Drive, Forms).
   - Giao diện thuộc nhóm **Educational Workspace & High-Trust Productivity**: cần nền sáng sủa (`--canvas: #F8FAFC`, `--surface: #FFFFFF`), chữ sắc nét (`--ink: #0F172A`), và điểm nhấn màu phân hệ có ngữ nghĩa sư phạm rõ ràng.
2. **Mô hình 6 Vai trò RBAC Hệ thống (`SystemRole`) & 4 Cổng Góc nhìn Giao diện (`ViewRole` / `UserRole`)**:
   Ứng dụng hiện tại định nghĩa **6 vai trò RBAC trong CSDL và phiên xác thực** (`src/lib/session-token.ts:6-12`, `src/app/quan-tri/nguoi-dung/UserManagementTable.tsx:231-236`), được ánh xạ vào **4 cổng góc nhìn giao diện chính** (`src/context/RoleContext.tsx:6`, `src/components/layout/RoleSwitcher.tsx:29-65`) trên **5 tiền tố đường dẫn được bảo vệ** (`src/middleware.ts:8-14`):
   - **Cổng Học sinh (`ViewRole: STUDENT` — đường dẫn `/hoc-sinh/*`)**:
     - Phục vụ vai trò hệ thống **`STUDENT`** (Học sinh Khối 6–8) và là góc nhìn mặc định khi ánh xạ vai trò **`COMMUNITY_USER`** (Thành viên Cộng đồng — đăng ký qua tab `"Cộng đồng"` tại `/dang-ky/page.tsx:29-41`, tham gia không gian `/hoc-sinh/cong-dong`).
     - Yêu cầu UX: Vùng bấm rõ ràng, chỉ dẫn từng bước, phản hồi AI Socratic khích lệ (gợi mở tư duy thay vì giải hộ), khu vực chạy thử trò chơi HTML Sandbox (`iframe` cô lập) an toàn.
   - **Cổng Giáo viên (`ViewRole: TEACHER` — đường dẫn `/giao-vien/*`)**:
     - Phục vụ vai trò hệ thống **`TEACHER`** (Giáo viên bộ môn; ngoài ra `SCHOOL_ADMIN` và `SUPER_ADMIN` cũng được phép truy cập theo `src/middleware.ts:32-34`).
     - Yêu cầu UX: Bàn làm việc mật độ thông tin hợp lý, chấm bài theo 4 tiêu chí Rubric nhanh, lọc/tìm kiếm ngân hàng câu hỏi tức thì, theo dõi trạng thái đồng bộ Google Sheets trung thực (`SYNCED` / `SYNC_ERROR` / `PENDING` / `NONE`).
   - **Cổng Phụ huynh (`ViewRole: PARENT` — đường dẫn `/phu-huynh/*`)**:
     - Phục vụ vai trò hệ thống **`PARENT`** (Phụ huynh học sinh).
     - Yêu cầu UX: Ngôn ngữ gần gũi, bảng tổng hợp chuyên cần và nhận xét điểm mạnh/điểm cần hỗ trợ rõ ràng, dễ đọc trên màn hình điện thoại (`375px`), trung thực tuyệt đối (chưa có dữ liệu phải ghi `"Chưa có dữ liệu"`).
   - **Cổng Quản trị viên (`ViewRole: ADMIN` — đường dẫn `/quan-tri/*` và `/admin/*`)**:
     - Phục vụ 2 vai trò quản trị hệ thống:
       1. **`SCHOOL_ADMIN`** (Quản trị nhà trường / Ban Giám hiệu): Truy cập `/quan-tri/*` (quản lý người dùng, nhập danh sách Excel UNIGO idempotent, cấu hình tích hợp AI, xem báo cáo trường).
       2. **`SUPER_ADMIN`** (Quản trị tối cao): Truy cập cả `/admin/*` (`/admin/overview`) lẫn `/quan-tri/*` và có quyền chuyển đổi giữa cả 4 góc nhìn (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) qua `RoleSwitcher` (`Multi-View Switcher`).
3. **Ngân sách gây chú ý (Noise & Interruption Budget — từ `guides/user-experience/content-first-noise-reduction.md`)**:
   - **Thanh điều hướng dính (`AppHeader`)**: Giữ trên **1 hàng duy nhất**, cao `64px` (`h-16`, chiếm `< 12%` chiều cao viewport desktop/mobile), không xếp chồng nhiều thanh banner cố định làm hẹp vùng đọc bài giảng.
   - **Khớp mức độ ngắt quãng với rủi ro (Match Interruption to Stakes)**:
     - *Hành động hệ trọng / Không thể hoàn tác hoặc biểu mẫu tạo mới có cấu trúc* (Xóa dữ liệu, thu hồi quyền, tạo bài giảng/bài tập/người dùng mới): Dùng hộp thoại chặn trang `<Modal>` (`role="dialog"`, `aria-modal="true"`).
     - *Phản hồi thường nhật* (Lưu kết quả chấm, gửi sản phẩm cộng đồng, đồng bộ hoàn tất): Dùng `useToast()` (`aria-live="polite"`) hoặc trạng thái nội tuyến (`role="status"` / `role="alert"`) — **cấm dùng `window.alert()` / `window.confirm()`**.

---

## 3. Hướng dẫn Thiết kế Trực quan (Visual Design & Identity)

*(Tách biệt rõ với các quy tắc kỹ thuật ở Mục 4 và Mục 5)*

### 3.1. Hệ Màu, Độ tương phản & Tokens (`guides/visual-design/color.md` + `DESIGN.md`)
1. **Kiến trúc Token 3 lớp**:
   - Luôn dùng biến CSS / class Tailwind từ `src/app/globals.css`, `tailwind.config.ts` và `getModuleTheme(tone)` trong `src/lib/theme.ts`.
   - **Quy tắc từ `guides/visual-design/color.md` về sinh dải màu động**: Trước khi tính toán màu động bằng CSS, luôn ưu tiên dùng token thiết kế định sẵn (`ocean-600`, `ocean-700`, `status-*`). Nếu cần pha màu nền tint trong CSS hiện đại, dùng `color-mix(in oklab, var(--ocean-primary) 12%, white)` thay vì tự tăng kênh Lightness trong `oklch()` (vì trình duyệt hiện chưa tự động gamut-mapping khi kênh `L` đẩy màu ra ngoài dải sRGB, dễ làm lệch sắc độ xanh dương).
2. **Độ tương phản văn bản & phi văn bản (WCAG 1.4.3 & 1.4.11)**:
   - **Văn bản (`WCAG 1.4.3`)**: Văn bản thường đạt tối thiểu `4.5:1` (`text-ink` `#0F172A` đạt `17.8:1`; `text-ink-muted` `#64748B` đạt `4.76:1` trên nền `#FFFFFF`). Không dùng `text-slate-400` cho nội dung cần đọc trên nền sáng.
   - **Thành phần phi văn bản (`WCAG 1.4.11 Non-text Contrast`)**:
     - Hiện tại trong EDUCARE AI, vòng `:focus-visible` dùng `outline: 2px solid #2563EB` (tương phản `5.17:1` trên `#FFFFFF`, đạt chuẩn `>= 3:1`), còn `--border` (`#E2E8F0`, tương phản `~1.22:1`) đóng vai trò đường chia thẻ trang trí kết hợp nền phân biệt (`bg-canvas` `#F8FAFC` vs `bg-surface` `#FFFFFF`).
     - Theo hướng dẫn tại `guides/visual-design/color.md`, khi thiết kế hoặc nâng cấp các ô nhập liệu (`input`, `select`, `textarea`) hoặc nút viền đứng trên nền đồng màu mà không có nền phân biệt, cần đảm bảo đường viền trạng thái mặc định/hover đạt tương phản tối thiểu `3:1` (ví dụ `#94A3B8` `slate-400` trở lên) hoặc có dấu hiệu hình thái rõ rệt.
3. **Không dùng màu sắc đơn độc để truyền tải trạng thái (`WCAG 1.4.1 Use of Color`)**:
   - Mọi huy hiệu trạng thái (`GRADED`, `SUBMITTED`, `SYNC_ERROR`, `SYNCED`), thông báo lỗi biểu mẫu và tab đang chọn phải kết hợp **Màu sắc + Nhãn chữ tiếng Việt + Biểu tượng (Icon) hoặc Hình thái (khung pill nổi / đường gạch chân)**.

### 3.2. Kiểu chữ, Nhịp điệu & Hiển thị Tiếng Việt (`guides/visual-design/typography.md` + `visually-stable-font-fallbacks.md`)
1. **Kết quả cần đạt về Phóng to Văn bản (`WCAG 1.4.4 Resize Text`) & Kỹ thuật `clamp()`**:
   - **Kết quả bắt buộc theo WCAG 1.4.4**: Văn bản phải có thể phóng to lên tới **200%** mà không làm mất nội dung hoặc chức năng. Luôn dùng đơn vị tương đối (`rem` qua các lớp `text-xs`, `text-sm`, `text-base` của Tailwind) thay vì khóa cứng `px` cho nội dung đọc.
   - **Kỹ thuật được hướng dẫn trong `guides/visual-design/typography.md`**: Khi sử dụng hàm `clamp(min, preferred, max)` có kết hợp đơn vị viewport (`vw`) cho tiêu đề co giãn (fluid typography), đặt `min` và `max` bằng đơn vị `rem`, kết hợp `rem + vw` ở tham số giữa, và giữ **`max <= 2.5 × min`**. Đây là kỹ thuật thực hành giúp đảm bảo khi người dùng phóng to trình duyệt (tối đa 500%), cỡ chữ vẫn vượt qua ngưỡng 200% so với kích thước ban đầu.
2. **Chiều dài dòng & Ngắt dòng thẩm mỹ**:
   - Khối văn bản bài giảng và giải thích AI giới hạn ở `60ch–75ch` (`max-w-2xl` hoặc `max-w-3xl`).
   - Áp dụng `text-balance` (`text-wrap: balance`) **chỉ trên tiêu đề (`h1–h3`)** và các khối chữ ngắn `<= 6 dòng` (tránh đặt lên các hộp có viền/nền kéo dài toàn chiều ngang nếu không căn giữa).
   - Áp dụng `text-pretty` (`text-wrap: pretty`) **chỉ trên đoạn văn (`p`, `li`)** để tránh từ đơn lẻ rớt dòng cuối. **Cấm** đặt `text-wrap: balance` hoặc `pretty` lên bộ chọn toàn cục `*` vì gây tốn chi phí tính toán bố cục.
3. **Số liệu bảng biểu**:
   - Mọi cột điểm số, tỷ lệ phần trăm, thời gian làm bài và mã định danh phải gắn `tabular-nums` (ưu tiên kèm `font-mono` — `JetBrains Mono`) để các chữ số thẳng hàng dọc.
4. **Ổn định phông chữ khi tải (`guides/visual-design/visually-stable-font-fallbacks.md`)**:
   - Hiện tại `src/app/layout.tsx` nạp `Plus_Jakarta_Sans` và `JetBrains_Mono` qua `next/font/google` với `display: "swap"` (Next.js tự động sinh `@font-face` metric overrides cho font dự phòng). Khi khai báo thêm phông chữ tùy chỉnh ngoài `next/font`, áp dụng `font-size-adjust: from-font` và các descriptor `ascent-override`/`descent-override`/`size-adjust` theo hướng dẫn để ngăn nhảy bố cục (CLS).

### 3.3. Quy tắc Chống Giao diện Rập khuôn / "AI Slop" (Bắt buộc)
Từ chối và viết lại ngay nếu xuất hiện các mẫu sau:
1. **Cấm chữ tô Gradient (`bg-clip-text text-transparent`)**: Tiêu đề phải dùng màu đặc độ tương phản cao (`text-ink`, `text-ocean-600`, hoặc `text-white` trên nền banner đậm).
2. **Cấm viền lệch một cạnh (`border-l-4`, `border-r-4`) làm trang trí thẻ**: Thay bằng viền mảnh toàn khối (`border border-border`), nền tint nhẹ (`theme.bgSoft`) và ô biểu tượng (`theme.iconBg`).
3. **Cấm lạm dụng Kính mờ (`backdrop-blur`) trên thẻ tĩnh**: Chỉ dùng `backdrop-blur` trên `AppHeader` dính, lớp phủ `Modal`/`Drawer`, hoặc pill nổi trên nền banner đậm.
4. **Cấm thẻ lồng trong thẻ nhiều tầng (Nested Cards)**: Nhóm thông tin con bên trong một panel dùng nền `bg-canvas` hoặc đường chia `divide-y divide-border/70`.
5. **Cấm nhãn in hoa trang trí tràn lan (Overused Uppercase Eyebrows)**: Chỉ dùng `uppercase tracking-wider` cho nhãn phân nhóm điều hướng, tiêu đề cột bảng hoặc nhãn trường biểu mẫu có chức năng phân loại thực sự.
6. **Cấm số liệu giả tạo**: Mọi chỉ số chưa có dữ liệu thật trong CSDL phải hiển thị `"Chưa có dữ liệu"` hoặc `null` kèm hướng dẫn tiếp theo.

---

## 4. Hướng dẫn Kỹ thuật: Responsive, Khả năng Truy cập (Accessibility) & Biểu mẫu (Forms/IME)

### 4.1. Thích ứng Đa thiết bị & Khả năng Co giãn Văn bản (`guides/user-experience/form-factor-adaptation.md`, `guides/css/responsive-design.md`)
1. **Không tràn ngang xuống tới 320px–375px (`WCAG 1.4.10 Reflow`)**:
   - Mọi phần tử con trong bố cục Flex/Grid chứa văn bản động (tên học sinh tiếng Việt dài, email, tên bài giảng) **bắt buộc có `min-w-0`** (`min-inline-size: 0`) để cho phép xuống dòng hoặc cắt chữ (`truncate`) thay vì đẩy vỡ chiều rộng khung cha.
   - Bảng dữ liệu rộng (`DataTable`) luôn bọc trong vùng `overflow-x-auto` cục bộ, tuyệt đối không để `document.documentElement.scrollWidth > window.innerWidth`.
2. **Dùng `min-block-size` (`min-h-*`) + `padding` thay cho `height` cố định (`WCAG 1.4.12 Text Spacing`)**:
   - Không khóa chết chiều cao cố định không thể giãn trên các nút bấm có chữ có thể xuống dòng, huy hiệu nhiều từ hoặc thẻ nội dung. Ưu tiên dùng `min-h-*` kết hợp `py-*` để khi người dùng tăng khoảng cách dòng (`1.5`), khoảng cách đoạn (`2em`), chữ (`0.12em`) hoặc từ (`0.16em`) theo WCAG 1.4.12, khung tự giãn theo nội dung mà không cắt mất dấu thanh tiếng Việt.
3. **Đơn vị Viewport Động & Vùng An toàn (`dvh` & `safe-area-inset-*`)**:
   - Với ngăn kéo toàn màn hình (`Drawer`), khung hội thoại nổi (`FloatingAIAssistant`) hoặc lớp phủ modal trên điện thoại, ưu tiên đơn vị `dvh` (`max-h-[85dvh]`, `min-h-dvh`) thay cho `100vh` tĩnh để không bị thanh địa chỉ trình duyệt di động che khuất nút hành động cuối trang.
   - Tôn trọng vùng an toàn thiết bị (`env(safe-area-inset-bottom)`) cho các nút nổi ở đáy màn hình.
4. **Kích thước vùng bấm (`WCAG 2.5.8` & `2.5.5`) và Thiết bị không có Hover (`@media (hover: none)`)**:
   - Mọi nút/liên kết tương tác đạt tối thiểu `24×24px` trên desktop (chuẩn WCAG 2.2 AA `2.5.8`) và ưu tiên nâng lên `44×44px` trên vùng chạm cảm ứng (`@media (pointer: coarse)`, chuẩn WCAG `2.5.5`).
   - **Cấm ẩn chức năng quan trọng chỉ sau `:hover`**: Mọi nút hành động trên thẻ hoặc hàng dữ liệu nếu hiện khi `:hover` thì **bắt buộc** phải hiện cả khi `:focus-within` (cho bàn phím) và trên màn hình cảm ứng (`@media (hover: none)`).

### 4.2. Khả năng Truy cập (Accessibility — `guides/accessibility/accessibility.md`, `guides/ui-components/dialog.md`, `guides/ui-components/tabs.md`)
1. **Ngữ nghĩa Landmark & Tiêu đề**:
   - Mỗi trang có đúng một `<main id="main-content" tabIndex={-1}>` và đúng một thẻ `<h1>` (thông qua `<PageHeader>`). Các vùng `<nav>` nếu xuất hiện nhiều hơn một lần trên trang phải có `aria-label` phân biệt rõ (`aria-label="Điều hướng chính"`, `aria-label="Liên kết tài khoản"`).
   - Luôn có liên kết bỏ qua điều hướng (`Skip Link` — `"Chuyển đến nội dung chính"`) là điểm dừng `Tab` đầu tiên trên trang.
2. **Hộp thoại Modal & Drawer (Top Layer / Portal Focus Containment)**:
   - Khi mở `<Modal>` hoặc `<Drawer>` modal (`src/components/ui/Modal.tsx`, `src/components/ui/Drawer.tsx`):
     1. Ghi nhận phần tử đang giữ focus (`previousFocusRef.current = document.activeElement`) **đồng bộ trước khi** chuyển focus vào trong hộp thoại.
     2. Chuyển focus vào phần tử tương tác đầu tiên được đánh dấu `data-autofocus` hoặc trường nhập/nút đóng bên trong hộp thoại.
     3. Bẫy vòng lặp `Tab` và `Shift+Tab` bên trong hộp thoại; nhấn `Escape` đóng hộp thoại.
     4. Khi đóng hộp thoại, trả focus về đúng phần tử đã kích hoạt nó (`previousFocusRef.current?.focus()`).
3. **Menu thả xuống (Disclosure vs WAI-ARIA Menu)**:
   - Với bảng chọn tài khoản, thông báo hoặc chuyển góc nhìn vai trò (`AppHeader.tsx`, `RoleSwitcher.tsx`) chứa các liên kết/nút bấm thông thường: sử dụng mẫu **WAI-ARIA Disclosure** (`aria-expanded={open}`, `aria-controls="..."`, đóng bằng `Escape` và click ngoài, điều hướng bên trong bằng `Tab` tự nhiên).
   - **Không** gán `role="menu"` / `role="menuitem"` trừ khi triển khai đầy đủ điều hướng phím mũi tên `ArrowUp`/`ArrowDown`/`Home`/`End` và quản lý `tabIndex` theo chuẩn WAI-ARIA Menu Widget.
4. **Giao diện Tab (`Tabs.tsx` — đối chiếu `guides/ui-components/tabs.md`)**:
   - Danh sách tab (`role="tablist"`) chỉ chứa các nút `<button type="button" role="tab" aria-selected={active}>`.
   - Hỗ trợ phím `ArrowLeft`, `ArrowRight`, `Home`, `End` để chuyển tab; chỉ tab đang chọn mới có `tabIndex={0}`, các tab còn lại đặt `tabIndex={-1}` (roving tabindex).
   - **Ghi chú về `focusgroup`**: Tài liệu `guides/ui-components/tabs.md` giới thiệu thuộc tính `focusgroup="tablist nomemory"` để trình duyệt tự xử lý điều hướng phím mũi tên. Tuy nhiên, **`focusgroup` là tính năng trình duyệt mới có độ phủ hạn chế** (mới hỗ trợ trên Chrome/Edge 150+, chưa hỗ trợ nguyên bản trên Firefox và Safari). Do đó, **chỉ sử dụng `focusgroup` khi đã kiểm tra khả năng hỗ trợ trên các trình duyệt mục tiêu và có phương án dự phòng phù hợp** (như nạp có điều kiện `@microsoft/focusgroup-polyfill` hoặc duy trì cơ chế roving `tabIndex` + xử lý phím mũi tên bằng React như trong `src/components/ui/Tabs.tsx` hiện tại).
   - Không chỉ báo tab đang chọn bằng màu chữ đơn thuần; luôn có hình thái đi kèm (khung pill nổi có `border` hoặc đường gạch chân `border`).
   - Khi số lượng tab nhiều trên màn hình hẹp, ưu tiên giữ thanh tab trên **1 hàng ngang** có cuộn (`overflow-x-auto`) và tự cuộn tab đang chọn vào vùng nhìn thấy (`scrollIntoView({ block: 'nearest', inline: 'nearest' })`) thay vì để các nút tab rớt thành nhiều hàng chồng chéo.
5. **Chế độ Tương phản Cao (`@media (forced-colors: active)`)**:
   - Đảm bảo vòng `:focus-visible` dùng `outline` (như `outline: 2px solid var(--ocean-primary)` trong `src/app/globals.css:104-107`) và chỉ báo tab đang chọn có `border` (`border-ocean-200/80` trong `src/components/ui/Tabs.tsx:90`) để không bị biến mất khi người dùng bật Windows Contrast Themes (do chế độ này tự động xóa `box-shadow` và `background`).

### 4.3. Biểu mẫu, Thông báo Lỗi & An toàn Bộ gõ Tiếng Việt (`guides/forms/ime-safe-enter-submit.md`, `guides/accessibility/accessible-error-announcement.md`)
1. **An toàn bộ gõ IME Tiếng Việt khi nhấn `Enter` (`guides/forms/ime-safe-enter-submit.md`)**:
   - Khi người dùng gõ tiếng Việt bằng bộ gõ IME (Unikey, EVKey, macOS/Windows Vietnamese Telex/VNI) hoặc gõ tiếng Nhật/Trung/Hàn, phím `Enter` đôi khi được dùng để xác nhận từ đang gõ.
   - Ở **mọi trình xử lý `onKeyDown` tùy chỉnh** bắt phím `Enter` để gửi dữ liệu (như ô chat AI hoặc ô tìm kiếm tùy chỉnh), **bắt buộc** kiểm tra trạng thái đang gõ tổ hợp phím trước khi gửi:
     ```tsx
     if (e.key === "Enter" && !e.shiftKey) {
       // Chặn gửi sớm nếu người dùng đang gõ tổ hợp IME (kèm keyCode 229 làm dự phòng cho Safari)
       if (e.nativeEvent.isComposing || e.keyCode === 229) {
         return;
       }
       e.preventDefault();
       handleSubmit();
     }
     ```
   - Với `<form onSubmit={...}>` dùng `<input>` đơn dòng không gắn `onKeyDown` tùy chỉnh (như hiện tại ở `FloatingAIAssistant.tsx`), trình duyệt tự động chặn gửi ngầm định khi IME đang hoạt động; tuy nhiên nếu chuyển sang `<textarea>` hoặc gắn `onKeyDown` bắt `Enter`, bắt buộc phải áp dụng đoạn kiểm tra trên. Luôn duy trì một nút `<button type="submit">` hiển thị rõ ràng.
2. **Nhãn và Thông báo Lỗi Biểu mẫu (`guides/accessibility/accessible-error-announcement.md`)**:
   - Mọi `<input>`, `<select>`, `<textarea>` phải có `<label htmlFor="...">` hiển thị rõ (không dùng `placeholder` thay cho nhãn).
   - Không gắn cứng `aria-invalid="true"` lên trường bắt buộc trống ngay khi vừa mở trang (tránh trình đọc màn hình báo lỗi trước khi người dùng kịp nhập). Khởi tạo `aria-invalid="false"` (hoặc chỉ đặt `aria-invalid="true"` kèm `aria-describedby` trỏ tới thông báo lỗi sau khi người dùng đã tương tác/rời trường hoặc sau khi bấm gửi thất bại).
   - Sau khi gửi biểu mẫu thất bại, hiển thị thông báo lỗi rõ ràng (*chuyện gì xảy ra, vì sao, cách sửa*) và chuyển focus về trường lỗi đầu tiên hoặc vùng thông báo lỗi.

---

## 5. Hướng dẫn Kỹ thuật: Hiệu năng (Core Web Vitals) & Chuyển động (Motion)

### 5.1. Tối ưu Core Web Vitals (`LCP`, `CLS`, `INP` — `guides/performance/defer-rendering-heavy-content.md`, `guides/performance/break-up-long-tasks.md`)
1. **Chống dịch chuyển bố cục (`CLS <= 0.1`, thực tế đạt `0.0000` trên các trang đã đo)**:
   - Mọi hình ảnh, khung nhúng trò chơi (`iframe`), biểu đồ và vùng tải dữ liệu bất đồng bộ phải khai báo kích thước giữ chỗ (`width`/`height`, `aspect-ratio`, hoặc `Skeleton` khớp chiều cao thật).
   - Thay đổi trạng thái trên nút bấm (`loading`) hoặc tab (`aria-selected`) **không được** làm thay đổi kích thước hộp (`padding`, `border`, `font-size`) gây giật cục các phần tử kế bên.
2. **Tối ưu Tốc độ Hiển thị Nội dung Chính (`LCP <= 2.5s`) và Trì hoãn Nội dung Nặng Dưới Màn hình**:
   - Sử dụng `next/dynamic` cho các thành phần nặng chỉ xuất hiện theo tương tác hoặc nằm ngoài luồng đọc đầu tiên (`FloatingAIAssistant`, `SandboxedHtmlGamePlayer`).
   - Với các danh sách dài hoặc khối nội dung phức tạp nằm **hoàn toàn bên dưới màn hình đầu tiên (below the fold)**, có thể áp dụng `content-visibility: auto` **bắt buộc đi kèm** `contain-intrinsic-size` (ví dụ `contain-intrinsic-size: auto none auto 320px`).
   - **Cấm** đặt `content-visibility: auto` lên các phần tử nằm trong màn hình đầu tiên (above the fold) như `PageHeader` hoặc hàng `StatCard` đầu trang vì sẽ làm chậm LCP. Khi dùng `content-visibility: auto`, bắt buộc kiểm tra điều hướng phím `Tab` tuần tự qua vùng dưới màn hình.
3. **Tối ưu Độ trễ Tương tác (`INP <= 200ms` — `guides/performance/break-up-long-tasks.md`)**:
   - Khi xử lý mảng dữ liệu lớn trên trình duyệt (ví dụ: phân tích cú pháp hàng trăm dòng CSV/Excel hoặc lọc danh sách lớn trên client), nếu vòng lặp xử lý kéo dài quá `50ms`, phải nhường luồng chính (yield to main thread) bằng `scheduler.yield()` kèm fallback `setTimeout(resolve, 0)` (do `scheduler.yield()` hiện chưa được hỗ trợ trên Safari):
     ```ts
     if (performance.now() >= deadline) {
       if ("scheduler" in window && "yield" in (window as unknown as { scheduler: { yield?: () => Promise<void> } }).scheduler) {
         await (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
       } else {
         await new Promise((resolve) => setTimeout(resolve, 0));
       }
       deadline = performance.now() + 50;
     }
     ```

### 5.2. Chuyển động Có Mục đích & Giảm Chuyển động (`guides/user-experience/natural-interactions.md`, `guides/ui-behaviors/physics-based-easing.md`, `MOTION_SPEC.md`)
1. **Chỉ Animate thuộc tính Compositor (`transform`, `opacity`)**:
   - Sử dụng `m.*` từ `framer-motion` trong `<LazyMotion features={domAnimation}>` với token từ `src/lib/motion.ts` (`MOTION_EASE`: `cubic-bezier(0.22, 1, 0.36, 1)`, thời lượng `150ms–300ms`).
   - Với hiệu ứng đàn hồi thuần CSS (khi không dùng Framer Motion), có thể dùng hàm `linear(...)` chuẩn Baseline kèm fallback `transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1)` phía trước; **không bao giờ** áp dụng đường cong nảy (bounce/overshoot) lên thuộc tính `opacity` vì giá trị vượt ngưỡng `[0, 1]` gây chớp nháy thị giác.
2. **Bảo vệ Kép cho `prefers-reduced-motion`**:
   - Luôn duy trì đồng thời `<MotionConfig reducedMotion="user">` trong `src/components/ui/MotionProvider.tsx` và `@media (prefers-reduced-motion: reduce)` trong `src/app/globals.css`.

---

## 6. Đối chiếu Khác biệt giữa `Modern Web Guidance` và Kiến trúc Hiện tại của EDUCARE AI

Bảng dưới đây ghi rõ sự khác biệt giữa hướng dẫn HTML/CSS nguyên bản trong `Modern Web Guidance` và kiến trúc React 19 / Next.js 15 hiện có của EDUCARE AI để agent áp dụng nhất quán:

| Chủ đề | Khuyến nghị trong `Modern Web Guidance` | Triển khai hiện tại trong EDUCARE AI | Quyết định áp dụng cho EDUCARE AI & Lý do kỹ thuật |
|---|---|---|---|
| **1. Hộp thoại Modal & Ngăn kéo (`guides/ui-components/dialog.md`)** | Dùng thẻ `<dialog>` nguyên bản với `showModal()`, `command="show-modal"`, `closedby="any"`, `overscroll-behavior: contain` và không tự viết focus trap hay `role="dialog"`. | Dùng React `<Modal>` và `<Drawer>` kết hợp Framer Motion `<AnimatePresence>`, `createPortal(..., document.body)` và khóa cuộn `document.body.style.overflow = "hidden"` (`src/components/ui/Modal.tsx`, `Drawer.tsx`). | **Giữ kiến trúc React Portal `<Modal>` / `<Drawer>` hiện tại + áp dụng quy tắc UX/A11y của `dialog.md`**:<br>• Trong React + `<AnimatePresence>`, vòng đời mount/unmount và hoạt ảnh thoát (`exit`) do state React điều khiển; gọi mệnh lệnh `dialog.showModal()` dễ xung đột với SSR/hydration và animation đóng.<br>• `createPortal(..., document.body)` đã đưa hộp thoại ra ngoài stacking context `transform` của `<PageTransition>` và đã được kiểm chứng trên trình duyệt thật về chuyển focus, bẫy `Tab`/`Shift+Tab`, đóng bằng `Escape`/click nền và trả focus về nút mở.<br>• Khi nâng cấp tiếp theo, có thể bổ sung `overscroll-behavior: contain` cho khung cuộn của modal theo `dialog.md`. |
| **2. Popover & Menu thả xuống (`guides/ui-components/dialog.md` Rule 3)** | Dùng thuộc tính HTML `popover` + `popovertarget` (cần polyfill `@oddbird/popover-polyfill` trên trình duyệt cũ). | Dùng state React + mẫu **WAI-ARIA Disclosure** (`aria-expanded`, `aria-controls`, đóng bằng `Escape` & click nền) trong `AppHeader.tsx` và `RoleSwitcher.tsx`. | **Giữ mẫu React Disclosure hiện tại**: Không phải cài thêm dependency polyfill (`@oddbird/popover-polyfill`), tương thích trực tiếp với React state và đã vượt qua kiểm thử bàn phím trên trình duyệt thật. |
| **3. Điều hướng Tab (`guides/ui-components/tabs.md`)** | Giới thiệu thuộc tính trình duyệt `focusgroup="tablist nomemory"` (mới hỗ trợ trên Chrome/Edge 150+, chưa có trên Firefox/Safari), `hidden="until-found"`, và không cần `aria-controls`. | `src/components/ui/Tabs.tsx` đang dùng **roving `tabIndex`**, xử lý phím `ArrowLeft`, `ArrowRight`, `Home`, `End` bằng React và gắn `aria-controls` (được kiểm tra bởi `tests/uiux-accessibility.test.ts`). | **Giữ cơ chế roving `tabIndex` + `aria-controls` của `Tabs.tsx` hiện tại**: Hoạt động đồng nhất trên mọi trình duyệt mà không cần polyfill `@microsoft/focusgroup-polyfill` và tương thích với bộ test hiện hữu. Lưu ý: `focusgroup` chỉ dùng khi đã xác nhận trình duyệt mục tiêu hỗ trợ và có phương án dự phòng. |
| **4. Hệ màu OKLCH vs Design Tokens (`guides/visual-design/color.md`)** | Khuyến khích không gian màu cảm nhận đều (`oklch`/`oklab`) nhưng **cảnh báo rõ**: ưu tiên dùng token thiết kế định sẵn trước, và không tự dịch kênh Lightness trong `oklch()` vì trình duyệt chưa hỗ trợ gamut mapping. | Hệ thống token màu Hex/RGB 3 lớp định sẵn trong `src/app/globals.css`, `tailwind.config.ts` và `src/lib/theme.ts`. | **Giữ nguyên hệ thống Token Ocean Blue 3.0 định sẵn**: Phù hợp trực tiếp với khuyến nghị ưu tiên token định sẵn trong `guides/visual-design/color.md`. |

---

## 7. Phân định Tiêu chí Kiểm tra Tĩnh (Static Code) vs Kiểm tra Trình duyệt Thật (Live Browser)

Agent **không được** đánh đồng việc "thấy thuộc tính trong mã nguồn" với việc "hành vi thực tế trên trình duyệt đã đúng". Mọi báo cáo kiểm định phải phân loại rõ 2 cấp độ xác minh sau:

| Nhóm tiêu chí | Kiểm tra qua Mã nguồn Tĩnh & CLI (`Static Verification`) | Kiểm tra trên Ứng dụng Đang chạy & Trình duyệt Thật (`Live Browser Verification`) |
|---|---|---|
| **Bố cục & Responsive** | • Có `min-w-0` trên phần tử con Flex/Grid.<br>• Có `overflow-x-auto` bọc bảng dữ liệu.<br>• Dùng `min-h-*` thay vì `h-*` cố định trên nút/thẻ chứa chữ.<br>• Dùng `dvh` thay vì `vh` cho ngăn kéo/overlay di động. | • Đo thực tế `document.documentElement.scrollWidth <= window.innerWidth` ở `375×812`, `768×1024`, `1440×900`.<br>• Kiểm tra bằng mắt/ảnh chụp màn hình không có chữ tiếng Việt bị cắt dấu, nút bấm không bị chồng lấp hoặc tràn khỏi khung thẻ. |
| **Hộp thoại (`Modal` / `Drawer`)** | • Có sử dụng component `<Modal>` / `<Drawer>` dùng chung (`createPortal`).<br>• Có `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.<br>• Có lắng nghe sự kiện `keydown` cho phím `Escape` và `Tab`. | • Mở hộp thoại thật trên trình duyệt và kiểm tra `document.activeElement` đã chuyển vào trong hộp thoại.<br>• Nhấn `Tab` / `Shift+Tab` ở phần tử đầu/cuối để xác nhận focus không lọt ra trang nền.<br>• Kiểm tra hộp thoại phủ toàn bộ viewport (`1440×900`), không bị kẹt trong khung `<main>` do CSS `transform` của thẻ cha.<br>• Nhấn `Escape` và xác nhận `document.activeElement` quay về đúng nút đã mở hộp thoại. |
| **Điều hướng Tab & Menu** | • Có `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`.<br>• Menu tài khoản dùng Disclosure (`aria-expanded`, `aria-controls`) thay vì `role="menu"` thiếu phím mũi tên. | • Nhấn thực tế `ArrowRight`, `ArrowLeft`, `Home`, `End` trên thanh tab và kiểm tra cả trạng thái chọn lẫn `document.activeElement` dịch chuyển đúng.<br>• Mở menu tài khoản/thông báo, nhấn `Escape` và xác nhận menu đóng, trả focus về nút mở. |
| **Biểu mẫu & Bộ gõ Tiếng Việt (IME)** | • Có `<label htmlFor="...">` khớp `id` của `<input>`/`<select>`/`<textarea>`.<br>• Bộ xử lý `onKeyDown` phím `Enter` có kiểm tra `e.nativeEvent.isComposing \|\| e.keyCode === 229`.<br>• Không còn lệnh `window.alert()`, `window.confirm()`, `window.prompt()` trong `src/`. | • Thử gửi biểu mẫu lỗi/rỗng hoặc gửi bình luận và kiểm tra thông báo nội tuyến (`role="alert"`) hoặc `Toast` (`aria-live="polite"`) hiển thị rõ trên màn hình.<br>• Kiểm tra phím `Enter` khi đang gõ dấu tiếng Việt không làm gửi tin nhắn bị đứt chữ. |
| **Hiệu năng & Build** | • Chạy `pnpm exec prisma validate`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` đạt PASS.<br>• Kiểm tra kích thước `First Load JS shared by all` trong bảng kết quả `pnpm build`. | • Đo qua Performance Observer / DevTools trên trình duyệt đang chạy: `TTFB`, `FCP`, `LCP`, `CLS`, `INP` kèm kích thước viewport dùng để đo.<br>• Kiểm tra `console.error` và `pageerror` khi chuyển qua các trang và thao tác tương tác. |

---

## 8. Checklist Trước và Sau Khi Triển khai

### 8.1. Checklist Trước Khi Triển khai (Pre-Implementation Gate)
- [ ] **Đọc trạng thái bàn giao & thiết kế**: Đã đọc `.planning/HANDOFF.md`, `PRODUCT_SPEC.md`, `DESIGN.md`, `MOTION_SPEC.md`, `src/lib/theme.ts` và `src/components/ui/index.ts`.
- [ ] **Xác định đúng vai trò RBAC & cổng giao diện**: Đã đối chiếu đúng 6 vai trò hệ thống (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `COMMUNITY_USER`) và 4 cổng góc nhìn (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`); chọn đúng thành phần phản hồi (`Toast` / nội tuyến cho phản hồi thường; `Modal` cho hành động hệ trọng).
- [ ] **Tái sử dụng thành phần chuẩn**: Đã kiểm tra và dùng lại `PageHeader`, `StatCard`, `DataTable`, `Modal`, `Drawer`, `Tabs`, `OceanButton`, `EmptyState`, `ErrorState`, `useToast` thay vì tự viết phần tử rời rạc.
- [ ] **Bảo vệ dữ liệu thật**: Đảm bảo mọi số liệu chưa có trong CSDL hiển thị `"Chưa có dữ liệu"` / `null`, không bịa số liệu mẫu trong mã nguồn giao diện.

### 8.2. Checklist Sau Khi Triển khai (Post-Implementation Gate)
- [ ] **Không có mẫu AI Slop**: Không có `bg-clip-text text-transparent`, không có `border-l-4` trang trí trên card, không có nested cards rườm rà, không có `window.alert()`.
- [ ] **Responsive & Co giãn văn bản**: Không tràn ngang ở `375px`, `768px`, `1440px`; chữ phóng to được tới 200% không mất nội dung/chức năng; các nút/thẻ chứa chữ dùng `min-h-*` + `padding`; các phần tử con trong Flex/Grid có `min-w-0`.
- [ ] **Khả năng truy cập & Bàn phím**:
  - Có đúng một `<h1>` trên trang và `Skip Link` hoạt động đúng.
  - Mọi nút chỉ có icon đều có `aria-label` tiếng Việt rõ nghĩa; icon trang trí có `aria-hidden="true"`.
  - Mọi `<Modal>` / `<Drawer>` render qua Portal ra `document.body`, chuyển focus vào trong khi mở, giữ focus khi nhấn `Tab`/`Shift+Tab`, đóng bằng `Escape` và trả focus về nút mở.
  - Mọi trình xử lý `onKeyDown` bắt phím `Enter` để gửi đều có chốt chặn `e.nativeEvent.isComposing || e.keyCode === 229`.
- [ ] **Chuyển động & Hiệu năng**:
  - Chỉ animate `transform` và `opacity` qua `m.*` (`LazyMotion`); tôn trọng `prefers-reduced-motion`.
  - Nếu có sửa mã nguồn trong `src/`, đã chạy và ghi nhận kết quả thực tế của:
    ```powershell
    pnpm exec prisma validate ; pnpm exec tsc --noEmit ; pnpm test ; pnpm build
    ```

---

## 9. Mẫu Báo cáo Kiểm định Chuẩn (Audit Report Template)

Khi báo cáo kết quả kiểm toán hoặc nâng cấp UI/UX trong `AUDIT_REPORT.md` hoặc phản hồi cho người dùng, sử dụng cấu trúc chuẩn dưới đây (mọi tiêu chí dưới `4/5` hoặc chưa xác minh phải ghi rõ bằng chứng):

```markdown
## 1. Bảng Tổng hợp Phát hiện & Khắc phục

| Mã phát hiện | Mức ưu tiên (`P0`–`P3`) | Tệp & Dòng (`file:line`) | Mô tả vấn đề & Nguyên tắc liên quan | Trạng thái (`ĐÃ SỬA` / `CẦN XÁC MINH` / `ĐỀ XUẤT`) | Phương pháp xác minh (`Tĩnh - Static` / `Trình duyệt thật - Live Browser`) |
|---|---|---|---|---|---|
| `UI-01` | `P1` | `src/...` | ... | `ĐÃ SỬA` | `Live Browser (375px, 768px, 1440px)` |

## 2. Kết quả Kiểm tra Bàn phím & Khả năng Truy cập
- **Skip Link**: [PASS / FAIL / CẦN XÁC MINH] — Bằng chứng: ...
- **Modal / Drawer (Focus vào trong, Focus Trap, Escape, Trả Focus)**: [PASS / FAIL / CẦN XÁC MINH] — Bằng chứng: ...
- **Tabs (ArrowLeft/Right, Home, End)**: [PASS / FAIL / CẦN XÁC MINH] — Bằng chứng: ...
- **Menu Disclosure & Biểu mẫu (Label, IME-safe Enter, Thông báo lỗi)**: [PASS / FAIL / CẦN XÁC MINH] — Bằng chứng: ...

## 3. Kết quả Responsive & Hiệu năng Thực tế
- **Viewport đã kiểm tra**: `375×812`, `768×1024`, `1440×900` (`scrollWidth <= innerWidth`).
- **Chỉ số đo đạc (nếu chạy trình duyệt)**: `TTFB`, `FCP`, `LCP`, `CLS`, `INP` (ghi rõ viewport và điều kiện đo; nếu không đo được chỉ số nào phải ghi rõ là `CẦN XÁC MINH` kèm nguyên nhân kỹ thuật).
- **Lệnh kiểm tra CLI đã chạy**: `prisma validate`, `tsc --noEmit`, `pnpm test`, `pnpm build`.

## 4. Bảng Điểm Tự Đánh giá (Thang 1–5 trên 9 Tiêu chí)
*(Đối chiếu với bảng Rubrics 9 tiêu chí tại Mục 10)*
```

---

## 10. Khung Tự Đánh giá Bằng Bằng chứng (Thang điểm 1–5)

| # | Tiêu chí | Mức 1–2 (Kém / Thiếu nhiều) | Mức 3 (Đạt cơ bản) | Mức 4 (Tốt — Chuẩn phát hành) | Mức 5 (Xuất sắc) |
|---|---|---|---|---|---|
| 1 | **Phù hợp với người dùng & mục tiêu** | Lẫn lộn luồng giữa các vai trò; có số liệu giả | Đúng vai trò nhưng còn chỗ gây bối rối | 6 vai trò RBAC & 4 cổng góc nhìn rõ ràng, số liệu trung thực, luồng chính thông suốt | Tối ưu sâu cho từng tác vụ sư phạm & học tập thực tế |
| 2 | **Khả năng tìm & sử dụng chức năng** | Menu rối, thiếu tìm kiếm trên mobile, thiếu breadcrumb | Có sidebar & Ctrl+K trên desktop nhưng thiếu trên mobile | Sidebar rõ ràng, có Ctrl+K cả mobile & desktop, skip-link, breadcrumb | Tìm thấy mọi chức năng trong ≤ 2 thao tác ở mọi thiết bị |
| 3 | **Tính nhất quán & bản sắc giao diện** | Pha trộn màu cũ/mới, có mẫu AI slop (gradient text), modal tự chế lệch chuẩn | Đã có Ocean Blue nhưng một số trang còn dùng modal/alert rời rạc | 100% đồng bộ Ocean Blue, `MODULE_THEMES`, không còn AI slop | Hệ thống thiết kế chặt chẽ, có bản sắc giáo dục số riêng biệt |
| 4 | **Responsive & Co giãn văn bản** | Tràn ngang ở 375px, khóa cứng `height` làm cắt chữ tiếng Việt | Hiển thị được trên mobile nhưng còn nút nhỏ hoặc tràn cục bộ | Đáp ứng tốt 320px–1440px, dùng `min-h-*`/`min-w-0`/`dvh`, chữ phóng to 200% an toàn | Bố cục thích ứng mượt mà ở mọi kích thước, mức zoom 200% và thiết bị |
| 5 | **Khả năng truy cập (Accessibility)** | Thiếu `aria-label`, không có skip-link, modal không bẫy/trả focus | Có focus ring cơ bản nhưng còn sót `aria-*` hoặc lỗi Portal | Đạt chuẩn WCAG AA: skip-link, Portal Modal bẫy/trả focus, Tabs bàn phím, Disclosure chuẩn | Kiểm tra tự động, bàn phím & trình đọc màn hình vượt qua 100% ca kiểm thử |
| 6 | **Trạng thái, Biểu mẫu & IME-safe** | Còn dùng `alert()`, thiếu `error.tsx`, nhấn Enter khi gõ tiếng Việt bị gửi sớm | Có `loading.tsx` và `EmptyState` nhưng thiếu IME guard hoặc error boundary | Đủ 8 trạng thái, thay toàn bộ `alert()` bằng Toast/inline, có IME-safe Enter guard khi bắt phím Enter | Phản hồi tức thì, đồng bộ `:user-invalid`/`aria-invalid` và hướng dẫn khôi phục lỗi rõ ràng |
| 7 | **Chất lượng hiệu ứng (Motion)** | Giật cục, animate width/height bừa bãi, thiếu reduced-motion | Có `LazyMotion` & `reducedMotion` nhưng vài overlay mở/đóng đột ngột | Chuyển động `transform`/`opacity` tinh tế, tôn trọng `prefers-reduced-motion` | Nhịp điệu chuyển động nhất quán, nâng đỡ nhận thức không gian |
| 8 | **Hiệu năng (CWV: LCP, CLS, INP)** | Tải font chặn hiển thị, bundle phình to, CLS > 0.1 | Đã dùng `next/font` và `next/dynamic` nhưng chưa tối ưu nội dung dưới màn hình | Build sạch, First Load JS ~103 kB, `CLS = 0.0000`, lazy-load sandbox & AI chat | Tối ưu toàn diện cả bundle, font, hình ảnh, `content-visibility` và `scheduler.yield()` |
| 9 | **Khả năng bảo trì (Maintainability)** | Mã màu hex rải rác, copy-paste modal ở nhiều nơi | Có `theme.ts` và `components/ui` nhưng tài liệu thiết kế chưa tách bạch | Có bộ đặc tả `PRODUCT_SPEC`, `DESIGN`, `MOTION_SPEC`, `AUDIT_REPORT` + test tự động | Kiến trúc token & component có kiểm thử bảo vệ chống hồi quy |
