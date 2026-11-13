import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { AssignmentSubmissionForm } from "./AssignmentSubmissionForm";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Award,
  Sparkles,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function StudentAssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();
  const isStudentSession =
    session?.user.role === "STUDENT" && !session.isSuperAdmin;

  const submissionWhere = {
    student: isStudentSession
      ? { userId: session.user.id }
      : { user: { email: "minhanh.nguyen@unigo.edu.vn" } },
  };

  let assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      schoolClass: true,
      teacher: { include: { user: true } },
      submissions: { where: submissionWhere },
    },
  });

  if (!assignment) {
    assignment = await prisma.assignment.findFirst({
      include: {
        subject: true,
        schoolClass: true,
        teacher: { include: { user: true } },
        submissions: { where: submissionWhere },
      },
    });
  }

  if (!assignment) {
    return (
      <AppShell>
        <div className="p-8 text-center text-sm text-ink-muted">Không tìm thấy bài tập.</div>
      </AppShell>
    );
  }

  const submission = assignment.submissions[0];

  let rubric = [];
  try {
    if (assignment.rubric) {
      rubric = JSON.parse(assignment.rubric);
    }
  } catch {
    rubric = [];
  }

  let rubricScores: Record<string, number> = {};
  try {
    if (submission?.rubricScores) {
      rubricScores = JSON.parse(submission.rubricScores);
    }
  } catch {}

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link href="/hoc-sinh/bai-tap" className="hover:text-orange-700 font-medium flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Danh sách bài tập</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">{assignment.title}</span>
        </div>

        {/* 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Assignment & Submission Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 rounded-2xl bg-surface border border-slate-200 shadow-card">
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
                <span className="text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full">
                  {assignment.subject.name}
                </span>
                <span className="text-xs text-ink-muted">
                  Giáo viên: {assignment.teacher.user.fullName}
                </span>
                <span className="text-xs text-ink-muted">•</span>
                <span className="text-xs text-ink-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Hạn nộp: {new Date(assignment.dueAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-ink mt-4">{assignment.title}</h1>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                {assignment.description}
              </p>

              {assignment.instructions && (
                <div className="mt-6 p-4 rounded-panel bg-canvas border border-border">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wide mb-2">
                    Hướng dẫn thực hiện từ giáo viên:
                  </h4>
                  <p className="text-xs text-ink leading-relaxed whitespace-pre-line">
                    {assignment.instructions}
                  </p>
                </div>
              )}

              {/* Submission Status or Form */}
              <div className="mt-8 pt-6 border-t border-border">
                {submission ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-panel bg-status-success-soft border border-status-success/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-status-success font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>
                            {submission.status === "GRADED"
                              ? `Đã chấm: ${submission.score}/10`
                              : "Bài nộp đã ghi nhận • Chờ giáo viên chấm"}
                          </span>
                        </div>
                        <span className="text-xs text-ink-muted">
                          Nộp lúc: {new Date(submission.submittedAt).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {submission.teacherComment && (
                        <div className="mt-4 pt-3 border-t border-status-success/20">
                          <span className="text-xs font-bold text-ink">
                            Nhận xét của {submission.gradedBy || "Giáo viên"}:
                          </span>
                          <p className="text-xs text-ink mt-1 italic">
                            "{submission.teacherComment}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submitted Content Preview */}
                    <div className="p-4 rounded-panel bg-surface border border-border text-xs space-y-2">
                      <span className="font-semibold text-ink block">Nội dung bài làm của em:</span>
                      <p className="text-ink-muted">{submission.content}</p>
                    </div>
                  </div>
                ) : (
                  <AssignmentSubmissionForm assignmentId={assignment.id} />
                )}
              </div>
            </div>
          </div>

          {/* Rubric & Self-Evaluation Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Tiêu chí đánh giá (Rubric)
                  </h3>
                </div>
                <span className="text-xs text-amber-700 font-bold">Tổ THCS UNIGO</span>
              </div>

              <div className="mt-4 space-y-4">
                {rubric.map((crit: any) => {
                  const studentScore = rubricScores[crit.id];
                  return (
                    <div
                      key={crit.id}
                      className="p-3.5 rounded-xl bg-canvas border border-slate-200/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-ink">
                        <span>{crit.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {crit.weight}%
                          </span>
                          {studentScore !== undefined && (
                            <span className="font-mono text-emerald-700 font-bold">
                              {studentScore} đ
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-ink-muted">{crit.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Socratic Hint */}
              <div className="mt-6 p-4 rounded-xl bg-violet-50/70 border border-violet-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-violet-800">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Lời khuyên tự đánh giá</span>
                </div>
                <p className="text-ink leading-relaxed">
                  Trước khi nhấn nộp bài, em hãy đối chiếu từng tiêu chí rubric trên xem bài của mình đã đạt mức Tốt chưa nhé!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

