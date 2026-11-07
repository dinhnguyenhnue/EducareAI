import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";
import { SuperAdminViewCards } from "./SuperAdminViewCards";
import {
  ShieldCheck,
  Users,
  Layers,
  Network,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminOverviewPage() {
  const [
    totalUsers,
    teachersCount,
    studentsCount,
    parentsCount,
    classes,
    subjectsCount,
    assignmentsCount,
    submissionsCount,
    roles,
    recentAudits,
    superAdminUser,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacherProfile.count(),
    prisma.studentProfile.count(),
    prisma.parentProfile.count(),
    prisma.schoolClass.findMany({
      include: { _count: { select: { students: true } }, academicYear: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.roleDefinition.findMany({
      include: { _count: { select: { userRoles: true, rolePermissions: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.user.findUnique({
      where: { email: "dinhnguyenhnue@gmail.com" },
    }),
  ]);

  const oauthConfig = getGoogleOAuthConfig();
  const grade6Classes = classes.filter((c) => c.gradeLevel === 6).length;
  const grade7Classes = classes.filter((c) => c.gradeLevel === 7).length;
  const grade8Classes = classes.filter((c) => c.gradeLevel === 8).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-teal-soft text-brand-teal px-2.5 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SUPER_ADMIN CONSOLE</span>
              </span>
              <span className="text-xs font-mono text-ink-muted">
                dinhnguyenhnue@gmail.com
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  superAdminUser?.accountStatus === "ACTIVE" &&
                  superAdminUser?.googleSub
                    ? "bg-status-success-soft text-status-success"
                    : "bg-status-warning-soft text-status-warning"
                }`}
              >
                {superAdminUser?.googleSub
                  ? "Đã xác minh Google OIDC sub"
                  : "PENDING_ACTIVATION (Chờ liên kết Google OIDC lần đầu)"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ink">
              Trung tâm Điều hành Tối cao EDUCARE AI – UNIGO
            </h1>
            <p className="text-xs text-ink-muted">
              Toàn bộ chỉ số dưới đây được truy vấn trực tiếp từ CSDL thực tế (Năm học 2026–2027). Không sử dụng số liệu cố định (hardcode).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/quan-tri/nguoi-dung"
              className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nhập Excel Học sinh 2026–2027</span>
            </Link>
            <Link
              href="/quan-tri/nhat-ky"
              className="px-4 py-2.5 rounded-button bg-canvas border border-border text-ink text-xs font-semibold hover:bg-surface-muted transition-colors flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-brand-teal" />
              <span>Audit Logs</span>
            </Link>
          </div>
        </div>

        {/* Real Database KPIs (Zero Hardcoded Numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Tổng tài khoản trong CSDL</span>
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div
              data-testid="kpi-total-users"
              className="text-2xl font-bold text-ink mt-2 font-mono"
            >
              {totalUsers} tài khoản
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              {teachersCount} Giáo viên • {studentsCount} Học sinh •{" "}
              {parentsCount} Phụ huynh
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Lớp học Năm 2026–2027</span>
              <Layers className="w-4 h-4 text-brand-teal" />
            </div>
            <div
              data-testid="kpi-total-classes"
              className="text-2xl font-bold text-ink mt-2 font-mono"
            >
              {classes.length} lớp
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Khối 6 ({grade6Classes}) • Khối 7 ({grade7Classes}) • Khối 8 (
              {grade8Classes})
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Học phần & Bài nộp thực</span>
              <Sparkles className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {assignmentsCount} bài tập / {submissionsCount} bài nộp
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Thuộc {subjectsCount} môn học đang triển khai
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Google OAuth & Workspace</span>
              <Network className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="mt-2">
              {oauthConfig.isConfigured ? (
                <span className="text-lg font-bold text-status-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  OAuth Configured
                </span>
              ) : (
                <span className="text-sm font-bold text-status-warning flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Chờ GOOGLE_CLIENT_ID
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Tách biệt Sign-In & Incremental Scopes
            </p>
          </div>
        </div>

        {/* Section VI: Super Admin Multi-View Switcher Interactive Cards */}
        <SuperAdminViewCards />

        {/* 12-Column Grid: RBAC Role Matrix & Recent Security Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 6 RBAC Roles in Database (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  Ma trận 6 Vai trò RBAC trong CSDL (Section IV)
                </h2>
              </div>
              <Link
                href="/quan-tri/nguoi-dung"
                className="text-xs font-semibold text-brand-teal hover:underline"
              >
                Quản lý người dùng →
              </Link>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-teal bg-brand-teal-soft px-2 py-0.5 rounded text-[11px]">
                        {r.code}
                      </span>
                      <span className="font-semibold text-ink">{r.name}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">
                      {r.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[11px]">
                    <div className="font-bold text-ink">
                      {r._count.rolePermissions} quyền
                    </div>
                    <div className="text-ink-muted">
                      {r._count.userRoles} tài khoản
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Recent Security & Audit Logs (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  Nhật ký Bảo mật & Điều hành Gần nhất (AuditLog)
                </h2>
              </div>
              <Link
                href="/quan-tri/nhat-ky"
                className="text-xs font-semibold text-brand-teal hover:underline"
              >
                Xem toàn bộ →
              </Link>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              {recentAudits.length === 0 ? (
                <p className="py-6 text-center text-ink-muted">
                  Chưa có bản ghi nhật ký nào.
                </p>
              ) : (
                recentAudits.map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink text-[11px]">
                          {log.action}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            log.status === "SUCCESS"
                              ? "bg-status-success-soft text-status-success"
                              : "bg-status-danger-soft text-status-danger"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        Thực hiện bởi: {log.actorEmail} ({log.actorRole}) • Tài nguyên:{" "}
                        {log.resource}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

