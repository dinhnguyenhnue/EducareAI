import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
  const [classes, trackingSheets] = await Promise.all([
    prisma.schoolClass.findMany({
      include: {
        students: {
          include: {
            user: true,
            submissions: true,
          },
        },
        academicYear: true,
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    prisma.classTrackingSheet.findMany({
      where: { spreadsheetId: { not: null } },
      select: { classId: true, spreadsheetId: true },
    }),
  ]);

  const sheetByClassId = new Map(
    trackingSheets.map((s) => [s.classId, s.spreadsheetId])
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="overview"
          badge="Lớp Chủ nhiệm & Giảng dạy"
          badgeIcon={<Users className="w-3.5 h-3.5" />}
          title="Quản lý Lớp học & Học sinh"
          description="Theo dõi danh sách học sinh, bài nộp thực tế và hồ sơ năng lực trực tiếp từ CSDL."
        />

        {classes.length === 0 ? (
          <EmptyState
            tone="overview"
            title="Chưa có dữ liệu lớp học"
            description="Nhà trường chưa tạo hoặc phân công lớp học trong hệ thống."
          />
        ) : (
          classes.map((cls) => {
            const linkedSheetId = sheetByClassId.get(cls.id) || null;
            return (
              <div
                key={cls.id}
                className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
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

                  {linkedSheetId ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Đã liên kết Google Sheets ({linkedSheetId.slice(0, 10)}...)
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-ink-muted bg-surface-muted border border-border px-2.5 py-1 rounded-full">
                      Chưa liên kết Google Workspace
                    </span>
                  )}
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
                      <th className="py-2.5 px-3">Điểm TB bài tập</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {cls.students.map((st) => {
                      const graded = st.submissions.filter(
                        (s) => s.status === "GRADED" && s.score !== null && s.score !== undefined
                      );
                      const avgScore =
                        graded.length > 0
                          ? (graded.reduce((acc, s) => acc + (s.score ?? 0), 0) / graded.length).toFixed(1)
                          : null;
                      const initials = st.user.fullName
                        .split(" ")
                        .slice(-2)
                        .map((part) => part[0] ?? "")
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={st.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-ink-muted">
                            {st.studentCode}
                          </td>
                          <td className="py-3 px-3 font-semibold text-ink flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-ocean-100 text-ocean-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {initials || "HS"}
                            </span>
                            <span>{st.user.fullName}</span>
                          </td>
                          <td className="py-3 px-3 text-ink-muted">{st.user.email}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-ocean-600">
                            {st.submissions.length} bài
                          </td>
                          <td className="py-3 px-3">
                            {avgScore !== null ? (
                              <span className="text-[11px] font-semibold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                {avgScore} / 10 ({graded.length} bài)
                              </span>
                            ) : (
                              <span className="text-[11px] text-ink-muted">Chưa có dữ liệu</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href="/hoc-sinh/ho-so-nang-luc"
                              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
                            >
                              Hồ sơ chi tiết →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

