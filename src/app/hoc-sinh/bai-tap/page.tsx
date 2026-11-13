import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage() {
  const session = await getServerSession();
  const isStudentSession =
    session?.user.role === "STUDENT" && !session.isSuperAdmin;

  const assignments = await prisma.assignment.findMany({
    include: {
      subject: true,
      schoolClass: true,
      submissions: {
        where: {
          student: isStudentSession
            ? { userId: session.user.id }
            : { user: { email: "minhanh.nguyen@unigo.edu.vn" } },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="assignments"
          badge="Nhiệm vụ thực hành"
          badgeIcon={<ClipboardList className="w-3.5 h-3.5" />}
          title="Bài tập & Dự án thực hành"
          description="Không chỉ làm bài để chấm điểm — hãy tập trung vào sản phẩm thực tế, khả năng tự đánh giá và phản biện."
        />

        {assignments.length === 0 ? (
          <EmptyState
            tone="assignments"
            icon={<ClipboardList className="w-6 h-6" />}
            title="Chưa có bài tập nào"
            description="Khi giáo viên giao bài tập hoặc dự án mới, danh sách sẽ tự động cập nhật ở đây."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignments.map((a) => {
              const submission = a.submissions[0];
              const isGraded = submission?.status === "GRADED";
              const isSubmitted = !!submission;

              let rubricCount = 0;
              try {
                if (a.rubric) {
                  rubricCount = JSON.parse(a.rubric).length;
                }
              } catch {
                rubricCount = 0;
              }

              return (
                <div
                  key={a.id}
                  className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full">
                        {a.subject.name}
                      </span>
                      <span className="text-xs font-medium text-ink-muted">
                        Lớp {a.schoolClass.name}
                      </span>
                      <span className="text-xs text-ink-muted">•</span>
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        Hạn nộp: {new Date(a.dueAt).toLocaleDateString("vi-VN")}
                      </span>
                      {rubricCount > 0 && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Rubric {rubricCount} tiêu chí
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-ink hover:text-ocean-700 transition-colors">
                      <Link href={`/hoc-sinh/bai-tap/${a.id}`}>{a.title}</Link>
                    </h3>

                    <p className="text-xs text-ink-muted line-clamp-2 max-w-3xl">
                      {a.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {isGraded ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Đã chấm điểm: {submission.score !== null ? `${submission.score}/10` : "Chưa có dữ liệu"}
                          </span>
                        </div>
                        <Link
                          href={`/hoc-sinh/bai-tap/${a.id}`}
                          className="text-[11px] text-ocean-700 font-semibold hover:underline block mt-1"
                        >
                          Xem nhận xét & rubric →
                        </Link>
                      </div>
                    ) : isSubmitted ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                          <Clock className="w-4 h-4" />
                          <span>Đã nộp bài • Chờ chấm</span>
                        </div>
                        <Link
                          href={`/hoc-sinh/bai-tap/${a.id}`}
                          className="text-[11px] text-ocean-700 font-semibold hover:underline block mt-1"
                        >
                          Xem lại bài nộp →
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/hoc-sinh/bai-tap/${a.id}`}
                        className="px-4 py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span>Làm bài & Nộp</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

