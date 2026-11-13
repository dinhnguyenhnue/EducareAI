import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  PageHeader,
  StatCard,
  FeatureCard,
  ChartCard,
  OceanButtonLink,
} from "@/components/ui";
import {
  Users,
  Layers,
  Network,
  Sparkles,
  Database,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    usersCount,
    teachersCount,
    studentsCount,
    parentsCount,
    classes,
    assignmentsCount,
    submissionsCount,
    syncLogsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacherProfile.count(),
    prisma.studentProfile.count(),
    prisma.parentProfile.count(),
    prisma.schoolClass.findMany({
      include: { _count: { select: { students: true } } },
    }),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.syncLog.count(),
  ]);

  const g6 = classes.filter((c) => c.gradeLevel === 6).length;
  const g7 = classes.filter((c) => c.gradeLevel === 7).length;
  const g8 = classes.filter((c) => c.gradeLevel === 8).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge="School Admin Console"
          badgeIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          tone="overview"
          title="Trung tâm Quản trị Hệ thống"
          description="Giám sát toàn diện Trường Tiểu học và THCS UNIGO: Người dùng, Lớp học, Google Workspace, Gemini AI và CSDL thực."
          actions={
            <OceanButtonLink href="/admin/overview" variant="soft" size="sm">
              Mở Super Admin Console →
            </OceanButtonLink>
          }
        />

        {/* Real Database System KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng người dùng (CSDL thực)"
            value={`${usersCount} tài khoản`}
            hint={`${teachersCount} GV • ${studentsCount} HS • ${parentsCount} Phụ huynh`}
            icon={<Users className="w-4 h-4" />}
            tone="overview"
            href="/quan-tri/nguoi-dung"
          />
          <StatCard
            label="Lớp học THCS (2026–2027)"
            value={`${classes.length} lớp`}
            hint={`Khối 6 (${g6} lớp), Khối 7 (${g7} lớp), Khối 8 (${g8} lớp)`}
            icon={<Layers className="w-4 h-4" />}
            tone="progress"
            href="/quan-tri/lop-hoc"
          />
          <StatCard
            label="Bài tập & Bài nộp thực"
            value={`${assignmentsCount} / ${submissionsCount}`}
            hint={`${assignmentsCount} bài giao • ${submissionsCount} bài nộp trên PostgreSQL`}
            icon={<Database className="w-4 h-4" />}
            tone="assignments"
          />
          <StatCard
            label="Lượt đồng bộ Google API"
            value={`${syncLogsCount} phiên`}
            hint="Drive, Docs, Sheets, Classroom, Calendar"
            icon={<Network className="w-4 h-4" />}
            tone="workspace"
            href="/quan-tri/google-integrations"
          />
        </div>

        <ChartCard
          title="Phân bố học sinh theo lớp học (CSDL thực)"
          subtitle="Số lượng hồ sơ học sinh đang liên kết theo từng lớp"
          data={classes.slice(0, 8).map((c) => ({
            label: c.name,
            value: c._count.students,
            tone: c.gradeLevel === 7 ? "overview" : c.gradeLevel === 6 ? "materials" : "progress",
          }))}
          unit=" HS"
          variant="horizontal"
          tone="overview"
        />

        {/* Administrative Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            title="Quản lý & Nhập người dùng"
            description="Thêm mới, phân quyền RBAC và nhập hàng loạt danh sách học sinh theo khối từ file Excel chuẩn UNIGO."
            href="/quan-tri/nguoi-dung"
            ctaLabel="Mở trang quản lý"
            tone="overview"
            badge="RBAC"
            icon={<Users className="w-5 h-5" />}
          />
          <FeatureCard
            title="Tích hợp Google Workspace"
            description="Kiểm tra kết nối OAuth, hạn ngạch Sheets, Drive Folder phân cấp và trạng thái đồng bộ thực."
            href="/quan-tri/google-integrations"
            ctaLabel="Kiểm tra tích hợp"
            tone="workspace"
            badge="Google API"
            icon={<Network className="w-5 h-5" />}
          />
          <FeatureCard
            title="Audit Logs & Nhật ký Bảo mật"
            description="Tra cứu toàn bộ lịch sử đăng nhập, chuyển góc nhìn Super Admin, phân quyền và đồng bộ dữ liệu."
            href="/quan-tri/nhat-ky"
            ctaLabel="Xem nhật ký"
            tone="assessments"
            badge="Security"
            icon={<Sparkles className="w-5 h-5" />}
          />
        </div>
      </div>
    </AppShell>
  );
}
