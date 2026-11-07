import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { BookOpen, FileText, CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: { lessons: true },
        orderBy: { orderIndex: "asc" },
      },
      assignments: true,
    },
    orderBy: { code: "asc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              Quản lý Môn học, Học liệu & Ngân hàng Đề
            </h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Curriculum & Assessment Bank
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Danh mục môn học, chủ đề, bài giảng số và bài tập gắn Rubric 4 tiêu chí.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const lessonCount = sub.topics.reduce(
              (acc, t) => acc + t.lessons.length,
              0
            );
            return (
              <div
                key={sub.id}
                className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <span className="text-[11px] font-mono font-bold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h2 className="text-base font-bold text-ink mt-1.5">
                      {sub.name} (Khối {sub.gradeLevel})
                    </h2>
                  </div>
                  <BookOpen className="w-5 h-5 text-brand-teal" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-canvas border border-border">
                    <div className="font-mono font-bold text-ink text-sm">
                      {sub.topics.length}
                    </div>
                    <div className="text-[10px] text-ink-muted">Chủ đề</div>
                  </div>
                  <div className="p-2.5 rounded bg-canvas border border-border">
                    <div className="font-mono font-bold text-ink text-sm">
                      {lessonCount}
                    </div>
                    <div className="text-[10px] text-ink-muted">Bài giảng</div>
                  </div>
                  <div className="p-2.5 rounded bg-canvas border border-border">
                    <div className="font-mono font-bold text-ink text-sm">
                      {sub.assignments.length}
                    </div>
                    <div className="text-[10px] text-ink-muted">Bài tập</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-ink-muted uppercase text-[10px]">
                    Danh sách chủ đề:
                  </span>
                  {sub.topics.length === 0 ? (
                    <p className="text-ink-muted italic">
                      Chưa có chủ đề được tạo cho môn học này.
                    </p>
                  ) : (
                    sub.topics.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded bg-canvas border border-border/70 flex items-center justify-between"
                      >
                        <span className="font-medium text-ink truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-mono text-brand-teal shrink-0 ml-2">
                          {t.lessons.length} bài
                        </span>
                      </div>
                    ))
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

