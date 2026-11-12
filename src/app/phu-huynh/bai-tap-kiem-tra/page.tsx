import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  Award,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentAssignmentsExamsPage() {
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
                  submissions: {
                    include: { assignment: { include: { subject: true } } },
                    orderBy: { submittedAt: "desc" },
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

  const [attempts, upcomingAssignments] = await Promise.all([
    prisma.attempt.findMany({
      where: child?.userId
        ? { studentId: child.userId }
        : { studentEmail: "minhanh.nguyen@unigo.edu.vn" },
      include: { assessment: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.assignment.findMany({
      where: child?.classId ? { classId: child.classId } : undefined,
      include: { subject: true },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  const submissions = child?.submissions || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">
              Cổng Phụ huynh • Theo dõi Bài tập & Kiểm tra (SRS FR-020)
            </span>
            <h1 className="text-2xl font-bold text-ink mt-1">
              Lịch sử Bài tập, Đề kiểm tra & Hạn nộp của {studentUser?.fullName || "Nguyễn Minh Anh"}
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Lớp {child?.schoolClass?.name || "7A1"} • Mã HS: {child?.studentCode || "HS2026001"} • Dữ liệu điểm chính thức đồng bộ trực tiếp từ Supabase.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              Đã nộp: {submissions.length} bài tập
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-semibold">
              Lượt kiểm tra/luyện tập: {attempts.length} lượt
            </div>
          </div>
        </div>

        {/* Section 1: Online Assessments & Practice Attempts */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-teal" />
            <h2 className="text-base font-bold text-ink">
              Kết quả Kiểm tra & Luyện tập Trực tuyến
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas text-ink-muted">
                  <th className="py-2.5 px-3">Môn học</th>
                  <th className="py-2.5 px-3">Bài kiểm tra / Luyện tập</th>
                  <th className="py-2.5 px-3">Hình thức</th>
                  <th className="py-2.5 px-3">Điểm số</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-canvas/60">
                    <td className="py-2.5 px-3 font-semibold text-brand-teal">
                      {att.assessment.subjectName || "Tin học"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {att.assessment.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          att.assessment.mode === "EXAM"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {att.assessment.mode === "EXAM" ? "Kiểm tra định kỳ" : "Luyện tập"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {att.totalScore !== null ? `${att.totalScore} / ${att.maxScore}` : "Đang làm"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                        {att.status === "SUBMITTED" ? "Đã hoàn thành" : att.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">
                      {att.submittedAt
                        ? new Date(att.submittedAt).toLocaleString("vi-VN")
                        : new Date(att.startedAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Assignment Submissions & Teacher Remarks */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand-teal" />
            <h2 className="text-base font-bold text-ink">
              Bài tập Dự án & Nhận xét đã duyệt của Giáo viên
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-card border border-border bg-canvas/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-teal">
                    {sub.assignment.subject.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    {sub.score !== null ? `${sub.score} / ${sub.assignment.maxScore} điểm` : "Chờ chấm"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink">{sub.assignment.title}</h3>
                <p className="text-xs text-ink-muted">
                  <strong>Nhận xét của Giáo viên:</strong>{" "}
                  {sub.teacherComment || "Chưa có dữ liệu nhận xét"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Upcoming Deadlines */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-ink">
              Lịch Bài tập & Hạn nộp Sắp tới
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingAssignments.map((asg) => {
              const isSubmitted = submissions.some((s) => s.assignmentId === asg.id);
              return (
                <div key={asg.id} className="p-4 rounded-card border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-teal">{asg.subject.name}</span>
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <BookOpen className="w-3.5 h-3.5" /> Cần hoàn thành
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-ink">{asg.title}</h3>
                  <p className="text-xs text-ink-muted">
                    Hạn nộp: {new Date(asg.dueAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
