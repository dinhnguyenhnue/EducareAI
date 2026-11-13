import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  PageHeader,
  StatCard,
  FeatureCard,
  AIWidget,
  EmptyState,
  OceanButtonLink,
} from "@/components/ui";
import {
  CheckSquare,
  Users,
  ArrowRight,
  AlertCircle,
  Network,
  FileEdit,
  BookOpen,
  LineChart,
  Briefcase,
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
        student: {
          include: {
            user: { select: { fullName: true } },
            schoolClass: { select: { name: true } },
          },
        },
        assignment: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const homeroomClass = teacher?.teacherProfile?.homeroomClasses[0];
  const classStudentCount = homeroomClass?.students.length || 0;
  const studentsWithoutSubmissions =
    homeroomClass?.students.filter((s) => s._count.submissions === 0).length || 0;
  const isGoogleConnected = teacher?.googleConnection?.status === "CONNECTED";

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge="Bàn làm việc Sư phạm • Tổ Tin học & Công nghệ THCS"
          badgeIcon={<Briefcase className="w-3.5 h-3.5" />}
          tone="overview"
          title={`Kính chào ${teacher?.fullName ?? "Thầy/Cô"}!`}
          description={`Hôm nay có ${pendingSubmissions.length} bài nộp đang chờ chấm và lớp ${homeroomClass?.name || "7A1"} hiện có ${teacher?.teacherProfile?._count.assignments || 0} nhiệm vụ trong CSDL.`}
          actions={
            <OceanButtonLink
              href="/giao-vien/cham-bai"
              variant="gradient"
              icon={<CheckSquare className="w-4 h-4" />}
            >
              <span>Hàng đợi chấm bài ({pendingSubmissions.length})</span>
              <ArrowRight className="w-4 h-4" />
            </OceanButtonLink>
          }
        />

        {/* Semantic Priority KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Hàng đợi bài cần chấm"
            value={`${pendingSubmissions.length} bài`}
            hint="Ưu tiên chấm theo Rubric 4 tiêu chí"
            icon={<CheckSquare className="w-4 h-4" />}
            tone="assignments"
            href="/giao-vien/cham-bai"
          />
          <StatCard
            label="Lớp phụ trách / Chủ nhiệm"
            value={`Lớp ${homeroomClass?.name || "Chưa gán"}`}
            hint={`Sĩ số thực tế trong CSDL: ${classStudentCount} học sinh`}
            icon={<Users className="w-4 h-4" />}
            tone="overview"
            href="/giao-vien/lop-hoc"
          />
          <StatCard
            label="Học sinh chưa có bài nộp"
            value={`${studentsWithoutSubmissions} học sinh`}
            hint="Theo dõi thực tế từ bảng Submission"
            icon={<AlertCircle className="w-4 h-4" />}
            tone="assessments"
          />
          <StatCard
            label="Google Workspace"
            value={isGoogleConnected ? "Đã kết nối" : "Chưa kết nối"}
            hint="Drive • Classroom • Sheets"
            icon={<Network className="w-4 h-4" />}
            tone="workspace"
            href="/giao-vien/google-workspace"
            valueClassName={
              isGoogleConnected ? "text-emerald-700 text-lg font-sans" : "text-amber-700 text-lg font-sans"
            }
          />
        </div>

        {/* 12-Column Productivity Workplace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Grading Queue */}
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Bài nộp học sinh chờ chấm điểm & nhận xét
                  </h2>
                </div>
                <Link
                  href="/giao-vien/cham-bai"
                  className="text-xs font-bold text-orange-700 hover:underline"
                >
                  Xem tất cả ({pendingSubmissions.length}) →
                </Link>
              </div>

              <div className="mt-4 divide-y divide-border/70">
                {pendingSubmissions.length === 0 ? (
                  <EmptyState
                    title="Không có bài nộp đang chờ chấm"
                    description="Khi học sinh nộp bài tập hoặc sản phẩm thực hành, danh sách chấm Rubric sẽ tự động hiển thị tại đây."
                    tone="assignments"
                  />
                ) : (
                  pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-ink">
                            {sub.student.user.fullName}
                          </span>
                          <span className="text-[11px] font-semibold bg-ocean-light text-ocean-700 px-2 py-0.5 rounded-full">
                            Lớp {sub.student.schoolClass?.name ?? "7A1"}
                          </span>
                          <span className="text-[11px] text-ink-muted font-mono">
                            {new Date(sub.submittedAt).toLocaleTimeString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-xs text-orange-700 font-semibold truncate">
                          {sub.assignment.title}
                        </p>
                        <p className="text-xs text-ink-muted line-clamp-1">
                          {sub.content}
                        </p>
                      </div>

                      <OceanButtonLink
                        href={`/giao-vien/cham-bai?id=${sub.id}`}
                        variant="primary"
                        size="sm"
                        className="shrink-0"
                      >
                        Chấm bài ngay
                      </OceanButtonLink>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Colored Teacher Productivity Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FeatureCard
                title="Giao bài tập mới"
                description="Gắn rubric 4 tiêu chí, thời hạn và giới hạn lượt nộp."
                href="/giao-vien/bai-tap"
                ctaLabel="Giao bài"
                tone="assignments"
                icon={<FileEdit className="w-5 h-5" />}
              />
              <FeatureCard
                title="Bài giảng & Học liệu"
                description="Tải tài liệu đa định dạng an toàn hoặc nhúng bài học số."
                href="/giao-vien/bai-giang"
                ctaLabel="Biên tập bài"
                tone="materials"
                icon={<BookOpen className="w-5 h-5" />}
              />
              <FeatureCard
                title="Phân tích Yêu cầu cần đạt"
                description="Theo dõi điểm trung bình thực tế và mức độ tiến bộ theo lớp."
                href="/giao-vien/phan-tich"
                ctaLabel="Xem phân tích"
                tone="progress"
                icon={<LineChart className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Right Column: AI Pedagogical Assistant */}
          <div className="lg:col-span-4 space-y-6">
            <AIWidget
              title="Trợ lý Sư phạm AI"
              badge="Rubric Copilot"
              description={
                <p>
                  Hệ thống đang ghi nhận{" "}
                  <strong className="text-ink font-bold">
                    {pendingSubmissions.length} bài nộp
                  </strong>{" "}
                  chờ Thầy/Cô xem xét và phê duyệt nhận xét.
                </p>
              }
              principle={
                <p>
                  <strong className="font-bold text-violet-800">
                    Nguyên tắc AI Sư phạm:
                  </strong>{" "}
                  AI chỉ gợi ý bản nháp nhận xét theo 4 tiêu chí Rubric; Giáo viên luôn là người kiểm duyệt và quyết định điểm số cuối cùng.
                </p>
              }
              primaryHref="/giao-vien/cham-bai"
              primaryLabel="Duyệt & Gửi nhận xét"
              secondaryHref="/giao-vien/prompt-library"
              secondaryLabel="Mở Thư viện Prompt GV"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
