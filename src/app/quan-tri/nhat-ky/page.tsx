import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Database, ShieldCheck, Network, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const [auditLogs, activeSessions, syncLogs] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.authSession.findMany({
      where: { isRevoked: false },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.syncLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              Nhật ký Bảo mật, Phiên Đăng nhập & Đồng bộ Google API
            </h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Security & Audit Trail
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Theo dõi thời gian thực mọi sự kiện xác thực OIDC, chuyển đổi góc nhìn Super Admin, kiểm soát RBAC và đồng bộ Google Workspace.
          </p>
        </div>

        {/* Active Sessions */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Lock className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
              Phiên Đăng nhập Đang Hoạt động ({activeSessions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink font-bold">
                  <th className="py-2.5 px-3">Người dùng</th>
                  <th className="py-2.5 px-3">Vai trò gốc</th>
                  <th className="py-2.5 px-3">Góc nhìn hiện tại</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3">Hết hạn lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activeSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {s.user.fullName} ({s.user.email})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-brand-teal font-bold">
                      {s.user.role}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink">
                      {s.activeViewRole || s.user.role}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink-muted">
                      {s.authMethod}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink-muted">
                      {new Date(s.expiresAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Logs */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
              Nhật ký Kiểm toán Bảo mật (AuditLog - {auditLogs.length} sự kiện gần nhất)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink font-bold">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Tác nhân (Actor)</th>
                  <th className="py-2.5 px-3">Hành động</th>
                  <th className="py-2.5 px-3">Tài nguyên</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-3 font-mono text-ink-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-ink">
                        {log.actorEmail}
                      </span>
                      <span className="ml-1.5 text-[10px] font-mono bg-canvas border border-border px-1.5 py-0.5 rounded">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-ink">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink-muted">
                      {log.resource}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.status === "SUCCESS"
                            ? "bg-status-success-soft text-status-success"
                            : "bg-status-danger-soft text-status-danger"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Google Workspace Sync Logs */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Network className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
              Nhật ký Đồng bộ Google Workspace API (SyncLog)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink font-bold">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Dịch vụ</th>
                  <th className="py-2.5 px-3">Thao tác API</th>
                  <th className="py-2.5 px-3">Resource ID</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {syncLogs.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-mono text-ink-muted">
                      {new Date(s.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-teal">
                      {s.service}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink">
                      {s.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink-muted">
                      {s.resourceId || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold bg-status-success-soft text-status-success px-2 py-0.5 rounded">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

