"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { OceanButton } from "@/components/ui";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const isFirstLogin = searchParams.get("firstLogin") === "1" || !token;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFirstLogin && !token) {
      setErrorMessage(
        "Thiếu mã xác thực khôi phục mật khẩu. Vui lòng bấm vào liên kết trong email."
      );
      return;
    }

    if (isFirstLogin && !currentPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu tạm do nhà trường/giáo viên cấp.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (isFirstLogin && newPassword === currentPassword) {
      setErrorMessage("Mật khẩu mới phải khác mật khẩu tạm ban đầu.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = isFirstLogin
        ? { mode: "FIRST_LOGIN_CHANGE", currentPassword, newPassword }
        : { token, newPassword };

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(
          data.error ||
            "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại thông tin."
        );
        return;
      }

      setSuccessMessage(data.message || "Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        router.push(data.redirectUrl || "/dang-nhap");
      }, 1500);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-light text-ocean-700 text-[11px] font-bold mb-2.5">
          {isFirstLogin ? "Kích hoạt tài khoản học sinh" : "Thiết lập mật khẩu mới"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          {isFirstLogin ? "Đổi mật khẩu lần đầu" : "Đặt lại mật khẩu mới"}
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1.5">
          {isFirstLogin
            ? "Để bảo vệ tài khoản học tập, bạn cần đổi mật khẩu tạm do quản trị viên cấp trước khi bắt đầu."
            : "Vui lòng nhập mật khẩu mới bảo mật cho tài khoản của bạn."}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-status-danger-soft border border-red-200 flex items-start gap-2.5 text-status-danger text-xs sm:text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage ? (
        <div className="p-6 rounded-panel bg-status-success-soft border border-emerald-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-status-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-ink text-sm">Thành công!</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            {successMessage}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isFirstLogin && (
            <div>
              <label
                htmlFor="reset-current-password"
                className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
              >
                Mật khẩu tạm hiện tại
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tạm được cấp"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="reset-new-password"
              className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded cursor-pointer"
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
            <label
              htmlFor="reset-confirm-password"
              className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
              />
            </div>
          </div>

          <OceanButton
            type="submit"
            variant="gradient"
            size="lg"
            loading={isLoading}
            className="w-full mt-2"
          >
            <span>{isLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </OceanButton>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-border text-center text-xs text-ink-muted">
        <Link
          href="/dang-nhap"
          className="font-bold text-ocean-600 hover:text-ocean-deep"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthSplitShell
      variant="forgot"
      heroTitle="Cập nhật mật khẩu chuẩn bảo mật mới"
      heroSubtitle="Mật khẩu được băm bằng thuật toán Argon2id/scrypt bảo mật và tự động thu hồi token sau khi hoàn tất."
      headerAction={
        <Link
          href="/dang-nhap"
          className="px-3.5 py-1.5 rounded-button bg-ocean-light hover:bg-ocean-100 text-ocean-deep font-bold text-xs transition-colors"
        >
          Đăng nhập
        </Link>
      }
      highlights={[
        {
          icon: <KeyRound className="w-4 h-4 text-amber-200" />,
          title: "Tối thiểu 8 ký tự",
          desc: "Khuyến nghị kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-200" />,
          title: "Xác thực một lần",
          desc: "Token đặt lại mật khẩu tự hủy ngay sau khi sử dụng thành công.",
        },
      ]}
    >
      <Suspense
        fallback={
          <div className="text-center py-20 text-ink-muted">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-ocean-600" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitShell>
  );
}
