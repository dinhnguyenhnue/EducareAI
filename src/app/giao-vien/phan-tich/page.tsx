import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, StatCard, ChartCard, ProgressCard, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Award, Sparkles, TrendingUp, Users, FileCheck2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherAnalyticsPage() {
  const [submissions, grades, progressRecords, studentsCount, quizAttempts, gamePlayRecords] =
    await Promise.all([
      prisma.submission.findMany({
        include: { assignment: true, student: { include: { user: true } } },
      }),
      prisma.grade.findMany(),
      prisma.learningProgress.findMany({
        include: { subject: true, student: { include: { user: true } } },
      }),
      prisma.studentProfile.count(),
      prisma.attempt.findMany({
        where: { status: { in: ["SUBMITTED", "EXPIRED_AUTO_SUBMITTED"] } },
        include: {
          assessment: { select: { title: true, code: true, mode: true } },
          answers: {
            where: { isCorrect: false },
            select: { assessmentItemId: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 30,
      }),
      prisma.learningRecord.findMany({
        where: { activityType: "HTML_GAME_PLAY" },
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
              schoolClass: { select: { name: true } },
            },
          },
        },
        orderBy: { recordedAt: "desc" },
        take: 30,
      }),
    ]);

  const attemptStudentIds = Array.from(
    new Set(quizAttempts.map((att) => att.studentId).filter(Boolean))
  );
  const attemptStudents =
    attemptStudentIds.length > 0
      ? await prisma.user.findMany({
        where: { id: { in: attemptStudentIds } },
        select: {
          id: true,
          fullName: true,
          studentProfile: {
            select: {
              studentCode: true,
              schoolClass: { select: { name: true } },
            },
          },
        },
      })
      : [];
  const attemptStudentMap = new Map(attemptStudents.map((u) => [u.id, u]));

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

        {/* Quiz Attempts & HTML Game Plays Recorded in DB */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">
                Nhật ký Lượt làm Trắc nghiệm &amp; Lượt chơi Trò chơi HTML
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Dữ liệu thực tế từ bảng <code className="font-mono">Attempt</code> và <code className="font-mono">LearningRecord</code> (không giả lập dữ liệu).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-200">
                {quizAttempts.length} lượt Quiz/Đề thi
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {gamePlayRecords.length} lượt chơi Game HTML
              </span>
            </div>
          </div>

          {quizAttempts.length === 0 && gamePlayRecords.length === 0 ? (
            <EmptyState
              tone="progress"
              title="Chưa có dữ liệu lượt làm hoặc lượt chơi"
              description="Khi học sinh nộp bài trắc nghiệm hoặc hoàn thành một lượt chơi trò chơi HTML có phát sự kiện kết thúc, dữ liệu sẽ hiển thị tại đây."
            />
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border font-bold text-ink">
                    <th className="py-2.5 px-3">Học sinh</th>
                    <th className="py-2.5 px-3">Lớp</th>
                    <th className="py-2.5 px-3">Loại hoạt động</th>
                    <th className="py-2.5 px-3">Tên bài / Trò chơi</th>
                    <th className="py-2.5 px-3">Lần</th>
                    <th className="py-2.5 px-3">Điểm (hệ 10)</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Câu / Chủ đề sai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {quizAttempts.map((att) => {
                    const attStudent = attemptStudentMap.get(att.studentId);
                    const durationSec =
                      att.submittedAt && att.startedAt
                        ? Math.max(
                          0,
                          Math.round(
                            (att.submittedAt.getTime() - att.startedAt.getTime()) / 1000
                          )
                        )
                        : null;
                    return (
                      <tr key={`att-${att.id}`}>
                        <td className="py-2 px-3 font-medium text-ink">
                          {attStudent?.fullName || "Chưa có dữ liệu"}
                          {attStudent?.studentProfile?.studentCode ? (
                            <span className="block text-[11px] font-mono text-ink-muted">
                              {attStudent.studentProfile.studentCode}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {attStudent?.studentProfile?.schoolClass?.name || att.classId || "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 font-semibold text-[11px]">
                            {att.assessment?.mode === "EXAM" ? "Kiểm tra" : "Luyện tập Quiz"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-ink">
                          {att.assessment?.title || "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3 font-mono">#{att.attemptNumber}</td>
                        <td className="py-2 px-3 font-bold text-ink">
                          {att.totalScore !== null && att.totalScore !== undefined
                            ? att.totalScore.toFixed(2)
                            : "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {durationSec !== null ? `${durationSec}s` : "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {att.answers.length > 0
                            ? `Sai ${att.answers.length} câu`
                            : "0 câu sai"}
                        </td>
                      </tr>
                    );
                  })}
                  {gamePlayRecords.map((rec) => {
                    let detail: Record<string, any> = {};
                    try {
                      detail = rec.detailData ? JSON.parse(rec.detailData) : {};
                    } catch { }
                    const wrongTopics: string[] = Array.isArray(detail.wrongTopics)
                      ? detail.wrongTopics
                      : [];
                    return (
                      <tr key={`gp-${rec.id}`}>
                        <td className="py-2 px-3 font-medium text-ink">
                          {rec.student?.user?.fullName || "Chưa có dữ liệu"}
                          {rec.student?.studentCode ? (
                            <span className="block text-[11px] font-mono text-ink-muted">
                              {rec.student.studentCode}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {rec.student?.schoolClass?.name || detail.className || "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                            Game HTML (Tự luyện)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-ink">
                          {detail.projectTitle || "Trò chơi HTML"}
                        </td>
                        <td className="py-2 px-3 font-mono">#{detail.attemptNumber || 1}</td>
                        <td className="py-2 px-3 font-bold text-ink">
                          {rec.score !== null && rec.score !== undefined
                            ? rec.score.toFixed(2)
                            : "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {rec.timeSpentSeconds !== null && rec.timeSpentSeconds !== undefined
                            ? `${rec.timeSpentSeconds}s`
                            : "Chưa có dữ liệu"}
                        </td>
                        <td className="py-2 px-3 text-ink-muted">
                          {wrongTopics.length > 0
                            ? wrongTopics.join(", ")
                            : "Chưa có dữ liệu"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
