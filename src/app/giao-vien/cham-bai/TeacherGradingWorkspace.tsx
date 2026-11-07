"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  Clock,
  User,
  Award,
} from "lucide-react";

export function TeacherGradingWorkspace({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string>(
    initialSubmissions[0]?.id || ""
  );

  const selectedSub = submissions.find((s) => s.id === selectedId) || submissions[0];

  // Rubric Scores State
  const [crit1, setCrit1] = useState<number>(2.5);
  const [crit2, setCrit2] = useState<number>(2.5);
  const [crit3, setCrit3] = useState<number>(2.0);
  const [crit4, setCrit4] = useState<number>(1.0);
  const [comment, setComment] = useState<string>(selectedSub?.teacherComment || "");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [sheetsSyncMsg, setSheetsSyncMsg] = useState<string | null>(null);

  const totalScore = Math.min(10, Number((crit1 + crit2 + crit3 + crit4).toFixed(1)));

  const handleExportToGoogleSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncMsg(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_SHEETS" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSheetsSyncMsg(data.message);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleGenerateAISuggestion = () => {
    const studentName = selectedSub?.student?.user?.fullName || "Học sinh";
    const suggestion = `Thầy đánh giá rất cao tinh thần tự nghiên cứu và tính sáng tạo của em ${studentName}. Sản phẩm có bố cục mạch lạc và truyền tải đúng thông điệp an toàn số. Về phần tự đánh giá, em đã nhìn nhận rất khách quan. Em hãy tiếp tục phát huy ở dự án tiếp theo nhé!`;
    setComment(suggestion);
  };

  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    setIsSaving(true);
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
          gradedBy: "Thầy Trần Minh Tuấn",
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        // update local state
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === selectedSub.id
              ? { ...s, score: totalScore, teacherComment: comment, status: "GRADED" }
              : s
          )
        );
        setTimeout(() => setSavedSuccess(false), 2000);
      } else {
        alert("Có lỗi khi lưu kết quả chấm.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối.");
    } finally {
      setIsSaving(false);
    }
  };

  let attachments = [];
  try {
    if (selectedSub?.attachments) {
      attachments = JSON.parse(selectedSub.attachments);
    }
  } catch (e) {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Submissions Queue (4 cols) */}
      <div className="lg:col-span-4 bg-surface rounded-panel border border-border shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-bold text-ink uppercase tracking-wide">
            Danh sách bài nộp ({submissions.length})
          </span>
          <span className="text-[11px] text-ink-muted">Tất cả lớp 7A1</span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[620px]">
          {submissions.map((sub) => {
            const isSelected = sub.id === selectedSub?.id;
            const isGraded = sub.status === "GRADED";
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedId(sub.id);
                  setComment(sub.teacherComment || "");
                }}
                className={`w-full p-3 rounded-button text-left text-xs transition-colors flex flex-col gap-1 border ${
                  isSelected
                    ? "bg-brand-teal-soft border-brand-teal font-semibold text-brand-teal"
                    : "bg-canvas border-border text-ink hover:bg-surface-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{sub.student.user.fullName}</span>
                  {isGraded ? (
                    <span className="font-mono font-bold text-status-success">
                      {sub.score}/10
                    </span>
                  ) : (
                    <span className="text-[10px] text-status-warning font-semibold bg-status-warning-soft px-1.5 py-0.2 rounded">
                      Chờ chấm
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-muted truncate">{sub.assignment.title}</p>
                <span className="text-[10px] text-ink-muted/80">
                  Nộp: {new Date(sub.submittedAt).toLocaleTimeString("vi-VN")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grading Workspace (8 cols) */}
      <div className="lg:col-span-8 bg-surface rounded-panel border border-border shadow-card p-6 space-y-6">
        {selectedSub ? (
          <>
            {/* Student & Assignment Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">
                    {selectedSub.student.user.fullName}
                  </h2>
                  <span className="text-xs bg-canvas border border-border px-2 py-0.5 rounded text-ink-muted">
                    Lớp {selectedSub.student.schoolClass?.name ?? "7A1"} • Mã HS: {selectedSub.student.studentCode}
                  </span>
                </div>
                <p className="text-xs text-brand-teal font-medium mt-0.5">
                  Bài tập: {selectedSub.assignment.title}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Điểm tổng kết:</span>
                <span className="text-2xl font-mono font-extrabold text-brand-teal">
                  {totalScore}
                  <span className="text-xs text-ink-muted font-normal"> / 10</span>
                </span>
              </div>
            </div>

            {/* Submission Content & Attachments */}
            <div className="p-4 rounded-panel bg-canvas border border-border space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wide block">
                Nội dung bài làm & Thuyết minh:
              </span>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-line">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded text-xs text-brand-teal hover:underline font-medium"
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
                  <Award className="w-4 h-4 text-brand-teal" />
                  <span>Đánh giá theo 4 Tiêu chí Rubric</span>
                </h3>
                <span className="text-[11px] text-ink-muted">Thang điểm 10.0</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Criterion 1 */}
                <div className="p-3.5 rounded-panel bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <span>1. Tính chính xác & khoa học (30%)</span>
                    <span className="font-mono text-brand-teal">{crit1} / 3.0</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={crit1}
                    onChange={(e) => setCrit1(parseFloat(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                  <p className="text-[10px] text-ink-muted">Thông tin chính xác, logic, có căn cứ.</p>
                </div>

                {/* Criterion 2 */}
                <div className="p-3.5 rounded-panel bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <span>2. Tính sáng tạo & thẩm mỹ (30%)</span>
                    <span className="font-mono text-brand-teal">{crit2} / 3.0</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={crit2}
                    onChange={(e) => setCrit2(parseFloat(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                  <p className="text-[10px] text-ink-muted">Bố cục bắt mắt, thể hiện độc đáo.</p>
                </div>

                {/* Criterion 3 */}
                <div className="p-3.5 rounded-panel bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <span>3. Ứng dụng thực tiễn & phản biện (25%)</span>
                    <span className="font-mono text-brand-teal">{crit3} / 2.5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={crit3}
                    onChange={(e) => setCrit3(parseFloat(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                  <p className="text-[10px] text-ink-muted">Giải quyết tình huống thực tế UNIGO.</p>
                </div>

                {/* Criterion 4 */}
                <div className="p-3.5 rounded-panel bg-canvas border border-border space-y-2">
                  <div className="flex justify-between font-bold text-ink">
                    <span>4. Tự đánh giá & trách nhiệm (15%)</span>
                    <span className="font-mono text-brand-teal">{crit4} / 1.5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={crit4}
                    onChange={(e) => setCrit4(parseFloat(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                  <p className="text-[10px] text-ink-muted">Học sinh tự nhận xét trung thực.</p>
                </div>
              </div>
            </div>

            {/* Teacher Pedagogical Feedback & AI Suggestion Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink uppercase tracking-wide">
                  Lời nhận xét sư phạm của Giáo viên:
                </label>

                <button
                  type="button"
                  onClick={handleGenerateAISuggestion}
                  className="px-2.5 py-1 rounded bg-brand-teal-soft text-brand-teal hover:bg-brand-teal-soft/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Gợi ý nhận xét</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập lời nhận xét khích lệ, chỉ ra điểm mạnh và định hướng hoàn thiện tiếp theo..."
                className="w-full p-3 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-brand-teal leading-relaxed"
              />
            </div>

            {/* Actions */}
            {sheetsSyncMsg && (
              <div className="p-3 rounded bg-status-success-soft text-status-success text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sheetsSyncMsg}</span>
              </div>
            )}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-status-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã lưu điểm chính thức vào bảng Grade & cập nhật cho học sinh!</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleExportToGoogleSheets}
                  disabled={isSyncingSheets}
                  className="px-3.5 py-2 rounded-button bg-canvas hover:bg-surface-muted border border-border text-ink text-xs font-semibold transition-colors"
                >
                  {isSyncingSheets
                    ? "Đang đồng bộ Sheets..."
                    : "Xuất bảng điểm sang Google Sheets (batchUpdate)"}
                </button>
              )}

              <button
                onClick={handleSaveGrade}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
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

