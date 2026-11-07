import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  AlertCircle,
} from "lucide-react";

export default async function StudentAssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: {
      subject: true,
      schoolClass: true,
      submissions: {
        where: {
          student: {
            user: { email: "minhanh.nguyen@unigo.edu.vn" },
          },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bài tập & Dự án thực hành</h1>
          <p className="text-xs text-ink-muted mt-1">
            Không chỉ làm bài để chấm điểm — hãy tập trung vào sản phẩm thực tế, khả năng tự đánh giá và phản biện.
          </p>
        </div>

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
            } catch (e) {}

            return (
              <div
                key={a.id}
                className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-teal/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                      {a.subject.name}
                    </span>
                    <span className="text-xs font-medium text-ink-muted">
                      Lớp {a.schoolClass.name}
                    </span>
                    <span className="text-xs text-ink-muted">•</span>
                    <span className="text-xs text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Hạn nộp: {new Date(a.dueAt).toLocaleDateString("vi-VN")}
                    </span>
                    {rubricCount > 0 && (
                      <span className="text-[11px] font-semibold text-status-info bg-status-info-soft px-2 py-0.5 rounded">
                        Rubric {rubricCount} tiêu chí
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-ink hover:text-brand-teal transition-colors">
                    <Link href={`/hoc-sinh/bai-tap/${a.id}`}>{a.title}</Link>
                  </h3>

                  <p className="text-xs text-ink-muted line-clamp-2 max-w-3xl">
                    {a.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {isGraded ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-status-success">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã chấm điểm: {submission.score}/10</span>
                      </div>
                      <Link
                        href={`/hoc-sinh/bai-tap/${a.id}`}
                        className="text-[11px] text-brand-teal font-semibold hover:underline block mt-1"
                      >
                        Xem nhận xét & rubric →
                      </Link>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-status-info">
                        <Clock className="w-4 h-4" />
                        <span>Đã nộp bài • Chờ chấm</span>
                      </div>
                      <Link
                        href={`/hoc-sinh/bai-tap/${a.id}`}
                        className="text-[11px] text-brand-teal font-semibold hover:underline block mt-1"
                      >
                        Xem lại bài nộp →
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/hoc-sinh/bai-tap/${a.id}`}
                      className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-1.5"
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
      </div>
    </AppShell>
  );
}

