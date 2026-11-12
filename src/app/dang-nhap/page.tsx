"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
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

  // Translate URL error codes into user-friendly messages
  useEffect(() => {
    if (urlError) {
      if (urlError === "google_denied") {
        setErrorMessage("Bạn đã hủy thao tác đăng nhập với Google.");
      } else if (urlError === "google_not_configured" || urlError === "google_exchange_failed") {
        setErrorMessage("Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
      } else if (urlError === "google_invalid_token") {
        setErrorMessage("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");
      } else {
        setErrorMessage("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      }
    }
  }, [urlError]);

  // Preload Google OAuth URL silently
  useEffect(() => {
    fetch(`/api/auth/google?purpose=signin&callbackUrl=${encodeURIComponent(callbackUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.oauthUrl) {
          setGoogleOauthUrl(data.oauthUrl);
        }
      })
      .catch(() => {
        // Silently handle - will show friendly notice if user clicks Google login
      });
  }, [callbackUrl]);

  // Handle Google OAuth Redirect
  const handleGoogleLogin = () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    if (googleOauthUrl) {
      window.location.href = googleOauthUrl;
      return;
    }

    // If preloaded URL is not ready, fetch on-demand
    fetch(`/api/auth/google?purpose=signin&callbackUrl=${encodeURIComponent(callbackUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.oauthUrl) {
          window.location.href = data.oauthUrl;
        } else {
          setErrorMessage("Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
          setIsGoogleLoading(false);
        }
      })
      .catch(() => {
        setErrorMessage("Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
        setIsGoogleLoading(false);
      });
  };

  // Handle Email & Password Login
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
      const destination = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : data.redirectUrl || "/";
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Chào mừng trở lại!</h1>
        <p className="text-sm text-ink-muted mt-2">
          Đăng nhập để tiếp tục hành trình học tập và sáng tạo cùng EDUCARE AI.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-status-danger-soft border border-status-danger/20 flex items-start gap-3 text-status-danger text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-button bg-surface border border-border hover:bg-surface-muted hover:border-ink/20 text-ink font-semibold text-sm transition-all shadow-card hover:shadow duration-150 disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
        ) : (
          <GoogleIcon />
        )}
        <span>Đăng nhập bằng Google</span>
      </button>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-canvas px-3 text-ink-muted font-medium">
            hoặc đăng nhập bằng Email
          </span>
        </div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
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
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 rounded-button bg-surface border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
              Mật khẩu
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-xs text-brand-teal hover:text-brand-teal-hover font-medium transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-button bg-surface border border-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal-soft text-sm text-ink outline-none transition-all placeholder:text-ink-muted/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-muted select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-border accent-brand-teal"
            />
            <span>Ghi nhớ đăng nhập trong 30 ngày</span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 px-4 rounded-button bg-brand-teal hover:bg-brand-teal-hover text-white font-semibold text-sm transition-all shadow-card hover:shadow flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to register */}
      <div className="mt-8 text-center text-sm text-ink-muted">
        Chưa có tài khoản?{" "}
        <Link
          href="/dang-ky"
          className="font-semibold text-brand-teal hover:text-brand-teal-hover transition-colors"
        >
          Đăng ký tài khoản mới
        </Link>
      </div>

      {/* Legal footer */}
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-4 text-xs text-ink-muted">
        <Link href="/privacy" className="hover:text-ink transition-colors">
          Chính sách bảo mật
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-ink transition-colors">
          Điều khoản sử dụng
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
            <p className="text-[10px] text-ink-muted -mt-0.5">Hệ sinh thái học tập số</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-ink-muted text-xs">Bạn là người mới?</span>
          <Link
            href="/dang-ky"
            className="px-3.5 py-1.5 rounded-button bg-brand-teal-soft hover:bg-brand-teal/15 text-brand-teal font-semibold text-xs transition-colors"
          >
            Tạo tài khoản
          </Link>
        </div>
      </header>

      {/* Main Container: Desktop Split */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-panel border border-border bg-surface shadow-panel overflow-hidden">
          {/* Left Hero Pane (Visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#124C49] via-brand-teal to-[#1B8D88] p-10 text-white flex-col justify-between relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-black/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Nền tảng Giáo dục Số Thông minh</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight leading-snug">
                Hệ sinh thái Đánh giá Năng lực & Sáng tạo cùng AI
              </h2>
              <p className="text-xs text-white/80 mt-2.5 leading-relaxed">
                Chuẩn Chương trình GDPT 2018 dành riêng cho Thầy và Trò Trường Tiểu học & THCS UNIGO.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Xác thực An toàn Chuẩn OIDC</div>
                  <div className="text-[11px] text-white/70 mt-0.5">
                    Phân quyền chặt chẽ 6 vai trò, mã hóa AES-256 bảo vệ dữ liệu học sinh.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Xưởng Trò Chơi & AI Tutor</div>
                  <div className="text-[11px] text-white/70 mt-0.5">
                    Học sinh tự lập trình trò chơi HTML và được AI trợ giảng gợi mở tư duy.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Liên thông 4 Phân hệ</div>
                  <div className="text-[11px] text-white/70 mt-0.5">
                    Nhà trường, Giáo viên, Học sinh và Phụ huynh cùng đồng hành minh bạch.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Badge */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-white/75">
              <span>UNIGO Secondary School</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Bảo mật Quốc gia
              </span>
            </div>
          </div>

          {/* Right Form Pane */}
          <div className="col-span-1 lg:col-span-7 p-8 sm:p-12 flex items-center justify-center bg-canvas/30">
            <Suspense
              fallback={
                <div className="py-20 text-center text-ink-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
                  <span>Đang tải form đăng nhập...</span>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số Trường Tiểu học & THCS UNIGO. Mọi quyền được bảo lưu.
      </footer>
    </div>
  );
}
