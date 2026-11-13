import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { BookOpen } from "lucide-react";

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
        <PageHeader
          variant="card"
          tone="materials"
          badge="Curriculum & Assessment Bank"
          badgeIcon={<BookOpen className="w-3.5 h-3.5" />}
          title="Quản lý Môn học, Học liệu & Ngân hàng Đề"
          description="Danh mục môn học, chủ đề, bài giảng số và bài tập gắn Rubric 4 tiêu chí."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const lessonCount = sub.topics.reduce(
              (acc, t) => acc + t.lessons.length,
              0
            );
            return (
              <div
                key={sub.id}
                className="p-6 rounded-2xl bg-surface border border-border hover:border-sky-300 shadow-card transition-all space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <span className="text-[11px] font-mono font-bold bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full">
                      {sub.code}
                    </span>
                    <h2 className="text-base font-bold text-ink mt-1.5">
                      {sub.name} (Khối {sub.gradeLevel})
                    </h2>
                  </div>
                  <BookOpen className="w-5 h-5 text-sky-600" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-canvas border border-border">
                    <div className="font-mono font-bold text-ink text-sm">
                      {sub.topics.length}
                    </div>
                    <div className="text-[10px] text-ink-muted">Chủ đề</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-canvas border border-border">
                    <div className="font-mono font-bold text-ink text-sm">
                      {lessonCount}
                    </div>
                    <div className="text-[10px] text-ink-muted">Bài giảng</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-canvas border border-border">
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
                        className="p-2.5 rounded-xl bg-canvas border border-border/70 flex items-center justify-between"
                      >
                        <span className="font-medium text-ink truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-mono text-sky-700 font-semibold shrink-0 ml-2">
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

