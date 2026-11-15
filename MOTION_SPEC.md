# MOTION_SPEC.md — Đặc tả Chuyển động & Hiệu năng Hoạt ảnh EDUCARE AI

> **Nguyên tắc cốt lõi**: Chuyển động trong EDUCARE AI phục vụ nhận thức không gian và phản hồi trạng thái (Spatial Continuity & State Feedback), không bao giờ làm chậm thao tác của giáo viên hay học sinh.
> **Nguồn định nghĩa mã nguồn**: [src/lib/motion.ts](file:///d:/Educare_AI/src/lib/motion.ts), [src/components/ui/MotionProvider.tsx](file:///d:/Educare_AI/src/components/ui/MotionProvider.tsx), [src/app/globals.css](file:///d:/Educare_AI/src/app/globals.css).

---

## 1. Hệ thống Token Thời lượng & Đường cong Gia tốc (Timing & Easing)

Toàn bộ hiệu ứng chuyển động trong ứng dụng dùng chung một đường cong giảm tốc tự nhiên (**Ocean Ease-Out Quart/Quint**) và bảng thời lượng cố định dưới 350ms cho giao diện tương tác:

| Token trong `src/lib/motion.ts` | Biến CSS trong `globals.css` | Giá trị | Mục đích sử dụng |
|---|---|---|---|
| `MOTION_EASE` | `--ease-ocean` | `cubic-bezier(0.22, 1, 0.36, 1)` | Đường cong chuẩn cho mọi chuyển động vào/ra (nhanh lúc đầu, êm dần lúc dừng, không nảy bounce/elastic). |
| `MOTION_DURATION.micro` | `--duration-micro` | `150ms` (`0.15s`) | Phản hồi nhấn nút (`whileTap={{ scale: 0.98 }}`), đóng nhanh hộp thoại/menu (`exit`). |
| `MOTION_DURATION.hover` | `--duration-hover` | `180ms` (`0.18s`) | Nâng nhẹ thẻ tương tác khi rê chuột (`whileHover={{ y: -3 }}`), hiện lớp phủ nền mờ (`modalBackdropVariants`). |
| `MOTION_DURATION.modal` | `--duration-modal` | `240ms` (`0.24s`) | Mở hộp thoại `Modal`, bảng `FloatingAIAssistant`, menu thả xuống (`AppHeader`, `RoleSwitcher`) và `Toast`. |
| `MOTION_DURATION.sidebar` | `--duration-sidebar` | `260ms` (`0.26s`) | Trượt ngăn kéo điều hướng mobile (`Drawer` trái/phải) và thu gọn/mở rộng `AppSidebar` desktop. |
| `MOTION_DURATION.page` | `--duration-page` | `300ms` (`0.30s`) | Hiệu ứng xuất hiện vùng nội dung trang (`PageTransition`: `opacity: 0 → 1`, `y: 10 → 0`). |
| `MOTION_DURATION.chart` | — | `550ms` (`0.55s`) | Thanh tiến độ (`ProgressCard`) và cột biểu đồ (`ChartCard`) khi hiển thị số liệu lần đầu. |
| `SPRING_GENTLE` | — | `stiffness: 340, damping: 30, mass: 0.85` | Chuyển động trượt chỉ báo đang chọn (`layoutId`) giữa các tab (`Tabs`, `AppSidebar`, tab chọn vai trò `/dang-ky`). |

---

## 2. Danh mục Hiệu ứng Đang Sử dụng & Mục đích Nghiệp vụ

| Thành phần | Biến thể / Kỹ thuật | Thuộc tính biến đổi | Mục đích UX |
|---|---|---|---|
| **Chuyển trang (`PageTransition.tsx`)** | `pageTransitionVariants` | `opacity: 0 → 1`, `y: 10px → 0` | Tạo cảm giác êm ái khi chuyển giữa các phân hệ trong `AppShell` mà không gây chớp trắng. |
| **Chỉ báo điều hướng (`AppSidebar.tsx`, `Tabs.tsx`)** | `layoutId` + `SPRING_GENTLE` | `transform` (vị trí khung pill) | Giúp mắt người dùng theo dõi vị trí tab/menu vừa chuyển tới (Spatial Continuity). |
| **Thẻ KPI & Cổng vai trò (`StatCard.tsx`, `FeatureCard.tsx`, `CourseCard.tsx`)** | `whileHover={{ y: -3 }}` | `transform: translateY(-3px)` | Báo hiệu rõ thẻ có thể tương tác hoặc nhấn vào để xem chi tiết. |
| **Nút bấm (`OceanButton.tsx`)** | `whileTap={{ scale: 0.98 }}` | `transform: scale(0.98)` | Phản hồi xúc giác tức thì (<100ms) khi người dùng chạm hoặc nhấp chuột; tự tắt khi `disabled` hoặc `loading`. |
| **Hộp thoại (`Modal.tsx`, `FloatingAIAssistant.tsx`)** | `modalPanelVariants` | `opacity: 0 → 1`, `scale: 0.97 → 1`, `y: 8px → 0` | Làm rõ nguồn xuất hiện của lớp nổi trên mặt phẳng giao diện; khi đóng (`exit`) thu nhỏ nhanh trong `150ms`. |
| **Ngăn kéo mobile (`Drawer.tsx`)** | `drawerSlideVariants` | `x: "-100%" → 0`, `opacity: 0.85 → 1` | Mô phỏng ngăn kéo vật lý trượt ra từ cạnh trái màn hình điện thoại. |
| **Thông báo nổi (`Toast.tsx`)** | `AnimatePresence` + `layout` | `opacity`, `y: 16px → 0`, `scale: 0.96 → 1` | Thông báo kết quả lưu điểm/đăng bài ở góc dưới phải mà không làm xô lệch bố cục trang chính. |
| **Khung chờ tải (`Skeleton.tsx`)** | CSS `@keyframes shimmer` | `transform: translateX(-100% → 100%)` | Báo hiệu hệ thống đang nạp dữ liệu với đúng kích thước của nội dung sắp hiển thị (tránh nhảy bố cục CLS). |

---

## 3. Hỗ trợ `prefers-reduced-motion` (2 Lớp Bảo vệ Bắt buộc)

EDUCARE AI tuân thủ nghiêm ngặt tiêu chuẩn WCAG 2.1 SC 2.3.3 và Apple/Material Reduced Motion thông qua **2 lớp bảo vệ độc lập**:

1. **Lớp 1 — Framer Motion Runtime (`src/components/ui/MotionProvider.tsx`)**:
   ```tsx
   <LazyMotion features={domAnimation}>
     <MotionConfig reducedMotion="user" transition={OCEAN_TRANSITION.page}>
       {children}
     </MotionConfig>
   </LazyMotion>
   ```
   Khi người dùng bật chế độ giảm chuyển động trong hệ điều hành (Windows / macOS / iOS / Android), `<MotionConfig reducedMotion="user">` tự động vô hiệu hóa mọi biến đổi dịch chuyển (`x`, `y`, `scale`, `layoutId`) của Framer Motion và giữ lại trạng thái hiển thị tức thì hoặc crossfade nhẹ.

2. **Lớp 2 — CSS Toàn cục (`src/app/globals.css:110-119`)**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
   Đảm bảo mọi hiệu ứng CSS thuần (`transition-*`, `animate-spin`, `animate-shimmer`) cũng dừng ngay lập tức khi `prefers-reduced-motion: reduce` được kích hoạt.

---

## 4. Quy tắc Hiệu năng Hoạt ảnh (60fps Main-Thread Budget)

1. **Chỉ Animate thuộc tính GPU Compositor**:
   - Mọi hiệu ứng chuyển động liên tục chỉ được phép tác động lên `transform` (`translate3d`, `scale`, `rotate`) và `opacity`.
   - Ngoại lệ duy nhất là `transition-[width]` khi người dùng chủ động bấm nút thu gọn `AppSidebar` trên desktop (`256px ↔ 72px`).
2. **Nạp gói Hoạt ảnh Tối giản (`LazyMotion`)**:
   - Toàn bộ mã nguồn dùng thành phần nhẹ `m.*` (`m.div`, `m.button`, `m.span`, `m.aside`) kết hợp `LazyMotion features={domAnimation}` thay vì nạp toàn bộ gói `motion.*` nặng nề, giúp giữ `First Load JS shared by all` ở mức `~103 kB`.
3. **Không chặn thao tác (Non-Blocking & Interruptible)**:
   - Không bao giờ khóa con trỏ chuột (`pointer-events-none`) trên nội dung đang hiển thị trong lúc chạy hiệu ứng vào trang.
   - Các vùng chứa `Toast` bên ngoài sử dụng `pointer-events-none` và chỉ bật `pointer-events-auto` trên từng thẻ thông báo để không che khuất các nút nằm ở góc dưới màn hình.

---

## 5. Chuẩn Chuyển động, Top Layer & Độ nhạy Tương tác từ `Modern Web Guidance` (`v1.0.0`)

Đối chiếu với `D:\AI\Repos\modern-web-guidance` (commit `4dd9683`, `Apache-2.0`), EDUCARE AI áp dụng các quy tắc kỹ thuật sau cho chuyển động và tương tác:

1. **Tương tác Tự nhiên & Thiết bị Cảm ứng (`skills/modern-web-guidance/guides/user-experience/natural-interactions.md`)**:
   - Mọi phần tử tương tác phải tách biệt rõ 3 trạng thái: `:hover` (nâng nhẹ hoặc đổi nền mềm), `:active` / `whileTap` (thu nhẹ `scale: 0.98` phản hồi tức thì `<100ms`), và `:focus-visible` (vòng `outline` độ tương phản `>= 3:1`).
   - Không bao giờ giấu các hành động quan trọng chỉ sau hiệu ứng `:hover`. Nếu một thẻ có nút phụ hiện ra khi rê chuột, phải hiển thị nút đó cả khi `:focus-within` và trên màn hình không có chuột (`@media (hover: none)`).
2. **Đường cong Vật lý `linear()` & Cấm Bounce trên `opacity` (`skills/modern-web-guidance/guides/ui-behaviors/physics-based-easing.md`)**:
   - Trong EDUCARE AI, các chuyển động lò xo phức tạp trên giao diện React ưu tiên dùng `SPRING_GENTLE` của Framer Motion (`LazyMotion`).
   - Khi viết hiệu ứng đàn hồi thuần CSS (không qua Framer Motion), có thể dùng hàm `linear(...)` chuẩn Baseline kèm dòng khai báo dự phòng `transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1)` đứng trước.
   - **Cấm tuyệt đối** áp dụng đường cong nảy (bounce/overshoot có giá trị vượt ngoài đoạn `[0, 1]`) lên thuộc tính `opacity` vì sẽ gây hiện tượng chớp nháy (flickering) khi giá trị vượt ngưỡng.
3. **Quản lý Lớp nổi (Top Layer vs React Portal — `skills/modern-web-guidance/guides/ui-components/dialog.md`)**:
   - Do `<PageTransition>` áp dụng biến đổi `transform` lên vùng nội dung trang (tạo stacking context mới làm hỏng `position: fixed` của các phần tử con), mọi hộp thoại `<Modal>` và `<Drawer>` trong EDUCARE AI **bắt buộc** render qua `createPortal(..., document.body)` để đạt hiệu quả tương đương Top Layer của trình duyệt và giữ nguyên hoạt ảnh đóng/mở của `<AnimatePresence>`.
   - Hiện tại `Modal.tsx` và `Drawer.tsx` khóa cuộn nền qua `document.body.style.overflow = "hidden"`; theo hướng dẫn tại `skills/modern-web-guidance/guides/ui-components/dialog.md`, khi nâng cấp vùng nội dung cuộn bên trong hộp thoại cần kết hợp thêm `overscroll-behavior: contain` để ngăn thao tác cuộn ở rìa hộp thoại truyền (scroll chaining) xuống trang nền.
4. **Bảo vệ Chỉ số INP (`<= 200ms`) & Trì hoãn Render Dưới Màn hình (`skills/modern-web-guidance/guides/performance/break-up-long-tasks.md`, `skills/modern-web-guidance/guides/performance/defer-rendering-heavy-content.md`)**:
   - Với các khối nội dung nặng nằm hoàn toàn bên dưới màn hình đầu tiên (below the fold), hướng dẫn sử dụng `content-visibility: auto` bắt buộc đi kèm `contain-intrinsic-size` (không bao giờ đặt lên vùng above-the-fold).
   - Với các vòng lặp xử lý dữ liệu lớn trên client kéo dài quá `50ms`, chủ động nhường luồng chính bằng `scheduler.yield()` (kèm fallback `setTimeout(resolve, 0)`) để giữ giao diện luôn phản hồi mượt mà.
