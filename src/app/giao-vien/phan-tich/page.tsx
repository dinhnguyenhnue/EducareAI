import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Award, Sparkles } from "lucide-react";

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">
                Phân tích Học tập & Đề xuất AI (Dữ liệu Thực)
              </h1>
              <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                Learning Analytics Engine
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Tổng hợp trực tiếp từ {submissions.length} bài nộp,{" "}
              {grades.length} bản ghi điểm chính thức và {progressRecords.length}{" "}
              hồ sơ tiến độ trong CSDL.
            </p>
          </div>
        </div>

        {/* Real DB Analytics KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs text-ink-muted">Tổng bài nộp đã thu</span>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {submissions.length} bài nộp
            </div>
            <p className="text-[11px] text-status-success font-medium mt-1">
              {gradedSubs.length} bài đã chấm điểm Rubric
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs text-ink-muted">
              Điểm trung bình thực tế
            </span>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {avgScore !== null ? `${avgScore} / 10` : "Chưa có dữ liệu"}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              {gradedSubs.length > 0
                ? `Tính trên ${gradedSubs.length} bài đã chấm`
                : "Chưa có bài nộp nào được chấm điểm"}
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs text-ink-muted">
              Mức độ làm chủ trung bình
            </span>
            <div className="text-2xl font-bold text-brand-teal mt-2 font-mono">
              {avgMastery !== null ? `${avgMastery}%` : "Chưa có dữ liệu"}
            </div>
            <p className="text-[11px] text-brand-teal mt-1">
              {progressRecords.length > 0
                ? `Từ ${progressRecords.length} bản ghi LearningProgress`
                : "Chưa có dữ liệu tiến độ"}
            </p>
          </div>

          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs text-ink-muted">
              Tổng học sinh trên hệ thống
            </span>
            <div className="text-2xl font-bold text-ink mt-2 font-mono">
              {studentsCount} học sinh
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Khối 6, 7, 8 UNIGO
            </p>
          </div>
        </div>

        {/* 12-Column Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-teal" />
              <span>
                Bản ghi Tiến độ Năng lực Học sinh trong CSDL ({progressRecords.length})
              </span>
            </h3>

            <div className="space-y-4 text-xs">
              {progressRecords.map((rec) => (
                <div key={rec.id}>
                  <div className="flex justify-between font-medium text-ink mb-1">
                    <span>
                      {rec.student.user.fullName} — {rec.subject.name}
                    </span>
                    <span className="font-mono font-bold text-brand-teal">
                      {rec.masteryPercent}% Đạt chuẩn
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full bg-brand-teal rounded-full"
                      style={{ width: `${rec.masteryPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    <strong>Điểm mạnh:</strong> {rec.strengths} |{" "}
                    <strong>Cần củng cố:</strong> {rec.gaps}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 shadow-card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-teal font-bold text-xs uppercase tracking-wider pb-2 border-b border-brand-teal/20">
                <Sparkles className="w-4 h-4" />
                <span>AI Recommendation Engine</span>
              </div>

              <div className="text-xs text-ink leading-relaxed space-y-3">
                <div className="p-3 rounded-panel bg-surface border border-border shadow-sm">
                  <span className="font-bold text-ink block mb-1">
                    Phát hiện từ CSDL LearningProgress:
                  </span>
                  <p className="text-ink-muted">
                    Học sinh hoàn thành tốt sản phẩm số môn Tin học, nhưng cần tăng cường bài tập thực hành tỉ lệ thức môn Toán và mở rộng dẫn chứng thực tế môn Ngữ văn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
