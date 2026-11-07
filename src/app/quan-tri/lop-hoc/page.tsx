import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Layers, Users, Calendar, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const academicYears = await prisma.academicYear.findMany({
    orderBy: { startYear: "desc" },
  });

  const classes = await prisma.schoolClass.findMany({
    include: {
      academicYear: true,
      homeroomTeacher: { include: { user: true } },
      students: { include: { user: true } },
      assignments: true,
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">
                Quản lý Năm học, Khối & Lớp học
              </h1>
              <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                Academic Structure
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Danh sách các khối lớp thực tế trong CSDL (Năm học{" "}
              {academicYears[0]?.name || "2026-2027"}).
            </p>
          </div>

          <Link
            href="/quan-tri/nguoi-dung"
            className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập thêm học sinh từ Excel</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[6, 7, 8].map((grade) => {
            const gradeClasses = classes.filter((c) => c.gradeLevel === grade);
            const totalStudents = gradeClasses.reduce(
              (acc, c) => acc + c.students.length,
              0
            );
            return (
              <div
                key={grade}
                className="p-5 rounded-panel bg-surface border border-border shadow-card"
              >
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Khối {grade} THCS</span>
                  <Layers className="w-4 h-4 text-brand-teal" />
                </div>
                <div className="text-2xl font-bold text-ink mt-2 font-mono">
                  {gradeClasses.length} lớp • {totalStudents} học sinh
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  Lớp:{" "}
                  {gradeClasses.map((c) => c.name).join(", ") ||
                    "Chưa có lớp"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-panel bg-surface border border-border shadow-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-border text-ink font-bold">
                <th className="py-3 px-4">Tên Lớp</th>
                <th className="py-3 px-4">Khối</th>
                <th className="py-3 px-4">Năm học</th>
                <th className="py-3 px-4">Giáo viên Chủ nhiệm</th>
                <th className="py-3 px-4">Sĩ số thực tế (CSDL)</th>
                <th className="py-3 px-4">Bài tập đã giao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/50">
                  <td className="py-3.5 px-4 font-bold text-brand-teal">
                    Lớp {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-ink">Khối {c.gradeLevel}</td>
                  <td className="py-3.5 px-4 font-mono text-ink-muted">
                    {c.academicYear.name}
                  </td>
                  <td className="py-3.5 px-4 text-ink">
                    {c.homeroomTeacher?.user.fullName || "Chưa phân công"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-ink">
                    {c.students.length} học sinh
                  </td>
                  <td className="py-3.5 px-4 font-mono text-ink-muted">
                    {c.assignments.length} bài tập
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

