"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import SandboxedHtmlGamePlayer from "@/components/game/SandboxedHtmlGamePlayer";
import {
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  EyeOff,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Code2,
  History,
  FileWarning,
} from "lucide-react";

interface VersionItem {
  id: string;
  versionNumber: number;
  changelog: string | null;
  htmlSourceCode: string;
  fileSizeBytes: number;
  staticScanJson: string;
  status: string;
  teacherFeedback: string | null;
  reviewedByName: string | null;
  createdAt: string;
}

interface ReportItem {
  id: string;
  reporterName: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
}

interface ProjectModerationItem {
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
  isDemoData: boolean;
  versions: VersionItem[];
  reports?: ReportItem[];
}

interface ModerationLogItem {
  id: string;
  moderatorName: string;
  targetType: string;
  action: string;
  reason: string | null;
  createdAt: string;
}

export default function TeacherGameModerationPage() {
  const [projects, setProjects] = useState<ProjectModerationItem[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLogItem[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<ProjectModerationItem | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    null
  );
  const [feedback, setFeedback] = useState("");
  const [showRawCode, setShowRawCode] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadModerationData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tin-hoc/projects?mode=MODERATION");
      const data = await res.json();
      if (res.ok) {
        const list: ProjectModerationItem[] = data.projects || [];
        setProjects(list);
        setModerationLogs(data.moderationLogs || []);
        if (list.length > 0) {
          const targetProj =
            list.find((p) => p.id === selectedProject?.id) || list[0];
          setSelectedProject(targetProj);
          setSelectedVersion(targetProj.versions?.[0] || null);
        } else {
          setSelectedProject(null);
          setSelectedVersion(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    loadModerationData();
  }, [loadModerationData]);

  const handleModerate = async (
    decision: "APPROVE" | "REQUEST_REVISION" | "HIDE" | "RESTORE_VERSION",
    versionId?: string
  ) => {
    if (!selectedProject) return;
    setStatusBanner(null);
    const res = await fetch("/api/tin-hoc/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "MODERATE_PROJECT",
        projectId: selectedProject.id,
        versionId: versionId || selectedVersion?.id,
        decision,
        feedback,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFeedback("");
      setStatusBanner(
        `Đã thực thi quyết định kiểm duyệt [${decision}] và lưu vào Nhật ký kiểm duyệt.`
      );
      await loadModerationData();
    } else {
      setStatusBanner(data.error || "Lỗi kiểm duyệt.");
    }
  };

  const handleDemoDataAction = async (
    action: "PURGE_DEMO_DATA" | "RESTORE_DEMO_DATA"
  ) => {
    setStatusBanner(null);
    const res = await fetch("/api/tin-hoc/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      if (action === "PURGE_DEMO_DATA") {
        setStatusBanner(
          `Đã xóa riêng dữ liệu mẫu thử nghiệm: ${data.deletedQuestions} câu hỏi mẫu, ${data.deletedAssessments} đề mẫu, ${data.deletedProjects} trò chơi mẫu. Dữ liệu thật được bảo toàn nguyên vẹn!`
        );
      } else {
        setStatusBanner(
          `Đã khôi phục bộ dữ liệu mẫu thử nghiệm Lớp 7A1 (${data.questionsCount} câu hỏi, ${data.assessmentsCount} đề, ${data.projectsCount} trò chơi).`
        );
      }
      await loadModerationData();
    }
  };

  return (
    <AppShell>
    <div className="space-y-6">
      {/* Header & 1-Click Purge Demo Data Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              KIỂM DUYỆT TRÒ CHƠI HTML & QUẢN TRỊ DỮ LIỆU MẪU
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Trung Tâm Kiểm Duyệt Xưởng Trò Chơi & Phiên Bản
          </h1>
          <p className="text-sm text-slate-600">
            Kiểm tra mã tĩnh, chạy thử sản phẩm học sinh trong khung Sandbox cô lập trước khi công bố. Hỗ trợ duyệt phiên bản mới hoặc khôi phục về phiên bản ổn định trước đó.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDemoDataAction("RESTORE_DEMO_DATA")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục dữ liệu mẫu Lớp 7A1
          </button>
          <button
            type="button"
            onClick={() => handleDemoDataAction("PURGE_DEMO_DATA")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa riêng dữ liệu mẫu thử nghiệm
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-semibold text-teal-900">
          {statusBanner}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Student Projects */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Danh sách sản phẩm học sinh ({projects.length})
          </div>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Đang tải danh sách sản phẩm...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Không có sản phẩm nào (Dữ liệu mẫu đã được xóa sạch). Nhấn &quot;Khôi phục dữ liệu mẫu Lớp 7A1&quot; nếu muốn nạp lại bộ thử nghiệm.
            </div>
          ) : (
            projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              const hasPendingVersion = proj.versions?.some(
                (v) => v.status === "PENDING_REVIEW"
              );
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => {
                    setSelectedProject(proj);
                    setSelectedVersion(proj.versions?.[0] || null);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all space-y-1.5 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        proj.status === "APPROVED"
                          ? "bg-teal-100 text-teal-800"
                          : proj.status === "PENDING_REVIEW"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {proj.status}
                    </span>
                    {hasPendingVersion && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-950">
                        Có bản mới chờ duyệt
                      </span>
                    )}
                    {proj.isDemoData && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">
                        DỮ LIỆU MẪU
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Tác giả: {proj.displayAuthorName} (Lớp {proj.className}) •{" "}
                    {proj.versions?.length || 0} phiên bản
                  </p>
                </button>
              );
            })
          )}

          {/* Moderation Log Audit Trail */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-teal-700" />
              Nhật ký kiểm duyệt gần nhất
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {moderationLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-700"
                >
                  <div className="font-bold text-slate-900">
                    [{log.action}] • {log.moderatorName}
                  </div>
                  <div className="text-slate-600">{log.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Moderation Inspector & Sandbox Player */}
        <div className="lg:col-span-8 space-y-4">
          {selectedProject && selectedVersion ? (
            <>
              {/* Version Selector & Moderation Actions Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedProject.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đang kiểm tra phiên bản:{" "}
                      <strong>v{selectedVersion.versionNumber}</strong> (Trạng thái:{" "}
                      <strong>{selectedVersion.status}</strong>) • Phiên bản đang hiển thị công khai:{" "}
                      <strong>
                        {selectedProject.approvedVersionId
                          ? `v${
                              selectedProject.versions.find(
                                (v) =>
                                  v.id === selectedProject.approvedVersionId
                              )?.versionNumber || 1
                            }`
                          : "Chưa có"}
                      </strong>
                    </p>
                  </div>

                  {/* Version Pills */}
                  <div className="flex items-center gap-1.5">
                    {selectedProject.versions.map((ver) => {
                      const isLive =
                        ver.id === selectedProject.approvedVersionId;
                      return (
                        <button
                          key={ver.id}
                          type="button"
                          onClick={() => setSelectedVersion(ver)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                            selectedVersion.id === ver.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          v{ver.versionNumber} ({ver.status})
                          {isLive ? " [Đang công khai]" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Usage & Student Contribution Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-slate-800">
                      Khai báo công cụ AI:
                    </strong>
                    <p className="text-slate-600 mt-0.5">
                      {selectedProject.aiToolsUsed}
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-800">
                      Đóng góp & tự chỉnh sửa của học sinh:
                    </strong>
                    <p className="text-slate-600 mt-0.5">
                      {selectedProject.studentContribution}
                    </p>
                  </div>
                </div>

                {/* Teacher Feedback & Action Buttons */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét kiểm duyệt hoặc yêu cầu học sinh chỉnh sửa..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleModerate("APPROVE", selectedVersion.id)
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Duyệt công khai v{selectedVersion.versionNumber}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleModerate("REQUEST_REVISION", selectedVersion.id)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Yêu cầu sửa lại v{selectedVersion.versionNumber}
                      </button>

                      {selectedVersion.status === "APPROVED" &&
                        selectedProject.approvedVersionId !==
                          selectedVersion.id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleModerate(
                                "RESTORE_VERSION",
                                selectedVersion.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Khôi phục hiển thị về v{selectedVersion.versionNumber}
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => handleModerate("HIDE")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <EyeOff className="w-4 h-4" />
                        Tạm ẩn ngay
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRawCode((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <Code2 className="w-4 h-4" />
                      {showRawCode ? "Ẩn mã nguồn HTML" : "Soi mã nguồn HTML"}
                    </button>
                  </div>
                </div>
              </div>

              {showRawCode && (
                <pre className="rounded-xl border border-slate-800 bg-slate-950 text-teal-300 p-4 text-xs font-mono max-h-72 overflow-y-auto whitespace-pre-wrap">
                  {selectedVersion.htmlSourceCode}
                </pre>
              )}

              {/* Isolated Sandbox Player with Static Scan Inspector Enabled */}
              <SandboxedHtmlGamePlayer
                title={`${selectedProject.title} (Kiểm thử v${selectedVersion.versionNumber})`}
                htmlSourceCode={selectedVersion.htmlSourceCode}
                slug={selectedProject.slug}
                versionNumber={selectedVersion.versionNumber}
                authorName={selectedProject.displayAuthorName}
                className={selectedProject.className}
                showSecurityInspector={true}
                height={520}
              />

              {/* Reports for this Project */}
              {selectedProject.reports && selectedProject.reports.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <FileWarning className="w-4 h-4" />
                    Báo cáo nội dung từ học sinh ({selectedProject.reports.length})
                  </h3>
                  {selectedProject.reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-lg bg-white border border-rose-200 p-2.5 text-xs text-slate-800"
                    >
                      <strong>[{rep.reason}]</strong> {rep.details} —{" "}
                      <span className="text-slate-500">
                        Báo cáo bởi {rep.reporterName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
    </AppShell>
  );
}

