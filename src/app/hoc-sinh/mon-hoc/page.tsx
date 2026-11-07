import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { BookOpen, ChevronRight, FileText, CheckCircle2, Layers } from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-bold text-ink">Môn học & Khóa học của em</h1>
          <p className="text-xs text-ink-muted mt-1">
            Chương trình THCS UNIGO kết hợp lý thuyết, bài giảng tương tác và thực hành sản phẩm số.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((s) => {
            const totalLessons = s.topics.reduce((acc, t) => acc + t.lessons.length, 0);
            return (
              <div
                key={s.id}
                className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                      Khối {s.gradeLevel}
                    </span>
                    <span className="text-xs text-ink-muted">{s.topics.length} Chủ đề</span>
                  </div>

                  <h3 className="text-lg font-bold text-ink">{s.name}</h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Mã môn: <span className="font-mono">{s.code}</span> • {totalLessons} bài học trực tuyến
                  </p>

                  <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
                    {s.topics.map((t) => (
                      <div key={t.id} className="text-xs">
                        <span className="font-medium text-ink block">{t.name}</span>
                        <div className="pl-3 mt-1 space-y-1">
                          {t.lessons.map((l) => (
                            <Link
                              key={l.id}
                              href={`/hoc-sinh/mon-hoc/${l.id}`}
                              className="text-ink-muted hover:text-brand-teal flex items-center justify-between text-[11px] group"
                            >
                              <span className="truncate group-hover:underline">• {l.title}</span>
                              <ChevronRight className="w-3 h-3 text-ink-muted group-hover:text-brand-teal shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/80">
                  <Link
                    href={`/hoc-sinh/mon-hoc/${s.topics[0]?.lessons[0]?.id ?? ""}`}
                    className="w-full text-center block py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
                  >
                    Vào học chủ đề 1
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

