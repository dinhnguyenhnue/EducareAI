"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SandboxedHtmlGamePlayer from "@/components/game/SandboxedHtmlGamePlayer";
import { BookOpen, ShieldCheck, ExternalLink } from "lucide-react";

interface EmbeddedProjectData {
  id: string;
  slug: string;
  title: string;
  displayAuthorName: string;
  className: string;
  gradeLevel: number;
  lessonTitle: string;
  learningObjective: string;
  gameType: string;
  howToPlay: string;
  knowledgeSummary: string;
  referenceSources: string;
  isDemoData: boolean;
  approvedVersion: {
    id: string;
    versionNumber: number;
    htmlSourceCode: string;
    fileSizeBytes: number;
  };
}

export default function EmbedGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [project, setProject] = useState<EmbeddedProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tin-hoc/projects?slug=${encodeURIComponent(slug)}&mode=EMBED`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không thể tải trò chơi.");
        }
        setProject(data.project);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">
            Đang khởi tạo khung Sandbox cô lập cho trò chơi...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center space-y-3">
          <p className="text-base font-semibold text-rose-400">
            Không thể mở trò chơi nhúng
          </p>
          <p className="text-sm text-slate-400">
            {error || "Trò chơi chưa được duyệt hoặc đường dẫn không tồn tại."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-5 flex flex-col gap-3">
      {/* Header Bar for Google Sites Embed & Standalone Window */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-sky-300 border border-sky-700/70">
              CỔNG HỌC TẬP TIN HỌC • KHỐI {project.gradeLevel}
            </span>
            {project.isDemoData && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800">
                DỮ LIỆU MẪU THỬ NGHIỆM
              </span>
            )}
            <span className="text-xs text-slate-400">
              Tác giả: {project.displayAuthorName} (Lớp {project.className})
            </span>
          </div>
          <h1 className="text-base md:text-lg font-bold text-white mt-1">
            {project.title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bài học: {project.lessonTitle} • Nguồn: {project.referenceSources}
          </p>
        </div>

        <a
          href={`/embed/tro-choi/${project.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ocean-600 hover:bg-ocean-700 text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở trong tab mới (Dự phòng Google Sites)
        </a>
      </div>

      {/* Isolated Sandbox Player */}
      <SandboxedHtmlGamePlayer
        title={project.title}
        htmlSourceCode={project.approvedVersion.htmlSourceCode}
        slug={project.slug}
        versionNumber={project.approvedVersion.versionNumber}
        authorName={project.displayAuthorName}
        className={project.className}
        height={560}
      />

      {/* Footer Pedagogical Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            Hướng dẫn cách chơi & Mục tiêu cần đạt
          </div>
          <p className="text-slate-300 leading-relaxed">{project.howToPlay}</p>
          <p className="text-slate-400 mt-1">
            <strong>Mục tiêu:</strong> {project.learningObjective}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kiến thức cốt lõi & Cơ chế cô lập bảo mật
          </div>
          <p className="text-slate-300 leading-relaxed">
            {project.knowledgeSummary}
          </p>
          <p className="text-slate-500 mt-1">
            Trò chơi chạy trong khung cô lập <code>sandbox=&quot;allow-scripts&quot;</code>{" "}
            không có <code>allow-same-origin</code> và chặn kết nối mạng ngoài bằng CSP.
          </p>
        </div>
      </div>
    </div>
  );
}

