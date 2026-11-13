"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import {
  FileCheck2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RefreshCw,
  BookOpen,
} from "lucide-react";

interface OptionChoice {
  id: string;
  text: string;
}

interface SanitizedAssessmentItem {
  id: string;
  orderIndex: number;
  points: number;
  snapshotQuestionText: string;
  snapshotOptionsJson: string;
  snapshotObjective?: string;
}

interface AttemptAnswer {
  id: string;
  assessmentItemId: string;
  studentResponse: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  correctAnswer?: string;
  explanation?: string;
}

interface StudentAttempt {
  id: string;
  attemptNumber: number;
  idempotencyKey: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  totalScore: number | null;
  maxScore: number;
  answers: AttemptAnswer[];
}

interface AssessmentData {
  id: string;
  code: string;
  title: string;
  description: string;
  mode: "PRACTICE" | "EXAM";
  gradeLevel: number;
  lessonTitle: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  revealAnswersMode: string;
  isDemoData: boolean;
  items: SanitizedAssessmentItem[];
  attempts: StudentAttempt[];
}

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentData | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentAttempt | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tin-hoc/assessments");
      const data = await res.json();
      if (res.ok) {
        const list: AssessmentData[] = data.assessments || [];
        setAssessments(list);
        if (!selectedAssessment && list.length > 0) {
          setSelectedAssessment(list[0]);
        } else if (selectedAssessment) {
          const refreshed = list.find((a) => a.id === selectedAssessment.id);
          if (refreshed) setSelectedAssessment(refreshed);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAssessment]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Server-enforced countdown timer for active EXAM attempt
  useEffect(() => {
    if (
      !activeAttempt ||
      activeAttempt.status !== "IN_PROGRESS" ||
      !activeAttempt.expiresAt
    ) {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const diffSec = Math.max(
        0,
        Math.floor(
          (new Date(activeAttempt.expiresAt!).getTime() - Date.now()) / 1000
        )
      );
      setRemainingSeconds(diffSec);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeAttempt]);

  const handleStartOrResume = async (assessment: AssessmentData) => {
    setStatusBanner(null);
    const res = await fetch("/api/tin-hoc/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "START_ATTEMPT",
        assessmentId: assessment.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusBanner({
        type: "error",
        text: data.error || "Không thể bắt đầu lượt làm bài.",
      });
      return;
    }

    const attempt: StudentAttempt = data.attempt;
    setActiveAttempt(attempt);

    // Restore any previously auto-saved responses (Reload / Wi-Fi drop recovery!)
    const restoredMap: Record<string, string> = {};
    for (const ans of attempt.answers || []) {
      restoredMap[ans.assessmentItemId] = ans.studentResponse;
    }
    setResponses(restoredMap);

    if (data.resumed) {
      setStatusBanner({
        type: "info",
        text: "Đã khôi phục phiên làm bài đang diễn ra và các câu trả lời đã lưu tạm trên máy chủ.",
      });
    }
  };

  const handleSelectOption = async (itemId: string, optionId: string) => {
    if (!activeAttempt || activeAttempt.status !== "IN_PROGRESS") return;
    const nextResponses = { ...responses, [itemId]: optionId };
    setResponses(nextResponses);

    // Auto-save to server so reload or network drop never loses progress
    try {
      const res = await fetch("/api/tin-hoc/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AUTOSAVE_ANSWERS",
          attemptId: activeAttempt.id,
          responses: { [itemId]: optionId },
        }),
      });
      if (res.ok) {
        setAutoSaveMsg(
          `Đã tự động lưu tạm lên máy chủ lúc ${new Date().toLocaleTimeString("vi-VN")}`
        );
      }
    } catch {
      setAutoSaveMsg(
        "Mất kết nối tạm thời: Câu trả lời đang giữ trên trình duyệt, vui lòng kiểm tra mạng trước khi nộp."
      );
    }
  };

  const handleSubmitAttempt = async () => {
    if (!activeAttempt || submitting) return;
    setSubmitting(true);
    setStatusBanner(null);
    try {
      const res = await fetch("/api/tin-hoc/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_ATTEMPT",
          attemptId: activeAttempt.id,
          idempotencyKey: activeAttempt.idempotencyKey,
          responses,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "Không thể nộp bài.",
        });
        return;
      }

      setActiveAttempt(data.attempt);
      setStatusBanner({
        type: "success",
        text: `Đã nộp bài và chấm điểm trên máy chủ! Điểm đạt được: ${data.attempt.totalScore}/10.`,
      });
      await loadAssessments();
    } finally {
      setSubmitting(false);
    }
  };

  const parseOptions = (jsonStr: string): OptionChoice[] => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === "string") {
            const letter = ["A", "B", "C", "D"][idx] || String(idx + 1);
            return { id: letter, text: item };
          }
          return { id: String(item.id), text: String(item.text) };
        });
      }
    } catch {
      // ignore
    }
    return [];
  };

  return (
    <AppShell>
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        tone="assessments"
        badge="Luyện tập & Kiểm tra Tin học"
        badgeIcon={<FileCheck2 className="w-3.5 h-3.5" />}
        title="Làm Bài Luyện Tập & Kiểm Tra Định Kỳ"
        description="Phân biệt rõ chế độ Luyện tập (PRACTICE) làm nhiều lần có giải thích ngay và Kiểm tra chính thức (EXAM) giới hạn lượt làm, tính giờ máy chủ, bảo mật đáp án."
        meta={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Tính giờ & chấm điểm tại máy chủ • Tự động khôi phục khi tải lại trang
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Assessments */}
        <div className="lg:col-span-4 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Đang tải danh sách bài tập & đề kiểm tra...
            </div>
          ) : (
            assessments.map((asm) => {
              const isSelected = selectedAssessment?.id === asm.id;
              const completedCount = (asm.attempts || []).filter(
                (a) =>
                  a.status === "SUBMITTED" ||
                  a.status === "EXPIRED_AUTO_SUBMITTED"
              ).length;

              return (
                <button
                  key={asm.id}
                  type="button"
                  onClick={() => {
                    setSelectedAssessment(asm);
                    const inProg = asm.attempts?.find(
                      (a) => a.status === "IN_PROGRESS"
                    );
                    if (inProg) {
                      setActiveAttempt(inProg);
                      const map: Record<string, string> = {};
                      for (const ans of inProg.answers || []) {
                        map[ans.assessmentItemId] = ans.studentResponse;
                      }
                      setResponses(map);
                    } else {
                      setActiveAttempt(asm.attempts?.[0] || null);
                    }
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition-all space-y-2 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400/30"
                      : "border-slate-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        asm.mode === "EXAM"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {asm.mode === "EXAM"
                        ? "ĐỀ KIỂM TRA (EXAM)"
                        : "BÀI LUYỆN TẬP (PRACTICE)"}
                    </span>
                    {asm.isDemoData && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        DỮ LIỆU MẪU
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {asm.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>{asm.items?.length || 0} câu hỏi</span>
                    <span>•</span>
                    <span>
                      {asm.timeLimitMinutes
                        ? `${asm.timeLimitMinutes} phút`
                        : "Không giới hạn giờ"}
                    </span>
                    <span>•</span>
                    <span>
                      Đã nộp: {completedCount}/
                      {asm.maxAttempts === 0 ? "∞" : asm.maxAttempts} lượt
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Assessment Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAssessment ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              {/* Top Info & Start/Timer Bar */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedAssessment.mode === "EXAM"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {selectedAssessment.mode === "EXAM"
                        ? "Chế độ Kiểm tra chính thức (Bảo mật đáp án)"
                        : "Chế độ Tự luyện (Phản hồi & giải thích ngay)"}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedAssessment.title}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {selectedAssessment.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {activeAttempt?.status === "IN_PROGRESS" &&
                    remainingSeconds !== null && (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ocean-950 text-white text-xs font-bold">
                        <Clock className="w-4 h-4 text-sky-400" />
                        Thời gian máy chủ còn:{" "}
                        {Math.floor(remainingSeconds / 60)}:
                        {String(remainingSeconds % 60).padStart(2, "0")}
                      </div>
                    )}

                  {(!activeAttempt ||
                    activeAttempt.status !== "IN_PROGRESS") && (
                    <button
                      type="button"
                      onClick={() => handleStartOrResume(selectedAssessment)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] transition-all text-white shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      {selectedAssessment.attempts?.length
                        ? "Làm lượt mới"
                        : "Bắt đầu làm bài"}
                    </button>
                  )}
                </div>
              </div>

              {statusBanner && (
                <div
                  className={`rounded-xl p-3.5 text-xs font-medium border ${
                    statusBanner.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : statusBanner.type === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-sky-50 border-sky-200 text-sky-900"
                  }`}
                >
                  {statusBanner.text}
                </div>
              )}

              {autoSaveMsg && activeAttempt?.status === "IN_PROGRESS" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 text-ocean-600" />
                  <span>{autoSaveMsg}</span>
                </div>
              )}

              {/* Questions List */}
              {activeAttempt ? (
                <div className="space-y-4">
                  {selectedAssessment.items.map((item, idx) => {
                    const options = parseOptions(item.snapshotOptionsJson);
                    const submittedAns = activeAttempt.answers?.find(
                      (a) => a.assessmentItemId === item.id
                    );
                    const chosen =
                      activeAttempt.status === "IN_PROGRESS"
                        ? responses[item.id]
                        : submittedAns?.studentResponse;
                    const isSubmitted = activeAttempt.status !== "IN_PROGRESS";

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-slate-900">
                            Câu {idx + 1}: {item.snapshotQuestionText}
                          </div>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">
                            {item.points} điểm
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {options.map((opt) => {
                            const isSelected = chosen === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() =>
                                  handleSelectOption(item.id, opt.id)
                                }
                                className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "border-ocean-600 bg-ocean-50 text-ocean-950 font-semibold"
                                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                }`}
                              >
                                <span>
                                  <strong>{opt.id}.</strong> {opt.text.replace(/^[A-D]\.\s*/, "")}
                                </span>
                                {isSelected && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-ocean-600 text-white">
                                    Đã chọn
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Server-graded Feedback (Shown after submission) */}
                        {isSubmitted && submittedAns && (
                          <div
                            className={`rounded-xl p-3.5 text-xs border ${
                              submittedAns.isCorrect
                                ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                                : "bg-rose-50/80 border-rose-200 text-rose-900"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {submittedAns.isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                  Chính xác (+{submittedAns.earnedPoints} điểm)
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-700" />
                                  Chưa chính xác (Phương án đã chọn:{" "}
                                  {submittedAns.studentResponse || "Chưa chọn"})
                                </>
                              )}
                            </div>

                            {submittedAns.correctAnswer && (
                              <p className="mt-1">
                                <strong>Đáp án đúng:</strong>{" "}
                                {submittedAns.correctAnswer}
                              </p>
                            )}
                            {submittedAns.explanation && (
                              <p className="mt-1 flex items-start gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Giải thích kiến thức:</strong>{" "}
                                  {submittedAns.explanation}
                                </span>
                              </p>
                            )}
                            {!submittedAns.correctAnswer &&
                              selectedAssessment.mode === "EXAM" && (
                                <p className="mt-1 text-slate-600">
                                  Đề kiểm tra đang mở cho cả lớp nên hệ thống bảo mật đáp án chi tiết cho tới khi Giáo viên đóng kỳ kiểm tra.
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeAttempt.status === "IN_PROGRESS" && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmitAttempt}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] transition-all text-white disabled:opacity-50 shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                        {submitting
                          ? "Đang nộp & chấm điểm trên máy chủ..."
                          : "Nộp bài chính thức (Chống nộp trùng Idempotent)"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                  Nhấn nút <strong>&quot;Bắt đầu làm bài&quot;</strong> ở góc trên bên phải để máy chủ khởi tạo phiên làm bài.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </AppShell>
  );
}

