import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  CheckSquare,
  Users,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Network,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await getServerSession();
  const isTeacherSession = session?.user.role === "TEACHER" && !session.isSuperAdmin;

  const [teacher, pendingSubmissions] = await Promise.all([
    prisma.user.findFirst({
      where: isTeacherSession
        ? { id: session.user.id }
        : { email: "thay.tuan@unigo.edu.vn" },
      include: {
        teacherProfile: {
          include: {
            homeroomClasses: {
              include: {
                students: {
                  select: { id: true, _count: { select: { submissions: true } } },
                },
              },
            },
            _count: { select: { assignments: true } },
          },
        },
        googleConnection: { select: { status: true } },
      },
    }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED" },
      include: {
        student: { include: { user: { select: { fullName: true } }, schoolClass: { select: { name: true } } } },
        assignment: { select: { title: true } },
      },
    }),
  ]);

  const homeroomClass = teacher?.teacherProfile?.homeroomClasses[0];
  const classStudentCount = homeroomClass?.students.length || 0;
  const studentsWithoutSubmissions =
    homeroomClass?.students.filter((s) => s._count.submissions === 0).length || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal">
              <span className="w-2 h-2 rounded-full bg-brand-teal"></span>
              <span>Bàn làm việc Sư phạm • Tổ Tin học & Công nghệ THCS</span>
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1">
              Kính chào {teacher?.fullName ?? "Thầy Trần Minh Tuấn"}!
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Hôm nay thầy có{" "}
              <strong className="text-ink">
                {pendingSubmissions.length} bài nộp cần chấm
              </strong>{" "}
              và lớp {homeroomClass?.name || "7A1"} đang có{" "}
              <strong className="text-ink">
                {teacher?.teacherProfile?._count.assignments || 0} nhiệm vụ
              </strong>{" "}
              trong CSDL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/giao-vien/cham-bai"
              className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Vào hàng đợi chấm bài ({pendingSubmissions.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Real DB Priority KPI Work Queue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Hàng đợi bài cần chấm</span>
              <CheckSquare className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {pendingSubmissions.length} bài
            </div>
            <p className="text-[11px] text-brand-teal font-medium mt-1">
              Ưu tiên chấm theo Rubric 4 tiêu chí
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Lớp phụ trách / Chủ nhiệm</span>
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              Lớp {homeroomClass?.name || "7A1"}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Sĩ số thực tế trong CSDL: {classStudentCount} học sinh
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Học sinh chưa có bài nộp</span>
              <AlertCircle className="w-4 h-4 text-status-warning" />
            </div>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {studentsWithoutSubmissions} học sinh
            </div>
            <p className="text-[11px] text-status-warning mt-1">
              Theo dõi thực tế từ bảng Submission
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Google Workspace</span>
              <Network className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-bold text-status-success mt-2">
              {teacher?.googleConnection?.status === "CONNECTED"
                ? "Đã kết nối"
                : "Chưa kết nối"}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Drive • Classroom • Sheets
            </p>
          </div>
        </div>

        {/* 12-Column Main Workplace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Urgent Submissions Waiting for Review (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-brand-teal" />
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Bài nộp học sinh chờ chấm điểm & nhận xét
                  </h2>
                </div>
                <Link
                  href="/giao-vien/cham-bai"
                  className="text-xs font-semibold text-brand-teal hover:underline"
                >
                  Xem tất cả ({pendingSubmissions.length}) →
                </Link>
              </div>

              <div className="mt-4 divide-y divide-border/60">
                {pendingSubmissions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-ink-muted">
                    Hiện không có bài nộp nào đang chờ chấm.
                  </p>
                ) : (
                  pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink">
                            {sub.student.user.fullName}
                          </span>
                          <span className="text-[11px] bg-canvas text-ink-muted px-2 py-0.5 rounded border border-border">
                            Lớp {sub.student.schoolClass?.name ?? "7A1"}
                          </span>
                          <span className="text-xs text-ink-muted">
                            Nộp lúc:{" "}
                            {new Date(sub.submittedAt).toLocaleTimeString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-brand-teal font-medium">
                          {sub.assignment.title}
                        </p>
                        <p className="text-xs text-ink-muted line-clamp-1">
                          {sub.content}
                        </p>
                      </div>

                      <Link
                        href={`/giao-vien/cham-bai?id=${sub.id}`}
                        className="px-3.5 py-1.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shrink-0"
                      >
                        Chấm bài ngay
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions for Teachers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/giao-vien/bai-tap"
                className="p-4 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink">Tạo bài tập mới</h4>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Gắn rubric 4 tiêu chí và đồng bộ Google Classroom / Calendar.
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand-teal mt-3">
                  Giao bài →
                </span>
              </Link>

              <Link
                href="/giao-vien/bai-giang"
                className="p-4 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Soạn kế hoạch bài dạy
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Tạo tài liệu Google Docs từ mẫu chuẩn và gắn Drive.
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand-teal mt-3">
                  Biên tập bài →
                </span>
              </Link>

              <Link
                href="/giao-vien/phan-tich"
                className="p-4 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal transition-colors flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Báo cáo Yêu cầu cần đạt
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Theo dõi điểm trung bình thực tế và các kỹ năng cần củng cố.
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand-teal mt-3">
                  Xem phân tích →
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: AI Pedagogical Assistant & Alerts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-teal/20">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  Trợ lý Sư phạm AI gợi ý
                </h3>
              </div>

              <div className="text-xs text-ink leading-relaxed space-y-2">
                <p>
                  Hệ thống ghi nhận{" "}
                  <strong className="font-semibold text-ink">
                    {pendingSubmissions.length} bài nộp
                  </strong>{" "}
                  đang chờ thầy phê duyệt nhận xét.
                </p>
                <p>
                  <strong className="text-brand-teal font-semibold">
                    Nguyên tắc AI Sư phạm:
                  </strong>{" "}
                  AI chỉ gợi ý bản nháp nhận xét theo 4 tiêu chí Rubric; Giáo viên là người kiểm duyệt và quyết định điểm số cuối cùng.
                </p>
              </div>

              <Link
                href="/giao-vien/cham-bai"
                className="block text-center w-full py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
              >
                Duyệt & Gửi nhận xét
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
