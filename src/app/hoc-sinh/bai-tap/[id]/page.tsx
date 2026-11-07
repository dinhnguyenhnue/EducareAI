import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { AssignmentSubmissionForm } from "./AssignmentSubmissionForm";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentAssignmentDetailPage({ params }: Props) {
  const { id } = await params;

  let assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      schoolClass: true,
      teacher: { include: { user: true } },
      submissions: {
        where: {
          student: { user: { email: "minhanh.nguyen@unigo.edu.vn" } },
        },
      },
    },
  });

  if (!assignment) {
    assignment = await prisma.assignment.findFirst({
      include: {
        subject: true,
        schoolClass: true,
        teacher: { include: { user: true } },
        submissions: {
          where: {
            student: { user: { email: "minhanh.nguyen@unigo.edu.vn" } },
          },
        },
      },
    });
  }

  if (!assignment) {
    return (
      <AppShell>
        <div className="p-8 text-center">Không tìm thấy bài tập.</div>
      </AppShell>
    );
  }

  const submission = assignment.submissions[0];

  let rubric = [];
  try {
    if (assignment.rubric) {
      rubric = JSON.parse(assignment.rubric);
    }
  } catch (e) {
    rubric = [];
  }

  let rubricScores: Record<string, number> = {};
  try {
    if (submission?.rubricScores) {
      rubricScores = JSON.parse(submission.rubricScores);
    }
  } catch (e) {}

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link href="/hoc-sinh/bai-tap" className="hover:text-brand-teal flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Danh sách bài tập</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">{assignment.title}</span>
        </div>

        {/* 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Assignment & Submission Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
                <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2.5 py-1 rounded">
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
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-teal" />
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Tiêu chí đánh giá (Rubric)
                  </h3>
                </div>
                <span className="text-xs text-brand-teal font-semibold">Tổ THCS UNIGO</span>
              </div>

              <div className="mt-4 space-y-4">
                {rubric.map((crit: any) => {
                  const studentScore = rubricScores[crit.id];
                  return (
                    <div
                      key={crit.id}
                      className="p-3.5 rounded-panel bg-canvas border border-border/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-ink">
                        <span>{crit.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-brand-teal bg-brand-teal-soft px-1.5 py-0.2 rounded">
                            {crit.weight}%
                          </span>
                          {studentScore !== undefined && (
                            <span className="font-mono text-status-success">
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
              <div className="mt-6 p-4 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-brand-teal">
                  <Sparkles className="w-4 h-4" />
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

