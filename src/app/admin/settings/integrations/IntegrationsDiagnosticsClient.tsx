"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unplug,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Save,
  KeyRound,
  Link2,
} from "lucide-react";
import type { WorkspaceServiceStatusItem } from "@/lib/google-workspace";

interface Props {
  initialServices: WorkspaceServiceStatusItem[];
  integrationSlots: Array<{
    slotKey: string;
    title: string;
    subjectCode: string | null;
    gradeLevel: number | null;
    providerType: string;
    status: string;
    externalUrl: string | null;
  }>;
  hasEncryptionKey?: boolean;
  initialOauthState?: {
    isConfigured: boolean;
    source: string;
    hasClientSecret: boolean;
    accountMode: "PERSONAL_GMAIL_HYBRID" | "WORKSPACE_DOMAIN";
  };
  initialGeminiState?: {
    isConfigured: boolean;
    source: string;
    hasApiKey: boolean;
    modelName: string;
  };
}

export function IntegrationsDiagnosticsClient({
  initialServices,
  integrationSlots: initialSlots,
  hasEncryptionKey: initialHasEncryptionKey = false,
  initialOauthState,
  initialGeminiState,
}: Props) {
  const [services, setServices] =
    useState<WorkspaceServiceStatusItem[]>(initialServices);
  const [slots, setSlots] = useState(initialSlots);
  const [slotUrlDrafts, setSlotUrlDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialSlots.map((s) => [s.slotKey, s.externalUrl || ""])
      )
  );
  const [savingSlotKey, setSavingSlotKey] = useState<string | null>(null);

  const [hasEncryptionKey, setHasEncryptionKey] = useState(
    initialHasEncryptionKey
  );
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accountMode, setAccountMode] = useState<
    "PERSONAL_GMAIL_HYBRID" | "WORKSPACE_DOMAIN"
  >(initialOauthState?.accountMode || "PERSONAL_GMAIL_HYBRID");
  const [oauthStateInfo, setOauthStateInfo] = useState<{
    isConfigured: boolean;
    source: string;
    hasClientSecret: boolean;
    oauthStatus: string;
    connectedGoogleEmail: string | null;
  } | null>(
    initialOauthState
      ? {
          isConfigured: initialOauthState.isConfigured,
          source: initialOauthState.source,
          hasClientSecret: initialOauthState.hasClientSecret,
          oauthStatus: "NOT_CONNECTED",
          connectedGoogleEmail: null,
        }
      : null
  );

  const [geminiModelName, setGeminiModelName] = useState(
    initialGeminiState?.modelName || "gemini-2.5-flash"
  );
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiStateInfo, setGeminiStateInfo] = useState<{
    isConfigured: boolean;
    source: string;
    hasApiKey: boolean;
  } | null>(
    initialGeminiState
      ? {
          isConfigured: initialGeminiState.isConfigured,
          source: initialGeminiState.source,
          hasApiKey: initialGeminiState.hasApiKey,
        }
      : null
  );

  const [savingTarget, setSavingTarget] = useState<string | null>(null);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [testingCode, setTestingCode] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  } | null>(null);

  const refreshAdminConfig = async () => {
    try {
      const res = await fetch("/api/admin/integrations/config");
      if (!res.ok) return;
      const data = await res.json();
      setHasEncryptionKey(Boolean(data.hasEncryptionKey));
      if (data.googleWorkspace) {
        setClientId(data.googleWorkspace.clientId || "");
        setAccountMode(
          data.googleWorkspace.accountMode === "WORKSPACE_DOMAIN"
            ? "WORKSPACE_DOMAIN"
            : "PERSONAL_GMAIL_HYBRID"
        );
        setOauthStateInfo({
          isConfigured: Boolean(data.googleWorkspace.isConfigured),
          source: data.googleWorkspace.source || "NONE",
          hasClientSecret: Boolean(data.googleWorkspace.hasClientSecret),
          oauthStatus: data.googleWorkspace.oauthStatus || "NOT_CONNECTED",
          connectedGoogleEmail: data.googleWorkspace.connectedGoogleEmail || null,
        });
      }
      if (data.geminiServer) {
        setGeminiModelName(data.geminiServer.modelName || "gemini-2.5-flash");
        setGeminiStateInfo({
          isConfigured: Boolean(data.geminiServer.isConfigured),
          source: data.geminiServer.source || "NONE",
          hasApiKey: Boolean(data.geminiServer.hasApiKey),
        });
      }
    } catch {
      // ignore initial fetch failure
    }
  };

  useEffect(() => {
    refreshAdminConfig();
  }, []);

  const handleSaveWorkspaceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget("GOOGLE_WORKSPACE");
    setActionBanner(null);
    try {
      const res = await fetch("/api/admin/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "GOOGLE_WORKSPACE",
          clientId,
          clientSecret,
          accountMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          tone: "warning",
          message: data.error || "Không thể lưu cấu hình Google Workspace.",
        });
        return;
      }
      setClientSecret("");
      await refreshAdminConfig();
      setActionBanner({
        tone: "success",
        message: data.message,
      });
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err?.message || "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSavingTarget(null);
    }
  };

  const handleSaveGeminiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget("GEMINI_API");
    setActionBanner(null);
    try {
      const res = await fetch("/api/admin/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "GEMINI_API",
          modelName: geminiModelName,
          apiKey: geminiApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          tone: "warning",
          message: data.error || "Không thể lưu cấu hình Gemini API.",
        });
        return;
      }
      setGeminiApiKey("");
      await refreshAdminConfig();
      setActionBanner({
        tone: "success",
        message: data.message,
      });
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err?.message || "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSavingTarget(null);
    }
  };

  const handleStartOAuthConsent = async () => {
    setConnectingOAuth(true);
    setActionBanner(null);
    try {
      const res = await fetch(
        "/api/auth/google?purpose=workspace&services=DRIVE,SHEETS&callbackUrl=/admin/settings/integrations"
      );
      const data = await res.json();
      if (!data.isConfigured || !data.oauthUrl) {
        setActionBanner({
          tone: "warning",
          message:
            "Chưa có đủ Client ID và Client Secret hợp lệ để mở màn hình cấp quyền Google OAuth.",
        });
        return;
      }
      window.location.href = data.oauthUrl;
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err?.message || "Không thể khởi tạo phiên OAuth Google.",
      });
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleSaveSlotUrl = async (slotKey: string) => {
    setSavingSlotKey(slotKey);
    setActionBanner(null);
    try {
      const urlValue = (slotUrlDrafts[slotKey] || "").trim();
      const res = await fetch("/api/integrations/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotCode: slotKey,
          externalUrl: urlValue || null,
          status: urlValue ? "CONNECTED" : "UNCONFIGURED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          tone: "warning",
          message: data.error || "Không thể cập nhật URL Gemini Gem.",
        });
        return;
      }
      setSlots((prev) =>
        prev.map((s) =>
          s.slotKey === slotKey
            ? {
                ...s,
                externalUrl: urlValue || null,
                status: urlValue ? "CONNECTED" : "UNCONFIGURED",
              }
            : s
        )
      );
      setActionBanner({
        tone: "success",
        message: `Đã cập nhật liên kết cho ${slotKey}.`,
      });
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err?.message || "Lỗi cập nhật slot.",
      });
    } finally {
      setSavingSlotKey(null);
    }
  };

  const handleTestService = async (serviceCode: string) => {
    setTestingCode(serviceCode);
    setActionBanner(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_SERVICE_CONNECTION",
          payload: { serviceCode },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          tone: "warning",
          message: data.error || "Không thể kiểm tra kết nối.",
        });
        return;
      }

      const result = data.data;
      setServices((prev) =>
        prev.map((item) =>
          item.serviceCode === serviceCode
            ? {
                ...item,
                status: result.status,
                statusLabel: result.statusLabel,
                lastSyncAt: result.lastSyncAt,
              }
            : item
        )
      );
      setActionBanner({
        tone: result.connected ? "success" : "warning",
        message: data.message,
      });
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err.message || "Lỗi kết nối máy chủ.",
      });
    } finally {
      setTestingCode(null);
    }
  };

  const handleDisconnectOAuth = async () => {
    setIsDisconnecting(true);
    setActionBanner(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISCONNECT_GOOGLE_OAUTH" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          tone: "warning",
          message: data.error || "Không thể ngắt kết nối.",
        });
        return;
      }
      setActionBanner({
        tone: "info",
        message: data.message,
      });
    } catch (err: any) {
      setActionBanner({
        tone: "warning",
        message: err.message || "Lỗi ngắt kết nối.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getBadgeStyle = (status: WorkspaceServiceStatusItem["status"]) => {
    switch (status) {
      case "CONNECTED":
        return "bg-status-success-soft text-status-success border-emerald-200";
      case "PENDING_CONSENT":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "ERROR":
        return "bg-status-danger-soft text-status-danger border-red-200";
      case "NOT_CONFIGURED":
      default:
        return "bg-canvas text-ink-muted border-border";
    }
  };

  return (
    <div className="space-y-6">
      {actionBanner && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
            actionBanner.tone === "success"
              ? "bg-status-success-soft border-emerald-200 text-status-success"
              : actionBanner.tone === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-sky-50 border-ocean-200 text-ocean-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionBanner.message}</span>
        </div>
      )}

      {/* Direct Admin Configuration Panel (AEAD Encrypted at Rest) */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-ocean-600" />
            <div>
              <h2 className="text-base font-bold text-ink">
                Cấu hình Trực tiếp Google Workspace OAuth &amp; Gemini API
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Secret được mã hóa AEAD AES-256-GCM bằng <code className="font-mono">APP_ENCRYPTION_KEY</code> trước khi lưu DB và không bao giờ trả ngược về trình duyệt.
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              hasEncryptionKey
                ? "bg-status-success-soft text-status-success border-emerald-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {hasEncryptionKey
              ? "✓ APP_ENCRYPTION_KEY sẵn sàng"
              : "⚠ Thiếu APP_ENCRYPTION_KEY (chỉ đọc .env)"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Google Workspace OAuth Form */}
          <form
            onSubmit={handleSaveWorkspaceConfig}
            className="p-4 rounded-xl bg-canvas border border-border space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">
                1. Google Workspace OAuth 2.0
              </h3>
              <span className="text-[11px] font-mono text-ink-muted">
                {oauthStateInfo?.isConfigured
                  ? `Đã cấu hình (${oauthStateInfo.source})`
                  : "NOT_CONFIGURED"}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Google Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1234567890-xxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Google Client Secret (chỉ ghi — write-only)
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={
                  oauthStateInfo?.hasClientSecret
                    ? "•••••••••••• (Đã lưu, nhập mới để thay)"
                    : "GOCSPX-..."
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Chế độ tài khoản Google
              </label>
              <select
                value={accountMode}
                onChange={(e) =>
                  setAccountMode(
                    e.target.value === "WORKSPACE_DOMAIN"
                      ? "WORKSPACE_DOMAIN"
                      : "PERSONAL_GMAIL_HYBRID"
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs text-ink"
              >
                <option value="PERSONAL_GMAIL_HYBRID">
                  Gmail cá nhân / Hybrid (Không cần Domain-wide Delegation)
                </option>
                <option value="WORKSPACE_DOMAIN">
                  Google Workspace for Education (Domain trường)
                </option>
              </select>
            </div>

            {oauthStateInfo?.connectedGoogleEmail && (
              <div className="text-[11px] text-status-success font-medium">
                Đang liên kết OAuth với: {oauthStateInfo.connectedGoogleEmail}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={savingTarget === "GOOGLE_WORKSPACE"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTarget === "GOOGLE_WORKSPACE"
                    ? "Đang lưu..."
                    : "Lưu cấu hình Google OAuth"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleStartOAuthConsent}
                disabled={connectingOAuth || !oauthStateInfo?.isConfigured}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ocean-300 bg-surface text-ocean-700 text-xs font-semibold hover:bg-ocean-50 disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>
                  {connectingOAuth ? "Đang mở Google..." : "Kết nối OAuth Google"}
                </span>
              </button>
            </div>
          </form>

          {/* Gemini Server API Form */}
          <form
            onSubmit={handleSaveGeminiConfig}
            className="p-4 rounded-xl bg-canvas border border-border space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">
                2. Gemini Server API (Trợ lý AI nội bộ)
              </h3>
              <span className="text-[11px] font-mono text-ink-muted">
                {geminiStateInfo?.isConfigured
                  ? `Đã cấu hình (${geminiStateInfo.source})`
                  : "NOT_CONFIGURED"}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Gemini Model
              </label>
              <input
                type="text"
                value={geminiModelName}
                onChange={(e) => setGeminiModelName(e.target.value)}
                placeholder="gemini-2.5-flash"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Gemini API Key (chỉ ghi — write-only)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={
                  geminiStateInfo?.hasApiKey
                    ? "•••••••••••• (Đã lưu, nhập mới để thay)"
                    : "AIza..."
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-ink"
              />
            </div>

            <p className="text-[11px] text-ink-muted leading-relaxed">
              Dùng bởi <code className="font-mono">/api/ai/chat</code> với bộ lọc ẩn danh PII học sinh. Khi chưa có key, hệ thống tự dùng gợi ý Socratic cục bộ.
            </p>

            <div className="pt-1">
              <button
                type="submit"
                disabled={savingTarget === "GEMINI_API"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTarget === "GEMINI_API"
                    ? "Đang lưu..."
                    : "Lưu cấu hình Gemini API"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 6 Services Grid */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-ink">
              Trạng thái từng Dịch vụ Google Workspace & Gemini API (6 Dịch vụ)
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Chỉ xin quyền OAuth tối thiểu (least-privilege scopes). Khi chưa có thông tin xác thực thật, dịch vụ luôn trả về{" "}
              <code className="font-mono font-bold">NOT_CONFIGURED</code> (không giả lập kết nối thành công).
            </p>
          </div>
          <button
            type="button"
            onClick={handleDisconnectOAuth}
            disabled={isDisconnecting}
            className="px-3 py-1.5 rounded-xl bg-canvas hover:bg-surface-muted border border-border text-ink text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Unplug className="w-3.5 h-3.5 text-status-danger" />
            <span>
              {isDisconnecting ? "Đang ngắt kết nối..." : "Ngắt kết nối OAuth"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div
              key={svc.serviceCode}
              className="p-4 rounded-xl bg-canvas border border-border flex flex-col justify-between space-y-3 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-ink text-sm block">
                      {svc.serviceName}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">
                      Mã dịch vụ: {svc.serviceCode}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${getBadgeStyle(
                      svc.status
                    )}`}
                  >
                    {svc.statusLabel} ({svc.status})
                  </span>
                </div>

                <p className="text-ink-muted leading-relaxed">
                  {svc.setupGuide}
                </p>

                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-ink">
                    Phạm vi quyền tối thiểu (Minimal OAuth Scopes):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {svc.requiredScopes.map((sc) => (
                      <span
                        key={sc}
                        className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-ocean-700"
                      >
                        {sc.replace("https://www.googleapis.com/auth/", "")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-ink-muted space-y-0.5 pt-1">
                  <div>
                    <strong>Biến môi trường cần có:</strong>{" "}
                    <span className="font-mono">
                      {svc.requiredEnvVars.join(", ")}
                    </span>
                  </div>
                  <div>
                    <strong>Lần đồng bộ / kiểm tra gần nhất:</strong>{" "}
                    {svc.lastSyncAt
                      ? new Date(svc.lastSyncAt).toLocaleString("vi-VN")
                      : "Chưa có dữ liệu"}
                  </div>
                  {svc.lastErrorMessage && (
                    <div className="text-amber-800">
                      <strong>Trạng thái chi tiết:</strong>{" "}
                      {svc.lastErrorMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleTestService(svc.serviceCode)}
                  disabled={testingCode === svc.serviceCode}
                  className="px-3 py-1.5 rounded-lg bg-ocean-600 hover:bg-ocean-700 text-white font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      testingCode === svc.serviceCode ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {testingCode === svc.serviceCode
                      ? "Đang kiểm tra..."
                      : "Kiểm tra kết nối"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Distinction: Gemini Server API vs Gemini Gems External Links */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Sparkles className="w-5 h-5 text-ocean-600" />
          <div>
            <h2 className="text-base font-bold text-ink">
              Phân biệt rõ: Gemini API (Gọi từ Server) và Gemini Gems (Liên kết ngoài)
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Đảm bảo minh bạch kiến trúc AI và bảo vệ dữ liệu cá nhân của học sinh (PII).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-canvas border border-border space-y-2">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ocean-600" />
              <span>1. Gemini API (Gọi trực tiếp từ Server Website)</span>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Sử dụng khóa <code className="font-mono">GEMINI_API_KEY</code> và mô hình{" "}
              <code className="font-mono">GEMINI_MODEL</code> trên máy chủ tại route{" "}
              <code className="font-mono">/api/ai/chat</code>. Khóa bí mật tuyệt đối không lộ xuống trình duyệt. Hệ thống tự động ẩn danh mã học sinh, email, số điện thoại trước khi gửi ngữ cảnh câu hỏi học tập. Khi chưa có khóa API, hệ thống tự động dùng bộ gợi ý Socratic cục bộ.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-border space-y-2">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-amber-700" />
              <span>2. Gemini Gems (Liên kết mở sang ứng dụng Gemini)</span>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Google hiện chưa cung cấp API công khai để gọi trực tiếp các{" "}
              <strong>Gemini Gems</strong> tùy chỉnh từ máy chủ bên thứ ba. Vì vậy, các vị trí tích hợp Gem (<code className="font-mono">IntegrationSlot</code>) hoạt động dưới dạng liên kết ngoài đã xác minh (<code className="font-mono">https://gemini.google.com/gem/...</code>) kèm kịch bản Socratic dự phòng ngay trong trang.
            </p>
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-border font-bold text-ink">
                <th className="py-2.5 px-3">Mã vị trí (Slot Key)</th>
                <th className="py-2.5 px-3">Tên Trợ lý / Gem Môn học</th>
                <th className="py-2.5 px-3">Loại tích hợp</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">URL Gem đã xác minh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {slots.map((slot) => (
                <tr key={slot.slotKey}>
                  <td className="py-2 px-3 font-mono font-semibold text-ink">
                    {slot.slotKey}
                  </td>
                  <td className="py-2 px-3 text-ink">{slot.title}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-ink-muted">
                    {slot.providerType}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        slot.status === "CONNECTED"
                          ? "bg-status-success-soft text-status-success"
                          : "bg-canvas border border-border text-ink-muted"
                      }`}
                    >
                      {slot.status === "CONNECTED"
                        ? "Đã gắn link Gem"
                        : "Chưa cấu hình (Dùng Socratic nội bộ)"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={slotUrlDrafts[slot.slotKey] ?? ""}
                        onChange={(e) =>
                          setSlotUrlDrafts((prev) => ({
                            ...prev,
                            [slot.slotKey]: e.target.value,
                          }))
                        }
                        placeholder="https://gemini.google.com/gem/..."
                        className="flex-1 min-w-[200px] px-2.5 py-1 rounded border border-border bg-surface font-mono text-[11px] text-ink"
                      />
                      <button
                        type="button"
                        disabled={savingSlotKey === slot.slotKey}
                        onClick={() => handleSaveSlotUrl(slot.slotKey)}
                        className="px-2.5 py-1 rounded bg-ocean-600 text-white text-[11px] font-semibold hover:bg-ocean-700 disabled:opacity-50"
                      >
                        {savingSlotKey === slot.slotKey ? "Lưu..." : "Lưu URL"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-800" />
          <span>
            <strong>Nguyên tắc bảo mật thông tin xác thực:</strong> Không lưu mật khẩu ứng dụng, khóa riêng (private key) hoặc{" "}
            <code className="font-mono">GOOGLE_CLIENT_SECRET</code> /{" "}
            <code className="font-mono">GEMINI_API_KEY</code> dạng rõ trong cơ sở dữ liệu,{" "}
            <code className="font-mono">localStorage</code> hay Git. Chỉ nạp qua biến môi trường máy chủ (<code className="font-mono">.env</code> / Secret Manager).
          </span>
        </div>
      </div>
    </div>
  );
}
