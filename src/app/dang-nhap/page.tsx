"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { OceanButton } from "@/components/ui";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const urlError = searchParams.get("error") || "";
  const { refreshSession } = useRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleOauthUrl, setGoogleOauthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (urlError) {
      if (urlError === "google_denied") {
        setErrorMessage("Bạn đã hủy thao tác đăng nhập với Google.");
      } else if (
        urlError === "google_not_configured" ||
        urlError === "google_exchange_failed"
      ) {
        setErrorMessage(
          "Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        );
      } else if (urlError === "google_invalid_token") {
        setErrorMessage("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");
      } else {
        setErrorMessage("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      }
    }
  }, [urlError]);

  useEffect(() => {
    fetch(
      `/api/auth/google?purpose=signin&callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.oauthUrl) {
          setGoogleOauthUrl(data.oauthUrl);
        }
      })
      .catch(() => {
        // Silently ignored — friendly message shown on click if unavailable
      });
  }, [callbackUrl]);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    if (googleOauthUrl) {
      window.location.href = googleOauthUrl;
      return;
    }

    fetch(
      `/api/auth/google?purpose=signin&callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.oauthUrl) {
          window.location.href = data.oauthUrl;
        } else {
          setErrorMessage(
            "Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
          );
          setIsGoogleLoading(false);
        }
      })
      .catch(() => {
        setErrorMessage(
          "Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        );
        setIsGoogleLoading(false);
      });
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CREDENTIALS",
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Email hoặc mật khẩu không chính xác.");
        return;
      }

      await refreshSession();
      const destination =
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : data.redirectUrl || "/";
      router.push(destination);
      router.refresh();
    } catch {
      setErrorMessage("Không thể kết nối với máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-light text-ocean-700 text-[11px] font-bold mb-3">
          Cổng xác thực thống nhất
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Chào mừng trở lại!
        </h1>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
          Đăng nhập để tiếp tục hành trình học tập và sáng tạo cùng EDUCARE AI.
        </p>
      </div>

      {errorMessage && (
        <m.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-status-danger-soft border border-red-200 flex items-start gap-2.5 text-status-danger text-xs sm:text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </m.div>
      )}

      {/* Google Sign-In */}
      <m.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-button bg-surface border border-border hover:bg-ocean-50/50 hover:border-ocean-300 text-ink font-semibold text-sm transition-all shadow-card hover:shadow-card-hover disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-ocean-600" />
        ) : (
          <GoogleIcon />
        )}
        <span>Đăng nhập bằng Google</span>
      </m.button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-surface px-3 text-ink-muted font-semibold">
            hoặc đăng nhập bằng Email
          </span>
        </div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
          >
            Email tài khoản
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten.nguoidung@unigo.edu.vn"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-ink uppercase tracking-wider"
            >
              Mật khẩu
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-xs text-ocean-600 hover:text-ocean-deep font-semibold transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-button bg-canvas border border-border focus:bg-surface focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-sm text-ink outline-none transition-all placeholder:text-ink-muted/55"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-ink-muted select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-600 border-border accent-ocean-600"
            />
            <span>Ghi nhớ đăng nhập trong 30 ngày</span>
          </label>
        </div>

        <OceanButton
          type="submit"
          variant="gradient"
          size="lg"
          loading={isLoading}
          disabled={isGoogleLoading}
          className="w-full"
        >
          <span>{isLoading ? "Đang xác thực..." : "Đăng nhập"}</span>
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </OceanButton>
      </form>

      <div className="mt-7 text-center text-xs sm:text-sm text-ink-muted">
        Chưa có tài khoản?{" "}
        <Link
          href="/dang-ky"
          className="font-bold text-ocean-600 hover:text-ocean-deep transition-colors"
        >
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplitShell
      variant="login"
      heroTitle="Hệ sinh thái Đánh giá Năng lực & Sáng tạo cùng AI"
      heroSubtitle="Chuẩn Chương trình GDPT 2018 dành riêng cho Thầy, Trò và Phụ huynh Trường Tiểu học & THCS UNIGO."
      headerAction={
        <>
          <span className="hidden sm:inline text-ink-muted text-xs">
            Bạn là người mới?
          </span>
          <Link
            href="/dang-ky"
            className="px-3.5 py-1.5 rounded-button bg-ocean-light hover:bg-ocean-100 text-ocean-deep font-bold text-xs transition-colors"
          >
            Tạo tài khoản
          </Link>
        </>
      }
      highlights={[
        {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-200" />,
          title: "Xác thực An toàn Chuẩn OIDC",
          desc: "Phân quyền chặt chẽ theo vai trò, phiên HttpOnly an toàn bảo vệ dữ liệu học sinh.",
        },
        {
          icon: <GraduationCap className="w-4 h-4 text-amber-200" />,
          title: "Xưởng Trò Chơi & AI Tutor Socratic",
          desc: "Học sinh tự lập trình trò chơi HTML Sandbox và được AI gợi mở tư duy.",
        },
        {
          icon: <Users className="w-4 h-4 text-sky-200" />,
          title: "Liên thông 4 Phân hệ UNIGO",
          desc: "Nhà trường, Giáo viên, Học sinh và Phụ huynh cùng đồng hành minh bạch.",
        },
      ]}
    >
      <Suspense
        fallback={
          <div className="py-20 text-center text-ink-muted flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-ocean-600" />
            <span className="text-sm">Đang tải biểu mẫu đăng nhập...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitShell>
  );
}
