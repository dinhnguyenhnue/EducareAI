import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function StudentSubjectsPage() {
  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: { lessons: true },
      },
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="materials"
          badge="Thư viện học liệu"
          badgeIcon={<BookOpen className="w-3.5 h-3.5" />}
          title="Môn học & Khóa học của em"
          description="Chương trình THCS UNIGO kết hợp lý thuyết, bài giảng tương tác và thực hành sản phẩm số."
        />

        {subjects.length === 0 ? (
          <EmptyState
            tone="materials"
            icon={<BookOpen className="w-6 h-6" />}
            title="Chưa có môn học nào"
            description="Các môn học và học liệu số sẽ xuất hiện tại đây khi nhà trường cập nhật chương trình."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((s) => {
              const totalLessons = s.topics.reduce((acc, t) => acc + t.lessons.length, 0);
              const firstLessonId = s.topics[0]?.lessons[0]?.id ?? "";
              return (
                <div
                  key={s.id}
                  className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-sky-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">
                        Khối {s.gradeLevel}
                      </span>
                      <span className="text-xs font-medium text-ink-muted">
                        {s.topics.length} Chủ đề
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-ink">{s.name}</h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Mã môn: <span className="font-mono text-sky-700 font-semibold">{s.code}</span> •{" "}
                      {totalLessons} bài học trực tuyến
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                      {s.topics.map((t) => (
                        <div key={t.id} className="text-xs">
                          <span className="font-semibold text-ink block">{t.name}</span>
                          <div className="pl-3 mt-1 space-y-1">
                            {t.lessons.map((l) => (
                              <Link
                                key={l.id}
                                href={`/hoc-sinh/mon-hoc/${l.id}`}
                                className="text-ink-muted hover:text-sky-700 flex items-center justify-between text-[11px] group py-0.5"
                              >
                                <span className="truncate group-hover:underline">• {l.title}</span>
                                <ChevronRight className="w-3 h-3 text-ink-muted group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href={firstLessonId ? `/hoc-sinh/mon-hoc/${firstLessonId}` : "/hoc-sinh/mon-hoc"}
                      className="w-full text-center block py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm"
                    >
                      Vào học chủ đề 1
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

