import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, CheckCircle2, ChevronRight, Award, Mail } from "lucide-react";

export default async function TeacherClassesPage() {
  const classes = await prisma.schoolClass.findMany({
    include: {
      students: {
        include: {
          user: true,
          submissions: true,
        },
      },
      academicYear: true,
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Quản lý Lớp học & Học sinh</h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Lớp Chủ nhiệm & Giảng dạy
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Theo dõi danh sách học sinh, tình trạng tham gia học tập và hồ sơ năng lực của từng em.
          </p>
        </div>

        {classes.map((cls) => (
          <div
            key={cls.id}
            className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-panel bg-brand-teal-soft flex items-center justify-center font-bold text-brand-teal">
                  {cls.name}
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Lớp {cls.name} • Khối {cls.gradeLevel}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Năm học: {cls.academicYear.name} • Sĩ số: {cls.students.length} học sinh
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-status-success bg-status-success-soft px-2.5 py-1 rounded">
                Đã đồng bộ Google Classroom
              </span>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-canvas text-ink font-bold">
                    <th className="py-2.5 px-3">Mã HS</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Email trường</th>
                    <th className="py-2.5 px-3">Bài tập đã nộp</th>
                    <th className="py-2.5 px-3">Năng lực tự học</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cls.students.map((st) => (
                    <tr key={st.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-ink-muted">
                        {st.studentCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-ink flex items-center gap-2">
                        <img
                          src={st.user.avatarUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"}
                          alt={st.user.fullName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{st.user.fullName}</span>
                      </td>
                      <td className="py-3 px-3 text-ink-muted">{st.user.email}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-brand-teal">
                        {st.submissions.length} bài
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-status-success bg-status-success-soft px-2 py-0.5 rounded">
                          Tốt (88%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`/hoc-sinh/ho-so-nang-luc`}
                          className="text-xs font-semibold text-brand-teal hover:underline"
                        >
                          Hồ sơ chi tiết →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

