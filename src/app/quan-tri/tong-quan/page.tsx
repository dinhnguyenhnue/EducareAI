import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Layers,
  Network,
  Sparkles,
  Database,
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
    prisma.schoolClass.findMany(),
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">
                Trung tâm Quản trị Hệ thống
              </h1>
              <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                School Admin Console
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Giám sát toàn diện Trường Tiểu học và THCS UNIGO: Người dùng, Lớp học, Google Workspace, Gemini AI và CSDL thực.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/overview"
              className="text-xs font-semibold text-brand-teal bg-brand-teal-soft px-3 py-1.5 rounded hover:underline"
            >
              Mở Super Admin Console →
            </Link>
          </div>
        </div>

        {/* Real Database System KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Tổng người dùng (CSDL thực)</span>
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {usersCount} tài khoản
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              {teachersCount} GV • {studentsCount} HS • {parentsCount} Phụ huynh
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Lớp học THCS (2026–2027)</span>
              <Layers className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {classes.length} lớp
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Khối 6 ({g6} lớp), Khối 7 ({g7} lớp), Khối 8 ({g8} lớp)
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Bài tập & Bài nộp thực</span>
              <Database className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {assignmentsCount} bài / {submissionsCount} nộp
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Lưu trữ trên CSDL chính SQLite/PostgreSQL
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Lượt đồng bộ Google API</span>
              <Network className="w-4 h-4 text-status-success" />
            </div>
            <div className="text-2xl font-bold text-status-success mt-2 font-mono">
              {syncLogsCount} phiên
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Drive, Docs, Sheets, Classroom, Calendar
            </p>
          </div>
        </div>

        {/* Administrative Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/quan-tri/nguoi-dung"
            className="p-6 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-panel bg-brand-teal-soft flex items-center justify-center text-brand-teal mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-ink">
                Quản lý & Nhập người dùng
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Thêm mới, phân quyền RBAC và nhập hàng loạt danh sách học sinh theo khối từ file Excel chuẩn UNIGO.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-teal mt-4 flex items-center gap-1">
              Mở trang quản lý →
            </span>
          </Link>

          <Link
            href="/quan-tri/google-integrations"
            className="p-6 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-panel bg-brand-teal-soft flex items-center justify-center text-brand-teal mb-3">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-ink">
                Tích hợp Google Workspace
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Cấu hình Client ID, kiểm tra hạn ngạch Sheets (60 req/min), Drive Folder phân cấp và trạng thái token.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-teal mt-4 flex items-center gap-1">
              Kiểm tra tích hợp →
            </span>
          </Link>

          <Link
            href="/quan-tri/nhat-ky"
            className="p-6 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-panel bg-brand-teal-soft flex items-center justify-center text-brand-teal mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-ink">
                Audit Logs & Nhật ký Bảo mật
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Tra cứu toàn bộ lịch sử đăng nhập, chuyển góc nhìn Super Admin, phân quyền và đồng bộ dữ liệu.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-teal mt-4 flex items-center gap-1">
              Xem nhật ký →
            </span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
