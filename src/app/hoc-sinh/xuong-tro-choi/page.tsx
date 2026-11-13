"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import {
  SAMPLE_QUIZ_10_GAME_HTML,
  SAMPLE_SIMULATION_3_TASKS_HTML,
} from "@/lib/html-game-sandbox";

const SandboxedHtmlGamePlayer = dynamic(
  () => import("@/components/game/SandboxedHtmlGamePlayer"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[530px] rounded-2xl border border-indigo-200 bg-indigo-50/40 animate-pulse flex items-center justify-center text-xs font-semibold text-indigo-700">
        Đang khởi tạo Sandbox trò chơi HTML cô lập...
      </div>
    ),
  }
);
import {
  Gamepad2,
  Code2,
  ShieldCheck,
  MessageSquare,
  Flag,
  Send,
  Upload,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface ProjectVersionItem {
  id: string;
  versionNumber: number;
  changelog: string | null;
  htmlSourceCode: string;
  fileSizeBytes: number;
  status: string;
  teacherFeedback: string | null;
  createdAt: string;
}

interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface ProjectItem {
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
  aiToolsUsed: string;
  studentContribution: string;
  status: string;
  approvedVersionId: string | null;
  currentVersionNum: number;
  playCount: number;
  isDemoData: boolean;
  versions: ProjectVersionItem[];
  comments: CommentItem[];
}

export default function StudentGameStudioPage() {
  const [activeTab, setActiveTab] = useState<"LIBRARY" | "MY_STUDIO">("LIBRARY");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [myProjects, setMyProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Comment & Report state
  const [commentText, setCommentText] = useState("");
  const [commentMsg, setCommentMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("LOI_KIEN_THUC");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatusMsg, setReportStatusMsg] = useState<string | null>(null);

  // Studio submission form state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("Bài 14: Thuật toán tìm kiếm tuần tự");
  const [learningObjective, setLearningObjective] = useState(
    "Giúp học sinh hiểu từng bước chạy của thuật toán và phân biệt đúng/sai."
  );
  const [gameType, setGameType] = useState<"QUIZ_10" | "SIMULATION_3_TASKS">("QUIZ_10");
  const [howToPlay, setHowToPlay] = useState(
    "Nhấn Bắt đầu, chọn phương án trả lời cho từng câu hỏi và đọc giải thích chi tiết."
  );
  const [knowledgeSummary, setKnowledgeSummary] = useState(
    "Tóm tắt nguyên lý hoạt động của thuật toán theo SGK Tin học 7."
  );
  const [referenceSources, setReferenceSources] = useState(
    "SGK Tin học 7 - Kết nối tri thức với cuộc sống (Trang 71 - 74)"
  );
  const [aiToolsUsed, setAiToolsUsed] = useState(
    "Sử dụng Gem 'TIN HỌC SÁNG TẠO' của giáo viên để tạo khung HTML/CSS cơ bản."
  );
  const [studentContribution, setStudentContribution] = useState(
    "Tự biên soạn và kiểm chứng lại bộ câu hỏi theo SGK, tự đổi màu giao diện và kiểm thử nút Chơi lại."
  );
  const [changelog, setChangelog] = useState("Phiên bản v1 hoàn chỉnh");
  const [htmlSourceCode, setHtmlSourceCode] = useState(SAMPLE_QUIZ_10_GAME_HTML);
  const [showPreviewSandbox, setShowPreviewSandbox] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tin-hoc/projects?mode=STUDENT_VIEW");
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
        setMyProjects(data.myProjects || []);
        if (!selectedProject && data.projects?.length > 0) {
          setSelectedProject(data.projects[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((p) => {
    if (gradeFilter !== "ALL" && String(p.gradeLevel) !== gradeFilter) return false;
    if (typeFilter !== "ALL" && p.gameType !== typeFilter) return false;
    return true;
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !commentText.trim()) return;
    setCommentMsg(null);
    const res = await fetch("/api/tin-hoc/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_COMMENT",
        projectId: selectedProject.id,
        content: commentText,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCommentMsg(data.error || "Không thể gửi bình luận.");
      return;
    }
    setCommentText("");
    setCommentMsg("Đã gửi bình luận văn bản thuần an toàn.");
    const updatedComments = [data.comment, ...(selectedProject.comments || [])];
    setSelectedProject({ ...selectedProject, comments: updatedComments });
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !reportDetails.trim()) return;
    const res = await fetch("/api/tin-hoc/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REPORT_CONTENT",
        projectId: selectedProject.id,
        reason: reportReason,
        details: reportDetails,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setReportStatusMsg(data.error || "Không thể gửi báo cáo.");
      return;
    }
    setReportDetails("");
    setReportStatusMsg("Đã gửi báo cáo tới Giáo viên để kiểm tra.");
    setTimeout(() => {
      setShowReportModal(false);
      setReportStatusMsg(null);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setSubmitStatus({
        type: "error",
        text: "Chỉ chấp nhận duy nhất 1 tệp .html tự chứa (không nhận file nén .zip hoặc .js rời).",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || "");
      setHtmlSourceCode(content);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleSaveOrSubmitProject = async (submitForReview: boolean) => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch("/api/tin-hoc/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_PROJECT_OR_VERSION",
          projectId: editingProjectId || undefined,
          title,
          lessonTitle,
          learningObjective,
          gameType,
          howToPlay,
          knowledgeSummary,
          referenceSources,
          aiToolsUsed,
          studentContribution,
          htmlSourceCode,
          changelog,
          submitForReview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitStatus({
          type: "error",
          text: data.error || "Không thể lưu sản phẩm.",
        });
        return;
      }
      setSubmitStatus({
        type: "success",
        text:
          data.message ||
          (submitForReview
            ? "Đã gửi sản phẩm sang trạng thái CHỜ GIÁO VIÊN DUYỆT (PENDING_REVIEW)."
            : "Đã lưu bản nháp (DRAFT) thành công."),
      });
      setEditingProjectId(null);
      await loadProjects();
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingExistingProject = (proj: ProjectItem) => {
    setEditingProjectId(proj.id);
    setTitle(proj.title);
    setLessonTitle(proj.lessonTitle);
    setLearningObjective(proj.learningObjective);
    setGameType(
      proj.gameType === "SIMULATION_3_TASKS" ? "SIMULATION_3_TASKS" : "QUIZ_10"
    );
    setHowToPlay(proj.howToPlay);
    setKnowledgeSummary(proj.knowledgeSummary);
    setReferenceSources(proj.referenceSources);
    setAiToolsUsed(proj.aiToolsUsed);
    setStudentContribution(proj.studentContribution);
    setChangelog(`Cập nhật phiên bản v${proj.currentVersionNum + 1}`);
    if (proj.versions?.[0]?.htmlSourceCode) {
      setHtmlSourceCode(proj.versions[0].htmlSourceCode);
    }
    setActiveTab("MY_STUDIO");
  };

  return (
    <AppShell>
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        tone="games"
        badge="Cổng học tập Tin học – Xưởng sáng tạo trò chơi"
        badgeIcon={<Gamepad2 className="w-3.5 h-3.5" />}
        title="Thư Viện Trò Chơi HTML & Xưởng Sáng Tạo Học Sinh"
        description="Khám phá các trò chơi trắc nghiệm (tối thiểu 10 câu có giải thích) và mô phỏng thuật toán (tối thiểu 3 nhiệm vụ) đã được Giáo viên kiểm duyệt, hoặc tự sáng tạo sản phẩm HTML của riêng em cùng trợ lý AI."
        meta={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Thực thi trong Sandbox cô lập
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/hoc-sinh/sang-tao-cung-ai"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              Mở 8 Prompt & Gem Sáng tạo AI
            </Link>
            <button
              type="button"
              onClick={() =>
                setActiveTab(activeTab === "LIBRARY" ? "MY_STUDIO" : "LIBRARY")
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] text-white transition-all shadow-sm"
            >
              <Code2 className="w-4 h-4" />
              {activeTab === "LIBRARY"
                ? "Xưởng của em & Nộp trò chơi HTML"
                : "Quay lại Thư viện Trò chơi đã duyệt"}
            </button>
          </div>
        }
      />

      {/* Mode Switch Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("LIBRARY")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "LIBRARY"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Thư viện Trò chơi Đã Duyệt ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("MY_STUDIO")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "MY_STUDIO"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Sản phẩm của em & Gửi duyệt HTML ({myProjects.length})
        </button>
      </div>

      {activeTab === "LIBRARY" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Approved Game List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bộ lọc Thư viện (Chỉ hiển thị sản phẩm Đã Duyệt)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Tất cả khối lớp</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7 (Lớp 7A1)</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Mọi thể loại</option>
                  <option value="QUIZ_10">Trắc nghiệm (&ge;10 câu)</option>
                  <option value="SIMULATION_3_TASKS">Mô phỏng (&ge;3 nhiệm vụ)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Đang tải danh sách trò chơi đã duyệt...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Chưa có trò chơi nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((proj) => {
                  const isSelected = selectedProject?.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-400/30"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                          {proj.gameType === "QUIZ_10"
                            ? "Trắc nghiệm >= 10 câu"
                            : "Mô phỏng >= 3 nhiệm vụ"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          Lớp {proj.className}
                        </span>
                        {proj.isDemoData && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                            DỮ LIỆU MẪU
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {proj.lessonTitle} • Tác giả: {proj.displayAuthorName}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Isolated Sandbox Player + Details + Safe Comments */}
          <div className="lg:col-span-8 space-y-5">
            {selectedProject && selectedProject.versions?.[0] ? (
              <>
                <SandboxedHtmlGamePlayer
                  title={selectedProject.title}
                  htmlSourceCode={selectedProject.versions[0].htmlSourceCode}
                  slug={selectedProject.slug}
                  versionNumber={selectedProject.versions[0].versionNumber}
                  authorName={selectedProject.displayAuthorName}
                  className={selectedProject.className}
                  height={530}
                />

                {/* Pedagogical & AI Transparency Metadata Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedProject.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bài học: <strong>{selectedProject.lessonTitle}</strong> • Nguồn đối chiếu:{" "}
                        <strong>{selectedProject.referenceSources}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Báo cáo lỗi / nội dung
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                        Hướng dẫn cách chơi & Mục tiêu học tập
                      </div>
                      <p className="text-slate-700">{selectedProject.howToPlay}</p>
                      <p className="text-slate-600">
                        <strong>Mục tiêu:</strong> {selectedProject.learningObjective}
                      </p>
                    </div>

                    <div className="rounded-xl bg-violet-50/60 p-3.5 border border-violet-200 space-y-1.5">
                      <div className="font-semibold text-violet-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        Minh bạch sử dụng AI & Đóng góp của học sinh
                      </div>
                      <p className="text-slate-700">
                        <strong>Công cụ AI hỗ trợ:</strong> {selectedProject.aiToolsUsed}
                      </p>
                      <p className="text-slate-700">
                        <strong>Phần tự làm & kiểm chứng:</strong>{" "}
                        {selectedProject.studentContribution}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safe Plain-Text Comments Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      Nhận xét & Góp ý học tập ({selectedProject.comments?.length || 0})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Chỉ hiển thị văn bản thuần an toàn • Không có nhắn tin riêng
                    </span>
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Viết nhận xét xây dựng về kiến thức hoặc gợi ý cải tiến trò chơi..."
                      maxLength={400}
                      className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/20"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-ocean-600 hover:bg-ocean-700 text-white transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi
                    </button>
                  </form>

                  {commentMsg && (
                    <p className="text-xs font-medium text-emerald-700">{commentMsg}</p>
                  )}

                  <div className="space-y-2.5">
                    {(selectedProject.comments || []).map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">
                            {c.authorName} ({c.authorRole === "TEACHER" ? "Giáo viên" : "Học sinh"})
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-slate-700">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Chọn một trò chơi ở cột bên trái để bắt đầu chơi trong khung Sandbox cô lập.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: MY STUDIO & SUBMIT HTML GAME */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* My Projects & Versions History */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Sản phẩm của em ({myProjects.length})
              </h3>
              <p className="text-xs text-slate-600">
                Lưu ý: Khi em gửi phiên bản cập nhật mới (v2), phiên bản v1 đã duyệt trước đó vẫn được giữ trên Thư viện cho tới khi Giáo viên duyệt bản v2.
              </p>

              {myProjects.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Em chưa gửi sản phẩm nào. Hãy dùng biểu mẫu bên phải để tạo trò chơi đầu tiên!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {myProjects.map((mp) => {
                    const latestVer = mp.versions?.[0];
                    return (
                      <div
                        key={mp.id}
                        className="rounded-lg border border-slate-200 p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {mp.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              mp.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : mp.status === "PENDING_REVIEW"
                                ? "bg-amber-100 text-amber-800"
                                : mp.status === "NEEDS_REVISION"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {mp.status}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Phiên bản mới nhất: <strong>v{mp.currentVersionNum}</strong> (
                          {latestVer?.status})
                        </p>
                        {latestVer?.teacherFeedback && (
                          <div className="rounded bg-amber-50 border border-amber-200 p-2 text-amber-900">
                            <strong>Nhận xét của Giáo viên:</strong>{" "}
                            {latestVer.teacherFeedback}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditingExistingProject(mp)}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                          Sửa / Nộp phiên bản mới (v{mp.currentVersionNum + 1})
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Submit / Edit Form */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingProjectId
                      ? "Cập Nhật Phiên Bản Mới Cho Trò Chơi"
                      : "Đăng Ký & Gửi Duyệt Trò Chơi HTML Tự Chứa"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Định dạng hỗ trợ: Duy nhất 1 tệp HTML tự chứa (HTML + CSS + JS nội tuyến, dung lượng &le; 256 KB, không gọi CDN ngoài).
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGameType("QUIZ_10");
                      setHtmlSourceCode(SAMPLE_QUIZ_10_GAME_HTML);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Nạp mẫu Quiz 10 câu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGameType("SIMULATION_3_TASKS");
                      setHtmlSourceCode(SAMPLE_SIMULATION_3_TASKS_HTML);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Nạp mẫu Mô phỏng 3 nhiệm vụ
                  </button>
                </div>
              </div>

              {submitStatus && (
                <div
                  className={`rounded-xl p-3.5 text-xs font-medium flex items-center gap-2 border ${
                    submitStatus.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  {submitStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  )}
                  <span>{submitStatus.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên trò chơi học tập *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Thử thách Tìm kiếm nhị phân Lớp 7"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loại hình trò chơi (Theo chuẩn Mục 6) *
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) =>
                      setGameType(
                        e.target.value === "SIMULATION_3_TASKS"
                          ? "SIMULATION_3_TASKS"
                          : "QUIZ_10"
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="QUIZ_10">
                      Trò chơi Trắc nghiệm (Tối thiểu 10 câu hỏi + giải thích)
                    </option>
                    <option value="SIMULATION_3_TASKS">
                      Trò chơi Mô phỏng / Thực hành (Tối thiểu 3 nhiệm vụ tăng dần)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bài học / Chủ đề SGK *
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nguồn kiến thức đối chiếu (SGK, trang) *
                  </label>
                  <input
                    type="text"
                    value={referenceSources}
                    onChange={(e) => setReferenceSources(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mục tiêu học tập *
                  </label>
                  <textarea
                    rows={2}
                    value={learningObjective}
                    onChange={(e) => setLearningObjective(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hướng dẫn cách chơi *
                  </label>
                  <textarea
                    rows={2}
                    value={howToPlay}
                    onChange={(e) => setHowToPlay(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khai báo công cụ AI (Gem/Gemini...) đã hỗ trợ *
                  </label>
                  <textarea
                    rows={2}
                    value={aiToolsUsed}
                    onChange={(e) => setAiToolsUsed(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phần em tự chỉnh sửa, biên soạn & kiểm thử *
                  </label>
                  <textarea
                    rows={2}
                    value={studentContribution}
                    onChange={(e) => setStudentContribution(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* HTML Source Code Input or File Upload */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Mã nguồn 1 tệp HTML tự chứa (&lt;!DOCTYPE html&gt; ... &lt;/html&gt;) *
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Tải tệp .html từ máy tính
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={htmlSourceCode}
                  onChange={(e) => setHtmlSourceCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewSandbox((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50"
                >
                  <Eye className="w-4 h-4" />
                  {showPreviewSandbox
                    ? "Ẩn khung chạy thử Sandbox"
                    : "Chạy thử trong Sandbox cô lập trước khi nộp"}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveOrSubmitProject(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    Lưu bản nháp (DRAFT)
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveOrSubmitProject(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] transition-all text-white disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Gửi Giáo viên duyệt (PENDING_REVIEW)
                  </button>
                </div>
              </div>
            </div>

            {showPreviewSandbox && (
              <SandboxedHtmlGamePlayer
                title={title || "Bản xem trước trong Sandbox cô lập"}
                htmlSourceCode={htmlSourceCode}
                showSecurityInspector={true}
                height={480}
              />
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Báo cáo vấn đề cho Giáo viên: {selectedProject.title}
            </h3>
            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do báo cáo
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="LOI_KIEN_THUC">
                    Sai kiến thức SGK hoặc đáp án chưa chính xác
                  </option>
                  <option value="LOI_KY_THUAT">
                    Lỗi kỹ thuật (không bấm được nút, kẹt màn hình)
                  </option>
                  <option value="NOI_DUNG_KHONG_PHU_HOP">
                    Ngôn từ hoặc nội dung không phù hợp học đường
                  </option>
                  <option value="VI_PHAM_BAN_QUYEN">
                    Nghi ngờ sao chép chưa ghi nguồn
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết vị trí lỗi
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="VD: Ở câu số 4, giải thích ghi nhầm trang SGK..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              {reportStatusMsg && (
                <p className="text-emerald-700 font-semibold">{reportStatusMsg}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-600 text-white"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}

