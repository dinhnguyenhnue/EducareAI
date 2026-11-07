import React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Users,
  Lock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "Điều khoản Sử dụng (Terms of Use / Terms of Service) | EDUCARE AI - UNIGO",
  description:
    "Điều khoản sử dụng chính thức của hệ sinh thái học tập số EDUCARE AI - Trường Tiểu học và THCS UNIGO, quy định về đăng nhập Google OAuth, liêm chính học thuật với AI và quy tắc cộng đồng học tập.",
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base">
              EA
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-ink tracking-tight text-base">EDUCARE AI</span>
                <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-1.5 py-0.5 rounded">
                  UNIGO
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">Cổng Pháp lý & Điều khoản Dịch vụ</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-button bg-canvas hover:bg-surface-muted border border-border text-ink transition-colors"
          >
            Chính sách bảo mật (Privacy)
          </Link>
          <Link
            href="/dang-nhap"
            className="px-4 py-2 rounded-button bg-brand-teal text-white hover:bg-brand-teal-hover transition-colors"
          >
            Đăng nhập OAuth
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ EDUCARE AI</span>
          </Link>
          <span className="text-xs text-ink-muted font-mono">
            Cập nhật lần cuối: 05/11/2026 • Áp dụng: Toàn hệ thống UNIGO
          </span>
        </div>

        {/* Hero Card */}
        <section className="p-8 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-soft text-brand-teal text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Điều khoản Sử dụng & Quy tắc Học thuật Số UNIGO (Terms of Service)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Điều khoản Sử dụng Nền tảng EDUCARE AI (Terms of Use)
          </h1>

          <p className="text-sm text-ink-muted leading-relaxed">
            Văn bản này quy định quyền và nghĩa vụ pháp lý giữa người sử dụng (Học sinh, Giáo viên, Phụ huynh, Quản trị viên và Thành viên Cộng đồng) với <strong>Trường Tiểu học và THCS UNIGO</strong> khi truy cập và sử dụng hệ sinh thái học tập số <strong>EDUCARE AI</strong>, bao gồm các tích hợp với <strong>Google Workspace</strong> và <strong>Google Gemini AI</strong>.
          </p>

          <div className="p-4 rounded-panel bg-canvas border border-border text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink">English Summary for Google OAuth Verification:</strong> By signing in with Google OAuth 2.0 or using EDUCARE AI, users agree to use the platform exclusively for educational, instructional, and academic assessment purposes under the supervision of UNIGO Primary &amp; Secondary School. Users retain full ownership of their Google Drive files, Docs, Sheets, and Calendar events, and may revoke OAuth permissions at any time.
          </div>
        </section>

        {/* Section 1: Roles & Accounts */}
        <section className="p-8 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Users className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-bold text-ink">
              1. Phân loại Tài khoản và Quy định Đăng nhập bằng Google (OAuth 2.0)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div className="p-4 rounded-button bg-canvas border border-border space-y-2">
              <h3 className="font-bold text-ink text-sm">1.1. Bốn vai trò chính thức & Tài khoản Cộng đồng</h3>
              <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                <li>
                  <strong>Học sinh UNIGO đã xác thực:</strong> Được truy cập lớp học, bài giảng, nộp bài, AI Tutor, Prompt Lab và đăng sản phẩm.
                </li>
                <li>
                  <strong>Giáo viên UNIGO:</strong> Quản lý lớp, soạn bài, chấm điểm theo Rubric, phê duyệt nhận xét AI và kiểm duyệt cộng đồng.
                </li>
                <li>
                  <strong>Phụ huynh:</strong> Xem tiến độ học tập, điểm số được chia sẻ và nhận gợi ý đồng hành (không xâm phạm hội thoại AI riêng tư của con).
                </li>
                <li>
                  <strong>Tài khoản ngoài trường (Cộng đồng):</strong> Chỉ được xem nội dung công khai và gửi bài qua quy trình kiểm duyệt; tuyệt đối không được truy cập dữ liệu nội bộ của học sinh UNIGO.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-button bg-canvas border border-border space-y-2">
              <h3 className="font-bold text-ink text-sm">1.2. Nguyên tắc Xác thực Google OAuth 2.0</h3>
              <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                <li>
                  Người dùng đăng nhập thông qua cổng ủy quyền chính thức của Google (<code>accounts.google.com</code>).
                </li>
                <li>
                  Người dùng không được chia sẻ phiên đăng nhập, không mạo danh tài khoản của học sinh hoặc giáo viên khác.
                </li>
                <li>
                  Đối với học sinh dưới 16 tuổi, việc kích hoạt tài khoản và kết nối Google Workspace được thực hiện dưới sự hướng dẫn của nhà trường và sự đồng thuận của phụ huynh theo Điều 20 Nghị định 13/2023/NĐ-CP.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Academic Integrity & AI Usage */}
        <section className="p-8 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Sparkles className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-bold text-ink">
              2. Liêm chính Học thuật và Quy tắc sử dụng Trí tuệ nhân tạo (Gemini AI & Gems)
            </h2>
          </div>

          <div className="space-y-3 text-xs text-ink leading-relaxed">
            <p>
              Căn cứ triết lý giáo dục của <strong>Tổ THCS UNIGO</strong> (<em>Giúp học sinh biết đặt câu hỏi, biết làm, biết phản biện, hạn chế học vẹt</em>), người dùng cam kết tuân thủ các nguyên tắc sử dụng AI sau:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
                <span className="font-bold text-brand-teal block">AI là Gia sư gợi mở, không làm thay</span>
                <p className="text-ink-muted">
                  Học sinh sử dụng AI Tutor và Prompt Lab để tìm hiểu bản chất vấn đề, xin gợi ý từng bước và rèn tư duy phản biện; không sử dụng AI để chép lời giải có sẵn mà không hiểu bài.
                </p>
              </div>

              <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
                <span className="font-bold text-brand-teal block">Trách nhiệm với sản phẩm học tập</span>
                <p className="text-ink-muted">
                  Khi nộp bài tập hoặc đăng sản phẩm lên Cộng đồng, học sinh phải thuyết minh rõ quy trình thực hiện, công cụ đã dùng và tự đánh giá trung thực theo Rubric.
                </p>
              </div>

              <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
                <span className="font-bold text-brand-teal block">Giáo viên quyết định chuyên môn cuối cùng</span>
                <p className="text-ink-muted">
                  Mọi điểm số đề xuất hoặc nhận xét do AI sinh ra đều mang nhãn &ldquo;Bản nháp AI / AI đề xuất&rdquo;. Giáo viên bộ môn là người kiểm tra và phê duyệt kết quả chính thức.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Google Workspace Services Rules */}
        <section className="p-8 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Lock className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-bold text-ink">
              3. Quy định về Tích hợp Google Drive, Docs, Sheets, Classroom và Calendar
            </h2>
          </div>

          <ul className="space-y-2 text-xs text-ink-muted list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-ink">Quyền sở hữu tệp:</strong> Giáo viên và học sinh giữ nguyên quyền sở hữu đối với toàn bộ tài liệu trên Google Drive, Google Docs và Google Sheets của mình.
            </li>
            <li>
              <strong className="text-ink">Tính toàn vẹn dữ liệu điểm số:</strong> Cơ sở dữ liệu chính của EDUCARE AI (PostgreSQL) là nguồn dữ liệu chuẩn duy nhất. Các bảng tính Google Sheets được xuất ra phục vụ mục đích báo cáo và thống kê; việc tự ý chỉnh sửa trên file Sheets bên ngoài sẽ không ghi đè trái phép lên điểm gốc trong hệ thống nếu không qua xác thực của giáo viên có thẩm quyền.
            </li>
            <li>
              <strong className="text-ink">An toàn tệp tải lên:</strong> Nghiêm cấm tải lên Google Drive của hệ thống các tệp chứa mã độc (virus, malware), nội dung vi phạm pháp luật Việt Nam, nội dung bạo lực học đường hoặc vi phạm bản quyền.
            </li>
          </ul>
        </section>

        {/* Section 4: Community Moderation */}
        <section className="p-8 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <AlertTriangle className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-bold text-ink">
              4. Quy tắc Cộng đồng Học tập Mở và Kiểm duyệt Nội dung
            </h2>
          </div>

          <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
            <p>
              Cộng đồng học tập EDUCARE AI được chia làm 02 phân vùng rõ rệt: (1) <strong>Vùng Học liệu chuẩn</strong> do giáo viên thẩm định và (2) <strong>Vùng Sản phẩm học sinh</strong>.
            </p>
            <p>
              Mọi bài đăng, dự án và mẫu Prompt do học sinh gửi lên đều ở trạng thái <code>Chờ duyệt (Pending Review)</code> và chỉ được hiển thị công khai sau khi giáo viên kiểm duyệt đạt yêu cầu về tính chuẩn mực sư phạm và an toàn thông tin.
            </p>
            <p>
              Khi tham gia bình luận và đánh giá chéo (Peer Review), học sinh phải giữ thái độ tôn trọng, nhận xét dựa trên tiêu chí Rubric, không công kích cá nhân. Giáo viên và Quản trị viên có quyền ẩn các bình luận không phù hợp.
            </p>
          </div>
        </section>

        {/* Footer Acceptance */}
        <section className="p-6 rounded-panel bg-brand-teal-soft/50 border border-brand-teal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-brand-teal text-sm block">
              Xác nhận đồng ý Điều khoản & Chính sách Bảo mật
            </span>
            <p className="text-ink">
              Bằng việc nhấn &ldquo;Đăng nhập bằng Google&rdquo; hoặc sử dụng tài khoản UNIGO, bạn xác nhận đã đọc, hiểu và đồng ý với toàn bộ Điều khoản Sử dụng và Chính sách Bảo mật này.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/privacy"
              className="px-4 py-2 rounded-button bg-surface border border-border font-semibold text-ink hover:bg-surface-muted transition-colors"
            >
              Chính sách Bảo mật
            </Link>
            <Link
              href="/dang-nhap"
              className="px-4 py-2 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors"
            >
              Đến trang Đăng nhập →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

