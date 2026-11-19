import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { parseLessonDriveLinksJson } from "@/lib/drive-url";
import { DriveMaterialList } from "@/components/materials/DriveMaterialViewer";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Gamepad2,
  FileCheck2,
  Target,
  Flame,
  ShieldAlert,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LessonPlayerPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();

  const studentProfile =
    session?.user?.id && session.role === "STUDENT" && !session.isSuperAdmin
      ? await prisma.studentProfile.findUnique({
          where: { userId: session.user.id },
          include: { schoolClass: true },
        })
      : null;

  let lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      topic: { include: { subject: true, lessons: true } },
      teacher: { include: { user: true } },
    },
  });

  if (!lesson) {
    lesson = await prisma.lesson.findFirst({
      where: studentProfile
        ? { topic: { subject: { gradeLevel: studentProfile.gradeLevel } } }
        : undefined,
      include: {
        topic: { include: { subject: true, lessons: true } },
        teacher: { include: { user: true } },
      },
    });
  }

  if (!lesson) {
    return (
      <AppShell>
        <div className="p-8 rounded-2xl bg-surface border border-slate-200 text-center space-y-4">
          <p className="text-base font-bold text-ink">
            Chưa tìm thấy bài học trong môn học này.
          </p>
          <Link
            href="/hoc-sinh/thi-diem"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ocean-600 text-white text-sm font-bold hover:bg-ocean-700"
          >
            Mở bài học thí điểm của khối em
          </Link>
        </div>
      </AppShell>
    );
  }

  const lessonGrade = lesson.topic.subject.gradeLevel;

  // Enforce grade/class scope for logged-in students
  if (studentProfile && studentProfile.gradeLevel !== lessonGrade) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-surface border border-amber-200 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 text-amber-800 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Học liệu thuộc khối lớp khác</span>
          </div>
          <p className="text-sm text-ink leading-relaxed">
            Bài học <strong>&quot;{lesson.title}&quot;</strong> thuộc chương trình{" "}
            <strong>Khối {lessonGrade}</strong>, trong khi tài khoản của em thuộc{" "}
            <strong>
              Lớp {studentProfile.schoolClass?.name || `Khối ${studentProfile.gradeLevel}`}
            </strong>
            . Hệ thống giữ đúng phạm vi học liệu theo từng lớp để tránh nhầm bài.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/hoc-sinh/thi-diem"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-ocean-600 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center hover:bg-ocean-700"
            >
              Về bài học Khối {studentProfile.gradeLevel} của em
            </Link>
            <Link
              href="/hoc-sinh/mon-hoc"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-canvas border border-slate-200 text-ink text-xs sm:text-sm font-semibold inline-flex items-center justify-center hover:bg-slate-100"
            >
              Danh sách môn học
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  let contentBlocks: any[] = [];
  try {
    contentBlocks = JSON.parse(lesson.contentBlocks);
  } catch {
    contentBlocks = [];
  }

  const objectiveBlock = contentBlocks.find((b) => b.type === "objective");
  const mainBlocks = contentBlocks.filter((b) => b.type !== "objective");
  const driveMaterials = parseLessonDriveLinksJson(lesson.driveFileLinks);

  // Find related published assessment for this grade/lesson
  const relatedAssessments = await prisma.assessment.findMany({
    where: {
      status: "PUBLISHED",
      gradeLevel: lessonGrade,
      mode: "EXAM",
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const tutorQuery = new URLSearchParams({
    grade: String(lessonGrade),
    className: studentProfile?.schoolClass?.name || `${lessonGrade}A1`,
    subject: lesson.topic.subject.name,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
  }).toString();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <Link
            href="/hoc-sinh/mon-hoc"
            className="hover:text-ocean-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Môn học</span>
          </Link>
          <span>/</span>
          <span>
            {lesson.topic.subject.name} (Khối {lessonGrade})
          </span>
          <span>/</span>
          <span className="text-ink font-semibold">{lesson.topic.name}</span>
        </div>

        {/* 12-Column Lesson Player Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-6">
              {/* Top Meta + Lesson Title + Short Objective ABOVE materials */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full">
                    Khối {lessonGrade} • Môn {lesson.topic.subject.name}
                  </span>
                  <span className="text-xs text-ink-muted">
                    Giáo viên:{" "}
                    <strong className="text-ink">
                      {lesson.teacher.user.fullName}
                    </strong>
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                  {lesson.title}
                </h1>

                {/* Mục tiêu ngắn ngay phía trên học liệu */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex items-start gap-3">
                  <Target className="w-4 h-4 text-ocean-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-ink leading-relaxed">
                    <strong className="text-ocean-900">Mục tiêu bài học: </strong>
                    {objectiveBlock?.content ||
                      `Nắm vững kiến thức trọng tâm của ${lesson.title}, vận dụng giải bài luyện tập và tự kiểm tra mức độ hiểu bài.`}
                  </div>
                </div>
              </div>

              {/* Học liệu Google Drive / Ảnh hiển thị trực tiếp ngay trong bài */}
              {driveMaterials.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-ocean-800">
                    Học liệu & Hình ảnh minh họa trong bài
                  </h2>
                  <DriveMaterialList materials={driveMaterials} />
                </div>
              )}

              {/* Lesson Content Blocks */}
              <div className="space-y-5 text-base text-ink leading-relaxed">
                {mainBlocks.map((block: any, idx: number) => {
                  if (block.type === "heading") {
                    return (
                      <h2
                        key={idx}
                        className="text-lg sm:text-xl font-bold text-ink pt-4 border-t border-slate-100"
                      >
                        {block.content}
                      </h2>
                    );
                  }
                  if (block.type === "callout") {
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-violet-50/70 border border-violet-200 flex items-start gap-3.5"
                      >
                        <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-violet-900 text-sm">
                            Gợi ý tư duy phản biện &amp; Khám phá
                          </p>
                          <p className="text-sm text-ink mt-1 leading-relaxed">
                            {block.content}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (block.type === "activity") {
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                          {block.title || "Nhiệm vụ thực hành"}
                        </span>
                        <p className="text-sm text-ink font-medium leading-relaxed">
                          {block.content}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-base text-ink leading-relaxed">
                      {block.content}
                    </p>
                  );
                })}
              </div>

              {/* Next Steps: 1. Luyện bằng trò chơi -> 2. Hỏi gia sư môn này -> 3. Bài kiểm tra liên quan */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hoạt động tiếp theo sau khi đọc học liệu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href={`/hoc-sinh/thi-diem?grade=${lessonGrade}&tab=GAME`}
                    className="min-h-[48px] p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Gamepad2 className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>1. Luyện bằng trò chơi</span>
                  </Link>

                  <Link
                    href={`/hoc-sinh/ai-tutor?${tutorQuery}`}
                    className="min-h-[48px] p-3.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Flame className="w-4 h-4 text-violet-700 shrink-0" />
                    <span>2. Hỏi gia sư môn này</span>
                  </Link>

                  <Link
                    href={`/hoc-sinh/kiem-tra?mode=EXAM&grade=${lessonGrade}&lessonTitle=${encodeURIComponent(
                      lesson.title
                    )}`}
                    className="min-h-[48px] p-3.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <FileCheck2 className="w-4 h-4 shrink-0" />
                    <span>3. Vào bài kiểm tra</span>
                  </Link>
                </div>

                {relatedAssessments.length > 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-ink flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Đề kiểm tra được giao cho Khối {lessonGrade}:{" "}
                      <strong>{relatedAssessments[0].title}</strong>
                    </span>
                    <Link
                      href={`/hoc-sinh/kiem-tra?mode=EXAM&assessmentId=${relatedAssessments[0].id}`}
                      className="font-bold text-ocean-700 hover:underline"
                    >
                      Mở đề kiểm tra ngay →
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-canvas border border-slate-200 text-xs text-ink-muted">
                    Lớp em hiện chưa có đề kiểm tra chính thức gắn riêng cho bài này. Em có thể luyện bằng trò chơi hoặc hỏi gia sư Socratic ở trên.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Syllabus Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted pb-3 border-b border-slate-100">
                Các bài học cùng chủ đề ({lesson.topic.name})
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1">{item.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-sky-700 shrink-0">
                            Đang học
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
