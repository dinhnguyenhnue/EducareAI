import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  Award,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const parentUser = await prisma.user.findFirst({
    where: { email: "ph.minhanh@gmail.com" },
    include: {
      parentProfile: {
        include: {
          children: {
            where: { isVerified: true },
            include: {
              student: {
                include: {
                  user: true,
                  schoolClass: {
                    include: { homeroomTeacher: { include: { user: true } } },
                  },
                  submissions: {
                    include: { assignment: { include: { subject: true } } },
                    orderBy: { submittedAt: "desc" },
                  },
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

  const linkedChild = parentUser?.parentProfile?.children[0]?.student;
  const studentUser = linkedChild?.user;
  const progressRecords = linkedChild?.progressRecords || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Child Selector & Welcome Banner */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={
                studentUser?.avatarUrl ||
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
              }
              alt="Học sinh"
              className="w-12 h-12 rounded-full object-cover border-2 border-brand-teal"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">
                  Đồng hành cùng con: {studentUser?.fullName ?? "Nguyễn Minh Anh"}
                </h1>
                <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                  Lớp {linkedChild?.schoolClass?.name ?? "7A1"}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Mã học sinh: {linkedChild?.studentCode} • Giáo viên chủ nhiệm:{" "}
                {linkedChild?.schoolClass?.homeroomTeacher?.user.fullName ||
                  "Thầy Trần Minh Tuấn"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">
              Liên kết Phụ huynh – Học sinh:
            </span>
            <span className="text-xs font-semibold text-status-success bg-status-success-soft px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã xác minh trong CSDL
            </span>
          </div>
        </div>

        {/* Strict Privacy Banner per DESIGN.md */}
        <div className="p-4 rounded-panel bg-canvas border border-border flex items-center gap-3 text-xs text-ink-muted">
          <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0" />
          <span>
            <strong className="text-ink font-semibold">
              Quy chuẩn An toàn dữ liệu UNIGO:
            </strong>{" "}
            Phụ huynh xem báo cáo học tập, kết quả điểm và nhận xét chính thức từ thầy cô của con đã xác minh liên kết. Lịch sử hội thoại riêng tư với AI Tutor được bảo mật để khuyến khích con tự do đặt câu hỏi khám phá.
          </span>
        </div>

        {/* 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Progress & Strengths (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-teal" />
                <span>Điểm mạnh & Nội dung cần đồng hành (Dữ liệu thực)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Strengths */}
                <div className="p-4 rounded-panel bg-status-success-soft/50 border border-status-success/20 space-y-2">
                  <span className="font-bold text-status-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Điểm mạnh nổi bật của con:</span>
                  </span>
                  <ul className="space-y-1.5 text-ink list-disc list-inside">
                    {progressRecords.map((rec) => (
                      <li key={rec.id}>
                        <strong>{rec.subject.name}:</strong> {rec.strengths}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps / Areas to support */}
                <div className="p-4 rounded-panel bg-status-warning-soft/50 border border-status-warning/20 space-y-2">
                  <span className="font-bold text-status-warning flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Nội dung gia đình có thể hỗ trợ:</span>
                  </span>
                  <ul className="space-y-1.5 text-ink list-disc list-inside">
                    {progressRecords.map((rec) => (
                      <li key={rec.id}>
                        <strong>{rec.subject.name}:</strong> {rec.gaps}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Official Teacher Comments & Evaluated Work */}
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border">
                Nhận xét chính thức từ Giáo viên bộ môn
              </h3>

              <div className="space-y-3">
                {linkedChild?.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-button bg-canvas border border-border/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">
                        {sub.assignment.title}
                      </span>
                      <span className="font-mono font-bold text-status-success text-sm">
                        {sub.score !== null ? `${sub.score}/10` : "Đang chấm"}
                      </span>
                    </div>
                    {sub.teacherComment && (
                      <p className="text-ink italic bg-surface p-2.5 rounded border border-border/60">
                        &ldquo;{sub.teacherComment}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                      <span>
                        Người chấm: {sub.gradedBy || "Thầy Trần Minh Tuấn"}
                      </span>
                      <span>
                        Ngày:{" "}
                        {new Date(
                          sub.gradedAt || sub.submittedAt
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Parent AI Assistant (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 shadow-card flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand-teal font-bold text-xs uppercase tracking-wider pb-2 border-b border-brand-teal/20">
                  <Sparkles className="w-4 h-4" />
                  <span>Trợ lý Đồng hành AI (Dành cho Phụ huynh)</span>
                </div>

                <div className="text-xs text-ink leading-relaxed space-y-3">
                  <p className="font-medium text-ink">
                    Chào Phụ huynh! Đây là gợi ý đồng hành dựa trên nhận xét chính thức của giáo viên bộ môn.
                  </p>
                  <div className="p-3 bg-surface rounded-panel border border-border text-ink space-y-2">
                    <span className="font-bold text-brand-teal block">
                      Gợi ý câu hỏi trò chuyện cùng con tối nay:
                    </span>
                    <p className="text-ink-muted">
                      &ldquo;Hôm nay bố/mẹ thấy sản phẩm Infographic Văn hóa số của con được thầy Tuấn đánh giá 9.0 điểm. Con tâm đắc nhất quy tắc bảo mật nào và làm thế nào để cả nhà mình cùng áp dụng?&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
