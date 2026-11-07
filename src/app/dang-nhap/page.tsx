"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  KeyRound,
  AlertCircle,
  Database,
  UserCheck,
} from "lucide-react";

const PROVISIONED_ACCOUNTS = [
  {
    email: "dinhnguyenhnue@gmail.com",
    name: "Đinh Nguyên (Super Admin)",
    roleCode: "SUPER_ADMIN",
    badge: "SUPER_ADMIN",
    desc: "Toàn quyền hệ thống • Multi-View Switcher (Admin/Teacher/Student/Parent)",
    icon: <ShieldCheck className="w-4 h-4 text-brand-teal" />,
  },
  {
    email: "thay.tuan@unigo.edu.vn",
    name: "Thầy Trần Minh Tuấn",
    roleCode: "TEACHER",
    badge: "TEACHER",
    desc: "Tổ trưởng Tin học • Chủ nhiệm lớp 7A1",
    icon: <Briefcase className="w-4 h-4 text-brand-teal" />,
  },
  {
    email: "minhanh.nguyen@unigo.edu.vn",
    name: "Nguyễn Minh Anh",
    roleCode: "STUDENT",
    badge: "STUDENT",
    desc: "Học sinh lớp 7A1 • Mã HS: HS2026-0701",
    icon: <GraduationCap className="w-4 h-4 text-brand-teal" />,
  },
  {
    email: "ph.minhanh@gmail.com",
    name: "Nguyễn Quang Huy",
    roleCode: "PARENT",
    badge: "PARENT",
    desc: "Phụ huynh em Nguyễn Minh Anh (Liên kết đã xác minh)",
    icon: <HeartHandshake className="w-4 h-4 text-brand-teal" />,
  },
  {
    email: "admin@unigo.edu.vn",
    name: "Nguyễn Văn Quản Trị",
    roleCode: "SCHOOL_ADMIN",
    badge: "SCHOOL_ADMIN",
    desc: "Quản trị Nhà trường / Tổ chuyên môn THCS",
    icon: <UserCheck className="w-4 h-4 text-brand-teal" />,
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const urlError = searchParams.get("error") || "";
  const { refreshSession } = useRole();

  const [selectedAccountEmail, setSelectedAccountEmail] = useState(
    "dinhnguyenhnue@gmail.com"
  );
  const [includeWorkspaceScopes, setIncludeWorkspaceScopes] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "DRIVE",
    "DOCS",
    "SHEETS",
    "CLASSROOM",
    "CALENDAR",
  ]);
  const [acceptedLegal, setAcceptedLegal] = useState(true);
  const [acceptedParental, setAcceptedParental] = useState(true);
  const [oauthInfo, setOauthInfo] = useState<{
    isConfigured: boolean;
    clientIdPreview: string;
    redirectUri: string;
    oauthUrl: string | null;
    missingEnvVars: string[];
  } | null>(null);
  const [superAdminDbStatus, setSuperAdminDbStatus] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(urlError || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const purpose = includeWorkspaceScopes ? "workspace" : "signin";
    fetch(
      `/api/auth/google?purpose=${purpose}&services=${selectedServices.join(
        ","
      )}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    )
      .then((res) => res.json())
      .then((data) => setOauthInfo(data))
      .catch(() => { });

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.superAdminStatus) {
          setSuperAdminDbStatus(data.superAdminStatus);
        }
      })
      .catch(() => { });
  }, [includeWorkspaceScopes, selectedServices, callbackUrl]);

  const toggleService = (svc: string) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((item) => item !== svc) : [...prev, svc]
    );
  };

  // 1. Real Google OAuth 2.0 / OIDC Login Handler (Never fakes success if credentials missing)
  const handleRealGoogleOAuth = async () => {
    setAuthError(null);
    if (!acceptedLegal) {
      setAuthError(
        "Vui lòng đồng ý với Chính sách Bảo mật và Điều khoản Sử dụng trước khi đăng nhập."
      );
      return;
    }

    if (oauthInfo?.isConfigured && oauthInfo.oauthUrl) {
      window.location.href = oauthInfo.oauthUrl;
      return;
    }

    // Credentials missing -> call backend to record audit & return explicit missing config error
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "GOOGLE_ID_TOKEN",
          email: selectedAccountEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(
          data.message ||
          "BLOCKED: Chưa cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env. Hệ thống không giả lập đăng nhập Google."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Controlled Provisioned DB Session (Explicitly labeled local DB session for testing RBAC & Workspaces)
  const handleProvisionedAccountLogin = async (emailToLogin: string) => {
    setAuthError(null);
    if (!acceptedLegal) {
      setAuthError(
        "Vui lòng đồng ý với Chính sách Bảo mật và Điều khoản Sử dụng trước khi tiếp tục."
      );
      return;
    }

    const chosen = PROVISIONED_ACCOUNTS.find((a) => a.email === emailToLogin);
    if (chosen?.roleCode === "STUDENT" && !acceptedParental) {
      setAuthError(
        "Học sinh dưới 16 tuổi cần xác nhận có sự đồng thuận của Phụ huynh và Nhà trường theo Nghị định 13/2023/NĐ-CP."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "LOCAL_PROVISIONED_ACCOUNT",
          email: emailToLogin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || data.error || "Đăng nhập thất bại.");
        return;
      }

      await refreshSession();
      const target =
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : data.redirectUrl || "/admin/overview";
      router.push(target);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const scopeOptions = [
    {
      id: "DRIVE",
      name: "Google Drive (drive.file)",
      desc: "Truy cập tệp và thư mục do bạn tải lên hoặc tạo trong EDUCARE AI.",
    },
    {
      id: "DOCS",
      name: "Google Docs (documents)",
      desc: "Khởi tạo đề kiểm tra, giáo án và phiếu học tập từ mẫu chuẩn.",
    },
    {
      id: "SHEETS",
      name: "Google Sheets (spreadsheets)",
      desc: "Đồng bộ báo cáo kết quả học tập dạng bảng (batchUpdate).",
    },
    {
      id: "CLASSROOM",
      name: "Google Classroom (courses & coursework)",
      desc: "Đồng bộ danh sách lớp, giao bài tập (STUDENT_COPY) và điểm số.",
    },
    {
      id: "CALENDAR",
      name: "Google Calendar (calendar.events)",
      desc: "Tạo nhắc việc tự động cho hạn nộp bài tập và lịch kiểm tra.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-surface border-b border-border px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base">
            EA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink tracking-tight text-base">
                EDUCARE AI
              </span>
              <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-1.5 py-0.5 rounded">
                UNIGO
              </span>
            </div>
            <p className="text-[11px] text-ink-muted">
              Cổng Xác thực OIDC, Quản trị Super Admin & Phân quyền RBAC
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/privacy" className="text-ink-muted hover:text-brand-teal">
            Chính sách Bảo mật (Privacy)
          </Link>
          <Link href="/terms" className="text-ink-muted hover:text-brand-teal">
            Điều khoản Sử dụng (Terms)
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Authentication & RBAC Session (7 cols) */}
        <div className="lg:col-span-7 p-7 rounded-panel bg-surface border border-border shadow-card space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-teal-soft text-brand-teal text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Xác thực OIDC • HttpOnly Session Cookie • RBAC 6 Vai trò</span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink">
              Đăng nhập Hệ sinh thái Học tập UNIGO
            </h1>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Tách biệt hoàn toàn giữa <strong>Google Sign-In cơ bản</strong> (openid, email, profile) và <strong>quyền Google Workspace mở rộng</strong>. Không tự đăng ký quyền quản trị.
            </p>
            {callbackUrl && (
              <div className="mt-3 p-2.5 rounded bg-brand-teal-soft/50 border border-brand-teal/30 text-xs text-ink">
                Bạn cần đăng nhập để truy cập đường dẫn nội bộ:{" "}
                <code className="font-mono font-bold text-brand-teal">
                  {callbackUrl}
                </code>
              </div>
            )}
          </div>

          {/* Error / Blocked Notice */}
          {authError && (
            <div
              role="alert"
              data-testid="auth-error-banner"
              className="p-4 rounded-panel bg-status-danger-soft border border-status-danger/30 text-xs text-status-danger space-y-1.5"
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Thông báo xác thực hệ thống</span>
              </div>
              <p className="text-ink leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Section A: Official Google OAuth 2.0 / OIDC Sign-In */}
          <div className="p-5 rounded-panel bg-canvas border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  1. Đăng nhập bằng Google OAuth 2.0 / OpenID Connect
                </h2>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Xác minh chữ ký ID Token (issuer, audience, expiry, email_verified) và định danh Google <code>sub</code>.
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded ${oauthInfo?.isConfigured
                    ? "bg-status-success-soft text-status-success"
                    : "bg-status-warning-soft text-status-warning"
                  }`}
              >
                {oauthInfo?.isConfigured
                  ? "OAuth Sẵn sàng"
                  : "Chờ cấu hình Client ID"}
              </span>
            </div>

            {/* Optional Incremental Google Workspace Scopes */}
            <div className="pt-2 border-t border-border/70">
              <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWorkspaceScopes}
                  onChange={(e) => setIncludeWorkspaceScopes(e.target.checked)}
                  className="accent-brand-teal"
                />
                <span>
                  Yêu cầu thêm quyền Google Workspace APIs ngay khi đăng nhập (Tùy chọn — có thể cấp quyền sau)
                </span>
              </label>

              {includeWorkspaceScopes && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scopeOptions.map((opt) => {
                    const checked = selectedServices.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-2 p-2.5 rounded-button border cursor-pointer text-[11px] ${checked
                            ? "bg-surface border-brand-teal/50"
                            : "bg-surface/60 border-border"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(opt.id)}
                          className="mt-0.5 accent-brand-teal"
                        />
                        <div>
                          <span className="font-bold text-ink block">
                            {opt.name}
                          </span>
                          <span className="text-[10px] text-ink-muted">
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="google-oauth-login-btn"
              onClick={handleRealGoogleOAuth}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-button bg-surface border border-border hover:border-brand-teal text-ink text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>
                Đăng nhập bằng Tài khoản Google (OAuth 2.0 / OIDC)
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-brand-teal" />
            </button>
          </div>

          {/* Section B: Provisioned Database Accounts (For Local RBAC & Super Admin Verification) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-teal" />
                <span>
                  2. Khởi tạo Phiên CSDL Nội bộ (Tài khoản đã Seed & Phân quyền RBAC):
                </span>
              </label>
            </div>

            <div className="space-y-2">
              {PROVISIONED_ACCOUNTS.map((acc) => {
                const active = selectedAccountEmail === acc.email;
                return (
                  <div
                    key={acc.email}
                    onClick={() => setSelectedAccountEmail(acc.email)}
                    className={`p-3 rounded-button border cursor-pointer transition-all flex items-center justify-between gap-3 ${active
                        ? "bg-brand-teal-soft/50 border-brand-teal"
                        : "bg-canvas border-border hover:bg-surface-muted"
                      }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{acc.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink">
                            {acc.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-brand-teal text-white px-1.5 py-0.5 rounded">
                            {acc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-ink-muted truncate">
                          {acc.email}
                        </p>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {acc.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid={`login-as-${acc.roleCode}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProvisionedAccountLogin(acc.email);
                      }}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>Vào phiên</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Legal & Child Data Protection Consent */}
          <div className="p-4 rounded-panel bg-canvas border border-border space-y-2.5 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="mt-0.5 accent-brand-teal"
              />
              <span className="text-ink leading-relaxed">
                Tôi đã đọc và đồng ý với{" "}
                <Link
                  href="/privacy"
                  className="text-brand-teal font-bold underline"
                >
                  Chính sách Bảo mật (Privacy Policy)
                </Link>{" "}
                và{" "}
                <Link
                  href="/terms"
                  className="text-brand-teal font-bold underline"
                >
                  Điều khoản Sử dụng (Terms of Use)
                </Link>{" "}
                của EDUCARE AI (Google API Services User Data Policy).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-border/70">
              <input
                type="checkbox"
                checked={acceptedParental}
                onChange={(e) => setAcceptedParental(e.target.checked)}
                className="mt-0.5 accent-brand-teal"
              />
              <span className="text-ink-muted leading-relaxed">
                <strong className="text-ink">
                  Bảo vệ dữ liệu Học sinh (Nghị định 13/2023/NĐ-CP):
                </strong>{" "}
                Xác nhận tài khoản học tập được nhà trường UNIGO và Phụ huynh đồng thuận.
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Super Admin Status & Google OAuth Setup Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Super Admin Account Status Card */}
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <h2 className="text-xs font-bold text-ink uppercase tracking-wide">
                  Hồ sơ Super Admin Cao nhất (Section III)
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                SUPER_ADMIN
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Email quản trị:</span>
                <span className="font-mono font-bold text-ink">
                  dinhnguyenhnue@gmail.com
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Trạng thái kích hoạt OIDC:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${superAdminDbStatus?.accountStatus === "ACTIVE" &&
                      superAdminDbStatus?.googleSub
                      ? "bg-status-success-soft text-status-success"
                      : "bg-status-warning-soft text-status-warning"
                    }`}
                >
                  {superAdminDbStatus?.googleSub
                    ? `Đã liên kết sub (${superAdminDbStatus.googleSub.slice(0, 8)}...)`
                    : "PENDING_ACTIVATION (Chờ OAuth lần đầu)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Khuyến nghị bảo mật:</span>
                <span className="font-semibold text-brand-teal">
                  Bật Google 2-Step Verification (MFA)
                </span>
              </div>
            </div>
          </div>

          {/* Google Cloud Console Verification Guide */}
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <KeyRound className="w-4 h-4 text-brand-teal" />
              <h2 className="text-xs font-bold text-ink uppercase tracking-wide">
                Trạng thái Cấu hình Google OAuth (.env)
              </h2>
            </div>

            <div className="flex items-center justify-between p-3 rounded-button bg-canvas border border-border text-xs">
              <span className="font-semibold text-ink">Biến môi trường OAuth:</span>
              {oauthInfo?.isConfigured ? (
                <span className="text-status-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã cấu hình đầy đủ
                </span>
              ) : (
                <span className="text-status-warning font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Thiếu GOOGLE_CLIENT_ID / SECRET
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-button bg-canvas border border-border space-y-1">
                <span className="font-bold text-ink block">
                  1. Authorized Redirect URI:
                </span>
                <code className="text-[11px] font-mono text-brand-teal block select-all">
                  http://localhost:3000/api/auth/google/callback
                </code>
              </div>

              <div className="p-3 rounded-button bg-canvas border border-border space-y-1">
                <span className="font-bold text-ink block">
                  2. Privacy Policy & Terms URLs:
                </span>
                <code className="text-[11px] font-mono text-brand-teal block">
                  http://localhost:3000/privacy • http://localhost:3000/terms
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginContent />
    </Suspense>
  );
}
