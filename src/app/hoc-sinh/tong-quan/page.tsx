import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  PageHeader,
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
  AlertCircle,
  Sparkles,
  MessageSquare,
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
              include: {
                assignment: { include: { subject: true } },
              },
              orderBy: { submittedAt: "desc" },
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
      take: 6,
    }),
    prisma.lesson.findMany({
      take: 4,
      include: { topic: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const schoolClass = student?.studentProfile?.schoolClass;
  const progressRecords = student?.studentProfile?.progressRecords || [];
  const submissions = student?.studentProfile?.submissions || [];
  const gradedSubmissions = submissions.filter((s) => s.status === "GRADED");
  const latestGraded = gradedSubmissions[0];
  const nextLesson = lessons[0];

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Modern Restrained PageHeader */}
        <PageHeader
          variant="card"
          tone="overview"
          badge={schoolClass ? `Lớp ${schoolClass.name} • UNIGO` : "Học sinh UNIGO"}
          badgeIcon={<BookOpen className="w-3.5 h-3.5" />}
          title={`Chào em, ${student?.fullName ?? "Học sinh UNIGO"}!`}
          description="Không gian học tập số cá nhân hóa: Theo dõi nhiệm vụ cần làm, học bài mới, sáng tạo sản phẩm và nhận phản hồi trực tiếp từ thầy cô."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <OceanButtonLink
                href="/hoc-sinh/bai-tap"
                variant="primary"
                size="md"
                icon={<ClipboardList className="w-4 h-4" />}
              >
                Bài tập cần làm
              </OceanButtonLink>
              <OceanButtonLink
                href="/hoc-sinh/xuong-tro-choi"
                variant="secondary"
                size="md"
                icon={<Gamepad2 className="w-4 h-4" />}
              >
                Xưởng trò chơi
              </OceanButtonLink>
            </div>
          }
        />

        {/* Chưa được xếp lớp cảnh báo rõ ràng */}
        {!schoolClass && (
          <div className="p-4 rounded-panel bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="font-bold block">Tài khoản chưa được xếp vào lớp học</strong>
              <p className="mt-0.5 text-amber-800">
                Em vui lòng liên hệ Thầy/Cô giáo chủ nhiệm hoặc Quản trị viên nhà trường để được bổ sung vào danh sách lớp chính thức.
              </p>
            </div>
          </div>
        )}

        {/* PHẦN 1: HÔM NAY EM CẦN LÀM GÌ? (Nổi bật, hành động trực tiếp) */}
        <section aria-labelledby="today-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="today-heading" className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ocean-600 inline-block" />
                Hôm nay em cần làm gì?
              </h2>
              <p className="text-sm text-ink-muted mt-0.5">
                Các nhiệm vụ quan trọng được sắp xếp theo mức độ ưu tiên và thời hạn nộp bài.
              </p>
            </div>
            <Link
              href="/hoc-sinh/bai-tap"
              className="text-sm font-semibold text-ocean-600 hover:text-ocean-700 flex items-center gap-1 transition-colors"
            >
              Xem tất cả bài tập <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Spotlight 1: Tiếp tục bài học gần nhất (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-panel bg-gradient-to-br from-sky-50/70 via-surface to-ocean-50/40 border border-sky-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-100/70 px-2.5 py-0.5 rounded-full border border-sky-200">
                  <BookOpen className="w-3.5 h-3.5" />
                  Bài học tiếp theo
                </span>
                {nextLesson ? (
                  <>
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      {nextLesson.title}
                    </h3>
                    <p className="text-sm text-ink-muted">
                      Môn {nextLesson.topic.subject.name} • Chủ đề: {nextLesson.topic.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Hiện chưa có bài học mới được phát hành.
                  </p>
                )}
              </div>

              {nextLesson ? (
                <OceanButtonLink
                  href={`/hoc-sinh/mon-hoc/${nextLesson.id}`}
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Học tiếp bài này
                </OceanButtonLink>
              ) : (
                <OceanButtonLink
                  href="/hoc-sinh/mon-hoc"
                  variant="secondary"
                  size="md"
                >
                  Khám phá môn học
                </OceanButtonLink>
              )}
            </div>

            {/* Spotlight 2: Danh sách nhiệm vụ cần nộp (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-panel bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Nhiệm vụ sắp đến hạn
                </span>
                <span className="text-xs text-ink-muted">
                  {assignments.length} bài được giao
                </span>
              </div>

              {assignments.length === 0 ? (
                <EmptyState
                  title="Không có bài tập nào đang chờ"
                  description="Em đã hoàn thành tất cả nhiệm vụ hoặc giáo viên chưa giao bài mới."
                  tone="assignments"
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {assignments.slice(0, 3).map((a) => {
                    const submission = submissions.find((s) => s.assignmentId === a.id);
                    const isGraded = submission?.status === "GRADED";
                    const isSubmitted = Boolean(submission);
                    const dueDate = new Date(a.dueAt);
                    const isOverdue = !isSubmitted && dueDate.getTime() < Date.now();

                    return (
                      <div
                        key={a.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                              {a.subject.name}
                            </span>
                            <span className={`text-xs ${isOverdue ? "text-status-danger font-semibold" : "text-ink-muted"}`}>
                              Hạn nộp: {dueDate.toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-ink hover:text-ocean-600 transition-colors truncate">
                            <Link href={`/hoc-sinh/bai-tap/${a.id}`}>{a.title}</Link>
                          </h4>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isGraded ? (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {submission?.score}/{a.maxScore} điểm
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Đã nộp bài
                            </span>
                          ) : (
                            <OceanButtonLink
                              href={`/hoc-sinh/bai-tap/${a.id}`}
                              variant="primary"
                              size="sm"
                            >
                              Nộp bài
                            </OceanButtonLink>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Phản hồi mới nhất từ giáo viên (nếu có) */}
          {latestGraded && (
            <div className="p-4 sm:p-5 rounded-panel bg-emerald-50/60 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      Phản hồi mới nhất từ Thầy/Cô
                    </span>
                    <span className="text-xs text-emerald-700">
                      • Bài: {latestGraded.assignment.title}
                    </span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    {latestGraded.teacherComment ? (
                      `"${latestGraded.teacherComment}"`
                    ) : (
                      <span className="text-ink-muted">
                        Bài đã được chấm đạt <strong>{latestGraded.score}/{latestGraded.assignment.maxScore}</strong> điểm theo Rubric.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <OceanButtonLink
                href={`/hoc-sinh/bai-tap/${latestGraded.assignmentId}`}
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                Xem chi tiết nhận xét
              </OceanButtonLink>
            </div>
          )}
        </section>

        {/* PHẦN 2: BÀI HỌC CỦA EM & TIẾN BỘ THỰC TẾ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái (8 cột): Khám phá bài giảng & Học tập */}
          <div className="lg:col-span-8 space-y-6">
            <section aria-labelledby="lessons-heading" className="p-6 rounded-panel bg-surface border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 id="lessons-heading" className="text-base font-bold text-ink flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  Bài học môn Tin học &amp; Đang diễn ra
                </h3>
                <Link
                  href="/hoc-sinh/mon-hoc"
                  className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 flex items-center gap-1"
                >
                  Tất cả môn học <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lessons.length === 0 ? (
                <EmptyState
                  title="Chưa có bài học nào được đăng tải"
                  description="Thầy cô sẽ cập nhật học liệu tương tác theo chương trình học của trường."
                  tone="materials"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Cột phải (4 cột): Tiến độ học tập thật & AI Socratic */}
          <div className="lg:col-span-4 space-y-6">
            {/* Em đang tiến bộ ở đâu? */}
            <section aria-labelledby="progress-heading" className="p-5 rounded-panel bg-surface border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 id="progress-heading" className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Tiến độ học tập thực tế
                </h3>
                <Link
                  href="/hoc-sinh/ho-so-nang-luc"
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Chi tiết
                </Link>
              </div>

              {progressRecords.length === 0 ? (
                <div className="py-2 text-center text-xs text-ink-muted">
                  Chưa có dữ liệu tiến độ. Khi em nộp bài và hoàn thành bài kiểm tra, chỉ số đạt sẽ hiển thị ở đây.
                </div>
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

            {/* Gia sư Socratic & Xưởng trò chơi */}
            <div className="p-5 rounded-panel bg-gradient-to-br from-violet-50/70 via-surface to-fuchsia-50/30 border border-violet-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm font-bold text-ink">Gia sư Socratic UNIGO</h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Thầy cô AI không giải bài hộ em, mà sẽ đặt câu hỏi gợi mở từng bước giúp em tự tìm ra cách giải quyết vấn đề.
              </p>
              <OceanButtonLink
                href="/hoc-sinh/ai-tutor"
                variant="secondary"
                size="sm"
                className="w-full justify-center"
              >
                Hỏi Gia sư Socratic
              </OceanButtonLink>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
