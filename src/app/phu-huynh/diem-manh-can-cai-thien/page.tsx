import React from "react";
import { AppShell } from "@/components/layout/AppShell";
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
          <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">
            Cổng Phụ huynh • Phân tích Năng lực Đa môn (SRS §3.2 & §4.4)
          </span>
          <h1 className="text-2xl font-bold text-ink mt-1">
            Điểm mạnh & Nội dung Cần Củng cố của {studentUser?.fullName || "Nguyễn Minh Anh"}
          </h1>
          <p className="text-xs text-ink-muted mt-1 max-w-3xl">
            Báo cáo được tổng hợp từ kết quả làm bài kiểm tra, bài tập dự án và đánh giá của giáo viên bộ môn, diễn giải bằng ngôn ngữ dễ hiểu giúp phụ huynh nắm bắt đúng trọng tâm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {progressRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-teal uppercase">
                    Môn {record.subject.name} (Khối {record.subject.gradeLevel})
                  </span>
                  <h2 className="text-lg font-bold text-ink mt-0.5">
                    Mức độ làm chủ kiến thức: {Math.round(record.masteryPercent)}%
                  </h2>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-brand-teal-soft text-brand-teal text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {record.completedLessons} bài học • {record.completedAssignments} bài tập
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-canvas overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full"
                  style={{ width: `${Math.min(100, Math.round(record.masteryPercent))}%` }}
                />
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Điểm mạnh nổi bật của con</span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {record.strengths || "Chưa có dữ liệu"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Nội dung con cần củng cố thêm</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  {record.gaps || "Chưa có dữ liệu"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Target className="w-4 h-4 text-brand-teal" />
                  <span>Định hướng tiếp theo từ Giáo viên & AI</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {record.nextStepSuggestion || "Chưa có dữ liệu"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-panel bg-brand-teal-soft/50 border border-brand-teal/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
          <div className="text-xs text-ink space-y-1">
            <p className="font-bold">
              Tổng kết phân nhóm học tập tuần này: Nhóm 1 – Khá giỏi & Chủ động sáng tạo
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
