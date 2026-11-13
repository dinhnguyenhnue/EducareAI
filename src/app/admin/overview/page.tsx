import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";
import { SuperAdminViewCards } from "./SuperAdminViewCards";
import {
  PageHeader,
  StatCard,
  ChartCard,
  EmptyState,
  OceanButtonLink,
} from "@/components/ui";
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

  const classDistribution = classes.slice(0, 8).map((c) => ({
    label: c.name,
    value: c._count.students,
    hint: c.academicYear?.name || `Khối ${c.gradeLevel}`,
    tone: (c.gradeLevel === 6
      ? "materials"
      : c.gradeLevel === 7
      ? "overview"
      : "progress") as "materials" | "overview" | "progress",
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge="SUPER_ADMIN CONSOLE"
          badgeIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          tone="security"
          title="Trung tâm Điều hành Tối cao EDUCARE AI – UNIGO"
          description="Toàn bộ chỉ số được truy vấn trực tiếp từ PostgreSQL thực tế (Năm học 2026–2027). Không sử dụng số liệu cố định."
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-ink-muted">
                dinhnguyenhnue@gmail.com
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  superAdminUser?.accountStatus === "ACTIVE" &&
                  superAdminUser?.googleSub
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {superAdminUser?.googleSub
                  ? "Đã xác minh Google OIDC sub"
                  : "PENDING_ACTIVATION (Chờ liên kết Google OIDC)"}
              </span>
            </div>
          }
          actions={
            <>
              <OceanButtonLink
                href="/quan-tri/nguoi-dung"
                variant="gradient"
                icon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Nhập Excel Học sinh
              </OceanButtonLink>
              <OceanButtonLink
                href="/admin/settings/integrations"
                variant="secondary"
                icon={<Network className="w-4 h-4 text-cyan-600" />}
              >
                Tích hợp Google
              </OceanButtonLink>
              <OceanButtonLink
                href="/quan-tri/nhat-ky"
                variant="secondary"
                icon={<Database className="w-4 h-4 text-amber-600" />}
              >
                Audit Logs
              </OceanButtonLink>
            </>
          }
        />

        {/* Real Database KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng tài khoản trong CSDL"
            value={`${totalUsers} tài khoản`}
            testId="kpi-total-users"
            hint={`${teachersCount} Giáo viên • ${studentsCount} Học sinh • ${parentsCount} Phụ huynh`}
            icon={<Users className="w-4 h-4" />}
            tone="overview"
            href="/quan-tri/nguoi-dung"
          />
          <StatCard
            label="Lớp học Năm 2026–2027"
            value={`${classes.length} lớp`}
            testId="kpi-total-classes"
            hint={`Khối 6 (${grade6Classes}) • Khối 7 (${grade7Classes}) • Khối 8 (${grade8Classes})`}
            icon={<Layers className="w-4 h-4" />}
            tone="progress"
            href="/quan-tri/lop-hoc"
          />
          <StatCard
            label="Học phần & Bài nộp thực"
            value={`${assignmentsCount} / ${submissionsCount}`}
            hint={`${assignmentsCount} bài tập & ${submissionsCount} bài nộp thuộc ${subjectsCount} môn học`}
            icon={<Sparkles className="w-4 h-4" />}
            tone="assignments"
          />
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card hover:shadow-card-hover hover:border-cyan-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-ink-muted">
                Google OAuth & Workspace
              </span>
              <span className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Network className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5">
              {oauthConfig.isConfigured ? (
                <span className="text-base font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  OAuth Configured
                </span>
              ) : (
                <span className="text-sm font-extrabold text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Chưa cấu hình OAuth
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted mt-1.5">
              Tách biệt Sign-In & Incremental Scopes
            </p>
          </div>
        </div>

        {/* Interactive Charts & Role Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ChartCard
            className="lg:col-span-7"
            title="Sĩ số học sinh theo lớp học (CSDL thực)"
            subtitle="Số lượng học sinh đang theo học từng lớp trong năm học"
            data={classDistribution}
            unit=" HS"
            variant="vertical"
            tone="overview"
            action={
              <Link
                href="/quan-tri/lop-hoc"
                className="text-xs font-semibold text-ocean-600 hover:underline"
              >
                Quản lý lớp →
              </Link>
            }
          />
          <ChartCard
            className="lg:col-span-5"
            title="Cơ cấu tài khoản theo vai trò"
            subtitle="Thống kê người dùng thực tế trong hệ sinh thái UNIGO"
            data={[
              { label: "Học sinh", value: studentsCount, tone: "progress" },
              { label: "Phụ huynh", value: parentsCount, tone: "aiTutor" },
              { label: "Giáo viên", value: teachersCount, tone: "overview" },
            ]}
            unit=" TK"
            variant="horizontal"
            tone="progress"
          />
        </div>

        {/* Multi-View Switcher */}
        <SuperAdminViewCards />

        {/* RBAC Role Matrix & Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-ocean-light text-ocean-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  Ma trận Vai trò RBAC trong CSDL
                </h2>
              </div>
              <Link
                href="/quan-tri/nguoi-dung"
                className="text-xs font-semibold text-ocean-600 hover:underline"
              >
                Quản lý người dùng →
              </Link>
            </div>

            {roles.length === 0 ? (
              <EmptyState title="Chưa có định nghĩa vai trò RBAC" tone="security" />
            ) : (
              <div className="divide-y divide-border/70 text-xs">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ocean-700 bg-ocean-light px-2 py-0.5 rounded text-[11px]">
                          {r.code}
                        </span>
                        <span className="font-bold text-ink">{r.name}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
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
            )}
          </section>

          <section className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  Nhật ký Bảo mật & Điều hành (AuditLog)
                </h2>
              </div>
              <Link
                href="/quan-tri/nhat-ky"
                className="text-xs font-semibold text-ocean-600 hover:underline"
              >
                Xem toàn bộ →
              </Link>
            </div>

            {recentAudits.length === 0 ? (
              <EmptyState
                title="Chưa có bản ghi nhật ký nào"
                description="Các thao tác đăng nhập, chuyển góc nhìn và đồng bộ sẽ xuất hiện tại đây."
                tone="assessments"
              />
            ) : (
              <div className="divide-y divide-border/70 text-xs">
                {recentAudits.map((log) => (
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
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        {log.actorEmail} ({log.actorRole}) • {log.resource}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
