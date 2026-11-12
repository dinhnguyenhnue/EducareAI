"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Thiếu mã xác thực khôi phục mật khẩu. Vui lòng bấm vào liên kết trong email.");
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

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.");
        return;
      }

      setSuccessMessage(data.message || "Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 2000);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface border border-border rounded-panel shadow-panel p-8 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Đặt lại mật khẩu mới</h1>
        <p className="text-xs text-ink-muted mt-2">
          Vui lòng nhập mật khẩu mới bảo mật cho tài khoản của bạn.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-status-danger-soft border border-status-danger/20 flex items-start gap-2.5 text-status-danger text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage ? (
        <div className="p-6 rounded-xl bg-status-success-soft border border-status-success/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-status-success/20 text-status-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-ink text-sm">Thành công!</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Mật khẩu đã được cập nhật an toàn. Đang chuyển hướng bạn về trang đăng nhập...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-button bg-brand-teal hover:bg-brand-teal-hover text-white font-semibold text-sm transition-all shadow-card hover:shadow flex items-center justify-center gap-2 disabled:opacity-60 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Xác nhận đổi mật khẩu</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-border text-center text-xs text-ink-muted">
        <Link href="/dang-nhap" className="font-semibold text-brand-teal hover:text-brand-teal-hover">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base">
            EA
          </div>
          <span className="font-bold text-ink tracking-tight text-base">EDUCARE AI</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense
          fallback={
            <div className="text-center py-20 text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-teal" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số Trường Tiểu học & THCS UNIGO.
      </footer>
    </div>
  );
}
