# DESIGN.md — Hệ thống Thiết kế EDUCARE AI (Ocean Blue 3.0)

> **Định hướng thẩm mỹ**: **Ocean Blue Product Register** — Sự tin cậy học đường kết hợp hiệu suất công cụ hiện đại. Giao diện phục vụ trực tiếp cho việc dạy và học, rõ ràng, có thứ bậc thị giác mạch lạc, nói không với các chi tiết trang trí "AI slop".
> **Nguồn tham khảo chắt lọc**: Google Chrome Modern Web Guidance (`v1.0.0`, commit `4dd9683`, `Apache-2.0`), Impeccable (`Apache-2.0`), UI UX Pro Max (`MIT`), EvondevKit (`MIT`).

---

## 1. Triết lý & Định vị Thị giác

1. **Earned Familiarity (Sự quen thuộc đáng tin cậy)**: Phục vụ **6 vai trò RBAC hệ thống** (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `COMMUNITY_USER`) được tổ chức thành **4 cổng góc nhìn giao diện** (`Học sinh`, `Giáo viên`, `Phụ huynh`, `Quản trị` trên 5 phân hệ đường dẫn `/hoc-sinh/*`, `/giao-vien/*`, `/phu-huynh/*`, `/quan-tri/*`, `/admin/*`). Người dùng mở trang ra là biết ngay việc chính nằm ở đâu, nút nào là hành động chính, không phải đoán nghĩa của biểu tượng.
2. **Restrained Canvas + Semantic Module Accents**:
   - Nền trang (`--canvas`: `#F8FAFC`) và bề mặt thẻ (`--surface`: `#FFFFFF`) giữ sự tinh khiết, thoáng đãng để nội dung bài giảng, câu hỏi và bảng điểm luôn nổi bật.
   - Màu sắc phân hệ (`MODULE_THEMES` trong [src/lib/theme.ts](file:///d:/Educare_AI/src/lib/theme.ts)) chỉ xuất hiện có kiểm soát ở huy hiệu đầu trang (`PageHeader`), ô biểu tượng (`w-9 h-9 rounded-xl`), và thanh tiến độ.
3. **Chống giao diện rập khuôn (Anti-AI-Slop)**:
   - Không dùng chữ tô chuyển sắc (`bg-clip-text text-transparent`).
   - Không dùng viền lệch 1 cạnh (`border-l-4`) trên thẻ thông tin.
   - Không lạm dụng hiệu ứng kính mờ (`backdrop-blur`) trên các thẻ dữ liệu tĩnh.
   - Không bo góc quá đà (`> 16px` cho panel nội dung).

---

## 2. Hệ Màu (Color System — Three-Layer Architecture)

### 2.1. Lớp Primitive & Semantic (`src/app/globals.css` & `tailwind.config.ts`)

| Vai trò | Token CSS / Class Tailwind | Mã màu (Hex) | Tỷ lệ tương phản trên `#FFFFFF` | Quy tắc sử dụng |
|---|---|---|---|---|
| **Primary Ocean** | `--ocean-primary` / `ocean-600` | `#2563EB` | `5.17:1` (Đạt AA) | Nút hành động chính (`primary`), vòng `:focus-visible`, liên kết điều hướng. |
| **Deep Ocean** | `--ocean-deep` / `ocean-700` | `#1D4ED8` | `6.70:1` (Đạt AA) | Trạng thái hover của nút chính, chữ nhấn mạnh trong mục đang chọn. |
| **Light Sky Surface** | `--ocean-light` / `ocean-light` | `#E0F2FE` | Nền nhạt (chữ `#1D4ED8` đạt `5.8:1`) | Nền pill mục đang chọn trong Sidebar, huy hiệu thông tin. |
| **Canvas (Nền trang)** | `--canvas` / `bg-canvas` | `#F8FAFC` | — | Nền tổng thể của `AppShell` và vùng nội dung phụ trong card. |
| **Surface (Bề mặt)** | `--surface` / `bg-surface` | `#FFFFFF` | — | Nền mặc định của Panel, Card, Modal, Drawer, DataTable. |
| **Surface Muted** | `--surface-muted` / `bg-surface-muted` | `#F1F5F9` | — | Nền đầu bảng (`thead`), khung chứa `Tabs`, trạng thái hover nhẹ. |
| **Primary Ink (Chữ chính)** | `--ink` / `text-ink` | `#0F172A` | `17.8:1` (Đạt AAA) | Tiêu đề, nội dung bài học, số liệu chính, nhãn biểu mẫu. |
| **Muted Ink (Chữ phụ)** | `--muted-ink` / `text-ink-muted` | `#64748B` | `4.76:1` (Đạt AA) | Mô tả phụ, chú thích thời gian, nhãn phụ (cấm dùng màu nhạt hơn `#64748B` cho chữ cần đọc). |
| **Border (Viền chuẩn)** | `--border` / `border-border` | `#E2E8F0` | `1.22:1` (Viền chia khối trang trí) | Đường chia khối, viền card (kết hợp nền phân biệt `bg-canvas` `#F8FAFC` / `bg-surface` `#FFFFFF`), viền ô nhập liệu trạng thái nghỉ (khi focus chuyển sang `--ocean-primary` `#2563EB` đạt `5.17:1`). |

### 2.2. Màu Trạng thái Ngữ nghĩa (Luôn đi kèm Icon + Chữ)

| Trạng thái | Chữ & Icon | Nền mềm (Soft Background) | Viền | Ý nghĩa trong EDUCARE AI |
|---|---|---|---|---|
| **Thành công (`status-success`)** | `#047857` (`emerald-700`) | `#ECFDF5` | `#A7F3D0` | Đã nộp bài, Đã chấm điểm (`GRADED`), Đồng bộ thành công, Đã kích hoạt. |
| **Cảnh báo (`status-warning`)** | `#B45309` (`amber-700`) | `#FFFBEB` | `#FDE68A` | Chờ chấm điểm, Chờ duyệt game, Chế độ Demo/Chưa kết nối Google API thật. |
| **Nguy hiểm / Lỗi (`status-danger`)** | `#B91C1C` (`red-700`) | `#FEF2F2` | `#FECACA` | Lỗi xác thực, Quá hạn nộp, Vi phạm CSP/Bảo mật, Hành động đăng xuất/xóa. |
| **Thông tin (`status-info`)** | `#1D4ED8` (`ocean-700`) | `#EFF6FF` | `#BFDBFE` | Gợi ý Socratic, Thông báo hệ thống, Hướng dẫn nghiệp vụ. |

### 2.3. Bảng Màu Phân hệ (`MODULE_THEMES` trong `src/lib/theme.ts`)
Mỗi phân hệ chức năng được gán một `ModuleToneKey` nhất quán giữa `AppSidebar`, `PageHeader`, `StatCard` và `EmptyState`:
- `overview` (`#2563EB` Ocean Blue) — Tổng quan & Lớp học
- `materials` (`#0284C7` Sky) — Bài giảng & Kho học liệu
- `assignments` (`#F97316` Orange) — Bài tập & Chấm bài Rubric
- `assessments` (`#F59E0B` Amber) — Ngân hàng câu hỏi & Kiểm tra
- `games` (`#6366F1` Indigo) — Xưởng Trò chơi HTML Sandbox
- `aiTutor` (`#8B5CF6` Violet) & `promptLab` (`#A855F7` Fuchsia) — AI Tutor Socratic & Trung tâm AI
- `progress` (`#10B981` Emerald) — Phân tích học tập & Hồ sơ năng lực
- `workspace` (`#06B6D4` Cyan) — Tích hợp Google Workspace & Sheets
- `community` (`#EC4899` Pink) — Cộng đồng học tập mở
- `security` (`#1D4ED8` Deep Ocean) — Quản trị bảo mật & RBAC

---

## 3. Kiểu chữ (Typography)

1. **Bộ phông chữ (`src/app/layout.tsx`)**:
   - **Sans-serif chính (`--font-sans`)**: `Plus Jakarta Sans` (nạp qua `next/font/google`, hỗ trợ đầy đủ dấu tiếng Việt `subsets: ["latin", "vietnamese"]`, các độ đậm `400, 500, 600, 700, 800`, `display: "swap"`).
   - **Monospace số liệu & mã (`--font-mono`)**: `JetBrains Mono` (`subsets: ["latin", "vietnamese"]`, dùng cho điểm số, mã học sinh `HS2026-0701`, mã lớp, thời gian nộp bài và trình soạn mã HTML).
2. **Thang cỡ chữ & Nhịp điệu (Type Scale)**:
   - **Tiêu đề trang (`h1` trong `PageHeader`)**: `text-xl sm:text-2xl font-bold tracking-tight text-ink text-balance` (`20px–24px`, mỗi trang chỉ có **đúng một thẻ `<h1>`**).
   - **Tiêu đề trang chủ Hero (`h1`)**: `text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-balance`.
   - **Tiêu đề khối / Modal (`h2`, `h3`)**: `text-sm sm:text-base font-bold text-ink leading-snug`.
   - **Nội dung chuẩn & Ô nhập liệu**: `text-xs sm:text-sm leading-relaxed` (`12px–14px` cho bảng điều khiển dày dữ liệu, `14px` cho biểu mẫu để tránh phóng to ngoài ý muốn và dễ đọc).
   - **Nhãn phụ / Huy hiệu / Cột bảng**: `text-[11px] font-semibold` (hạn chế dùng `text-[10px]` trừ huy hiệu trạng thái nhỏ đi kèm ngữ cảnh rõ ràng).
3. **Quy tắc trình bày tiếng Việt & Số liệu**:
   - Luôn thêm `tabular-nums` (và ưu tiên `font-mono`) trên mọi con số thống kê, điểm số (`8.5 / 10`), phần trăm tiến độ và bộ đếm.
   - Đoạn văn mô tả dùng `text-pretty` và giới hạn độ rộng đọc tối ưu `max-w-2xl` hoặc `max-w-3xl` (~65–75 ký tự/dòng).

---

## 4. Bố cục, Khoảng cách & Thang Z-Index

### 4.1. Khung Ứng dụng (`AppShell`)
- **Header dính (`AppHeader`)**: Cao `64px` (`h-16`), `sticky top-0 z-40`, chứa nút đóng/mở Sidebar, `BrandLogo`, Breadcrumb động, nút Tìm nhanh (`Ctrl+K` trên cả mobile và desktop), trạng thái Google Workspace, `RoleSwitcher` (cho Super Admin), Thông báo và Hồ sơ.
- **Thanh bên (`AppSidebar`)**:
  - Desktop (`>= 1024px`): Rộng `256px` khi mở rộng, `72px` khi thu gọn.
  - Mobile & Tablet (`< 1024px`): Ẩn thanh bên tĩnh, mở qua `<Drawer side="left" widthClass="w-[272px]">`.
- **Vùng nội dung chính (`<main id="main-content" tabIndex={-1}>`)**:
  - Khoảng đệm thích ứng: `p-4 sm:p-6 lg:p-8`, chiều rộng tối đa `max-w-[1440px] w-full mx-auto overflow-x-hidden`.
  - Nhịp dọc giữa các khối chính trên trang: `space-y-6`.

### 4.2. Bo góc & Đổ bóng (`tailwind.config.ts`)
- **Bo góc chuẩn**:
  - Nút bấm & Ô nhập liệu (`rounded-button`): `10px`.
  - Thẻ nội dung, Bảng, Hộp thoại (`rounded-panel`): `16px` (không dùng bo góc `>= 24px` cho khung lớn).
  - Huy hiệu (`badge` / `pill`): `rounded-full`.
- **Đổ bóng tinh tế**:
  - Thẻ tĩnh trong trang (`shadow-card`): `0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)` kết hợp viền `border-border` (`1px`).
  - Lớp nổi (`Modal`, `Drawer`, `Dropdown`, `Toast` — `shadow-dialog`): `0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 4px 14px rgba(15, 23, 42, 0.06)`.

### 4.3. Thang phân lớp Z-Index chuẩn
| Lớp | Z-Index | Thành phần áp dụng |
|---|---|---|
| Nội dung cơ sở | `z-0` / `z-10` | Thẻ nội dung, pill đang chọn bên trong `Tabs` và `AppSidebar`. |
| Lớp phủ đóng menu | `z-20` | Lớp nền trong suốt bắt sự kiện click ngoài của Dropdown (`AppHeader`, `RoleSwitcher`). |
| Menu thả xuống & Header phụ | `z-30` | Panel Thông báo, Menu Hồ sơ, Header trang công khai. |
| Header chính & Trợ lý AI nổi | `z-40` | `AppHeader`, nút mở `FloatingAIAssistant`. |
| Ngăn kéo điều hướng (`Drawer`) & Sandbox Fullscreen | `z-50` | `Drawer` mobile, chế độ toàn màn hình của `SandboxedHtmlGamePlayer`. |
| Hộp thoại (`Modal`) | `z-[60]` | Component `Modal` và các hộp thoại xác nhận/nhập liệu. |
| Thông báo nổi (`Toast`) & Skip Link | `z-[70]`–`z-[100]` | Vùng `ToastProvider` (`aria-live="polite"`) và liên kết `Chuyển đến nội dung chính` khi nhận focus. |

---

## 5. Thư viện Thành phần Dùng chung (`src/components/ui/*`)

Mọi màn hình mới hoặc nâng cấp trong EDUCARE AI phải lắp ghép từ các thành phần chuẩn sau:

1. **`PageHeader`**: Đầu trang chuẩn có `badge`, `title` (`<h1>`), `description`, `meta` và `actions`. Hỗ trợ 3 biến thể: `card` (mặc định trong phân hệ), `hero` (banner đậm cho trang tổng quan), `clean`.
2. **`StatCard`**: Thẻ chỉ số KPI dùng font số `tabular-nums font-mono`. Khi giá trị là `null`/`undefined`/`""`, tự động hiển thị `"Chưa có dữ liệu"` bằng cỡ chữ phù hợp.
3. **`DataTable`**: Bảng dữ liệu có thanh tìm kiếm tích hợp (`aria-label`), trạng thái đang tải (`TableSkeleton`), trạng thái rỗng (`EmptyState`) và vùng cuộn ngang an toàn (`overflow-x-auto`).
4. **`Modal` & `Drawer`**: Lớp nổi có `role="dialog"`, `aria-modal="true"`, tự khóa cuộn nền (`document.body.style.overflow = "hidden"`), đóng bằng phím `Escape` hoặc bấm nền mờ, có nút đóng kèm `aria-label`.
5. **`OceanButton` & `OceanButtonLink`**: Nút bấm chuẩn hỗ trợ 7 biến thể (`primary`, `gradient`, `ai`, `secondary`, `soft`, `ghost`, `danger`), 3 kích thước (`sm`, `md`, `lg`), trạng thái `loading` (hiển thị spinner `Loader2` và khóa bấm lặp) và vòng `:focus-visible`.
6. **`EmptyState` & `ErrorState`**: Khung hiển thị trạng thái rỗng và lỗi (`role="alert"`) đồng bộ màu sắc phân hệ và có nút hành động khôi phục.
7. **`ToastProvider` & `useToast`**: Hệ thống thông báo góc dưới phải (`aria-live="polite"`) thay thế hoàn toàn `window.alert()`.

---

## 6. Chuẩn Web Hiện đại Bổ sung từ Google Chrome `Modern Web Guidance` (`v1.0.0`)

Các quy tắc dưới đây được chắt lọc từ repo `D:\AI\Repos\modern-web-guidance` (commit `4dd9683`, `Apache-2.0`) và tích hợp vào chuẩn thiết kế EDUCARE AI (với đường dẫn tương đối chính xác trong repo tham khảo):

1. **Ngân sách Gây chú ý & Khớp Mức độ Ngắt quãng (`skills/modern-web-guidance/guides/user-experience/content-first-noise-reduction.md`)**:
   - Thanh dính đầu trang (`AppHeader`) giữ trên **1 hàng duy nhất**, cao `64px` (`< 12%` chiều cao viewport), không xếp chồng thêm thanh thông báo cố định làm thu hẹp không gian đọc bài giảng.
   - Chỉ dùng hộp thoại chặn trang (`<Modal>`) cho hành động hệ trọng (xóa dữ liệu, thu hồi quyền, biểu mẫu tạo mới có cấu trúc). Mọi phản hồi thường nhật dùng `useToast()` hoặc trạng thái nội tuyến.
2. **Độ tương phản Phi văn bản, Gamut Màu & Forced Colors (`skills/modern-web-guidance/guides/visual-design/color.md`)**:
   - **Tương phản phi văn bản (WCAG 1.4.11)**: Vòng `:focus-visible` hiện tại dùng `outline: 2px solid #2563EB` (`5.17:1` trên `#FFFFFF`, đạt chuẩn `>= 3:1`). Khi thiết kế các ô nhập liệu hoặc nút viền đứng độc lập trên nền đồng màu mà không có nền phân biệt, đường viền cần đạt tối thiểu `3:1` (ví dụ `#94A3B8` trở lên) hoặc có dấu hiệu hình thái rõ rệt.
   - **Ưu tiên Design Token định sẵn**: Ưu tiên tuyệt đối các Design Token đã kiểm định (`--ocean-primary`, `MODULE_THEMES`) thay vì tự dịch kênh Lightness trong `oklch()` (do trình duyệt chưa hỗ trợ gamut mapping tự động). Khi cần pha màu tint bằng CSS, sử dụng `color-mix(in oklab, ...)`.
   - **Hỗ trợ `@media (forced-colors: active)`**: Vòng `:focus-visible` dùng `outline` (không chỉ dựa vào `box-shadow`) và tab đang chọn có `border` (`border-ocean-200/80` trong `Tabs.tsx`) để không bị mất chỉ báo trong chế độ tương phản cao.
3. **Co giãn Văn bản, `min-block-size` & Phóng to 200% (`skills/modern-web-guidance/guides/visual-design/typography.md`, `skills/modern-web-guidance/guides/visual-design/visually-stable-font-fallbacks.md`)**:
   - **Khoảng cách văn bản (WCAG 1.4.12 Text Spacing)**: Trên các nút bấm, huy hiệu và thẻ có chữ tiếng Việt có thể xuống dòng, ưu tiên dùng `min-h-*` (`min-block-size`) kết hợp `padding` thay vì khóa cứng `height` cố định để không làm cắt dấu thanh tiếng Việt hoặc tràn chữ khi tăng khoảng cách dòng/chữ.
   - **Phóng to văn bản 200% (WCAG 1.4.4 Resize Text) & Kỹ thuật `clamp()`**: Kết quả cần đạt theo WCAG 1.4.4 là văn bản phải phóng to được tới **200%** mà không mất nội dung hoặc chức năng. Khi sử dụng `clamp(min, preferred, max)` có đơn vị viewport (`vw`), kỹ thuật được hướng dẫn trong `typography.md` là dùng đơn vị `rem` cho `min`/`max`, kết hợp `rem + vw` ở giá trị giữa và giữ `max <= 2.5 × min` để khi người dùng zoom trình duyệt (tối đa 500%) chữ vẫn đạt ngưỡng phóng to 200%.
   - **Ngắt dòng thẩm mỹ**: Chỉ áp dụng `text-balance` cho tiêu đề (`h1–h3`) và `text-pretty` cho đoạn văn (`p`, `li`); cấm đặt lên bộ chọn toàn cục `*`.
4. **Thích ứng Thiết bị, Vùng chạm & Bộ gõ Tiếng Việt IME (`skills/modern-web-guidance/guides/user-experience/form-factor-adaptation.md`, `skills/modern-web-guidance/guides/forms/ime-safe-enter-submit.md`)**:
   - Đảm bảo không tràn ngang xuống tới `320px–375px` (WCAG 1.4.10 Reflow); mọi phần tử con Flex/Grid chứa chuỗi động phải có `min-w-0`.
   - Khi xây dựng hoặc nâng cấp ngăn kéo (`Drawer`) và khung hội thoại nổi (`FloatingAIAssistant`) trên di động, ưu tiên đơn vị viewport động (`dvh`) thay cho `vh` tĩnh để tránh bị thanh địa chỉ trình duyệt che khuất.
   - Không ẩn các nút thao tác quan trọng chỉ sau `:hover`; nếu dùng `:hover` trên desktop thì bắt buộc mở khóa hiển thị khi `:focus-within` và trên thiết bị cảm ứng (`@media (hover: none)`).
   - **An toàn bộ gõ Tiếng Việt (IME-safe Enter Submit)**: Mọi trình xử lý `onKeyDown` tùy chỉnh bắt phím `Enter` để gửi dữ liệu đều phải kiểm tra `if (e.nativeEvent.isComposing || e.keyCode === 229) return;` để không gửi nhầm khi người dùng đang gõ dấu tiếng Việt (Telex/VNI).
