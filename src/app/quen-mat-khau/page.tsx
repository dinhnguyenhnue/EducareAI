"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { OceanButton } from "@/components/ui";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

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
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(
          data.error || "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau."
        );
        return;
      }

      setIsSubmitted(true);
    } catch {
      setErrorMessage(
        "Không thể kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitShell
      variant="forgot"
      heroTitle="Khôi phục quyền truy cập an toàn"
      heroSubtitle="Hệ thống sử dụng token đặt lại mật khẩu dùng một lần và không tiết lộ sự tồn tại tài khoản để bảo vệ người dùng."
      headerAction={
        <Link
          href="/dang-nhap"
          className="text-xs text-ocean-600 hover:text-ocean-deep font-bold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại đăng nhập</span>
        </Link>
      }
      highlights={[
        {
          icon: <KeyRound className="w-4 h-4 text-amber-200" />,
          title: "Token mã hóa có thời hạn",
          desc: "Liên kết đặt lại mật khẩu hết hạn tự động sau thời gian ngắn.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-200" />,
          title: "Bảo vệ tài khoản Google OAuth",
          desc: "Tài khoản đăng nhập qua Google vẫn tiếp tục xác thực trực tiếp bằng Google.",
        },
      ]}
    >
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-light text-ocean-700 text-[11px] font-bold mb-2.5">
            Hỗ trợ tài khoản Email
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Khôi phục mật khẩu
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">
            Nhập email tài khoản UNIGO của bạn để nhận liên kết đặt lại mật khẩu an toàn.
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

        {isSubmitted ? (
          <div className="p-6 rounded-panel bg-status-success-soft border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-ink text-sm">
              Yêu cầu đã được tiếp nhận!
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Nếu tài khoản <strong>{email}</strong> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu an toàn đã được kích hoạt.
            </p>
            <div className="pt-3">
              <Link
                href="/dang-nhap"
                className="inline-flex items-center gap-2 text-xs font-bold text-ocean-600 hover:text-ocean-deep"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang Đăng nhập</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
              >
                Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten.nguoidung@unigo.edu.vn"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
                />
              </div>
            </div>

            <OceanButton
              type="submit"
              variant="gradient"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              <span>{isLoading ? "Đang gửi..." : "Gửi liên kết khôi phục"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </OceanButton>
          </form>
        )}
      </div>
    </AuthSplitShell>
  );
}
