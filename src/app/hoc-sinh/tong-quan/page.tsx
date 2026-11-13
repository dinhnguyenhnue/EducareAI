import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  PageHeader,
  StatCard,
  CourseCard,
  ProgressCard,
  AIWidget,
  EmptyState,
  OceanButtonLink,
} from "@/components/ui";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  ClipboardList,
  Gamepad2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  const isStudentSession =
    session?.user.role === "STUDENT" && !session.isSuperAdmin;

  const [student, assignments, lessons] = await Promise.all([
    prisma.user.findFirst({
      where: isStudentSession
        ? { id: session.user.id }
        : { email: "minhanh.nguyen@unigo.edu.vn" },
      include: {
        studentProfile: {
          include: {
            schoolClass: true,
            submissions: {
              select: { id: true, assignmentId: true, status: true, score: true },
            },
            progressRecords: {
              include: { subject: true },
            },
          },
        },
      },
    }),
    prisma.assignment.findMany({
      include: { subject: true, schoolClass: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.lesson.findMany({
      take: 4,
      include: { topic: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const progressRecords = student?.studentProfile?.progressRecords || [];
  const submissions = student?.studentProfile?.submissions || [];
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length;
  const averageMastery =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((sum, r) => sum + r.masteryPercent, 0) /
            progressRecords.length
        )
      : null;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Vibrant Ocean Blue Student Hero Banner */}
        <PageHeader
          variant="hero"
          badge={`Lớp ${student?.studentProfile?.schoolClass?.name ?? "7A1"} • Không gian học tập`}
          title={`Xin chào, ${student?.fullName ?? "Học sinh UNIGO"}!`}
          description={`Hôm nay em có ${assignments.length} nhiệm vụ học tập được giao và ${lessons.length} bài giảng số sẵn sàng trong hệ thống.`}
          actions={
            <>
              <Link
                href="/hoc-sinh/bai-tap"
                className="px-4 py-2.5 rounded-button bg-white text-ocean-deep text-xs font-bold hover:bg-ocean-light transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>Xem bài tập cần nộp</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/hoc-sinh/xuong-tro-choi"
                className="px-4 py-2.5 rounded-button bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/25 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Xưởng trò chơi HTML</span>
              </Link>
            </>
          }
        />

        {/* Gamified Real KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Nhiệm vụ học tập"
            value={`${assignments.length} bài`}
            hint="Bài tập được giao từ thầy cô"
            icon={<ClipboardList className="w-4 h-4" />}
            tone="assignments"
            href="/hoc-sinh/bai-tap"
          />
          <StatCard
            label="Bài đã được chấm"
            value={`${gradedCount} bài`}
            hint={`Tổng ${submissions.length} lượt đã nộp trong CSDL`}
            icon={<CheckCircle2 className="w-4 h-4" />}
            tone="progress"
            href="/hoc-sinh/ho-so-nang-luc"
          />
          <StatCard
            label="Bài giảng số mới nhất"
            value={`${lessons.length} học liệu`}
            hint="Học liệu tương tác theo chủ đề"
            icon={<BookOpen className="w-4 h-4" />}
            tone="materials"
            href="/hoc-sinh/mon-hoc"
          />
          <StatCard
            label="Mức đạt trung bình"
            value={averageMastery !== null ? `${averageMastery}%` : null}
            hint={
              averageMastery !== null
                ? `Tổng hợp từ ${progressRecords.length} môn học`
                : "Chưa có dữ liệu tiến độ môn học"
            }
            icon={<Award className="w-4 h-4" />}
            tone="achievements"
            href="/hoc-sinh/ho-so-nang-luc"
          />
        </div>

        {/* 12-Column Learning Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns: Tasks & Lessons */}
          <div className="lg:col-span-8 space-y-6">
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    1. Hôm nay em cần làm gì?
                  </h2>
                </div>
                <span className="text-xs text-ink-muted">Sắp xếp theo hạn nộp</span>
              </div>

              <div className="mt-4 divide-y divide-border/70">
                {assignments.length === 0 ? (
                  <EmptyState
                    title="Chưa có bài tập nào được giao"
                    description="Khi giáo viên phát hành bài tập mới cho lớp, nhiệm vụ sẽ hiển thị tại đây."
                    tone="assignments"
                  />
                ) : (
                  assignments.map((a) => {
                    const gradedSub = submissions.find(
                      (s) => s.assignmentId === a.id && s.status === "GRADED"
                    );
                    const isSubmitted = submissions.some(
                      (s) => s.assignmentId === a.id
                    );

                    return (
                      <div
                        key={a.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">
                              {a.subject.name}
                            </span>
                            <span className="text-xs text-ink-muted">
                              Hạn nộp:{" "}
                              {new Date(a.dueAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-ink hover:text-ocean-600 transition-colors">
                            <Link href={`/hoc-sinh/bai-tap/${a.id}`}>
                              {a.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-ink-muted line-clamp-1">
                            {a.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {gradedSub ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã chấm ({gradedSub.score}/{a.maxScore})
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-ocean-light text-ocean-700 border border-ocean-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Đang chờ chấm
                            </span>
                          ) : (
                            <OceanButtonLink
                              href={`/hoc-sinh/bai-tap/${a.id}`}
                              variant="primary"
                              size="sm"
                            >
                              Làm bài & Nộp
                            </OceanButtonLink>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Subject Courses */}
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Bài học đang diễn ra
                  </h2>
                </div>
                <Link
                  href="/hoc-sinh/mon-hoc"
                  className="text-xs font-bold text-sky-700 hover:text-ocean-600 flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lessons.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Chưa có bài giảng số nào"
                    description="Bài giảng của môn học sẽ xuất hiện tại đây khi thầy cô cập nhật."
                    tone="materials"
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lessons.map((l) => (
                    <CourseCard
                      key={l.id}
                      subjectName={l.topic.subject.name}
                      topicName={l.topic.name}
                      title={l.title}
                      href={`/hoc-sinh/mon-hoc/${l.id}`}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right 4 Columns: Mastery Progress & AI Tutor */}
          <div className="lg:col-span-4 space-y-6">
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  2. Em đang tiến bộ ở đâu?
                </h2>
              </div>

              {progressRecords.length === 0 ? (
                <EmptyState
                  title="Chưa có dữ liệu tiến độ"
                  description="Hoàn thành bài tập và bài kiểm tra để theo dõi biểu đồ tiến bộ."
                  tone="progress"
                />
              ) : (
                <div className="space-y-3">
                  {progressRecords.map((rec) => (
                    <ProgressCard
                      key={rec.id}
                      title={rec.subject.name}
                      percent={rec.masteryPercent}
                      detail={rec.strengths}
                      tone="progress"
                      showRing
                    />
                  ))}
                </div>
              )}
            </section>

            <AIWidget
              title="3. Bước học tiếp theo"
              badge="AI Tutor"
              description={
                <p>
                  <strong className="text-violet-700 font-bold">
                    Đề xuất cá nhân hóa:
                  </strong>{" "}
                  {progressRecords[0]?.nextStepSuggestion ||
                    "Hoàn thành bài tập thực hành và chia sẻ sản phẩm lên Cộng đồng học tập UNIGO."}
                </p>
              }
              primaryHref="/hoc-sinh/ai-tutor"
              primaryLabel="Trao đổi với AI Tutor"
              secondaryHref="/hoc-sinh/cong-dong"
              secondaryLabel="Đăng sản phẩm lên Cộng đồng"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
