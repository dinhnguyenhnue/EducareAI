import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentStrengthsAndGapsPage() {
  const session = await getServerSession();
  const isParentSession = session?.user.role === "PARENT" && !session.isSuperAdmin;

  const parentUser = await prisma.user.findFirst({
    where: isParentSession
      ? { id: session.user.id }
      : { email: "ph.minhanh@gmail.com" },
    include: {
      parentProfile: {
        include: {
          children: {
            where: { isVerified: true },
            include: {
              student: {
                include: {
                  user: true,
                  schoolClass: true,
                  progressRecords: {
                    include: { subject: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const child = parentUser?.parentProfile?.children[0]?.student;
  const studentUser = child?.user;
  const progressRecords = child?.progressRecords || [];

  const avgMastery =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((acc, r) => acc + (r.masteryPercent ?? 0), 0) /
            progressRecords.length
        )
      : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="progress"
          badge="Cổng Phụ huynh • Phân tích Năng lực Đa môn (SRS §3.2 & §4.4)"
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          title={`Điểm mạnh & Nội dung Cần Củng cố của ${studentUser?.fullName || "Chưa có dữ liệu"}`}
          description="Báo cáo được tổng hợp từ kết quả làm bài kiểm tra, bài tập dự án và đánh giá của giáo viên bộ môn, diễn giải bằng ngôn ngữ dễ hiểu giúp phụ huynh nắm bắt đúng trọng tâm."
        />

        {progressRecords.length === 0 ? (
          <EmptyState
            tone="progress"
            icon={<TrendingUp className="w-6 h-6" />}
            title="Chưa có dữ liệu phân tích năng lực"
            description="Hệ thống sẽ hiển thị điểm mạnh và nội dung cần củng cố sau khi có kết quả học tập được giáo viên ghi nhận."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {progressRecords.map((record) => (
              <div
                key={record.id}
                className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      Môn {record.subject.name} (Khối {record.subject.gradeLevel})
                    </span>
                    <h2 className="text-lg font-bold text-ink mt-0.5">
                      Mức độ làm chủ kiến thức:{" "}
                      {record.masteryPercent !== null && record.masteryPercent !== undefined
                        ? `${Math.round(record.masteryPercent)}%`
                        : "Chưa có dữ liệu"}
                    </h2>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {record.completedLessons} bài học • {record.completedAssignments} bài tập
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(record.masteryPercent ?? 0))}%` }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Điểm mạnh nổi bật của con</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {record.strengths || "Chưa có dữ liệu"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Nội dung con cần củng cố thêm</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    {record.gaps || "Chưa có dữ liệu"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-canvas border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <Target className="w-4 h-4 text-ocean-600" />
                    <span>Định hướng tiếp theo từ Giáo viên & AI</span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {record.nextStepSuggestion || "Chưa có dữ liệu"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-5 rounded-2xl bg-ocean-50/70 border border-ocean-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-ocean-600 shrink-0 mt-0.5" />
          <div className="text-xs text-ink space-y-1">
            <p className="font-bold text-ocean-900">
              {avgMastery !== null
                ? `Mức độ làm chủ kiến thức trung bình (${progressRecords.length} môn): ${avgMastery}%`
                : "Chưa có dữ liệu tổng hợp phân nhóm học tập tuần này"}
            </p>
            <p className="text-ink-muted">
              Mọi nhận xét trên đây đều đã được giáo viên bộ môn kiểm duyệt trước khi hiển thị trên Cổng Phụ huynh theo đúng quy định của nhà trường.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
