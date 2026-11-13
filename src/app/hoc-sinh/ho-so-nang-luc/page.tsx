import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  Award,
  Sparkles,
  FileCheck,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentCompetencyProfilePage() {
  const session = await getServerSession();
  const isStudentSession = session?.user.role === "STUDENT" && !session.isSuperAdmin;

  const student = await prisma.user.findFirst({
    where: isStudentSession
      ? { id: session.user.id }
      : { email: "minhanh.nguyen@unigo.edu.vn" },
    include: {
      studentProfile: {
        include: {
          schoolClass: true,
          progressRecords: { include: { subject: true } },
          submissions: {
            include: { assignment: { include: { subject: true } } },
            orderBy: { submittedAt: "desc" },
          },
        },
      },
    },
  });

  const [attempts, approvedInsights] = student
    ? await Promise.all([
        prisma.attempt.findMany({
          where: {
            studentId: student.id,
            status: { in: ["SUBMITTED", "EXPIRED_AUTO_SUBMITTED"] },
            isDemoData: false,
          },
          include: { assessment: true },
          orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
        }),
        prisma.studentInsight.findMany({
          where: {
            studentUserId: student.id,
            status: "APPROVED",
          },
          orderBy: { reviewedAt: "desc" },
          take: 5,
        }),
      ])
    : [[], []];

  const validAttempts = attempts.filter(
    (a) => a.totalScore !== null && a.totalScore !== undefined && a.maxScore > 0
  );
  const practiceAttempts = validAttempts.filter((a) => a.assessment.mode === "PRACTICE");
  const examAttempts = validAttempts.filter((a) => a.assessment.mode === "EXAM");

  function computeModeSummary(list: typeof validAttempts) {
    if (list.length === 0) {
      return {
        count: 0,
        first: null as number | null,
        latest: null as number | null,
        best: null as number | null,
        mean: null as number | null,
        improvement: null as number | null,
      };
    }
    const normalized = list.map((a) =>
      Math.round(((a.totalScore! / a.maxScore) * 10 + Number.EPSILON) * 100) / 100
    );
    const first = normalized[0];
    const latest = normalized[normalized.length - 1];
    const best = Math.max(...normalized);
    const mean =
      Math.round((normalized.reduce((s, v) => s + v, 0) / normalized.length) * 100) / 100;
    const improvement =
      normalized.length >= 2
        ? Math.round((latest - first + Number.EPSILON) * 100) / 100
        : null;
    return { count: normalized.length, first, latest, best, mean, improvement };
  }

  const practiceStats = computeModeSummary(practiceAttempts);
  const examStats = computeModeSummary(examAttempts);
  const progressRecords = student?.studentProfile?.progressRecords || [];
  const submissions = student?.studentProfile?.submissions || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="progress"
          badge="Chỉ số minh bạch • Tách Luyện tập & Kiểm tra"
          badgeIcon={<Award className="w-3.5 h-3.5" />}
          title="Hồ sơ năng lực học tập số"
          description='Thống kê trực tiếp từ các lượt làm bài hợp lệ (Điểm đầu, Gần nhất, Tốt nhất, Trung bình, Mức cải thiện). Khi chưa đủ minh chứng hệ thống hiển thị "Chưa có dữ liệu", không tự suy diễn năng lực.'
        />

        {/* Transparent Practice vs Exam Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Chế độ Luyện tập (PRACTICE)", stats: practiceStats, accent: "text-sky-700", iconBg: "text-sky-600" },
            { label: "Chế độ Kiểm tra chính thức (EXAM)", stats: examStats, accent: "text-amber-700", iconBg: "text-amber-600" },
          ].map((block) => (
            <div
              key={block.label}
              className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${block.iconBg}`} />
                  <h2 className="text-sm font-bold text-ink">{block.label}</h2>
                </div>
                <span className={`text-xs font-bold ${block.accent}`}>
                  {block.stats.count} lượt hợp lệ
                </span>
              </div>

              {block.stats.count === 0 ? (
                <div className="p-4 rounded-xl bg-canvas border border-slate-200 text-xs text-ink-muted">
                  Chưa có dữ liệu lượt làm bài hoàn tất hợp lệ.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-canvas border border-slate-200">
                    <span className="text-ink-muted block">Điểm đầu</span>
                    <strong className="font-mono text-sm text-ink">
                      {block.stats.first !== null ? `${block.stats.first}/10` : "Chưa có dữ liệu"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas border border-slate-200">
                    <span className="text-ink-muted block">Gần nhất</span>
                    <strong className="font-mono text-sm text-ink">
                      {block.stats.latest !== null ? `${block.stats.latest}/10` : "Chưa có dữ liệu"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-emerald-700 font-medium block">Tốt nhất</span>
                    <strong className="font-mono text-sm text-emerald-700">
                      {block.stats.best !== null ? `${block.stats.best}/10` : "Chưa có dữ liệu"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas border border-slate-200">
                    <span className="text-ink-muted block">Trung bình</span>
                    <strong className="font-mono text-sm text-ink">
                      {block.stats.mean !== null ? `${block.stats.mean}/10` : "Chưa có dữ liệu"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas border border-slate-200">
                    <span className="text-ink-muted block">Cải thiện</span>
                    <strong className="font-mono text-sm text-ocean-700">
                      {block.stats.improvement !== null
                        ? `${block.stats.improvement >= 0 ? "+" : ""}${block.stats.improvement}`
                        : "Chưa đủ dữ liệu (<2 lượt)"}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subject Mastery from Real DB LearningProgress */}
        <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                Tiến độ theo môn học (Dữ liệu thực từ LearningProgress)
              </h2>
            </div>
            <span className="text-xs text-ink-muted">
              {progressRecords.length > 0
                ? `${progressRecords.length} môn có dữ liệu`
                : "Chưa có dữ liệu"}
            </span>
          </div>

          {progressRecords.length === 0 ? (
            <div className="p-4 rounded-panel bg-canvas border border-border text-xs text-ink-muted">
              Chưa có dữ liệu tiến độ môn học. Hệ thống không tự gán điểm năng lực khi chưa có minh chứng.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-panel bg-canvas border border-border/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">{rec.subject.name}</span>
                    <span className="font-mono font-bold text-ink">
                      {rec.masteryPercent !== null && rec.masteryPercent !== undefined
                        ? `${Math.round(rec.masteryPercent)}%`
                        : "Chưa có dữ liệu"}
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, rec.masteryPercent || 0))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    <strong>Điểm mạnh:</strong> {rec.strengths || "Chưa có dữ liệu"} •{" "}
                    <strong>Cần củng cố:</strong> {rec.gaps || "Chưa có dữ liệu"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning History & Approved Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-orange-600" />
              <span>Minh chứng bài tập đã nộp ({submissions.length})</span>
            </h3>

            {submissions.length === 0 ? (
              <p className="text-xs text-ink-muted py-4">Chưa có dữ liệu bài nộp.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl bg-canvas border border-slate-200/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{sub.assignment.title}</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {sub.score !== null && sub.score !== undefined
                          ? `${sub.score}/${sub.assignment.maxScore}`
                          : "Chưa có điểm"}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted line-clamp-2">
                      Nhận xét của GV: {sub.teacherComment || "Chưa có dữ liệu nhận xét"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-ink-muted/80 pt-1 border-t border-slate-100">
                      <span>Môn: {sub.assignment.subject.name}</span>
                      <span>
                        Ngày nộp:{" "}
                        {new Date(sub.gradedAt || sub.submittedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher-Approved Insights Only */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-violet-50/60 border border-violet-200 shadow-card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-violet-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-violet-200/70">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Nhận xét có căn cứ (Đã được Giáo viên duyệt)</span>
              </div>

              {approvedInsights.length === 0 ? (
                <div className="text-xs text-ink-muted leading-relaxed space-y-2">
                  <p className="font-semibold text-ink">Chưa có nhận xét AI đã duyệt.</p>
                  <p>
                    Theo quy định đánh giá minh bạch, bản nháp phân tích của AI chỉ được hiển thị sau khi có đủ bằng chứng lượt làm bài và được Giáo viên kiểm duyệt.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-ink">
                  {approvedInsights.map((ins) => (
                    <div key={ins.id} className="p-3 rounded-xl bg-surface border border-violet-200/70 space-y-1">
                      <p className="leading-relaxed">{ins.draftText}</p>
                      <p className="text-[11px] text-violet-700 font-semibold">
                        Hành động đề xuất: {ins.suggestedAction}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-violet-200/70 text-[11px] text-ink-muted">
              Tổng hợp từ {validAttempts.length} lượt kiểm tra/luyện tập hợp lệ và {submissions.length} bài tập đã nộp.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
