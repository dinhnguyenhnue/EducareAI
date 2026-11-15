"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui";
import {
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";

export function TeacherGradingWorkspace({
  initialSubmissions,
}: {
  initialSubmissions: any[];
}) {
  const { pushToast } = useToast();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string>(
    initialSubmissions[0]?.id || ""
  );

  const selectedSub =
    submissions.find((s) => s.id === selectedId) || submissions[0];

  // Rubric Scores State
  const [crit1, setCrit1] = useState<number>(2.5);
  const [crit2, setCrit2] = useState<number>(2.5);
  const [crit3, setCrit3] = useState<number>(2.0);
  const [crit4, setCrit4] = useState<number>(1.0);
  const [comment, setComment] = useState<string>(
    selectedSub?.teacherComment || ""
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [sheetsSyncMsg, setSheetsSyncMsg] = useState<string | null>(null);

  const totalScore = Math.min(
    10,
    Number((crit1 + crit2 + crit3 + crit4).toFixed(1))
  );

  const handleExportToGoogleSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncMsg(null);
    setActionError(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_SHEETS" }),
      });
      const data = await res.json();
      if (res.ok) {
        const msg =
          data.message || "Đã đồng bộ bảng điểm sang Google Sheets thành công.";
        setSheetsSyncMsg(msg);
        pushToast({
          variant: "success",
          title: "Đồng bộ Google Sheets hoàn tất",
          description: msg,
        });
      } else {
        const errText =
          data.error ||
          data.message ||
          "Không thể đồng bộ Google Sheets lúc này. Vui lòng kiểm tra kết nối.";
        setActionError(errText);
        pushToast({
          variant: "error",
          title: "Không thể đồng bộ Google Sheets",
          description: errText,
        });
      }
    } catch {
      const netErr =
        "Không thể kết nối máy chủ khi đồng bộ Google Sheets. Vui lòng thử lại.";
      setActionError(netErr);
      pushToast({
        variant: "error",
        title: "Lỗi kết nối mạng",
        description: netErr,
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleGenerateAISuggestion = () => {
    const studentName = selectedSub?.student?.user?.fullName || "Học sinh";
    const suggestion = `Giáo viên đánh giá rất cao tinh thần tự nghiên cứu và tính sáng tạo của em ${studentName}. Sản phẩm có bố cục mạch lạc và truyền tải đúng thông điệp an toàn số. Về phần tự đánh giá, em đã nhìn nhận rất khách quan. Em hãy tiếp tục phát huy ở dự án tiếp theo nhé!`;
    setComment(suggestion);
  };

  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    setIsSaving(true);
    setActionError(null);
    try {
      const res = await fetch("/api/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          score: totalScore,
          teacherComment: comment,
          rubricScores: {
            crit_1: crit1,
            crit_2: crit2,
            crit_3: crit3,
            crit_4: crit4,
          },
          gradedBy: "Giáo viên bộ môn",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSavedSuccess(true);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === selectedSub.id
              ? {
                  ...s,
                  score: totalScore,
                  teacherComment: comment,
                  status: "GRADED",
                }
              : s
          )
        );
        pushToast({
          variant: "success",
          title: "Đã lưu kết quả chấm bài",
          description: `Đã cập nhật điểm ${totalScore}/10 cho học sinh ${selectedSub.student?.user?.fullName || ""}.`,
        });
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        const errText =
          data.error ||
          "Không thể lưu kết quả chấm điểm. Vui lòng kiểm tra quyền phụ trách lớp hoặc thử lại.";
        setActionError(errText);
        pushToast({
          variant: "error",
          title: "Lưu kết quả chấm thất bại",
          description: errText,
        });
      }
    } catch {
      const netErr =
        "Lỗi kết nối máy chủ khi lưu điểm. Vui lòng kiểm tra mạng và thử lại.";
      setActionError(netErr);
      pushToast({
        variant: "error",
        title: "Lỗi kết nối",
        description: netErr,
      });
    } finally {
      setIsSaving(false);
    }
  };

  let attachments = [];
  try {
    if (selectedSub?.attachments) {
      attachments = JSON.parse(selectedSub.attachments);
    }
  } catch {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Submissions Queue (4 cols) */}
      <div className="lg:col-span-4 bg-surface rounded-panel border border-border shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-bold text-ink uppercase tracking-wide">
            Danh sách bài nộp ({submissions.length})
          </span>
          <span className="text-[11px] text-ink-muted">Tất cả lớp phụ trách</span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[620px]">
          {submissions.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-ink-muted bg-canvas/60 rounded-xl border border-dashed border-border">
              Chưa có bài nộp nào cần chấm trong lớp phụ trách.
            </div>
          ) : (
            submissions.map((sub) => {
            const isSelected = sub.id === selectedSub?.id;
            const isGraded = sub.status === "GRADED";
            return (
              <button
                key={sub.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedId(sub.id);
                  setComment(sub.teacherComment || "");
                  setActionError(null);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs transition-colors flex flex-col gap-1 border ${
                  isSelected
                    ? "bg-orange-50 border-orange-400 font-semibold text-orange-800 shadow-xs"
                    : "bg-canvas border-border text-ink hover:bg-surface-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold truncate">
                    {sub.student.user.fullName}
                  </span>
                  {isGraded ? (
                    <span className="font-mono tabular-nums font-bold text-status-success shrink-0">
                      {sub.score}/10
                    </span>
                  ) : (
                    <span className="text-[10px] text-status-warning font-semibold bg-status-warning-soft px-1.5 py-0.5 rounded shrink-0">
                      Chờ chấm
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-muted truncate">
                  {sub.assignment.title}
                </p>
                <span className="text-[10px] text-ink-muted/80 tabular-nums">
                  Nộp: {new Date(sub.submittedAt).toLocaleTimeString("vi-VN")}
                </span>
              </button>
            );
          })
          )}
        </div>
      </div>

      {/* Grading Workspace (8 cols) */}
      <div className="lg:col-span-8 bg-surface rounded-panel border border-border shadow-card p-6 space-y-6">
        {selectedSub ? (
          <>
            {/* Student & Assignment Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">
                    {selectedSub.student.user.fullName}
                  </h2>
                  <span className="text-xs bg-canvas border border-border px-2 py-0.5 rounded text-ink-muted font-mono">
                    Lớp {selectedSub.student.schoolClass?.name ?? "7A1"} • Mã HS:{" "}
                    {selectedSub.student.studentCode}
                  </span>
                </div>
                <p className="text-xs text-orange-700 font-medium mt-0.5">
                  Bài tập: {selectedSub.assignment.title}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-ink-muted">Điểm tổng kết:</span>
                <span className="text-2xl font-mono tabular-nums font-extrabold text-ocean-600">
                  {totalScore}
                  <span className="text-xs text-ink-muted font-normal">
                    {" "}
                    / 10
                  </span>
                </span>
              </div>
            </div>

            {actionError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-status-danger-soft border border-red-200 text-status-danger text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{actionError}</span>
              </div>
            )}

            {/* Submission Content & Attachments */}
            <div className="p-4 rounded-xl bg-canvas border border-border space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wide block">
                Nội dung bài làm & Thuyết minh:
              </span>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-line text-pretty">
                {selectedSub.content || "(Không có nội dung văn bản)"}
              </p>

              {attachments.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Tệp đính kèm:
                  </span>
                  {attachments.map((att: any, i: number) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ocean-600 hover:underline font-medium mr-2"
                    >
                      <span>{att.title || "Mở tệp Google Drive"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Rubric Evaluation Form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Đánh giá theo 4 Tiêu chí Rubric</span>
                </h3>
                <span className="text-[11px] text-ink-muted font-mono tabular-nums">
                  Thang điểm 10.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Criterion 1 */}
                <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <label htmlFor="rubric-crit-1">
                      1. Tính chính xác & khoa học (30%)
                    </label>
                    <span className="font-mono tabular-nums text-ocean-600">
                      {crit1} / 3.0
                    </span>
                  </div>
                  <input
                    id="rubric-crit-1"
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={crit1}
                    onChange={(e) => setCrit1(parseFloat(e.target.value))}
                    className="w-full accent-ocean-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Thông tin chính xác, logic, có căn cứ.
                  </p>
                </div>

                {/* Criterion 2 */}
                <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <label htmlFor="rubric-crit-2">
                      2. Tính sáng tạo & thẩm mỹ (30%)
                    </label>
                    <span className="font-mono tabular-nums text-ocean-600">
                      {crit2} / 3.0
                    </span>
                  </div>
                  <input
                    id="rubric-crit-2"
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={crit2}
                    onChange={(e) => setCrit2(parseFloat(e.target.value))}
                    className="w-full accent-ocean-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Bố cục bắt mắt, thể hiện độc đáo.
                  </p>
                </div>

                {/* Criterion 3 */}
                <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <label htmlFor="rubric-crit-3">
                      3. Ứng dụng thực tiễn & phản biện (25%)
                    </label>
                    <span className="font-mono tabular-nums text-ocean-600">
                      {crit3} / 2.5
                    </span>
                  </div>
                  <input
                    id="rubric-crit-3"
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={crit3}
                    onChange={(e) => setCrit3(parseFloat(e.target.value))}
                    className="w-full accent-ocean-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Giải quyết tình huống thực tế trong học tập.
                  </p>
                </div>

                {/* Criterion 4 */}
                <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <label htmlFor="rubric-crit-4">
                      4. Tự đánh giá & trách nhiệm (15%)
                    </label>
                    <span className="font-mono tabular-nums text-ocean-600">
                      {crit4} / 1.5
                    </span>
                  </div>
                  <input
                    id="rubric-crit-4"
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={crit4}
                    onChange={(e) => setCrit4(parseFloat(e.target.value))}
                    className="w-full accent-ocean-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Học sinh tự nhận xét trung thực.
                  </p>
                </div>
              </div>
            </div>

            {/* Teacher Pedagogical Feedback & AI Suggestion Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="grading-teacher-comment"
                  className="text-xs font-bold text-ink uppercase tracking-wide"
                >
                  Lời nhận xét sư phạm của Giáo viên:
                </label>

                <button
                  type="button"
                  onClick={handleGenerateAISuggestion}
                  className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200/70 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Gợi ý nhận xét</span>
                </button>
              </div>

              <textarea
                id="grading-teacher-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập lời nhận xét khích lệ, chỉ ra điểm mạnh và định hướng hoàn thiện tiếp theo..."
                className="w-full p-3.5 bg-canvas border border-border rounded-xl text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 leading-relaxed placeholder:text-ink-muted/70"
              />
            </div>

            {/* Actions */}
            {sheetsSyncMsg && (
              <div
                role="status"
                className="p-3 rounded-xl bg-status-success-soft text-status-success text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sheetsSyncMsg}</span>
              </div>
            )}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              {savedSuccess ? (
                <span
                  role="status"
                  className="text-sm font-semibold text-status-success flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Đã lưu điểm chính thức vào bảng Grade & cập nhật cho học
                    sinh!
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleExportToGoogleSheets}
                  disabled={isSyncingSheets}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-canvas hover:bg-cyan-50 border border-border text-ink text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingSheets
                    ? "Đang đồng bộ Sheets..."
                    : "Xuất bảng điểm sang Google Sheets (batchUpdate)"}
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveGrade}
                disabled={isSaving}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-ocean-600 text-white text-sm font-semibold hover:bg-ocean-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Đang lưu..." : "Phê duyệt & Lưu điểm"}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-ink-muted">
            Chọn một bài nộp ở danh sách bên trái để chấm điểm.
          </div>
        )}
      </div>
    </div>
  );
}
