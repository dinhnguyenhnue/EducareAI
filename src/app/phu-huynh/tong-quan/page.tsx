import React from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  PageHeader,
  ProgressCard,
  AIWidget,
  EmptyState,
  OceanButtonLink,
} from "@/components/ui";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const session = await getServerSession();
  const isParentSession =
    session?.user.role === "PARENT" && !session.isSuperAdmin;

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
  const childAvatar =
    studentUser?.avatarUrl ||
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Trust & Clarity Parent Header */}
        <PageHeader
          badge={linkedChild ? "Liên kết đã xác minh" : "Chưa liên kết học sinh"}
          badgeIcon={<HeartHandshake className="w-3.5 h-3.5" />}
          tone="aiTutor"
          title={`Đồng hành cùng con: ${studentUser?.fullName ?? "Chưa có dữ liệu"}`}
          description={`Lớp ${linkedChild?.schoolClass?.name ?? "--"} • Mã HS: ${linkedChild?.studentCode ?? "--"} • GVCN: ${linkedChild?.schoolClass?.homeroomTeacher?.user.fullName || "Chưa gán"}`}
          meta={
            <div className="flex items-center gap-3">
              <Image
                src={childAvatar}
                alt={studentUser?.fullName || "Học sinh"}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border-2 border-violet-200 shrink-0"
              />
              {linkedChild && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác minh trong CSDL
                </span>
              )}
            </div>
          }
          actions={
            <OceanButtonLink
              href="/phu-huynh/bai-tap-kiem-tra"
              variant="soft"
              size="sm"
            >
              <span>Xem bài tập & điểm chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </OceanButtonLink>
          }
        />

        {/* Privacy Assurance Banner */}
        <div className="p-4 rounded-panel bg-ocean-50/70 border border-ocean-200/70 flex items-center gap-3 text-xs text-ink">
          <span className="w-9 h-9 rounded-xl bg-ocean-light text-ocean-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <span className="leading-relaxed">
            <strong className="text-ocean-deep font-bold">
              Quy chuẩn An toàn dữ liệu UNIGO:
            </strong>{" "}
            Phụ huynh xem báo cáo học tập, kết quả điểm và nhận xét chính thức từ thầy cô của con đã xác minh liên kết. Lịch sử hội thoại riêng tư với AI Tutor được bảo mật để khuyến khích con tự do đặt câu hỏi khám phá.
          </span>
        </div>

        {/* 12-Column Clarity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            {/* Subject Progress Overview */}
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide pb-3 border-b border-border flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </span>
                <span>Tiến bộ từng môn & Điểm mạnh của con</span>
              </h2>

              {progressRecords.length === 0 ? (
                <EmptyState
                  title="Chưa có báo cáo tiến bộ môn học"
                  description="Dữ liệu đánh giá định kỳ từ thầy cô sẽ hiển thị tại đây khi được cập nhật."
                  tone="progress"
                />
              ) : (
                <>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Điểm mạnh nổi bật</span>
                      </span>
                      <ul className="space-y-1.5 text-ink list-disc list-inside">
                        {progressRecords.map((rec) => (
                          <li key={rec.id}>
                            <strong>{rec.subject.name}:</strong> {rec.strengths}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <span className="font-bold text-amber-800 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>Nội dung gia đình có thể hỗ trợ</span>
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
                </>
              )}
            </section>

            {/* Official Teacher Comments */}
            <section className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-3 border-b border-border">
                Nhận xét chính thức từ Giáo viên bộ môn
              </h3>

              {!linkedChild?.submissions || linkedChild.submissions.length === 0 ? (
                <EmptyState
                  title="Chưa có bài nộp hoặc nhận xét chính thức"
                  description="Khi con hoàn thành bài tập và được giáo viên chấm điểm, nhận xét sẽ xuất hiện tại đây."
                  tone="assignments"
                />
              ) : (
                <div className="space-y-3">
                  {linkedChild.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-canvas/70 border border-border/80 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-ink">
                          {sub.assignment.title}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                            sub.score !== null
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {sub.score !== null ? `${sub.score}/10` : "Đang chấm"}
                        </span>
                      </div>
                      {sub.teacherComment && (
                        <p className="text-ink italic bg-surface p-3 rounded-lg border border-border/70">
                          &ldquo;{sub.teacherComment}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                        <span>
                          Người chấm:{" "}
                          {sub.gradedBy ||
                            linkedChild?.schoolClass?.homeroomTeacher?.user
                              .fullName ||
                            "Giáo viên bộ môn"}
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
              )}
            </section>
          </div>

          {/* Right 5 Columns: Parent AI Assistant */}
          <div className="lg:col-span-5 space-y-6">
            <AIWidget
              title="Trợ lý Đồng hành AI (Phụ huynh)"
              badge="Parent Guide"
              description={
                <p>
                  Chào Quý phụ huynh! Dưới đây là gợi ý đồng hành dựa trên nhận xét và bài nộp thực tế gần nhất của con.
                </p>
              }
              principle={
                linkedChild?.submissions && linkedChild.submissions.length > 0 ? (
                  <p>
                    <strong className="font-bold text-violet-800 block mb-1">
                      Gợi ý câu hỏi trò chuyện cùng con tối nay:
                    </strong>
                    &ldquo;Bố/mẹ thấy con vừa nộp bài &lsquo;
                    {linkedChild.submissions[0].assignment.title}&rsquo;
                    {linkedChild.submissions[0].score !== null &&
                    linkedChild.submissions[0].score !== undefined
                      ? ` (${linkedChild.submissions[0].score}/${linkedChild.submissions[0].assignment.maxScore} điểm)`
                      : ""}
                    . Con tâm đắc nhất nội dung nào trong bài làm này?&rdquo;
                  </p>
                ) : (
                  <p>
                    Chưa có dữ liệu bài nộp đã chấm để tạo gợi ý cụ thể cho con.
                  </p>
                )
              }
              primaryHref="/phu-huynh/goi-y-dong-hanh"
              primaryLabel="Xem thêm gợi ý đồng hành"
              secondaryHref="/phu-huynh/diem-manh-can-cai-thien"
              secondaryLabel="Chi tiết điểm mạnh & cần hỗ trợ"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
