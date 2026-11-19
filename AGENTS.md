# EDUCARE AI — Quy tắc bắt buộc cho MỌI agent/model (ưu tiên cao nhất)

> File này là rule cấp workspace, được nạp tự động và có độ ưu tiên cao hơn mọi skill/rule global.
> Áp dụng cho mọi model (Claude, Gemini, GPT…) và mọi phiên làm việc.

## 0. BƯỚC ĐẦU TIÊN & QUY TẮC NGỮ CẢNH (CONTEXT HYGIENE)

1. Kiểm tra `git status --short` (và `git log -n 5 --oneline` khi cần) để bảo toàn mọi thay đổi chưa commit của người dùng; không tự ý xóa hoặc di chuyển file.
2. Đọc `AGENTS.md` và **chỉ đọc tài liệu liên quan trực tiếp đến task hiện tại**:
   - **Chỉ đọc** `.agents/skills/educare-session-handoff/SKILL.md` (cùng `.planning/HANDOFF.md` → `.planning/task_plan.md` → 40 dòng cuối `.planning/progress.md` → `.planning/findings.md` khi cần) khi **tiếp tục hoặc bàn giao phiên**. Giữ nguyên các file `.planning/*` đang phục vụ task hiện tại.
   - **Chỉ đọc** `.agents/skills/educare-uiux-performance/SKILL.md`, `DESIGN.md` và `MOTION_SPEC.md` (cùng `PRODUCT_SPEC.md`, `AUDIT_REPORT.md` khi cần) khi **task liên quan đến UI/UX, giao diện, khả năng truy cập hoặc hiệu năng frontend**.
3. **Không nạp vào context** các thư mục/file `node_modules/`, `.next/`, `scratch/`, build artifacts hoặc nội dung `.env` nếu task không cần. Tuyệt đối không đọc hoặc tiết lộ giá trị bí mật trong `.env`.
4. Tiếp tục đúng task đang `in_progress` trong `task_plan.md`. KHÔNG làm lại việc đã đánh dấu `complete` trừ khi có bằng chứng hỏng.

## 1. Lưu log liên tục (chống mất ngữ cảnh khi hết token / đổi model)

- Sau mỗi thay đổi mã có ý nghĩa hoặc mỗi 3–5 lần gọi tool: thêm 1 dòng vào `.planning/progress.md`.
- Khi hoàn thành/bắt đầu một task: cập nhật trạng thái trong `.planning/task_plan.md`.
- Khi cảm thấy ngữ cảnh dài (nhiều file lớn đã đọc, > ~60% context) hoặc trước khi dừng: chạy quy trình "Checkpoint" trong skill (cập nhật `HANDOFF.md`, commit WIP cục bộ nếu được phép).
- Phát hiện kỹ thuật quan trọng (vị trí lỗi, quyết định thiết kế, lệnh chạy được/không được) → ghi `.planning/findings.md`.

## 1A. RULE CỨNG: Nhịp kiểm tra tiến độ & Diệt vòng lặp vô hạn (BẮT BUỘC)

- **Nhịp kiểm tra tiến độ để hoàn thành task**:
  - **Task dài / đa bước** (nhiều file, build/migration/test dài, triển khai tính năng lớn, chạy subagent/background task): kiểm tra tiến độ **5 phút / lần** (đối chiếu mục tiêu, ghi 1 dòng trạng thái vào `.planning/progress.md`, xác nhận bước kế tiếp cho đến khi hoàn thành).
  - **Task đơn giản / ngắn** (sửa lỗi cục bộ, cập nhật 1–2 file, chạy lệnh ngắn): kiểm tra tiến độ **1 phút / lần** để đảm bảo xong dứt điểm, không bị treo.
- **Cơ chế phát hiện & diệt vòng lặp vô hạn (Circuit Breaker)**:
  - Coi là **vòng lặp vô hạn / treo** khi: (a) một lệnh/tiến trình lặp log giống hệt nhau hoặc không có tiến triển sau 1 chu kỳ (1 phút với lệnh ngắn, 5 phút với lệnh dài); (b) lặp lại cùng một lỗi hoặc cùng một chuỗi gọi tool thất bại **>= 3 lần liên tiếp** mà không đổi nguyên nhân; (c) code/API/UI phát sinh polling/re-render/đệ quy vô hạn.
  - **Hành động bắt buộc ngay lập tức**:
    1. **Diệt lệnh/tiến trình đang chạy** (hủy background task bằng `manage_task(kill)` hoặc dừng tiến trình treo) — tuyệt đối không chờ thụ động hay chạy lại y hệt lệnh cũ.
    2. **Khoanh vùng nguyên nhân gốc** và ghi ngắn gọn vào `.planning/findings.md`.
    3. **Chạy phương án sửa lỗi gốc (fix)** trước, sau đó mới chạy lại kiểm chứng với điều kiện dừng rõ ràng.

## 2. Nguồn yêu cầu & Định hướng UI/UX

- Đặc tả gốc: `docs/LMS_MASTER_PROMPT.md`, `docs/LMS_DATA_DESIGN.md`, `docs/LMS_QA_2026-11-12.md`.
- Khi làm sản phẩm, tài khoản, Workspace, dữ liệu học tập, slide hoặc redesign: đọc chọn lọc `docs/EDUCAREAI_VISION_AND_DECISIONS.md` (quyết định cập nhật 15/11/2026). Với redesign, dùng thêm `docs/EDUCAREAI_REDESIGN_PROMPT.md`; phân biệt đề xuất với phần đã triển khai và không coi kết quả QA lịch sử là kiểm chứng hiện tại.
- Thứ tự triển khai: tính đúng đắn & bảo mật → học liệu/upload → Sheets & đánh giá → tiện ích AI.
- **Với task UI/UX**: Giữ định hướng thẩm mỹ **Ocean Blue** (`DESIGN.md`, `src/lib/theme.ts`); chỉ thay đổi khi có lý do kỹ thuật/trải nghiệm rõ ràng và phải ghi rõ trong đề xuất.
- **Nguồn tham khảo UI/UX ngoại vi đã xác minh**:
  - Impeccable: `D:\AI\Repos\impeccable`
  - UI UX Pro Max: `D:\AI\Skills\ui-ux-pro-max-skill`
  - EvondevKit: `D:\AI\Repos\evondevKit`
  - Google Chrome Modern Web Guidance: `D:\AI\Repos\modern-web-guidance`

## 3. Ràng buộc an toàn

- Không đọc/in giá trị secret trong `.env` vào log, báo cáo hay commit. `.env` không bao giờ được commit.
- Chỉ kiểm tra ứng dụng trên môi trường `local/dev` và dữ liệu thử nghiệm an toàn. Không chạy script seed/purge (`prisma/seed.ts`, `scripts/verify-*.ts`, `scripts/optimize-and-clean-data.ts`) trên DB thật. Kiểm thử dùng DB riêng (`DATABASE_URL` trỏ file SQLite tạm hoặc cô lập).
- Không push lên remote trừ khi người dùng yêu cầu.
- Không tuyên bố "hết lỗi"; chỉ báo pass/fail/blocked kèm lệnh đã chạy.
- Không bịa dữ liệu hiển thị (điểm, tiến độ, trạng thái SYNCED…): thiếu dữ liệu → `null` / "Chưa có dữ liệu".

## 4. Lệnh kiểm tra chuẩn

```powershell
pnpm install --frozen-lockfile
pnpm exec prisma validate
pnpm exec tsc --noEmit
pnpm test            # node:test qua tsx, xem tests/
pnpm build
```

