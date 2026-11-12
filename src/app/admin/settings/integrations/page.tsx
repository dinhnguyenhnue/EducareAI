import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Network,
  Database,
  Cloud,
  FileSpreadsheet,
  FolderTree,
  Key,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsSettingsPage() {
  const session = await getServerSession();

  // Strict Super Admin protection
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/khong-co-quyen?from=/admin/settings/integrations");
  }

  const oauthConfig = getGoogleOAuthConfig();

  // Fetch sanitized audit logs for Google Workspace and Auth
  const [auditLogs, driveNodesCount, sheetsCount, superAdminUser] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        resource: { in: ["AUTH", "GOOGLE_INTEGRATION", "DRIVE", "SHEETS"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.driveFolderNode.count(),
    prisma.classTrackingSheet.count(),
    prisma.user.findUnique({
      where: { email: "dinhnguyenhnue@gmail.com" },
      select: {
        email: true,
        fullName: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    }),
  ]);

  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight">
                Cấu hình Tích hợp & Kết nối Google Workspace
              </h1>
              <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Trung tâm giám sát bảo mật OAuth 2.0, OpenID Connect và đồng bộ 3 tầng dữ liệu cho toàn bộ hệ sinh thái UNIGO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-success-soft text-status-success border border-status-success/20">
              <ShieldCheck className="w-4 h-4" />
              RBAC Cấp 1 Tối cao
            </span>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span>Google OAuth 2.0</span>
              <Cloud className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-lg font-bold text-ink">
              {oauthConfig.isConfigured ? "Đã kết nối" : "Chưa cấu hình"}
            </div>
            <div className="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
              {oauthConfig.isConfigured ? (
                <span className="text-status-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OIDC Sẵn sàng
                </span>
              ) : (
                <span className="text-status-warning flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cần cấu hình .env
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span>Thư mục Drive</span>
              <FolderTree className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-lg font-bold text-ink">{driveNodesCount} / 19 Thư mục</div>
            <div className="text-[11px] text-ink-muted mt-1">
              Cây thư mục 6 nhánh chuẩn
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span>Bảng tính Sheets</span>
              <FileSpreadsheet className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-lg font-bold text-ink">{sheetsCount} Lớp đã sync</div>
            <div className="text-[11px] text-ink-muted mt-1">
              Tracking 6 tab chuẩn UNIGO
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span>Cơ sở dữ liệu</span>
              <Database className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-lg font-bold text-ink">PostgreSQL</div>
            <div className="text-[11px] text-status-success mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Prisma Cloud Active
            </div>
          </div>
        </div>

        {/* Section 1: Google OAuth Security Configuration */}
        <div className="p-6 rounded-xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Key className="w-5 h-5 text-brand-teal" />
            <h2 className="text-base font-bold text-ink">Thông tin Xác thực Google OAuth 2.0 / OpenID Connect</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-1.5">
              <span className="text-ink-muted font-semibold uppercase">Google Client ID</span>
              <div className="font-mono text-ink font-medium break-all">
                {hasClientId
                  ? `${process.env.GOOGLE_CLIENT_ID?.slice(0, 16)}••••••••••••.apps.googleusercontent.com`
                  : "Chưa cấu hình (Thiếu GOOGLE_CLIENT_ID)"}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-1.5">
              <span className="text-ink-muted font-semibold uppercase">Google Client Secret</span>
              <div className="font-mono text-ink font-medium">
                {hasClientSecret ? "•••••••••••••••• (Bảo mật máy chủ)" : "Chưa cấu hình (Thiếu GOOGLE_CLIENT_SECRET)"}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-1.5 md:col-span-2">
              <span className="text-ink-muted font-semibold uppercase">Authorized Redirect URI (Callback)</span>
              <div className="font-mono text-brand-teal font-medium break-all">
                {oauthConfig.redirectUri}
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Đảm bảo URI này đã được thêm vào mục <strong>Authorized redirect URIs</strong> trên Google Cloud Console để người dùng không bị lỗi chuyển hướng.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Vercel Environment Variables Guide */}
        <div className="p-6 rounded-xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Network className="w-5 h-5 text-brand-teal" />
            <h2 className="text-base font-bold text-ink">Hướng dẫn cấu hình Biến môi trường trên Vercel</h2>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Để bảo vệ an toàn tuyệt đối, các khóa bảo mật được lưu trữ trực tiếp trên Vercel Dashboard (không bao giờ hiển thị trên giao diện người dùng hay client bundle).
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-border">
              <div className="font-mono font-medium text-ink">GOOGLE_CLIENT_ID</div>
              <span className={hasClientId ? "text-status-success font-semibold" : "text-status-danger font-semibold"}>
                {hasClientId ? "✓ Đã nạp" : "✗ Thiếu"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-border">
              <div className="font-mono font-medium text-ink">GOOGLE_CLIENT_SECRET</div>
              <span className={hasClientSecret ? "text-status-success font-semibold" : "text-status-danger font-semibold"}>
                {hasClientSecret ? "✓ Đã nạp" : "✗ Thiếu"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-border">
              <div className="font-mono font-medium text-ink">DATABASE_URL</div>
              <span className={hasDbUrl ? "text-status-success font-semibold" : "text-status-danger font-semibold"}>
                {hasDbUrl ? "✓ Đã nạp (Postgres)" : "✗ Thiếu"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-border">
              <div className="font-mono font-medium text-ink">GEMINI_API_KEY</div>
              <span className={hasGeminiKey ? "text-status-success font-semibold" : "text-status-danger font-semibold"}>
                {hasGeminiKey ? "✓ Đã nạp" : "✗ Thiếu"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Sanitized Security Audit Logs */}
        <div className="p-6 rounded-xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-teal" />
              <h2 className="text-base font-bold text-ink">Nhật ký Xác thực & Tích hợp Hệ thống (Sanitized Audit Logs)</h2>
            </div>
            <span className="text-xs text-ink-muted">10 sự kiện gần nhất</span>
          </div>

          <div className="divide-y divide-border">
            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-muted">Chưa có bản ghi nhật ký.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-ink flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                        {log.resource}
                      </span>
                    </div>
                    <div className="text-ink-muted text-[11px]">
                      Thực hiện bởi: {log.actorEmail} ({log.actorRole})
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        log.status === "SUCCESS"
                          ? "bg-status-success-soft text-status-success"
                          : "bg-status-danger-soft text-status-danger"
                      }`}
                    >
                      {log.status}
                    </span>
                    <div className="text-[10px] text-ink-muted mt-1">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
