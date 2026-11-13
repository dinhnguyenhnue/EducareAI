import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, StatCard, ChartCard, ProgressCard, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Award, Sparkles, TrendingUp, Users, FileCheck2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherAnalyticsPage() {
  const [submissions, grades, progressRecords, studentsCount] =
    await Promise.all([
      prisma.submission.findMany({
        include: { assignment: true, student: { include: { user: true } } },
      }),
      prisma.grade.findMany(),
      prisma.learningProgress.findMany({
        include: { subject: true, student: { include: { user: true } } },
      }),
      prisma.studentProfile.count(),
    ]);

  const gradedSubs = submissions.filter(
    (s) => s.status === "GRADED" && s.score !== null && s.score !== undefined
  );
  const avgScore: string | null =
    gradedSubs.length > 0
      ? (
          gradedSubs.reduce((acc, s) => acc + (s.score ?? 0), 0) /
          gradedSubs.length
        ).toFixed(1)
      : null;

  const avgMastery: number | null =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((acc, p) => acc + p.masteryPercent, 0) /
            progressRecords.length
        )
      : null;

  const subjectChartMap = new Map<string, { sum: number; count: number }>();
  progressRecords.forEach((p) => {
    const key = p.subject.name;
    const prev = subjectChartMap.get(key) ?? { sum: 0, count: 0 };
    subjectChartMap.set(key, { sum: prev.sum + p.masteryPercent, count: prev.count + 1 });
  });
  const subjectChartData = Array.from(subjectChartMap.entries()).map(([label, v]) => ({
    label,
    value: Math.round(v.sum / v.count),
    hint: `${v.count} HS`,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="progress"
          badge="Learning Analytics Engine"
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          title="Phân tích Học tập & Đề xuất AI (Dữ liệu Thực)"
          description={`Tổng hợp trực tiếp từ ${submissions.length} bài nộp, ${grades.length} bản ghi điểm chính thức và ${progressRecords.length} hồ sơ tiến độ trong CSDL.`}
        />

        {/* Real DB Analytics KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            tone="assignments"
            label="Tổng bài nộp đã thu"
            value={`${submissions.length} bài`}
            hint={`${gradedSubs.length} bài đã chấm điểm Rubric`}
            icon={<FileCheck2 className="w-4 h-4" />}
          />
          <StatCard
            tone="assessments"
            label="Điểm trung bình thực tế"
            value={avgScore !== null ? `${avgScore} / 10` : "Chưa có dữ liệu"}
            hint={gradedSubs.length > 0 ? `Tính trên ${gradedSubs.length} bài đã chấm` : "Chưa có bài nộp nào được chấm điểm"}
            icon={<Award className="w-4 h-4" />}
          />
          <StatCard
            tone="progress"
            label="Mức độ làm chủ trung bình"
            value={avgMastery !== null ? `${avgMastery}%` : "Chưa có dữ liệu"}
            hint={progressRecords.length > 0 ? `Từ ${progressRecords.length} bản ghi LearningProgress` : "Chưa có dữ liệu tiến độ"}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            tone="overview"
            label="Tổng học sinh trên hệ thống"
            value={`${studentsCount} học sinh`}
            hint="Khối 6, 7, 8 UNIGO"
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        {/* 12-Column Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {subjectChartData.length > 0 && (
              <ChartCard
                title="Mức độ làm chủ trung bình theo Môn học"
                subtitle="Tính từ dữ liệu thực trong CSDL LearningProgress"
                data={subjectChartData}
                unit="%"
                tone="progress"
              />
            )}

            <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>
                  Bản ghi Tiến độ Năng lực Học sinh trong CSDL ({progressRecords.length})
                </span>
              </h3>

              {progressRecords.length === 0 ? (
                <EmptyState
                  tone="progress"
                  title="Chưa có dữ liệu LearningProgress"
                  description="Khi có bài tập được chấm hoặc dữ liệu đồng bộ chính thức, biểu đồ tiến độ sẽ hiển thị tại đây."
                />
              ) : (
                <div className="space-y-4">
                  {progressRecords.map((rec) => (
                    <ProgressCard
                      key={rec.id}
                      tone="progress"
                      title={`${rec.student.user.fullName} — ${rec.subject.name}`}
                      subtitle={
                        rec.strengths
                          ? `Điểm mạnh: ${rec.strengths}`
                          : "Đang cập nhật nhận xét"
                      }
                      percent={rec.masteryPercent}
                      detail={rec.gaps ? `Cần củng cố: ${rec.gaps}` : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50/50 border border-violet-200 shadow-card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-violet-200/80">
                <Sparkles className="w-4 h-4" />
                <span>AI Recommendation Engine</span>
              </div>

              <div className="text-xs text-ink leading-relaxed space-y-3">
                {progressRecords.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface border border-violet-200/60 shadow-xs text-ink-muted">
                    Chưa có dữ liệu tiến độ để tạo gợi ý sư phạm.
                  </div>
                ) : (
                  progressRecords
                    .filter((r) => Boolean(r.gaps))
                    .slice(0, 4)
                    .map((r) => (
                      <div key={r.id} className="p-3.5 rounded-xl bg-surface border border-violet-200/70 shadow-xs">
                        <span className="font-bold text-violet-700 block mb-1">
                          {r.student.user.fullName} • {r.subject.name} ({r.masteryPercent}%)
                        </span>
                        <p className="text-ink-muted">
                          Cần củng cố: {r.gaps}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
