# Thiết kế dữ liệu đánh giá học sinh từ Google Sheets

Ngày rà soát: 12/11/2026. Trạng thái: **bản thiết kế triển khai**, chưa tạo bảng trên cơ sở dữ liệu thật, chưa kết nối hay nhập dữ liệu học sinh thật.

## Những gì đã có và điểm cần sửa trước

- `prisma/schema.prisma` đã có `User`, `StudentProfile`, `SchoolClass`, `AcademicYear`, `Enrollment`, `Assessment`, `AssessmentItem`, `Attempt`, `Answer`, `ClassTrackingSheet`.
- `Attempt.studentId` hiện lưu **User.id**, trong khi `Enrollment.studentId` lưu **StudentProfile.id**. Phải ánh xạ qua `StudentProfile.userId`, không nối trực tiếp hai cột cùng tên.
- `syncClassTrackingSheet` tại `src/lib/google-workspace.ts:456` hiện tạo ID `GSHEET-TRACKING-...`, lưu nội dung vào DB và đánh dấu `SYNCED`; trong hàm này chưa có thao tác gửi dữ liệu tới Google Sheets. Không được coi đây là đồng bộ thật.
- Hàm trên lấy tất cả lượt `SUBMITTED` và nhật ký AI mà chưa lọc theo lớp; cần sửa phạm vi quyền truy cập trước khi xuất dữ liệu. Phải dùng `classId` và `academicYearId`, không chỉ tên lớp.
- Khi thiếu dữ liệu, hàm dùng điểm 8.45, tiến độ mẫu và nhật ký AI mẫu. Báo cáo thật phải trả `null`/“Chưa đủ dữ liệu”, tách dữ liệu mẫu khỏi kết quả học sinh.
- `ClassTrackingSheet.className @unique` không phân biệt lớp 7A1 giữa nhiều năm học. Chuyển khóa nghiệp vụ sang `(classId, academicYearId, purpose)` sau khi kiểm tra và chuyển đổi dữ liệu cũ.

## Kiến trúc đề xuất

Google Forms/Sheets → vùng dữ liệu thô → xác thực và ánh xạ → lượt làm bài chuẩn hóa → chỉ số minh bạch → nhận xét nháp → giáo viên duyệt.

PostgreSQL giữ dữ liệu chuẩn; Sheets là nguồn nhập có kiểm soát và bản xuất báo cáo. Không đồng bộ hai chiều toàn bộ bảng điểm theo nguyên tắc “bản cuối ghi đè”. Mỗi nguồn phải khai báo chiều đồng bộ, trường được phép sửa và cách giải quyết xung đột.

## Các thực thể bổ sung

| Thực thể | Trường chính và ràng buộc |
|---|---|
| `SheetImportSource` | `id`, `trackingSheetId?`, `spreadsheetId`, `sheetId` dạng số ổn định, `classId`, `academicYearId`, `direction`, `mappingJson`, `mappingVersion`, `timezone`, `enabled`; duy nhất `(spreadsheetId, sheetId)`; OAuth token chỉ lưu mã hóa phía máy chủ. |
| `StudentExternalIdentity` | `sourceId`, `externalStudentId`, `studentProfileId`; duy nhất `(sourceId, externalStudentId)`. Ưu tiên mã học sinh; email chỉ dùng để đề xuất đối chiếu, tên không phải khóa. |
| `AssessmentExternalIdentity` | `sourceId`, `externalAssessmentId`, `assessmentId`, `assessmentVersion`; duy nhất `(sourceId, externalAssessmentId, assessmentVersion)`. Không gộp hai đề khác độ khó chỉ vì cùng tên. |
| `SheetImportRun` | `id`, `sourceId`, `idempotencyKey`, `startedAt`, `completedAt`, `status`, `readCount`, `acceptedCount`, `rejectedCount`, `unchangedCount`, `errorCode`; khóa duy nhất `(sourceId, idempotencyKey)`. |
| `SheetImportRow` | `id`, `runId`, `sourceRecordId`, `sourceRevision`, `payloadHash`, `rawJson`, `status`, `errorCodes`, `mappedStudentId?`, `mappedAssessmentId?`, `sourceUpdatedAt?`; giữ dấu vết dòng nguồn, trạng thái `STAGED/ACCEPTED/REJECTED/CONFLICT/UNCHANGED`. Dữ liệu thô có lịch xóa riêng. |
| `ImportedAttempt` | `id`, `sourceId`, `sourceRecordId`, `studentUserId`, `assessmentId`, `classId`, `academicYearId`, `mode`, `submittedAt`, `rawScore`, `maxScore`, `normalizedScore`, `status`, `revision`, `importRowId`, `nativeAttemptId?`; duy nhất `(sourceId, sourceRecordId)`, điểm tối đa > 0 và 0 ≤ điểm ≤ tối đa. FK `studentUserId` → `User.id`. |
| `AttemptCorrection` | `id`, `importedAttemptId`, `oldPayload`, `newPayload`, `reason`, `actorId`, `approvedAt`, `sourceRevision`; giữ lịch sử sửa điểm, không sửa mất dấu vết. |
| `StudentAssessmentMetric` | `studentUserId`, `assessmentId`, `assessmentVersion`, `mode`, `windowStart`, `windowEnd`, `validAttemptCount`, `firstScore`, `latestScore`, `bestScore`, `meanScore`, `improvement`, `evidenceCount`, `computedAt`, `algorithmVersion`, `sourceWatermark`; khóa duy nhất theo học sinh–đề–phiên bản–chế độ–kỳ thống kê. Đây là bảng dẫn xuất, có thể tính lại. |
| `StudentInsight` | `id`, `studentUserId`, `classId`, `metricSnapshotId`, `evidenceRefsJson`, `suggestedAction`, `draftText`, `status=DRAFT/APPROVED/REJECTED`, `reviewerId?`, `reviewedAt?`, `modelVersion?`, `promptVersion?`; chỉ phát hành sau duyệt. |

Giữ `Attempt`/`Answer` phục vụ bài làm native của LMS. Ban đầu nhập Sheets vào `ImportedAttempt` để tránh giả tạo thời gian bắt đầu, đáp án từng câu hoặc khóa chống nộp trùng của bài native. Tầng tổng hợp đọc cả hai nguồn, nhưng dùng `nativeAttemptId`/định danh xuất để loại lượt LMS đã xuất ra Sheets rồi được nhập lại. Không lưu một lượt hai lần.

Nếu nguồn chỉ có tổng điểm và tổng số lần làm bài, dùng thực thể riêng `ImportedAssessmentSummary` gồm `studentUserId`, `assessmentId`, `reportedAttemptCount`, `reportedScore`, `scoreMeaning`, `asOf`, `sourceRecordId`. Không tạo các lượt làm giả; điểm đầu/cuối/xu hướng phải để trống vì không có bằng chứng.

## Mẫu cột Google Sheets

`record_id | student_code | class_id | academic_year | assessment_code | assessment_version | mode | submitted_at | score | max_score | status | source_updated_at`

- `record_id` là Google Forms response ID hoặc UUID được ghi một lần vào cột bảo vệ. Không dùng số hàng: thao tác sắp xếp/chèn dòng làm số hàng thay đổi.
- `submitted_at`: ISO 8601 có múi giờ; nhập theo `Asia/Ho_Chi_Minh` nếu nguồn không có offset và đã khai báo rõ, lưu UTC trong DB.
- `score`, `max_score` là số riêng; kiểm tra dấu phẩy thập phân theo locale nguồn. Ô rỗng không chuyển thành điểm 0.
- `assessment_version` giữ bài đã chấm gắn với đúng nội dung đề; thay câu hỏi phải tạo phiên bản.
- Nếu có câu trả lời từng câu, tạo bảng con `ImportedAnswer` liên kết mục đề/phiên bản và lưu điểm từng mục. Không suy diễn năng lực chủ đề từ tổng điểm khi thiếu dữ liệu câu hỏi.

## Đồng bộ và chống trùng

1. Giáo viên chọn spreadsheet/tab, xem trước ánh xạ cột và kiểm tra quyền lớp/năm học.
2. Đọc theo lô, ghi `SheetImportRun` và các dòng staging. Khóa riêng theo nguồn để hai job không nhập cùng lúc.
3. Kiểm tra mã học sinh, đăng ký lớp, mã đề, phiên bản, thời gian, chế độ, giới hạn điểm. Dòng lỗi vào danh sách sửa; không tự tạo học sinh từ tên trùng.
4. Trong giao dịch DB: upsert theo `(sourceId, sourceRecordId)`. Hash không đổi → bỏ qua; revision mới hơn → ghi lịch sử sửa; revision xung đột → chờ duyệt. Hash phục vụ phát hiện thay đổi, không thay thế ID ổn định.
5. Chỉ tăng số lượt khi xuất hiện một record hợp lệ mới. Retry/import lại không tăng số lượt. Nếu không có revision đáng tin, thay đổi điểm đã chấp nhận phải chờ giáo viên duyệt.
6. Chỉ xác nhận checkpoint sau khi giao dịch thành công. Retry có backoff; giới hạn lần thử; có hàng đợi lỗi và nút chạy lại. Quét đối soát định kỳ vì người dùng có thể sửa một dòng cũ.
7. Xóa dòng nguồn không tự xóa điểm đã chấp nhận. Tạo đề nghị hủy có lý do và nhật ký.
8. Chỉ ghi `SYNCED` sau khi thao tác Google API thành công và kiểm tra lại ID/range đích. Kết quả giả lập phải ghi `DEMO` hoặc `NOT_CONNECTED`.
9. Khi xuất báo cáo, ghi text bằng chế độ RAW hoặc xử lý đầu vào bắt đầu bằng `=`, `+`, `-`, `@` để không biến tên/nhận xét thành công thức ngoài ý muốn.

## Cách đánh giá có thể giải thích

- Chuẩn hóa thang 10: `normalizedScore = 10 × rawScore / maxScore`; tính từ numeric, làm tròn khi hiển thị. Không âm, không vượt tối đa.
- `validAttemptCount`: số record khác nhau đã hoàn tất, hợp lệ, không bị hủy, không phải demo. Lượt tự thu khi hết giờ được tính nếu đã chấm xong; lượt còn làm/đồng bộ lỗi không tính.
- Điểm đầu/cuối sắp xếp theo `submittedAt` và ID ổn định để xử lý cùng thời điểm; điểm cao nhất và trung bình hiển thị riêng. Không đổi nhãn “điểm chính thức” thành điểm cao nhất nếu chính sách đề không cho phép.
- `improvement = latestScore − firstScore`, chỉ khi ≥ 2 lượt cùng đề/phiên bản/chế độ. Không coi đây là bằng chứng nhân quả hay tiến bộ giữa các đề khác độ khó.
- Hiển thị song song kết quả, số lượt, thời gian, dữ liệu thiếu và mức độ đủ bằng chứng. Luyện nhiều lần không bị trừ điểm hay gắn nhãn “yếu”; bài thi và luyện tập có báo cáo riêng.
- Không đủ dữ liệu → “Chưa đủ dữ liệu”; không dùng 0 hoặc điểm trung bình lớp để thay thế.
- AI chỉ gợi ý hoạt động tiếp theo, chỉ dẫn chứng từ những record có thật. Không chẩn đoán, không quyết định điểm chính thức hay xếp loại học sinh tự động.

## Quyền truy cập và triển khai

- Giáo viên chỉ xem lớp/môn được phân công trong năm học tương ứng; học sinh xem chính mình; phụ huynh chỉ xem con có liên kết đã xác minh. Quản trị có quyền theo phạm vi trường.
- Raw/staging và token nằm trong schema riêng không công khai qua Data API; thu hồi quyền `PUBLIC/anon/authenticated`. Chỉ cấp quyền cần thiết cho role backend; API vẫn bắt buộc xác thực và kiểm tra lớp trước mỗi truy vấn.
- Nếu dùng bảng được expose qua Supabase, bật RLS và viết policy theo ownership/class membership thực tế. Không mặc định `User.id` hiện tại bằng `auth.uid()` vì hệ thống có xác thực riêng.
- Tạo chỉ mục `(studentUserId, assessmentId, submittedAt)`, `(classId, academicYearId, submittedAt)`, `(sourceId, status)` cho pipeline nhập; dùng `NUMERIC` cho điểm mới.
- Bổ sung FK sau bước dò orphan và đối chiếu hai loại ID học sinh; không bật cascade xóa điểm chỉ vì xóa cấu hình nguồn nhập.
- Trước triển khai: sao lưu, migration trên DB thử nghiệm, đối soát số bản ghi, phân quyền, rollback và khôi phục. Bản thiết kế này không thay đổi production.

## Các ca nghiệm thu bắt buộc

| Ca | Kết quả cần đạt |
|---|---|
| Nhập cùng dữ liệu hai lần; hai worker chạy đồng thời | Một lượt duy nhất, số lượt không tăng |
| Sắp xếp hoặc chèn dòng Sheets | Vẫn nhận diện đúng `record_id` |
| Sửa điểm cũ, mất mạng giữa import | Có revision/audit, chạy lại không mất/nhân đôi dữ liệu |
| Học sinh trùng tên, đổi email, chuyển lớp | Đối chiếu bằng mã và enrollment/năm học |
| Điểm rỗng, max=0, âm hoặc lớn hơn tối đa | Dòng bị từ chối, không thành điểm 0 |
| Dữ liệu 8/10 và 80/100 | Cùng chuẩn hóa 8/10 |
| Chỉ có tổng số lượt | Không bịa điểm đầu/cuối hay lịch sử từng lượt |
| LMS xuất Sheets rồi nhập lại | Không đếm hai lần cùng lượt |
| Giáo viên A truy vấn ID học sinh lớp B | Bị từ chối ở API/DB theo mô hình quyền |
| Báo cáo chưa có điểm hoặc mất kết nối | Thể hiện thiếu dữ liệu/lỗi; không báo thành công giả |
