# PRODUCT_SPEC.md — Đặc tả Sản phẩm & Trải nghiệm Người dùng EDUCARE AI

> **Dự án**: Hệ sinh thái Học tập Số EDUCARE AI (Trường Tiểu học & THCS UNIGO)
> **Công nghệ nền tảng**: Next.js 15.5.29 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion 14.12, Prisma 6.19 (SQLite/PostgreSQL)
> **Cập nhật**: `2026-11-15`

---

## 1. Bối cảnh & Vấn đề Hiện tại

EDUCARE AI là nền tảng quản lý học tập (LMS) kết hợp trí tuệ nhân tạo Socratic (Gemini AI) và Google Workspace dành cho khối THCS (trọng tâm là môn Tin học 6, 7, 8 và các môn cốt lõi theo Chương trình GDPT 2018). Sau khi hoàn thành giai đoạn cứng hóa bảo mật LMS (Phase 1–5) và chuyển đổi sang hệ màu **Ocean Blue 3.0**, đợt khảo sát chuyên sâu theo skill `.agents/skills/educare-uiux-performance/SKILL.md` ghi nhận các vấn đề thực tế sau:

1. **Tương tác chặn luồng (Blocking Native Dialogs — `P0`)**:
   - Giao diện chấm bài của giáo viên (`src/app/giao-vien/cham-bai/TeacherGradingWorkspace.tsx:93,97`) và trang cộng đồng học sinh (`src/app/hoc-sinh/cong-dong/page.tsx:73`) vẫn dùng `window.alert(...)` gây đóng băng luồng trình duyệt và thiếu tính chuyên nghiệp.
   - Nút đồng bộ Google Sheets trong `TeacherGradingWorkspace.tsx:36-52` chưa hiển thị phản hồi lỗi khi yêu cầu mạng hoặc API thất bại.
2. **Thiếu ranh giới xử lý lỗi & trang không tìm thấy cấp ứng dụng (`P0`)**:
   - Toàn bộ thư mục `src/app/` mới có `loading.tsx` cho 5 phân hệ nhưng **chưa có** `src/app/error.tsx` và `src/app/not-found.tsx`. Khi người dùng gặp lỗi runtime hoặc truy cập đường dẫn 404, hệ thống rơi về trang mặc định thô của Next.js thay vì giữ khung nhận diện Ocean Blue kèm lối thoát an toàn.
3. **Khả năng truy cập bàn phím & Trình đọc màn hình chưa đồng đều (`P1`)**:
   - Thiếu liên kết bỏ qua điều hướng (`Skip to main content` — `#main-content`) tại `AppShell.tsx`, `AuthSplitShell.tsx` và `src/app/page.tsx`.
   - Liên kết đang chọn trên thanh bên (`src/components/layout/AppSidebar.tsx:302`) chỉ đổi màu và hiện pill chuyển động nhưng thiếu thuộc tính `aria-current="page"`.
   - Nút tìm kiếm nhanh (`Ctrl+K`) trên `AppHeader.tsx:223` bị ẩn hoàn toàn trên màn hình nhỏ (`hidden md:flex`), khiến người dùng điện thoại không thể mở hộp lệnh tìm kiếm nhanh.
   - Nhiều hộp thoại nghiệp vụ (`cong-dong/page.tsx:180`, `TeacherLessonsClient.tsx:165`, `TeacherAssignmentsClient.tsx:227`, `ngan-hang-cau-hoi/page.tsx:456`, `xuong-tro-choi/page.tsx:877`, `UserManagementTable.tsx:365,615,706`) tự dựng thẻ `<div className="fixed inset-0...">` mà thiếu `role="dialog"`, `aria-modal="true"`, xử lý phím `Escape` hoặc `aria-label` trên nút đóng.
   - Một số biểu mẫu (`dang-ky/page.tsx`, `dat-lai-mat-khau/page.tsx`, `TeacherGradingWorkspace.tsx`, `FloatingAIAssistant.tsx`) thiếu liên kết `htmlFor`/`id` hoặc `aria-label` cho ô nhập và thanh trượt Rubric.
4. **Chi tiết thị giác rập khuôn ("AI Slop" — `P2`)**:
   - Trang chủ (`src/app/page.tsx:138`) dùng `bg-gradient-primary bg-clip-text text-transparent` trên cụm chữ `"UNIGO Ocean Blue"`, vi phạm quy tắc chống chữ tô gradient của Impeccable & EvondevKit.

---

## 2. Hệ thống Vai trò RBAC (6 Vai trò) & 4 Cổng Góc nhìn Người dùng

Trong mã nguồn hiện tại ([src/lib/session-token.ts](file:///d:/Educare_AI/src/lib/session-token.ts#L6-L14), [src/context/RoleContext.tsx](file:///d:/Educare_AI/src/context/RoleContext.tsx#L6-L13), [src/middleware.ts](file:///d:/Educare_AI/src/middleware.ts#L8-L41), [src/app/page.tsx](file:///d:/Educare_AI/src/app/page.tsx#L21-L91), [src/app/dang-ky/page.tsx](file:///d:/Educare_AI/src/app/dang-ky/page.tsx#L29-L41)), hệ thống phân tách rõ **6 vai trò RBAC cấp hệ thống (`SystemRole`)** và ánh xạ vào **4 cổng góc nhìn giao diện (`ViewRole` / `UserRole`)** trên **5 phân hệ đường dẫn được bảo vệ**:

| Cổng góc nhìn (`ViewRole`) | Vai trò RBAC hệ thống (`SystemRole`) | Phân hệ đường dẫn | Mục tiêu cốt lõi | Yêu cầu UX đặc thù |
|---|---|---|---|---|
| **1. Cổng Học sinh (`STUDENT`)** | • **`STUDENT`** (Học sinh THCS Khối 6–8)<br>• **`COMMUNITY_USER`** (Thành viên Cộng đồng — đăng ký tại tab `"Cộng đồng"` ở `/dang-ky`, ánh xạ góc nhìn mặc định về `STUDENT`) | `/hoc-sinh/*` (gồm cả `/hoc-sinh/cong-dong` và `/hoc-sinh/xuong-tro-choi`) | Xem bài giảng, làm bài tập/kiểm tra, lập trình trò chơi HTML trong Sandbox, hỏi đáp AI Tutor Socratic, chia sẻ và thảo luận sản phẩm cộng đồng. | Ngôn ngữ thân thiện, khích lệ; không giải bài hộ; phân biệt rõ bài luyện tập và bài kiểm tra; không dùng hộp thoại `alert()` gây giật mình. |
| **2. Cổng Giáo viên (`TEACHER`)** | • **`TEACHER`** (Giáo viên bộ môn)<br>*(Lưu ý: `SCHOOL_ADMIN` và `SUPER_ADMIN` cũng được quyền truy cập `/giao-vien/*`)* | `/giao-vien/*` | Quản lý lớp, đăng bài giảng đa định dạng, giao bài, chấm điểm theo 4 tiêu chí Rubric, duyệt game HTML/bài đăng cộng đồng, đồng bộ Google Sheets. | Tốc độ thao tác nhanh; chấm bài trên 1 màn hình không phải tải lại trang; phản hồi lưu điểm/đồng bộ Sheets rõ ràng ngay tại chỗ. |
| **3. Cổng Phụ huynh (`PARENT`)** | • **`PARENT`** (Phụ huynh học sinh) | `/phu-huynh/*` | Xem tổng quan tiến độ thật của con, lịch bài tập, điểm mạnh/cần cải thiện và gợi ý đồng hành tại nhà. | Minh bạch tuyệt đối (chưa có dữ liệu phải ghi rõ `"Chưa có dữ liệu"`, không bịa điểm); chữ dễ đọc trên điện thoại (`375px`). |
| **4. Cổng Quản trị viên (`ADMIN`)** | • **`SCHOOL_ADMIN`** (Quản trị nhà trường / Ban Giám hiệu)<br>• **`SUPER_ADMIN`** (Quản trị tối cao — có thêm `RoleSwitcher` chuyển đổi cả 4 góc nhìn `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) | • `/quan-tri/*` (`SCHOOL_ADMIN` & `SUPER_ADMIN`)<br>• `/admin/*` (chỉ `SUPER_ADMIN`) | Quản lý tài khoản RBAC 6 vai trò, import danh sách học sinh từ Excel UNIGO, cấu hình khe tích hợp AI (`IntegrationSlot`), giám sát Audit Log và chuyển góc nhìn Multi-View. | Chuẩn bảng điều khiển SaaS; kiểm tra trước khi import (Preview Idempotent); hiển thị rõ trạng thái khi đang ở chế độ `Multi-View`. |

---

## 3. Các Luồng Sử dụng Quan trọng Cần Cải thiện

### Luồng 1: Điều hướng Toàn cục & Tìm kiếm Nhanh (`AppShell`, `AppHeader`, `AppSidebar`)
- **Mục tiêu**: Người dùng bằng bàn phím hoặc trên điện thoại đều truy cập được nội dung chính và hộp lệnh nhanh (`Ctrl+K`) chỉ trong 1–2 thao tác.
- **Cải thiện**:
  - Thêm liên kết `Chuyển đến nội dung chính` (`href="#main-content"`) ở đầu `AppShell`, `AuthSplitShell` và trang chủ `/`.
  - Gắn `id="main-content" tabIndex={-1}` cho vùng `<main>`.
  - Hiển thị nút kính lúp mở hộp lệnh tìm kiếm trên màn hình `< 768px` tại `AppHeader.tsx`, bổ sung trạng thái rỗng khi từ khóa tìm kiếm không khớp kết quả nào.
  - Bổ sung `aria-current="page"` cho mục đang chọn trên `AppSidebar.tsx` và `aria-expanded` cho các nút đóng/mở menu.

### Luồng 2: Chấm bài theo Rubric & Đồng bộ Google Sheets (`/giao-vien/cham-bai`)
- **Mục tiêu**: Giáo viên chấm điểm 4 tiêu chí Rubric, nhận gợi ý nhận xét từ AI và xuất điểm sang Google Sheets mượt mà, không bị chặn bởi `alert()`.
- **Cải thiện**:
  - Thay thế toàn bộ `alert()` trong `TeacherGradingWorkspace.tsx` bằng thông báo Toast (`useToast`) và banner lỗi nội tuyến (`role="alert"`).
  - Bổ sung xử lý lỗi rõ ràng cho thao tác đồng bộ Google Sheets (`handleExportToGoogleSheets`).
  - Gắn nhãn `htmlFor`/`id` và `aria-valuetext` cho 4 thanh trượt tiêu chí Rubric; áp dụng `tabular-nums` cho điểm số.

### Luồng 3: Đăng tải Sản phẩm Cộng đồng & Các Hộp thoại Nghiệp vụ (`/hoc-sinh/cong-dong`, `/giao-vien/*`, `/quan-tri/nguoi-dung`)
- **Mục tiêu**: Mọi hộp thoại tạo mới/chỉnh sửa/báo cáo đều tuân thủ chuẩn hộp thoại tiếp cận được (Accessible Dialog), đóng được bằng phím `Escape` và phản hồi bằng Toast.
- **Cải thiện**:
  - Chuyển hộp thoại đăng sản phẩm tại `/hoc-sinh/cong-dong/page.tsx` sang sử dụng component `<Modal>` chuẩn của hệ thống và thông báo qua `useToast()` + cập nhật danh sách bài đăng chờ duyệt tại chỗ thay vì `alert()`.
  - Chuẩn hóa `role="dialog"`, `aria-modal="true"`, xử lý phím `Escape` và `aria-label="Đóng hộp thoại"` trên các modal tại `TeacherLessonsClient.tsx`, `TeacherAssignmentsClient.tsx`, `ngan-hang-cau-hoi/page.tsx`, `xuong-tro-choi/page.tsx` và `UserManagementTable.tsx`.

### Luồng 4: Xác thực & Khôi phục Lỗi Toàn cục (`/dang-nhap`, `/dang-ky`, `/dat-lai-mat-khau`, `error.tsx`, `not-found.tsx`)
- **Mục tiêu**: Biểu mẫu xác thực liên kết nhãn-ô nhập đầy đủ cho trình đọc màn hình; mọi lỗi đường dẫn (404) hoặc sự cố runtime (500) đều có giao diện khôi phục rõ ràng.
- **Cải thiện**:
  - Tạo `src/app/error.tsx` và `src/app/not-found.tsx` đồng bộ phong cách Ocean Blue.
  - Bổ sung `htmlFor`/`id`, `role="tablist"`/`role="tab"`/`aria-selected` cho bộ chọn vai trò tại `/dang-ky/page.tsx` và `/dat-lai-mat-khau/page.tsx`.

---

## 4. Phạm vi & Tiêu chí Hoàn thành (Definition of Done)

### Trong phạm vi (In-Scope)
- Khảo sát và lập bộ 5 tài liệu chuẩn (`.agents/skills/educare-uiux-performance/SKILL.md`, `PRODUCT_SPEC.md`, `DESIGN.md`, `MOTION_SPEC.md`, `AUDIT_REPORT.md`).
- Triển khai các bản vá P0–P2 trên hệ thống giao diện hiện tại mà không làm thay đổi kiến trúc CSDL, xác thực OIDC hay logic bảo mật RBAC.
- Viết bổ sung bộ kiểm thử tự động `tests/uiux-accessibility.test.ts` để bảo vệ các quy chuẩn UI/UX và khả năng truy cập vừa nâng cấp.

### Ngoài phạm vi (Out-of-Scope)
- Không thêm thư viện UI bên ngoài mới.
- Không sửa đổi `.env`, cấu hình triển khai nhạy cảm hoặc chạy script seed/purge trên CSDL thật.
- Không xóa hoặc sửa `.agents/skills/educare-session-handoff/SKILL.md`.

### Tiêu chí hoàn thành (Acceptance Criteria)
1. `git grep -n "alert(" src/` trả về **0** kết quả.
2. Có mặt `src/app/error.tsx` và `src/app/not-found.tsx` hoạt động đúng chuẩn App Router.
3. Không còn mẫu `bg-clip-text text-transparent` trên tiêu đề trang chủ.
4. `pnpm exec prisma validate`, `pnpm exec tsc --noEmit`, `pnpm test`, và `pnpm build` đều **PASS 100%**.
5. Mọi hạng mục trong `AUDIT_REPORT.md` được chấm điểm trước/sau minh bạch bằng bằng chứng thực tế.
