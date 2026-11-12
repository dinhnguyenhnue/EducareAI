# EDUCARE AI — Quy tắc bắt buộc cho MỌI agent/model (ưu tiên cao nhất)

> File này là rule cấp workspace, được nạp tự động và có độ ưu tiên cao hơn mọi skill/rule global.
> Áp dụng cho mọi model (Claude, Gemini, GPT…) và mọi phiên làm việc.

## 0. BƯỚC ĐẦU TIÊN — trước khi trả lời hay sửa bất cứ thứ gì

1. Đọc skill bàn giao: `.agents/skills/educare-session-handoff/SKILL.md` và làm đúng mục "Khôi phục phiên".
2. Đọc theo thứ tự: `.planning/HANDOFF.md` → `.planning/task_plan.md` → 40 dòng cuối `.planning/progress.md` → `.planning/findings.md` (khi cần).
3. Chạy `git status --short` và `git log -n 5 --oneline` để đối chiếu thực tế với log.
4. Tiếp tục đúng task đang `in_progress` trong `task_plan.md`. KHÔNG làm lại việc đã đánh dấu `complete` trừ khi có bằng chứng hỏng.

## 1. Lưu log liên tục (chống mất ngữ cảnh khi hết token / đổi model)

- Sau mỗi thay đổi mã có ý nghĩa hoặc mỗi 3–5 lần gọi tool: thêm 1 dòng vào `.planning/progress.md`.
- Khi hoàn thành/bắt đầu một task: cập nhật trạng thái trong `.planning/task_plan.md`.
- Khi cảm thấy ngữ cảnh dài (nhiều file lớn đã đọc, > ~60% context) hoặc trước khi dừng: chạy quy trình "Checkpoint" trong skill (cập nhật `HANDOFF.md`, commit WIP cục bộ nếu được phép).
- Phát hiện kỹ thuật quan trọng (vị trí lỗi, quyết định thiết kế, lệnh chạy được/không được) → ghi `.planning/findings.md`.

## 2. Nguồn yêu cầu

- Đặc tả gốc: `docs/LMS_MASTER_PROMPT.md`, `docs/LMS_DATA_DESIGN.md`, `docs/LMS_QA_2026-11-12.md`.
- Thứ tự triển khai: tính đúng đắn & bảo mật → học liệu/upload → Sheets & đánh giá → tiện ích AI.

## 3. Ràng buộc an toàn

- Không đọc/in giá trị secret trong `.env` vào log, báo cáo hay commit. `.env` không bao giờ được commit.
- Không chạy script seed/purge (`prisma/seed.ts`, `scripts/verify-*.ts`, `scripts/optimize-and-clean-data.ts`) trên DB thật. Kiểm thử dùng DB riêng (`DATABASE_URL` trỏ file SQLite tạm trong `scratch/`).
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

