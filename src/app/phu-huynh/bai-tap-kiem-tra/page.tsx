import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, EmptyState } from "@/components/ui";
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
        <PageHeader
          tone="assignments"
          badge="Cổng Phụ huynh • Theo dõi Bài tập & Kiểm tra (SRS FR-020)"
          badgeIcon={<FileCheck2 className="w-3.5 h-3.5" />}
          title={`Lịch sử Bài tập, Đề kiểm tra & Hạn nộp của ${studentUser?.fullName || "Chưa có dữ liệu"}`}
          description={`Lớp ${child?.schoolClass?.name || "Chưa có dữ liệu"} • Mã HS: ${child?.studentCode || "Chưa có dữ liệu"} • Dữ liệu điểm chính thức đồng bộ trực tiếp từ hệ thống.`}
          actions={
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                Đã nộp: {submissions.length} bài tập
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                Lượt kiểm tra/luyện tập: {attempts.length} lượt
              </div>
            </div>
          }
        />

        {/* Section 1: Online Assessments & Practice Attempts */}
        <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-ink">
              Kết quả Kiểm tra & Luyện tập Trực tuyến
            </h2>
          </div>
          {attempts.length === 0 ? (
            <EmptyState
              tone="assessments"
              icon={<Award className="w-6 h-6" />}
              title="Chưa có dữ liệu lượt kiểm tra"
              description="Khi học sinh hoàn thành bài luyện tập hoặc kiểm tra định kỳ, kết quả sẽ hiển thị tại đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-canvas text-ink-muted">
                    <th className="py-2.5 px-3">Môn học</th>
                    <th className="py-2.5 px-3">Bài kiểm tra / Luyện tập</th>
                    <th className="py-2.5 px-3">Hình thức</th>
                    <th className="py-2.5 px-3">Điểm số</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ocean-700">
                        {att.assessment.subjectName || "Tin học"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">
                        {att.assessment.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            att.assessment.mode === "EXAM"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {att.assessment.mode === "EXAM" ? "Kiểm tra định kỳ" : "Luyện tập"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">
                        {att.totalScore !== null ? `${att.totalScore} / ${att.maxScore}` : "Đang làm"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
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
          )}
        </div>

        {/* Section 2: Assignment Submissions & Teacher Remarks */}
        <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-ink">
              Bài tập Dự án & Nhận xét đã duyệt của Giáo viên
            </h2>
          </div>
          {submissions.length === 0 ? (
            <p className="text-xs text-ink-muted">Chưa có dữ liệu bài tập đã nộp.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 bg-canvas/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-700">
                      {sub.assignment.subject.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
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
          )}
        </div>

        {/* Section 3: Upcoming Deadlines */}
        <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
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
                <div key={asg.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-orange-700">{asg.subject.name}</span>
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
