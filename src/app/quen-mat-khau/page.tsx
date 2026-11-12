"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setIsLoading(true);
    // Security best practice: Always show success even if email not found to prevent user enumeration
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base">
            EA
          </div>
          <span className="font-bold text-ink tracking-tight text-base">EDUCARE AI</span>
        </Link>

        <Link
          href="/dang-nhap"
          className="text-xs text-brand-teal hover:text-brand-teal-hover font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại đăng nhập</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-border rounded-panel shadow-panel p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Khôi phục mật khẩu</h1>
            <p className="text-xs text-ink-muted mt-2">
              Nhập email tài khoản UNIGO của bạn để nhận liên kết đặt lại mật khẩu an toàn.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-status-danger-soft border border-status-danger/20 flex items-start gap-2.5 text-status-danger text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="p-6 rounded-xl bg-status-success-soft border border-status-success/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-status-success/20 text-status-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ink text-sm">Yêu cầu đã được gửi!</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Nếu tài khoản <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong hộp thư.
              </p>
              <div className="pt-3">
                <Link
                  href="/dang-nhap"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-brand-teal hover:text-brand-teal-hover"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten.nguoidung@unigo.edu.vn"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-button bg-brand-teal hover:bg-brand-teal-hover text-white font-semibold text-sm transition-all shadow-card hover:shadow flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi liên kết khôi phục</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số Trường Tiểu học & THCS UNIGO.
      </footer>
    </div>
  );
}
