"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Compass,
  ArrowRight,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
} from "lucide-react";

type RegistrationRole = "STUDENT" | "TEACHER" | "PARENT" | "COMMUNITY_USER";

export default function RegisterPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<RegistrationRole>("STUDENT");

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Student fields
  const [gradeLevel, setGradeLevel] = useState("7");
  const [className, setClassName] = useState("7A1");
  const [studentCode, setStudentCode] = useState("");
  const [parentConsent, setParentConsent] = useState(false);

  // Teacher fields
  const [specialization, setSpecialization] = useState("Tin học & Công nghệ số");
  const [teacherInviteCode, setTeacherInviteCode] = useState("");

  // Parent fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [childStudentCode, setChildStudentCode] = useState("");
  const [relationship, setRelationship] = useState("PHU_HUYNH");

  // Community fields
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    if (activeRole === "STUDENT" && !parentConsent) {
      setErrorMessage("Học sinh dưới 16 tuổi cần xác nhận đồng ý của Phụ huynh theo Nghị định 13/2023/NĐ-CP.");
      return;
    }

    if (activeRole === "COMMUNITY_USER" && !termsAccepted) {
      setErrorMessage("Vui lòng đồng ý với Điều khoản sử dụng của cộng đồng.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          // Role specific
          gradeLevel: Number(gradeLevel),
          className,
          studentCode,
          parentConsent,
          specialization,
          teacherInviteCode,
          phoneNumber,
          childStudentCode,
          relationship,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Đăng ký thất bại. Vui lòng thử lại.");
        return;
      }

      setSuccessMessage(data.message || "Đăng ký tài khoản thành công!");
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 2000);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base shadow-card transition-transform group-hover:scale-105">
            EA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink tracking-tight text-base">EDUCARE AI</span>
              <span className="text-[10px] font-semibold bg-brand-teal-soft text-brand-teal px-1.5 py-0.5 rounded">
                UNIGO
              </span>
            </div>
            <p className="text-[10px] text-ink-muted -mt-0.5">Cổng đăng ký thành viên</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-ink-muted text-xs">Đã có tài khoản?</span>
          <Link
            href="/dang-nhap"
            className="px-3.5 py-1.5 rounded-button bg-surface border border-border hover:bg-surface-muted text-ink font-semibold text-xs transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl bg-surface border border-border rounded-panel shadow-panel p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Tạo tài khoản EDUCARE AI
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 max-w-md mx-auto">
              Chọn vai trò của bạn để nhận không gian học tập và làm việc sư phạm phù hợp.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl bg-canvas border border-border mb-8">
            <button
              type="button"
              onClick={() => setActiveRole("STUDENT")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "STUDENT"
                  ? "bg-surface text-brand-teal shadow-card border border-border"
                  : "text-ink-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("TEACHER")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "TEACHER"
                  ? "bg-surface text-brand-teal shadow-card border border-border"
                  : "text-ink-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Giáo viên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("PARENT")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "PARENT"
                  ? "bg-surface text-brand-teal shadow-card border border-border"
                  : "text-ink-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <HeartHandshake className="w-5 h-5" />
              <span>Phụ huynh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("COMMUNITY_USER")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "COMMUNITY_USER"
                  ? "bg-surface text-brand-teal shadow-card border border-border"
                  : "text-ink-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>Cộng đồng</span>
            </button>
          </div>

          {/* Admin Policy Notice */}
          <div className="mb-6 p-3 rounded-lg bg-surface-muted/60 border border-border text-[11px] text-ink-muted flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
            <div>
              <strong>Chính sách phân quyền:</strong> Tài khoản Quản trị viên (Super Admin, Ban giám hiệu) được thiết lập bảo mật riêng bởi nhà trường và không có biểu mẫu đăng ký công khai.
            </div>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-status-danger-soft border border-status-danger/20 flex items-start gap-3 text-status-danger text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-status-success-soft border border-status-success/20 flex items-start gap-3 text-status-success text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Họ và tên đầy đủ
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeRole === "TEACHER"
                      ? "thay.co@unigo.edu.vn"
                      : "email.hoc.tap@unigo.edu.vn hoặc gmail"
                  }
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
                />
              </div>
            </div>

            {/* ROLE SPECIFIC: Student */}
            {activeRole === "STUDENT" && (
              <div className="space-y-4 p-4 rounded-xl bg-canvas border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Khối lớp
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                    >
                      <option value="6">Khối 6</option>
                      <option value="7">Khối 7</option>
                      <option value="8">Khối 8</option>
                      <option value="9">Khối 9</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Lớp học
                    </label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                    >
                      <option value="6A1">Lớp 6A1</option>
                      <option value="7A1">Lớp 7A1 (Thí điểm)</option>
                      <option value="8A1">Lớp 8A1</option>
                      <option value="9A1">Lớp 9A1</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Mã học sinh UNIGO (Nếu đã có)
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="VD: HS2026-0701 (Để trống hệ thống sẽ tự sinh)"
                    className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink select-none pt-1">
                  <input
                    type="checkbox"
                    checked={parentConsent}
                    onChange={(e) => setParentConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-border accent-brand-teal mt-0.5"
                  />
                  <span>
                    Tôi xác nhận đã có sự đồng ý của Phụ huynh / Người giám hộ tham gia học tập số theo quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).
                  </span>
                </label>
              </div>
            )}

            {/* ROLE SPECIFIC: Teacher */}
            {activeRole === "TEACHER" && (
              <div className="space-y-4 p-4 rounded-xl bg-canvas border border-border">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Bộ môn giảng dạy
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                  >
                    <option value="Tin học & Công nghệ số">Tin học & Công nghệ số</option>
                    <option value="Toán học THCS">Toán học THCS</option>
                    <option value="Ngữ văn THCS">Ngữ văn THCS</option>
                    <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Mã mời tổ chuyên môn (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={teacherInviteCode}
                    onChange={(e) => setTeacherInviteCode(e.target.value)}
                    placeholder="Mã xác thực do Nhà trường / Tổ trưởng cấp"
                    className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                  />
                </div>

                <p className="text-xs text-status-warning bg-status-warning-soft p-3 rounded-lg border border-status-warning/20">
                  ⚠️ Lưu ý sư phạm: Hồ sơ giáo viên mới sẽ cần Ban giám hiệu / Quản trị viên duyệt để kích hoạt quyền giao bài và chấm điểm chính thức.
                </p>
              </div>
            )}

            {/* ROLE SPECIFIC: Parent */}
            {activeRole === "PARENT" && (
              <div className="space-y-4 p-4 rounded-xl bg-canvas border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Mối quan hệ
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                    >
                      <option value="BO">Bố</option>
                      <option value="ME">Mẹ</option>
                      <option value="NGUOI_GIAM_HO">Người giám hộ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Mã học sinh của con (Để liên kết)
                  </label>
                  <input
                    type="text"
                    value={childStudentCode}
                    onChange={(e) => setChildStudentCode(e.target.value)}
                    placeholder="VD: HS2026-0701"
                    className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-brand-teal"
                  />
                  <p className="text-[11px] text-ink-muted mt-1">
                    Liên kết sẽ được GVCN lớp đối chiếu hồ sơ để bảo vệ quyền riêng tư điểm số của học sinh.
                  </p>
                </div>
              </div>
            )}

            {/* ROLE SPECIFIC: Community */}
            {activeRole === "COMMUNITY_USER" && (
              <div className="p-4 rounded-xl bg-canvas border border-border">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-border accent-brand-teal mt-0.5"
                  />
                  <span>
                    Tôi đồng ý với Điều khoản cộng đồng học tập mở và cam kết chia sẻ học liệu có trách nhiệm, văn minh, tích cực.
                  </span>
                </label>
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-button bg-brand-teal hover:bg-brand-teal-hover text-white font-semibold text-sm transition-all shadow-card hover:shadow flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Hoàn tất đăng ký</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-ink-muted">
            Đã có tài khoản?{" "}
            <Link
              href="/dang-nhap"
              className="font-semibold text-brand-teal hover:text-brand-teal-hover transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số Trường Tiểu học & THCS UNIGO.
      </footer>
    </div>
  );
}
