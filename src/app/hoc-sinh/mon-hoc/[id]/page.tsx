import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LessonPlayerPage({ params }: Props) {
  const { id } = await params;

  let lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      topic: { include: { subject: true, lessons: true } },
      teacher: { include: { user: true } },
    },
  });

  if (!lesson) {
    lesson = await prisma.lesson.findFirst({
      include: {
        topic: { include: { subject: true, lessons: true } },
        teacher: { include: { user: true } },
      },
    });
  }

  if (!lesson) {
    return (
      <AppShell>
        <div className="p-8 text-center">Không tìm thấy bài học.</div>
      </AppShell>
    );
  }

  let contentBlocks = [];
  try {
    contentBlocks = JSON.parse(lesson.contentBlocks);
  } catch (e) {
    contentBlocks = [];
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link href="/hoc-sinh/mon-hoc" className="hover:text-sky-700 font-medium flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Môn học</span>
          </Link>
          <span>/</span>
          <span>{lesson.topic.subject.name}</span>
          <span>/</span>
          <span className="text-ink font-semibold">{lesson.topic.name}</span>
        </div>

        {/* 12-Column Asymmetric Lesson Player Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-8 rounded-2xl bg-surface border border-slate-200 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full">
                  Bài học chính thức • Chuẩn THCS UNIGO
                </span>
                <span className="text-xs text-ink-muted">
                  Giảng viên: <strong className="text-ink">{lesson.teacher.user.fullName}</strong>
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-ink mt-4 tracking-tight">
                {lesson.title}
              </h1>

              {/* Lesson 4-Phases Content Blocks */}
              <div className="mt-8 space-y-6 text-sm text-ink leading-relaxed">
                {contentBlocks.map((block: any, idx: number) => {
                  if (block.type === "heading") {
                    return (
                      <h3
                        key={idx}
                        className="text-lg font-bold text-ink pt-4 border-t border-slate-100"
                      >
                        {block.content}
                      </h3>
                    );
                  }
                  if (block.type === "callout") {
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 flex items-start gap-3"
                      >
                        <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-violet-800 text-xs">
                            Gợi ý tư duy phản biện Tổ THCS
                          </p>
                          <p className="text-xs text-ink mt-1">{block.content}</p>
                        </div>
                      </div>
                    );
                  }
                  if (block.type === "activity") {
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-sky-50/50 border border-sky-200 space-y-2"
                      >
                        <span className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          {block.title || "Nhiệm vụ thực hành"}
                        </span>
                        <p className="text-xs text-ink font-medium leading-relaxed">
                          {block.content}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-ink leading-relaxed">
                      {block.content}
                    </p>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Em đã hoàn thành phần lý thuyết bài này</span>
                </div>

                <Link
                  href="/hoc-sinh/bai-tap"
                  className="px-5 py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm text-center"
                >
                  Chuyển sang làm bài tập thực hành →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar / Syllabus Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Syllabus */}
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted pb-3 border-b border-slate-100">
                Nội dung cùng chủ đề
              </h3>
              <div className="mt-4 space-y-2">
                {lesson.topic.lessons.map((item) => {
                  const isCurrent = item.id === lesson.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/hoc-sinh/mon-hoc/${item.id}`}
                      className={`block p-3 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? "bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs"
                          : "text-ink hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="line-clamp-1">{item.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-sky-700">
                            Đang học
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Google Drive Learning Materials */}
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted pb-2 border-b border-slate-100">
                Tài liệu Google Drive đính kèm
              </h3>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 text-xs text-ink transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Phiếu thực hành Tin học 7.pdf</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-sky-700" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

