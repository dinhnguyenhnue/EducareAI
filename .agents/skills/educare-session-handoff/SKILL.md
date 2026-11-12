---
name: educare-session-handoff
description: >-
  HIGHEST PRIORITY skill for the EDUCARE AI repo. Use at the START of every session/turn in this
  workspace (any model), whenever the user says "tiếp tục", "continue", "làm tiếp", switches model,
  or when context/token budget is running low. Restores state from .planning/ (HANDOFF.md,
  task_plan.md, progress.md, findings.md) and defines the checkpoint procedure so another model
  can resume the LMS hardening work from docs/LMS_MASTER_PROMPT.md without redoing work.
---

# EDUCARE AI — Bàn giao & khôi phục phiên (liên model)

Mục tiêu: bất kỳ model nào mở workspace này đều có thể tiếp tục công việc đúng chỗ đã dừng,
dựa trên "bộ nhớ trên đĩa" trong `.planning/`, không phụ thuộc lịch sử chat.

## A. Khôi phục phiên (làm TRƯỚC mọi việc khác)

1. Đọc `.planning/HANDOFF.md` (ảnh chụp trạng thái mới nhất, ngắn).
2. Đọc `.planning/task_plan.md` → xác định task `in_progress` (hoặc task `pending` đầu tiên).
3. Đọc 40 dòng cuối `.planning/progress.md`:
   ```powershell
   Get-Content .planning/progress.md -Tail 40
   ```
4. Đối chiếu thực tế:
   ```powershell
   git status --short; git log -n 5 --oneline; git diff --stat
   ```
   Nếu có thay đổi chưa được ghi trong progress.md → ghi bổ sung trước (mục "Phục hồi từ diff").
5. Chỉ đọc `.planning/findings.md` và `docs/*.md` khi task hiện tại cần chi tiết.
6. Tiếp tục task. Không hỏi lại người dùng những gì đã có trong plan.

## B. Ghi log trong lúc làm

| Khi nào | Ghi vào đâu | Nội dung |
|---|---|---|
| Sau mỗi sửa đổi mã có ý nghĩa | `progress.md` | `- [YYYY-MM-DD HH:mm] [model] T<id>: <việc> — <file> — <kết quả test>` |
| Bắt đầu / xong task | `task_plan.md` | đổi `pending` → `in_progress` → `complete` (hoặc `blocked: lý do`) |
| Phát hiện lỗi/quyết định | `findings.md` | vị trí `file:line`, nguyên nhân, quyết định, lệnh đã thử |
| Lỗi lặp lại | `task_plan.md` › Errors | lần thử, cách xử lý — KHÔNG lặp lại cách đã thất bại |

## C. Checkpoint (khi sắp hết token, trước khi dừng, hoặc mỗi khi xong 1 task lớn)

Dấu hiệu cần checkpoint: đã đọc nhiều file lớn, cuộc hội thoại dài, hệ thống báo sắp nén ngữ cảnh,
hoặc sắp kết thúc lượt trả lời mà task chưa xong.

1. Cập nhật `task_plan.md` (trạng thái từng task).
2. Viết lại toàn bộ `.planning/HANDOFF.md` theo mẫu dưới (≤ 60 dòng).
3. Thêm dòng `CHECKPOINT` vào `progress.md`.
4. Chạy kiểm tra nhanh nếu có thể (`pnpm exec tsc --noEmit`, `pnpm test`) và ghi kết quả.
5. Commit WIP cục bộ để không mất việc (không push):
   ```powershell
   git add -A; git reset -q .env; git commit -m "wip(lms): checkpoint <task-id> — <tóm tắt>"
   ```
6. Báo người dùng: đã checkpoint, task tiếp theo là gì, và có thể đổi model rồi nói "tiếp tục".

### Mẫu HANDOFF.md

```markdown
# HANDOFF — cập nhật <thời gian> bởi <model>
## Đang làm
T<id> <tên> — bước còn lại: ...
## Vừa xong
- ...
## Việc tiếp theo (theo thứ tự)
1. ...
## Trạng thái kiểm thử
| Lệnh | Kết quả |
## Cảnh báo / bẫy đã gặp
- ...
## File then chốt đã sửa
- ...
```

## D. Phục hồi từ diff (khi phiên trước dừng đột ngột, không kịp ghi log)

1. `git diff --stat` và `git log -n 10 --oneline` để biết file nào đã đổi.
2. Đọc diff các file liên quan task `in_progress`, xác định phần đã xong/dở.
3. Ghi dòng `RECOVERED` vào `progress.md` mô tả trạng thái suy ra, rồi tiếp tục.

## E. Quy tắc bất biến

- Ưu tiên: đúng đắn & bảo mật → học liệu/upload → Sheets & đánh giá → AI (theo `docs/LMS_MASTER_PROMPT.md`).
- Không đọc/in secret; không commit `.env`; không chạy seed/purge trên DB thật.
- Kiểm thử bằng DB SQLite tạm: `$env:DATABASE_URL="file:../scratch/test.db"`.
- Mỗi kết luận "đã sửa" phải kèm lệnh kiểm thử + kết quả trong `progress.md`.

