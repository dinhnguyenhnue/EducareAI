"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { OceanButton } from "@/components/ui";
import { SPRING_GENTLE, OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type RegistrationRole = "STUDENT" | "TEACHER" | "PARENT" | "COMMUNITY_USER";

const ROLE_TABS: Array<{
  id: RegistrationRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
}> = [
  { id: "STUDENT", label: "Học sinh", icon: GraduationCap, activeColor: "text-emerald-700" },
  { id: "TEACHER", label: "Giáo viên", icon: Briefcase, activeColor: "text-ocean-600" },
  { id: "PARENT", label: "Phụ huynh", icon: HeartHandshake, activeColor: "text-violet-700" },
  { id: "COMMUNITY_USER", label: "Cộng đồng", icon: Compass, activeColor: "text-pink-700" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<RegistrationRole>("STUDENT");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [gradeLevel, setGradeLevel] = useState("7");
  const [className, setClassName] = useState("7A1");
  const [studentCode, setStudentCode] = useState("");
  const [parentConsent, setParentConsent] = useState(false);

  const [specialization, setSpecialization] = useState("Tin học & Công nghệ số");
  const [teacherInviteCode, setTeacherInviteCode] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [childStudentCode, setChildStudentCode] = useState("");
  const [relationship, setRelationship] = useState("PHU_HUYNH");

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    if (activeRole === "STUDENT" && !parentConsent) {
      setErrorMessage(
        "Học sinh dưới 16 tuổi cần xác nhận đồng ý của Phụ huynh theo Nghị định 13/2023/NĐ-CP."
      );
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
      setErrorMessage(
        "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitShell
      variant="register"
      heroTitle="Tham gia Hệ sinh thái Học tập Số EDUCARE AI"
      heroSubtitle="Quy trình đăng ký và xác minh riêng biệt theo từng vai trò Học sinh, Giáo viên, Phụ huynh và Cộng đồng UNIGO."
      headerAction={
        <>
          <span className="hidden sm:inline text-ink-muted text-xs">
            Đã có tài khoản?
          </span>
          <Link
            href="/dang-nhap"
            className="px-3.5 py-1.5 rounded-button bg-ocean-light hover:bg-ocean-100 text-ocean-deep font-bold text-xs transition-colors"
          >
            Đăng nhập
          </Link>
        </>
      }
      highlights={[
        {
          icon: <GraduationCap className="w-4 h-4 text-emerald-200" />,
          title: "Xác minh hồ sơ nhà trường",
          desc: "Đối chiếu mã học sinh, lớp học và mã mời tổ chuyên môn để bảo vệ dữ liệu.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4 text-sky-200" />,
          title: "Không mở đăng ký Quản trị công khai",
          desc: "Tài khoản Quản trị viên được cấp qua quy trình bảo mật nội bộ riêng.",
        },
        {
          icon: <Sparkles className="w-4 h-4 text-amber-200" />,
          title: "Kích hoạt không gian đúng vai trò",
          desc: "Tự động điều hướng tới Dashboard và bộ công cụ AI phù hợp ngay sau xác nhận.",
        },
      ]}
    >
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-light text-ocean-700 text-[11px] font-bold mb-2.5">
            Đăng ký thành viên mới
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Tạo tài khoản EDUCARE AI
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1.5">
            Chọn đúng vai trò của bạn để mở biểu mẫu xác minh phù hợp.
          </p>
        </div>

        {/* Animated Role Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-surface-muted border border-border mb-5">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveRole(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors",
                  isActive
                    ? tab.activeColor
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="register-role-pill"
                    transition={SPRING_GENTLE}
                    className="absolute inset-0 rounded-lg bg-surface shadow-card border border-ocean-200/80"
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Admin Policy Notice */}
        <div className="mb-5 p-3 rounded-xl bg-ocean-50/70 border border-ocean-200/70 text-[11px] text-ocean-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
          <div>
            <strong>Chính sách phân quyền:</strong> Tài khoản Quản trị viên (Super Admin, Ban giám hiệu) được thiết lập bảo mật riêng bởi nhà trường và không có biểu mẫu tự đăng ký công khai.
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-status-danger-soft border border-red-200 flex items-start gap-2.5 text-status-danger text-xs sm:text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-status-success-soft border border-emerald-200 flex items-start gap-2.5 text-status-success text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                      : "email@unigo.edu.vn hoặc gmail"
                  }
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={activeRole}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={OCEAN_TRANSITION.micro}
            >
              {activeRole === "STUDENT" && (
                <div className="space-y-3.5 p-4 rounded-xl bg-emerald-50/45 border border-emerald-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Khối lớp
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                      >
                        <option value="6">Khối 6</option>
                        <option value="7">Khối 7</option>
                        <option value="8">Khối 8</option>
                        <option value="9">Khối 9</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Lớp học
                      </label>
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                      >
                        <option value="6A1">Lớp 6A1</option>
                        <option value="7A1">Lớp 7A1 (Thí điểm)</option>
                        <option value="8A1">Lớp 8A1</option>
                        <option value="9A1">Lớp 9A1</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Mã học sinh UNIGO (Nếu đã có)
                    </label>
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="VD: HS2026-0701 (Để trống hệ thống sẽ tự sinh)"
                      className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink select-none pt-1">
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-600 border-border accent-ocean-600 mt-0.5"
                    />
                    <span>
                      Tôi xác nhận đã có sự đồng ý của Phụ huynh / Người giám hộ tham gia học tập số theo quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).
                    </span>
                  </label>
                </div>
              )}

              {activeRole === "TEACHER" && (
                <div className="space-y-3.5 p-4 rounded-xl bg-ocean-50/55 border border-ocean-200/80">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Bộ môn giảng dạy
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                    >
                      <option value="Tin học & Công nghệ số">Tin học & Công nghệ số</option>
                      <option value="Toán học THCS">Toán học THCS</option>
                      <option value="Ngữ văn THCS">Ngữ văn THCS</option>
                      <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Mã mời tổ chuyên môn (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={teacherInviteCode}
                      onChange={(e) => setTeacherInviteCode(e.target.value)}
                      placeholder="Mã xác thực do Nhà trường / Tổ trưởng cấp"
                      className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                    />
                  </div>

                  <p className="text-xs text-status-warning bg-status-warning-soft p-3 rounded-lg border border-amber-200">
                    Lưu ý sư phạm: Hồ sơ giáo viên mới sẽ cần Ban giám hiệu / Quản trị viên duyệt để kích hoạt quyền giao bài và chấm điểm chính thức.
                  </p>
                </div>
              )}

              {activeRole === "PARENT" && (
                <div className="space-y-3.5 p-4 rounded-xl bg-violet-50/55 border border-violet-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912345678"
                        className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Mối quan hệ
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                      >
                        <option value="BO">Bố</option>
                        <option value="ME">Mẹ</option>
                        <option value="NGUOI_GIAM_HO">Người giám hộ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Mã học sinh của con (Để liên kết)
                    </label>
                    <input
                      type="text"
                      value={childStudentCode}
                      onChange={(e) => setChildStudentCode(e.target.value)}
                      placeholder="VD: HS2026-0701"
                      className="w-full px-3 py-2 rounded-button bg-surface border border-border text-sm text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
                    />
                    <p className="text-[11px] text-ink-muted mt-1">
                      Liên kết sẽ được GVCN lớp đối chiếu hồ sơ để bảo vệ quyền riêng tư điểm số của học sinh.
                    </p>
                  </div>
                </div>
              )}

              {activeRole === "COMMUNITY_USER" && (
                <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-600 border-border accent-ocean-600 mt-0.5"
                    />
                    <span>
                      Tôi đồng ý với Điều khoản cộng đồng học tập mở và cam kết chia sẻ học liệu có trách nhiệm, văn minh, tích cực.
                    </span>
                  </label>
                </div>
              )}
            </m.div>
          </AnimatePresence>

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
              </div>
            </div>
          </div>

          <OceanButton
            type="submit"
            variant="gradient"
            size="lg"
            loading={isLoading}
            className="w-full mt-2"
          >
            <span>{isLoading ? "Đang xử lý đăng ký..." : "Hoàn tất đăng ký"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </OceanButton>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs sm:text-sm text-ink-muted">
          Đã có tài khoản?{" "}
          <Link
            href="/dang-nhap"
            className="font-bold text-ocean-600 hover:text-ocean-deep transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </AuthSplitShell>
  );
}
