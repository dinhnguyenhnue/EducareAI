# Một prompt redesign EDUCARE AI — Ocean Blue, rõ việc, dễ học

Ngày: 15/11/2026. Sao chép từ **BẮT ĐẦU PROMPT** đến **KẾT THÚC PROMPT** vào agent đang mở repo EDUCARE AI. Prompt yêu cầu agent triển khai khi được chạy; lượt tạo tài liệu này chưa thay đổi giao diện.

---

## BẮT ĐẦU PROMPT

Bạn là chuyên gia thiết kế sản phẩm giáo dục, kiến trúc thông tin, UX writing tiếng Việt, accessibility và kỹ sư frontend cấp cao. Hãy redesign và triển khai giao diện EDUCARE AI trên codebase hiện có, đạt chất lượng sản phẩm dùng hằng ngày: đẹp có bản sắc, dễ hiểu, ít thao tác thừa, dữ liệu đáng tin và hoạt động tốt trên điện thoại phổ thông.

Không dừng ở góp ý hoặc một landing page. Hãy audit, xác lập hướng thiết kế, triển khai theo từng nhóm màn hình và kiểm chứng các luồng. Phần hoàn thiện đã có phải được kế thừa. “Đẹp nhất” được chuyển thành tiêu chí có thể đánh giá; không tuyên bố tuyệt đối hoặc tự cho điểm cao khi thiếu bằng chứng.

### 1. Khôi phục đúng ngữ cảnh, giới hạn phạm vi

1. Chạy `git status --short`, đọc `AGENTS.md`; giữ nguyên mọi thay đổi chưa commit. Đọc skill bàn giao và `.planning/HANDOFF.md` → `task_plan.md` → 40 dòng cuối `progress.md`; chỉ đọc findings liên quan.
2. Đọc `docs/EDUCAREAI_VISION_AND_DECISIONS.md`, skill `.agents/skills/educare-uiux-performance/SKILL.md`, `DESIGN.md`, `MOTION_SPEC.md`; tham khảo mục liên quan trong `PRODUCT_SPEC.md` và phần cập nhật mới nhất `PRODUCT_REALITY_AUDIT.md`. Không nạp cả lịch sử/tài liệu hoặc các thư mục build vào context.
3. Khám phá mã bằng codebase-memory-mcp; làm mới index khi đã lỗi thời. Kiểm tra `src/lib/theme.ts`, motion tokens, thư viện `src/components/ui`, AppShell/Header/Sidebar, auth và các màn hình thuộc đợt triển khai.
4. Tái sử dụng stack thực tế Next.js App Router/React/TypeScript/Tailwind/Prisma và thư viện motion có sẵn. Không đổi framework, thiết kế lại schema hay cài thư viện đồ sộ chỉ để thay giao diện.
5. Đối chiếu repo tham khảo theo nhu cầu: `D:\AI\Repos\impeccable`, `D:\AI\Skills\ui-ux-pro-max-skill`, `D:\AI\Repos\evondevKit`, `D:\AI\Repos\modern-web-guidance`. Chắt lọc nguyên tắc, không nạp cả repo hay sao chép tài sản.
6. Bảo toàn API, URL cũ, RBAC, dữ liệu, chống nộp trùng, sandbox, autosave và bộ kiểm thử. Không seed/purge dữ liệu thật, không đọc/in secret, không push/deploy hoặc sửa slide trong tác vụ redesign. Chỉ thay backend khi cần sửa một lỗi tái hiện cản luồng được redesign; ghi rõ phạm vi.
7. Những lựa chọn UI thường lệ hãy tự quyết theo mục tiêu; chỉ hỏi khi thiếu thông tin thực sự chặn công việc hoặc thay đổi vượt phạm vi. Không thêm quy trình xin duyệt lặp lại sau mỗi component.

### 2. Sự thật sản phẩm phải được phản ánh

- Học sinh dùng **Mã học sinh + Mật khẩu**, có đổi mật khẩu lần đầu; không cần email trường và không tạo email giả. Giữ đăng nhập bằng email cho tài khoản thực sự có email. Màn hình lấy lại quyền truy cập của học sinh cần hướng dẫn liên hệ giáo viên/quản trị, không bắt buộc email.
- Giữ 6 vai trò RBAC và 4 cổng nhìn hiện có. Đổi góc nhìn không được cấp thêm quyền; khi quản trị xem trước vai trò khác phải có ngữ cảnh rõ, sidebar/breadcrumb nhất quán.
- Hệ thống đã có nhiều phần: upload Asset, HTML sandbox, IntegrationSlot, Sheets import, cấu hình mã hóa và ghi nhận lượt làm/chơi. Đọc mã xác minh trước khi xây mới. Không lấy báo cáo lỗi ngày 12/11 làm danh sách lỗi còn tồn tại.
- Phân biệt **cấu hình đã lưu**, **chờ cấp quyền**, **kết nối đã kiểm tra** và **đồng bộ dữ liệu thành công**. Chỉ có dữ liệu từ server và kiểm tra thật mới cho phép hiển thị trạng thái tương ứng.
- Gemini API, liên kết Gemini Gem và Agent API là ba hình thức khác nhau. Tính năng chưa sẵn sàng có thông báo/hành động phù hợp, không dựng nút thành công giả.
- Điểm thi, điểm bài nộp và điểm luyện tập do game tự báo phải có nhãn và nguồn riêng. Không tự nhập điểm game vào điểm chính thức. Thiếu dữ liệu là `null`/“Chưa có dữ liệu”; thiếu chi tiết câu sai thì nói rõ, không suy diễn.

### 3. Định hướng thị giác

Giữ **Ocean Blue**: nền sáng, mực chữ đậm, xanh dương làm điểm tập trung, khoảng trắng có chủ đích, đường chia mảnh, hình ảnh giáo dục tiết chế. Cảm giác tin cậy, hiện đại và thân thiện với học sinh; giáo viên có công cụ làm việc rõ ràng.

- Kế thừa token: primary `#2563EB`, deep `#1D4ED8`, canvas `#F8FAFC`, surface `#FFFFFF`, ink `#0F172A`; màu phụ lấy từ `MODULE_THEMES`, chỉ dùng điểm nhấn nhỏ. Kiểm tra contrast thực tế cho từng cặp chữ/nền/control, không coi mọi token đều đạt trên mọi nền.
- Giữ font hỗ trợ tiếng Việt đang dùng, ưu tiên một họ sans chính; monospace cho mã/đoạn code, `tabular-nums` cho cột số. Đề xuất nâng body học tập lên **16–18px**, input mobile **16px**, bảng desktop thường **14px**, nhãn phụ thường **12–13px**. H1 ứng dụng 24–32px tùy viewport, nhịp dòng rõ và không cắt dấu.
- Các thay đổi cỡ chữ trên là nâng cấp có lý do so với DESIGN hiện tại dùng 12–14px. Ghi rationale và cập nhật token/document sau khi thử trên trang thật; không tạo hàng loạt giá trị rời rạc.
- Khoảng cách theo nhịp 4/8px; khối đọc khoảng 60–75 ký tự/dòng; phân biệt rõ tiêu đề, mô tả, dữ liệu và hành động. Dữ liệu nhiều dùng bảng/danh sách, nội dung cần khám phá dùng thẻ.
- Không phủ toàn trang bằng card giống nhau, nested cards, banner xanh khổng lồ, chữ gradient, viền màu trang trí lệch một cạnh, hạt bay hoặc minh họa vô nghĩa. Card chỉ hover nổi nếu thật sự bấm được.
- Sử dụng một CTA chính nổi bật trong mỗi ngữ cảnh; các thao tác phụ nhẹ hơn. Nút có động từ cụ thể: “Học tiếp”, “Nộp bài”, “Lưu bản nháp”, “Gửi duyệt”, “Kiểm tra kết nối”.
- Tên thương hiệu EDUCARE AI/UNIGO phải nhất quán. Tên kỹ thuật “Ocean Blue”, “Sandbox”, “RBAC”, “REST API”, “3 Tab” không xuất hiện như lợi ích hay nhãn bắt buộc cho học sinh.

### 4. Kiến trúc thông tin và vai trò

Giữ các route hiện hành, rút ngắn tên và nhóm menu theo mục đích. Tạo bảng ánh xạ **route cũ → nhóm điều hướng → nhiệm vụ chính → CTA** trước khi sửa. Không che mất tính năng đang sử dụng.

| Người dùng | Màn hình đầu tiên ưu tiên | Nhóm điều hướng |
|---|---|---|
| Học sinh | Bài đang học, bài cần nộp, phản hồi mới | Hôm nay; Học tập (bài học/bài tập/luyện tập–kiểm tra); Sáng tạo; Trợ lý AI; Tiến bộ |
| Giáo viên | Bài cần chấm, việc sắp đến hạn, lớp đang phụ trách | Hôm nay; Lớp học; Học liệu; Giao bài; Chấm bài; Phân tích; Công cụ |
| Phụ huynh | Chọn con, việc cần hỗ trợ, nhận xét mới | Tổng quan; Bài học/bài tập; Tiến bộ; Thông báo |
| Quản trị | Vấn đề cần xử lý, tài khoản, kết nối | Tổng quan; Người dùng; Lớp/năm học; Nội dung; Tích hợp; Nhật ký |

Desktop: sidebar theo nhóm có active state rõ, breadcrumb ngắn, bộ chọn lớp/năm học tại vị trí ổn định. Mobile: drawer và tìm kiếm dễ chạm; cân nhắc thanh điều hướng dưới tối đa 4–5 mục nếu giúp học sinh/phụ huynh, không ép dùng cho bảng quản trị và không chồng nhiều thanh cố định.

Hợp nhất entry point AI theo nhiệm vụ; giữ tutor, prompt mẫu và Gems/Agents dưới các tab hoặc khu vực rõ. Không để người dùng phải hiểu tên nhà cung cấp mới biết công cụ nào giúp mình.

### 5. Đặc tả các màn hình trọng tâm

**A. Tổng quan học sinh**
- Nửa trên là “Hôm nay em cần làm gì?”: một nội dung học tiếp nổi bật; danh sách bài cần nộp có môn, hạn và trạng thái; phản hồi giáo viên.
- Phần dưới là tiến bộ theo dữ liệu thật và hoạt động khám phá. Không để hàng KPI, điểm thưởng hoặc bảng xếp hạng lấn nội dung học.
- Khi chưa được xếp lớp: giải thích ngắn và chỉ rõ liên hệ ai; khi chưa có bài: nêu trạng thái, không để màn hình trắng hoặc bịa tiến độ.

**B. Bài học, bài tập, luyện tập/thi**
- Bài học: mục tiêu → nội dung → tài liệu → hoạt động → bước tiếp theo; mục lục desktop, thu gọn mobile; đọc bài không bị widget AI che.
- Bài tập: yêu cầu, rubric, hạn nộp, tệp đính kèm, vùng nộp, lịch sử và nhận xét tách rõ. Có bản nháp, tiến độ upload, lỗi từng tệp, thử lại, xác nhận đã nhận bài từ server.
- Luyện tập và thi có nhãn/ràng buộc riêng. Phòng thi giảm điều hướng và thông báo không liên quan; luôn thấy thời gian, câu đang làm và tình trạng lưu. Giữ hỗ trợ accessibility và tránh mất câu trả lời khi lỗi mạng.
- Kết quả: điểm và thang điểm, lượt hợp lệ, câu cần ôn nếu có quyền xem; không lộ đáp án trước thời điểm cho phép.

**C. Bàn làm việc giáo viên và chấm bài**
- Dashboard ưu tiên hàng đợi cần xử lý, lớp và lịch; không áp dụng layout học sinh rồi đổi nhãn.
- Soạn bài dài bằng trang riêng: nội dung chính và panel thiết lập; hiển thị lưu nháp/xuất bản theo khả năng API thật. Modal dành cho tác vụ ngắn/xác nhận. Ghi lý do nếu thay modal soạn bài hiện hữu.
- Chấm bài desktop: danh sách học sinh, bài nộp, rubric/nhận xét có thứ bậc rõ; thao tác chuyển bài tiếp theo không mất dữ liệu. Mobile chia bước/tab nhưng giữ ngữ cảnh học sinh và trạng thái lưu.
- Thao tác hàng loạt phải có số lượng/phạm vi rõ và kết quả từng trường hợp; giữ bộ lọc khi mở chi tiết rồi quay lại.

**D. Kho học liệu và upload**
- Một cách trình bày thống nhất cho tệp trong bài học/bài tập/xưởng: tên, loại, dung lượng, quyền, trạng thái xử lý, xem/tải.
- Kéo thả luôn có nút “Chọn tệp” để dùng bằng bàn phím/điện thoại. Nêu giới hạn trước khi chọn. Phân biệt đã chọn, đang tải, đang xử lý, hoàn tất, lỗi, bị chặn.
- Không ghi “Đã lưu” khi chỉ chọn file local. Không bật loại file không được backend hỗ trợ.

**E. Xưởng trò chơi và HTML**
- Tách **Chơi trò đã duyệt** khỏi **Tạo trò chơi của em** bằng hai khu vực/tab dễ hiểu; các URL cũ vẫn hoạt động.
- Luồng sáng tạo: chọn bài tập/mục tiêu → chọn cách tạo (prompt mẫu/tải HTML/dán mã) → xem thử → gửi duyệt. Hiển thị phiên bản và phản hồi giáo viên.
- Desktop cho xem mã/xem thử song song khi đủ chỗ; mobile chuyển tab, có mở toàn màn hình. Hướng dẫn đơn giản, chi tiết kỹ thuật ở mục mở rộng.
- Giữ sandbox/CSP và giao thức ghi lượt chơi. “Điểm luyện tập do trò chơi gửi” không trình bày như điểm thi xác thực.

**F. Trung tâm AI**
- Gợi ý theo ý định: “Giải thích bài”, “Luyện thêm”, “Tạo trò chơi”, “Soạn học liệu” theo vai trò.
- Prompt có biến đầu vào và nút sao chép; Gem là liên kết ngoài có thông báo phù hợp; agent có trạng thái khả dụng và phạm vi hỗ trợ thật.
- Trợ lý nổi không tự mở, không che CTA, không gây gián đoạn khi thi; chỉ một entry point nổi. Khi AI lỗi/chưa cấu hình vẫn có hướng dẫn hoặc prompt dự phòng.

**G. Tiến bộ học sinh và phân tích lớp**
- Lọc lớp/môn/kỳ/hoạt động. Hiển thị điểm lần đầu/gần nhất/tốt nhất, số lượt hoàn tất và mức cải thiện với thang điểm nhất quán.
- Tách bài thi, bài nộp và lượt chơi. Mọi biểu đồ có đơn vị, mốc thời gian, nguồn, thời điểm cập nhật và bảng thay thế dễ đọc.
- Không phạt việc luyện nhiều lần; không xếp loại năng lực khi thiếu dữ liệu; nhận xét AI là gợi ý cần giáo viên duyệt. Phụ huynh thấy tiến bộ và bước hỗ trợ bằng ngôn ngữ dễ hiểu.

**H. Quản trị tài khoản và tích hợp**
- Cấp học sinh: nhập tay/CSV–Excel → xem trước và sửa lỗi → tạo tài khoản → thông báo kết quả. Mật khẩu tạm chỉ hiển thị đúng quy trình an toàn, không đưa vào ảnh chụp/báo cáo.
- Tích hợp có nhóm Google Workspace, Gemini API, Gems/Agents; dùng màn chi tiết hoặc quy trình từng bước thay vì một biểu mẫu dài trộn mọi dịch vụ.
- Từng dịch vụ: mục đích → trạng thái → trường cấu hình cần thiết → lưu → cấp quyền → kiểm tra → lần kiểm tra gần nhất và lỗi có hướng xử lý. Cần map từ trạng thái server thật, không chỉ đổi màu badge.
- Secret write-only, để trống có nghĩa “giữ nguyên” nếu API hỗ trợ; không hiện lại plaintext. Thiếu khóa mã hóa máy chủ thì hướng dẫn quản trị xử lý trước, không bật lưu giả.
- Giáo viên thấy công cụ sử dụng và trạng thái liên quan; học sinh không phải đọc OAuth scope hoặc cấu hình máy chủ.

### 6. Component, states, accessibility và hiệu năng

- Tái sử dụng PageHeader, OceanButton, DataTable, Tabs, Modal, Drawer, EmptyState, ErrorState, Toast và tokens. Không thêm component trùng chỉ vì muốn đổi kiểu.
- Thiết kế trạng thái: loading, empty, ready, saving, success, error, disabled, forbidden; thêm offline/stale/pending-consent nơi cần. Giữ dữ liệu người dùng đã nhập khi lỗi; không dùng toast biến mất làm bằng chứng duy nhất cho việc nộp bài/lưu điểm.
- Mục tiêu **WCAG 2.2 AA**: contrast chữ thường ≥4.5:1, chữ lớn ≥3:1; dấu hiệu control/focus phù hợp ≥3:1; label thật, lỗi có hướng dẫn, bàn phím đầy đủ, skip-link, focus không bị che. Một h1, heading theo thứ tự.
- Vùng chạm đặt mục tiêu UX **44×44 CSS px** cho thao tác chính; không nhầm với ngưỡng tối thiểu AA 24×24 có ngoại lệ. Text zoom 200%, reflow 320px. Không giấu tràn bằng `overflow-x-hidden` để làm đẹp kết quả đo; bảng rộng có vùng cuộn cục bộ có thể nhận biết.
- Giữ focus trap/return và Portal của Modal/Drawer, Tabs bàn phím, Disclosure chuẩn; IME tiếng Việt không gửi sớm khi Enter. Kiểm tra trình đọc màn hình và forced colors ở luồng chính khi công cụ hỗ trợ.
- Chuyển động theo motion tokens khoảng 150–300ms cho tương tác, chỉ transform/opacity; không chặn input, không làm mọi thẻ nhảy khi hover. Reduced motion ở CSS và runtime.
- Hiệu năng: ưu tiên Server Components phù hợp, lazy-load chat/editor/chart/game theo nhu cầu, giữ chỗ media/skeleton, tránh tải trước mọi widget và tránh fetch lặp. Không đặt virtualization/content-visibility vào mọi chỗ khi chưa có vấn đề đo được.
- Mục tiêu Core Web Vitals ngoài thực tế ở p75: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Local/lab phải ghi điều kiện đo; không dùng TBT thay cho kết luận INP và không dùng báo cáo 103 kB cũ làm budget đã đạt hôm nay. Đo baseline và báo regression trước/sau.

### 7. Thứ tự triển khai và bằng chứng

1. **Audit có giới hạn:** chụp baseline desktop/mobile của các luồng chính trên local/dev an toàn; lập bảng vấn đề theo tác động và route. Xác minh các màn đã sửa để tránh làm lại từ báo cáo cũ.
2. **Hướng thiết kế:** chốt một phương án phù hợp kèm lý do, sitemap và vài wireframe của dashboard học sinh, chấm bài, cấu hình tích hợp. Ghi mapping component/trạng thái; tiếp tục triển khai trong phạm vi được giao.
3. **Nền tảng:** typography, spacing, AppShell, navigation và component dùng chung. Sau đó làm dashboard học sinh + một luồng bài học → bài tập → nộp bài làm mẫu chuẩn.
4. **Mở rộng:** giáo viên/chấm bài → HTML/AI → phân tích/phụ huynh → quản trị/tích hợp → các trang công khai/auth còn lại. Dùng cùng hệ thiết kế nhưng bố cục theo công việc.
5. **Kiểm chứng:** test các trạng thái không dữ liệu, dữ liệu dài, nhiều tệp, mạng lỗi, chưa cấu hình và sai quyền; bảo vệ các sửa lỗi bảo mật hiện có.
6. **Bàn giao:** cập nhật DESIGN/MOTION/PRODUCT/AUDIT phần liên quan và `.planning/*`. Ghi rõ đề xuất đã triển khai, API còn thiếu, kiểm thử bị chặn và việc tiếp theo.

### 8. Tiêu chí nghiệm thu

- Bảng route coverage cho cả 4 cổng, các trang công khai/auth và embed liên quan; mỗi trang có mục đích, CTA, trạng thái rỗng/lỗi và kết quả kiểm chứng.
- Kiểm tra 320, 375, 768, 1024, 1440px; tối thiểu bằng chứng ảnh tại 375/768/1440 cho các màn mẫu. Không có nội dung/CTA bị che, chữ cắt dấu hoặc mất thao tác khi zoom 200%.
- Hoàn tất luồng: học sinh đăng nhập bằng mã/đổi mật khẩu lần đầu → tìm bài → nộp tệp → xem xác nhận; giáo viên giao/chấm; tạo HTML → gửi duyệt; quản trị lưu cấu hình thiếu/đủ điều kiện và xem trạng thái thật.
- So sánh số thao tác tìm chức năng với baseline; đặt mục tiêu tìm đến tác vụ thường dùng trong ≤2 thao tác điều hướng từ trang tổng quan, không tính bước nhập/nộp dữ liệu cần thiết. Thử với người dùng đại diện nếu có; nếu chỉ agent walkthrough thì ghi rõ chưa có usability test người thật.
- Chạy lệnh chuẩn khi sửa source: `pnpm exec prisma validate`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`; cài theo lockfile khi cần. DB kiểm thử phải cô lập và phù hợp provider schema; không tùy tiện trỏ URL SQLite cho schema PostgreSQL. Không seed/purge production.
- Giữ các kiểm thử hành vi có ý nghĩa; bổ sung cho luồng thay đổi, không dùng kiểm tra source chứa chuỗi làm bằng chứng hành vi UI hoạt động.
- Báo cáo PASS/FAIL/BLOCKED theo lệnh và luồng; ảnh trước/sau cùng kích thước, dữ liệu thử được ghi nhãn, console/page errors và hiệu năng có điều kiện đo. Google thật chưa cấp quyền thì ghi BLOCKED, không báo đã kết nối.
- Không tự chấm 10/10 hoặc tuyên bố “hết lỗi”. Bàn giao link/path file đã sửa, quyết định thiết kế, bằng chứng và hạn chế còn lại. Không công bố website khi chỉ đang được giao redesign local.

Hãy bắt đầu bằng kiểm tra trạng thái repo và một bản audit ngắn, sau đó tiến hành theo thứ tự trên. Kết quả phải là một giao diện làm rõ việc dạy và học, có chất lượng thị giác nhất quán và bằng chứng sử dụng được.

## KẾT THÚC PROMPT

---

Nguồn chuẩn cho tiêu chí: [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) và [Google Web Vitals](https://web.dev/articles/vitals). Đây là mục tiêu nghiệm thu, không phải kết quả đo EDUCARE AI trong lượt soạn prompt.
