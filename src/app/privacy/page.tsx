import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  FileCheck,
  UserCheck,
  Server,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "Chính sách Bảo mật & Quyền riêng tư (Privacy Policy) | EDUCARE AI - UNIGO",
  description:
    "Chính sách bảo vệ dữ liệu cá nhân, tuân thủ Nghị định 13/2023/NĐ-CP và Google API Services User Data Policy (Limited Use) của hệ sinh thái học tập số EDUCARE AI - Trường Tiểu học và THCS UNIGO.",
};

export default function PrivacyPolicyPage() {
  const googleScopes = [
    {
      scope: "openid, email, profile",
      service: "Google Sign-In (OAuth 2.0)",
      access: "Họ tên, địa chỉ email, ảnh đại diện Google và định danh tài khoản (Google ID).",
      purpose: "Xác thực danh tính người dùng (Học sinh, Giáo viên, Phụ huynh, Quản trị viên) mà không cần lưu trữ mật khẩu Google.",
      storage: "Lưu trong bảng `User` tại cơ sở dữ liệu PostgreSQL/SQLite của EDUCARE AI.",
    },
    {
      scope: "https://www.googleapis.com/auth/drive.file",
      service: "Google Drive API v3",
      access: "Chỉ truy cập các tệp và thư mục do chính người dùng tải lên hoặc tạo ra thông qua ứng dụng EDUCARE AI (quyền tối thiểu `drive.file`, KHÔNG truy cập toàn bộ Drive cá nhân).",
      purpose: "Lưu trữ đề kiểm tra, giáo án, bài nộp học sinh và sản phẩm dự án học tập.",
      storage: "Chỉ lưu ID tệp (`drive_file_id`) và liên kết xem trước trong hệ thống.",
    },
    {
      scope: "https://www.googleapis.com/auth/documents",
      service: "Google Docs API v1",
      access: "Đọc và ghi cấu trúc tài liệu đối với các file đề thi, giáo án hoặc phiếu học tập được liên kết trong EDUCARE AI.",
      purpose: "Hỗ trợ giáo viên khởi tạo đề kiểm tra, giáo án từ mẫu chuẩn (Template) và điền nhận xét học tập.",
      storage: "Lưu metadata tài liệu (`googleDocId`, tên bài, môn học, phiên bản).",
    },
    {
      scope: "https://www.googleapis.com/auth/spreadsheets",
      service: "Google Sheets API v4",
      access: "Tạo mới và cập nhật dữ liệu dạng bảng trên các tệp báo cáo học tập được chỉ định.",
      purpose: "Đồng bộ một chiều từ CSDL chính của EDUCARE AI ra bảng tính báo cáo điểm và tiến độ cho giáo viên và Tổ chuyên môn THCS.",
      storage: "Dữ liệu gốc nằm tại PostgreSQL; Sheets chỉ nhận bản xuất báo cáo theo lịch hoặc theo yêu cầu.",
    },
    {
      scope: "https://www.googleapis.com/auth/classroom.courses & classroom.coursework.students",
      service: "Google Classroom API v1",
      access: "Danh sách lớp học, bài tập (CourseWork), trạng thái nộp bài (StudentSubmissions) và điểm số trong phạm vi lớp mà giáo viên phụ trách.",
      purpose: "Đồng bộ bài tập từ EDUCARE AI sang Google Classroom, theo dõi trạng thái nộp bài và trả điểm cho học sinh.",
      storage: "Lưu mã ánh xạ lớp (`classroomCourseId`), mã bài tập (`classroomCourseworkId`) và trạng thái đồng bộ.",
    },
    {
      scope: "https://www.googleapis.com/auth/calendar.events",
      service: "Google Calendar API v3",
      access: "Đọc/ghi sự kiện trên lịch học tập được chia sẻ hoặc lịch cá nhân khi người dùng bật tính năng đồng bộ lịch.",
      purpose: "Tạo nhắc việc tự động cho hạn nộp bài tập, lịch kiểm tra và báo cáo dự án.",
      storage: "Chỉ thực hiện khi người dùng chủ động cấp quyền (Opt-in).",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-border px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" subtitle="Cổng Pháp lý & Bảo vệ Dữ liệu Học đường" />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            href="/terms"
            className="px-3 py-1.5 rounded-xl bg-canvas hover:bg-surface-muted border border-border text-ink transition-colors"
          >
            Điều khoản sử dụng (Terms)
          </Link>
          <Link
            href="/dang-nhap"
            className="px-4 py-2 rounded-xl bg-ocean-600 text-white hover:bg-ocean-700 shadow-sm transition-colors"
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ EDUCARE AI</span>
          </Link>
          <span className="text-xs text-ink-muted font-mono">
            Hiệu lực từ: 01/11/2026 • Phiên bản: 2.0-OAuth-Compliant
          </span>
        </div>

        {/* Hero Title Card */}
        <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-50 border border-ocean-200 text-ocean-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Tuân thủ Nghị định 13/2023/NĐ-CP & Google API Limited Use Policy</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Chính sách Bảo mật và Quyền riêng tư Dữ liệu (Privacy Policy)
          </h1>

          <p className="text-sm text-ink-muted leading-relaxed">
            Chào mừng bạn đến với <strong>EDUCARE AI — Hệ sinh thái Học tập số Trường Tiểu học và THCS UNIGO</strong>. Chính sách này giải thích rõ cách chúng tôi thu thập, sử dụng, lưu trữ, bảo vệ dữ liệu cá nhân của học sinh, giáo viên, phụ huynh và cách chúng tôi tích hợp với các dịch vụ <strong>Google Workspace</strong> và <strong>Google Gemini AI</strong> theo chuẩn pháp lý Việt Nam và quốc tế.
          </p>

          {/* Mandatory Google Limited Use Disclosure Box */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border-2 border-ocean-200 space-y-2">
            <div className="flex items-center gap-2 text-ocean-700 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cam kết Tuân thủ Chính sách Dữ liệu Người dùng Google API (Google API Services User Data Policy Disclosure)</span>
            </div>
            <p className="text-xs text-ink leading-relaxed font-medium">
              <strong>Tiếng Việt:</strong> Việc EDUCARE AI sử dụng và chuyển giao thông tin nhận được từ các Google API sang bất kỳ ứng dụng nào khác hoàn toàn tuân thủ{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-ocean-600 hover:text-ocean-700 underline font-bold"
              >
                Chính sách dữ liệu người dùng của Dịch vụ API của Google (Google API Services User Data Policy)
              </a>
              , bao gồm cả các yêu cầu về <strong>Sử dụng Hạn chế (Limited Use requirements)</strong>.
            </p>
            <p className="text-xs text-ink-muted leading-relaxed italic border-t border-ocean-200 pt-2">
              <strong>English (For Google OAuth Verification Reviewers):</strong> EDUCARE AI&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noreferrer"
                className="text-ocean-600 hover:text-ocean-700 underline font-semibold"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. We do NOT use Google Workspace data or student personal data for serving advertisements, selling to third-party data brokers, or training generalized artificial intelligence/machine learning models.
            </p>
          </div>
        </section>

        {/* Section 1: Legal Basis in Vietnam & Educational Privacy */}
        <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Scale className="w-5 h-5 text-ocean-600" />
            <h2 className="text-lg font-bold text-ink">
              1. Căn cứ pháp lý và Nguyên tắc bảo vệ dữ liệu trẻ em (Học sinh Tiểu học & THCS)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div className="p-4 rounded-button bg-canvas border border-border space-y-2">
              <h3 className="font-bold text-ink text-sm">1.1. Pháp luật Việt Nam hiện hành</h3>
              <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                <li>
                  <strong>Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ về Bảo vệ dữ liệu cá nhân (đặc biệt tuân thủ <strong>Điều 20: Bảo vệ dữ liệu cá nhân của trẻ em</strong> từ 7 tuổi đến dưới 16 tuổi).
                </li>
                <li>
                  <strong>Luật Trẻ em 2016</strong> (Điều 21 về quyền bí mật đời sống riêng tư của trẻ em) và <strong>Luật An ninh mạng 2018</strong>.
                </li>
                <li>
                  Quy định của Bộ Giáo dục và Đào tạo về quản lý, vận hành hệ thống thông tin giáo dục và hồ sơ học tập điện tử.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-button bg-canvas border border-border space-y-2">
              <h3 className="font-bold text-ink text-sm">1.2. Sự đồng ý của Phụ huynh & Nhà trường</h3>
              <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                <li>
                  Tài khoản học sinh UNIGO được cấp phát và quản lý dưới sự ủy quyền chính thức của <strong>Trường Tiểu học và THCS UNIGO</strong> và sự đồng thuận của cha/mẹ hoặc người giám hộ hợp pháp.
                </li>
                <li>
                  <strong>Không yêu cầu mật khẩu Google:</strong> EDUCARE AI tuyệt đối không bao giờ yêu cầu học sinh hay giáo viên nhập mật khẩu Google trực tiếp trên nền tảng. Mọi kết nối đều qua chuẩn ủy quyền <strong>OAuth 2.0</strong> chính thức của Google.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Google OAuth Scopes Table */}
        <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Lock className="w-5 h-5 text-ocean-600" />
            <h2 className="text-lg font-bold text-ink">
              2. Chi tiết các Quyền truy cập Google OAuth (Scopes) và Mục đích sử dụng
            </h2>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Theo nguyên tắc <strong>Cấp quyền tối thiểu (Least Privilege)</strong>, EDUCARE AI chỉ yêu cầu các quyền (scopes) cần thiết tương ứng với vai trò của người dùng. Dưới đây là bảng minh bạch từng quyền truy cập:
          </p>

          <div className="overflow-x-auto border border-border rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink font-bold">
                  <th className="py-3 px-4 w-1/5">Dịch vụ & OAuth Scope</th>
                  <th className="py-3 px-4 w-1/4">Dữ liệu truy cập</th>
                  <th className="py-3 px-4 w-1/3">Mục đích sử dụng trong EDUCARE AI</th>
                  <th className="py-3 px-4">Lưu trữ & Kiểm soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {googleScopes.map((item, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-bold text-ocean-600 block">{item.service}</span>
                      <code className="text-[10px] font-mono bg-surface-muted px-1.5 py-0.5 rounded text-ink mt-1 inline-block break-all">
                        {item.scope}
                      </code>
                    </td>
                    <td className="py-3.5 px-4 align-top text-ink leading-relaxed">{item.access}</td>
                    <td className="py-3.5 px-4 align-top text-ink-muted leading-relaxed">{item.purpose}</td>
                    <td className="py-3.5 px-4 align-top text-ink-muted leading-relaxed">{item.storage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: AI & Gemini Data Protection */}
        <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <EyeOff className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-ink">
              3. Bảo mật dữ liệu khi sử dụng Trí tuệ nhân tạo (Google Gemini AI)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-ink block">Không dùng dữ liệu HS để huấn luyện AI</span>
              <p className="text-ink-muted leading-relaxed">
                EDUCARE AI sử dụng Gemini API ở chế độ bảo mật doanh nghiệp/giáo dục (Paid Tier). Mọi câu hỏi, bài làm của học sinh <strong>không được sử dụng để huấn luyện (train)</strong> các mô hình AI công cộng.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-ink block">Bảo vệ không gian hỏi đáp của Học sinh</span>
              <p className="text-ink-muted leading-relaxed">
                Phụ huynh chỉ xem báo cáo tiến độ, điểm số và nhận xét chính thức của giáo viên. Lịch sử hội thoại chi tiết giữa học sinh và AI Tutor được giữ riêng tư cho mục đích sư phạm để học sinh không ngại đặt câu hỏi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-ink block">Không lưu API Key ở Frontend</span>
              <p className="text-ink-muted leading-relaxed">
                Toàn bộ khóa kết nối Google OAuth và Gemini API được bảo vệ nghiêm ngặt ở tầng máy chủ (Backend Server-side) và mã hóa token theo chuẩn AES-256.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: User Rights & Revoking Access */}
        <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <UserCheck className="w-5 h-5 text-ocean-600" />
            <h2 className="text-lg font-bold text-ink">
              4. Quyền của Người dùng: Xem, Chỉnh sửa, Thu hồi quyền OAuth và Xóa dữ liệu
            </h2>
          </div>

          <div className="space-y-3 text-xs text-ink leading-relaxed">
            <p>
              Người dùng (hoặc cha mẹ/người giám hộ của học sinh) có đầy đủ các quyền của chủ thể dữ liệu theo Điều 9 Nghị định 13/2023/NĐ-CP và quy định của Google:
            </p>
            <ul className="space-y-2 list-disc list-inside text-ink-muted">
              <li>
                <strong className="text-ink">Quyền thu hồi kết nối Google (Revoke Access) bất kỳ lúc nào:</strong> Người dùng có thể ngắt kết nối trực tiếp tại mục{" "}
                <Link href="/giao-vien/google-workspace" className="text-ocean-600 hover:text-ocean-700 underline font-semibold">
                  Google Workspace Center
                </Link>{" "}
                trong EDUCARE AI, hoặc truy cập trực tiếp trang quản lý bảo mật của Google tại:{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ocean-600 hover:text-ocean-700 underline font-mono"
                >
                  https://myaccount.google.com/permissions
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Quyền yêu cầu xóa dữ liệu (Data Deletion):</strong> Khi thu hồi quyền hoặc gửi yêu cầu xóa tài khoản tới Quản trị viên nhà trường, hệ thống sẽ xóa toàn bộ OAuth Access/Refresh Token đã lưu ngay lập tức và ẩn danh/xóa dữ liệu cá nhân trong vòng 72 giờ theo quy trình lưu trữ hồ sơ học đường.
              </li>
              <li>
                <strong className="text-ink">Không bán hoặc chia sẻ cho bên thứ ba:</strong> Dữ liệu học tập chỉ được lưu chuyển nội bộ giữa Học sinh, Giáo viên phụ trách, Phụ huynh được liên kết và Ban Giám hiệu/Tổ chuyên môn Trường Tiểu học & THCS UNIGO.
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Info Footer Card */}
        <section className="p-6 rounded-2xl bg-canvas border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-ink text-sm">Thông tin Liên hệ Bộ phận Bảo vệ Dữ liệu (DPO) — UNIGO</h3>
            <p className="text-ink-muted">
              Đơn vị chủ quản: <strong>Trường Tiểu học và Trung học Cơ sở UNIGO</strong> (Bộ phận Công nghệ Giáo dục & Tổ THCS)
            </p>
            <p className="text-ink-muted">
              Email hỗ trợ pháp lý & quyền riêng tư:{" "}
              <a href="mailto:privacy@unigo.edu.vn" className="text-ocean-600 hover:text-ocean-700 font-semibold underline">
                privacy@unigo.edu.vn
              </a>{" "}
              • Điện thoại: (024) 7300-8899
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/terms"
              className="px-4 py-2 rounded-button bg-surface border border-border font-semibold text-ink hover:bg-surface-muted transition-colors"
            >
              Xem Điều khoản Sử dụng →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

