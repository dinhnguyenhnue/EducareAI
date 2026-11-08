import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  const isStudentSession = session?.user.role === "STUDENT" && !session.isSuperAdmin;

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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner - Quiet Confidence */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal">
              <span className="w-2 h-2 rounded-full bg-brand-teal"></span>
              <span>
                Không gian học tập cá nhân • Lớp{" "}
                {student?.studentProfile?.schoolClass?.name ?? "7A1"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1">
              Xin chào, {student?.fullName ?? "Nguyễn Minh Anh"}!
            </h1>
            <p className="text-xs text-ink-muted mt-1 max-w-xl">
              Hôm nay em có{" "}
              <strong className="text-ink">
                {assignments.length} nhiệm vụ học tập
              </strong>{" "}
              được giao và{" "}
              <strong className="text-ink">
                {lessons.length} bài giảng số
              </strong>{" "}
              đã sẵn sàng trong CSDL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hoc-sinh/bai-tap"
              className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Xem bài tập cần nộp</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3 Core Questions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Hôm nay em cần làm gì? */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-teal" />
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    1. Hôm nay em cần làm gì?
                  </h2>
                </div>
                <span className="text-xs text-ink-muted">
                  Sắp xếp theo hạn nộp
                </span>
              </div>

              <div className="mt-4 divide-y divide-border/60">
                {assignments.map((a) => {
                  const gradedSub = student?.studentProfile?.submissions.find(
                    (s) => s.assignmentId === a.id && s.status === "GRADED"
                  );
                  const isSubmitted = student?.studentProfile?.submissions.some(
                    (s) => s.assignmentId === a.id
                  );

                  return (
                    <div
                      key={a.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                            {a.subject.name}
                          </span>
                          <span className="text-xs text-ink-muted">
                            Hạn nộp:{" "}
                            {new Date(a.dueAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-ink hover:text-brand-teal transition-colors">
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
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-status-success-soft text-status-success flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã chấm ({gradedSub.score}/{a.maxScore})
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-status-info-soft text-status-info flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Đang chờ chấm
                          </span>
                        ) : (
                          <Link
                            href={`/hoc-sinh/bai-tap/${a.id}`}
                            className="px-3 py-1.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
                          >
                            Làm bài & Nộp
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bài học mới */}
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-teal" />
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Bài học đang diễn ra
                  </h2>
                </div>
                <Link
                  href="/hoc-sinh/mon-hoc"
                  className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/hoc-sinh/mon-hoc/${l.id}`}
                    className="p-4 rounded-button bg-canvas hover:bg-surface-muted border border-border/80 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-brand-teal">
                        {l.topic.subject.name} • {l.topic.name}
                      </span>
                      <h4 className="text-xs font-bold text-ink mt-1 line-clamp-2">
                        {l.title}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Học liệu số UNIGO</span>
                      <span className="font-semibold text-brand-teal">
                        Vào học ngay →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Em đang tiến bộ ở đâu? (Real DB LearningProgress) */}
          <div className="space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Award className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  2. Em đang tiến bộ ở đâu?
                </h2>
              </div>

              <div className="mt-4 space-y-4">
                {progressRecords.map((rec) => (
                  <div key={rec.id}>
                    <div className="flex justify-between text-xs font-medium text-ink mb-1.5">
                      <span>{rec.subject.name}</span>
                      <span className="font-mono font-bold text-brand-teal">
                        {rec.masteryPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full bg-brand-teal rounded-full"
                        style={{ width: `${rec.masteryPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">
                      {rec.strengths}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Bước học tiếp theo là gì? */}
            <div className="p-6 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 shadow-card">
              <div className="flex items-center gap-2 pb-3 border-b border-brand-teal/20">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                  3. Bước học tiếp theo
                </h2>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-ink leading-relaxed">
                  <strong className="text-brand-teal font-semibold">
                    Đề xuất cá nhân hóa:
                  </strong>{" "}
                  {progressRecords[0]?.nextStepSuggestion ||
                    "Hoàn thành bài tập thực hành và chia sẻ sản phẩm lên Cộng đồng học tập UNIGO."}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/hoc-sinh/cong-dong"
                    className="w-full text-center py-2 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors"
                  >
                    Đăng sản phẩm lên Cộng đồng
                  </Link>
                  <Link
                    href="/hoc-sinh/ai-tutor"
                    className="w-full text-center py-2 rounded-button bg-surface border border-border text-ink font-semibold hover:bg-surface-muted transition-colors"
                  >
                    Trao đổi với AI Tutor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
