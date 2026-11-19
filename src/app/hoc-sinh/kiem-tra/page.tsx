"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  AlertCircle,
  ArrowLeft,
  Flame,
  ClipboardList,
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
  status?: string;
  gradeLevel: number;
  lessonTitle: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  revealAnswersMode: string;
  isDemoData: boolean;
  items: SanitizedAssessmentItem[];
  attempts: StudentAttempt[];
}

function StudentAssessmentsContent() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get("mode");
  const requestedAssessmentId = searchParams.get("assessmentId");
  const contextLessonTitle = searchParams.get("lessonTitle");
  const contextGrade = searchParams.get("grade");

  const [modeFilter, setModeFilter] = useState<"EXAM" | "PRACTICE" | "ALL">(
    initialModeParam === "PRACTICE"
      ? "PRACTICE"
      : initialModeParam === "EXAM"
      ? "EXAM"
      : "EXAM"
  );
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    requestedAssessmentId
  );
  const selectedIdRef = useRef<string | null>(requestedAssessmentId);
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const syncSelectedAttemptState = useCallback((asm: AssessmentData | null) => {
    if (!asm) {
      setActiveAttempt(null);
      setResponses({});
      return;
    }
    const inProg = asm.attempts?.find((a) => a.status === "IN_PROGRESS");
    if (inProg) {
      setActiveAttempt(inProg);
      const map: Record<string, string> = {};
      for (const ans of inProg.answers || []) {
        map[ans.assessmentItemId] = ans.studentResponse;
      }
      setResponses(map);
      setStatusBanner({
        type: "info",
        text: `Đã khôi phục lượt làm bài #${inProg.attemptNumber} đang diễn ra cùng các câu trả lời đã lưu.`,
      });
    } else {
      setActiveAttempt(asm.attempts?.[0] || null);
      setResponses({});
    }
  }, []);

  // Stable loadAssessments without object dependency -> stops calling API once data settles
  const loadAssessments = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/tin-hoc/assessments");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(
          data.error || "Không thể tải danh sách bài kiểm tra. Vui lòng thử lại."
        );
        return;
      }
      const list: AssessmentData[] = data.assessments || [];
      setAssessments(list);

      const currentId = selectedIdRef.current;
      let target =
        (currentId && list.find((a) => a.id === currentId)) || null;
      if (!target) {
        const modeMatches = list.filter((a) =>
          initialModeParam === "PRACTICE"
            ? a.mode === "PRACTICE"
            : a.mode === "EXAM"
        );
        target = modeMatches[0] || list[0] || null;
      }
      if (target) {
        selectedIdRef.current = target.id;
        setSelectedId(target.id);
        syncSelectedAttemptState(target);
      }
    } catch {
      setFetchError(
        "Không thể kết nối tới máy chủ để tải đề kiểm tra. Em hãy kiểm tra mạng và bấm Thử lại."
      );
    } finally {
      setLoading(false);
    }
  }, [initialModeParam, syncSelectedAttemptState]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const filteredAssessments = useMemo(() => {
    if (modeFilter === "ALL") return assessments;
    return assessments.filter((a) => a.mode === modeFilter);
  }, [assessments, modeFilter]);

  const selectedAssessment = useMemo(() => {
    return (
      filteredAssessments.find((a) => a.id === selectedId) ||
      filteredAssessments[0] ||
      null
    );
  }, [filteredAssessments, selectedId]);

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

    const restoredMap: Record<string, string> = {};
    for (const ans of attempt.answers || []) {
      restoredMap[ans.assessmentItemId] = ans.studentResponse;
    }
    setResponses(restoredMap);

    if (data.resumed) {
      setStatusBanner({
        type: "info",
        text: `Đã khôi phục lượt làm bài #${attempt.attemptNumber} đang diễn ra trên máy chủ.`,
      });
    } else {
      setStatusBanner({
        type: "info",
        text: `Đã bắt đầu lượt làm bài thứ ${attempt.attemptNumber}.`,
      });
    }
  };

  const handleSelectOption = async (itemId: string, optionId: string) => {
    if (!activeAttempt || activeAttempt.status !== "IN_PROGRESS") return;
    const nextResponses = { ...responses, [itemId]: optionId };
    setResponses(nextResponses);

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
          `Đã lưu tạm câu trả lời lúc ${new Date().toLocaleTimeString("vi-VN")}`
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
      const scoreVal =
        data.attempt.totalScore !== null && data.attempt.totalScore !== undefined
          ? data.attempt.totalScore
          : 0;
      setStatusBanner({
        type: "success",
        text: `Đã nộp bài thành công (Lượt #${data.attempt.attemptNumber})! Điểm đạt được: ${scoreVal}/${
          data.attempt.maxScore || 10
        }.`,
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

  const completedAttemptsOfSelected = useMemo(() => {
    if (!selectedAssessment) return [];
    return (selectedAssessment.attempts || []).filter(
      (a) =>
        a.status === "SUBMITTED" || a.status === "EXPIRED_AUTO_SUBMITTED"
    );
  }, [selectedAssessment]);

  const canStartNewAttempt = useMemo(() => {
    if (!selectedAssessment) return false;
    if (selectedAssessment.maxAttempts === 0) return true;
    return completedAttemptsOfSelected.length < selectedAssessment.maxAttempts;
  }, [selectedAssessment, completedAttemptsOfSelected]);

  return (
    <div className="space-y-6">
      <PageHeader
        tone="assessments"
        badge={
          contextLessonTitle
            ? `Từ bài học: ${contextLessonTitle}`
            : "Luyện tập & Kiểm tra"
        }
        badgeIcon={<FileCheck2 className="w-3.5 h-3.5" />}
        title={
          modeFilter === "EXAM"
            ? "Đề Kiểm Tra Được Giao (Chế độ Kiểm tra)"
            : modeFilter === "PRACTICE"
            ? "Bài Tự Luyện Tập (Chế độ Luyện tập)"
            : "Tất cả Đề Kiểm Tra & Bài Luyện Tập"
        }
        description="Phân biệt rõ: Đề Kiểm tra (EXAM) tính giờ, giới hạn lượt làm; Bài Tự luyện (PRACTICE) ôn tập nhiều lần có giải thích ngay; Bài tập & Nộp bài dùng để nộp sản phẩm/tệp."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={
                contextGrade
                  ? `/hoc-sinh/thi-diem?grade=${contextGrade}`
                  : "/hoc-sinh/thi-diem"
              }
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-canvas border border-slate-200 text-xs font-bold text-ink hover:bg-slate-100 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại học bài</span>
            </Link>
            <Link
              href="/hoc-sinh/bai-tap"
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-canvas border border-slate-200 text-xs font-bold text-ink hover:bg-slate-100 inline-flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5 text-ocean-600" />
              <span>Sang Bài tập & Nộp bài</span>
            </Link>
          </div>
        }
      />

      {/* Mode Switcher Tabs: EXAM vs PRACTICE vs ALL */}
      <div
        role="tablist"
        aria-label="Chọn chế độ Kiểm tra hoặc Luyện tập"
        className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-surface border border-slate-200 shadow-xs"
      >
        {(
          [
            {
              id: "EXAM" as const,
              label: `Đề kiểm tra được giao (${
                assessments.filter((a) => a.mode === "EXAM").length
              })`,
            },
            {
              id: "PRACTICE" as const,
              label: `Bài tự luyện (${
                assessments.filter((a) => a.mode === "PRACTICE").length
              })`,
            },
            {
              id: "ALL" as const,
              label: `Tất cả (${assessments.length})`,
            },
          ] as const
        ).map((tab) => {
          const isActive = modeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setModeFilter(tab.id);
                const nextList =
                  tab.id === "ALL"
                    ? assessments
                    : assessments.filter((a) => a.mode === tab.id);
                const nextSelected = nextList[0] || null;
                selectedIdRef.current = nextSelected?.id || null;
                setSelectedId(nextSelected?.id || null);
                syncSelectedAttemptState(nextSelected);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? "bg-ocean-600 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-canvas"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error State with Retry Button */}
      {fetchError && (
        <div
          role="alert"
          className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 text-xs sm:text-sm text-rose-900">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">
                Lỗi tải danh sách bài kiểm tra
              </strong>
              <p className="mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAssessments}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Empty State when no EXAM is assigned */}
      {!loading && !fetchError && filteredAssessments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-ocean-600">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-ink">
            Lớp em chưa có bài kiểm tra được giao
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
            Hiện tại thầy/cô chưa mở đề kiểm tra ở mục này. Em có thể quay lại bài học để đọc tài liệu, chơi trò chơi ôn tập hoặc chuyển sang tab Bài tự luyện.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={
                contextGrade
                  ? `/hoc-sinh/thi-diem?grade=${contextGrade}`
                  : "/hoc-sinh/thi-diem"
              }
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Quay lại học bài</span>
            </Link>
            {modeFilter === "EXAM" &&
              assessments.some((a) => a.mode === "PRACTICE") && (
                <button
                  type="button"
                  onClick={() => setModeFilter("PRACTICE")}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-canvas border border-slate-200 hover:bg-slate-100 text-ink text-xs sm:text-sm font-bold"
                >
                  Xem Bài tự luyện
                </button>
              )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List of Assessments */}
          <div className="lg:col-span-4 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Đang tải danh sách bài kiểm tra...
              </div>
            ) : (
              filteredAssessments.map((asm) => {
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
                      selectedIdRef.current = asm.id;
                      setSelectedId(asm.id);
                      syncSelectedAttemptState(asm);
                    }}
                    className={`w-full text-left rounded-2xl border p-4 transition-all space-y-2 ${
                      isSelected
                        ? "border-ocean-600 bg-sky-50/50 shadow-sm ring-1 ring-ocean-500/30"
                        : "border-slate-200 bg-white hover:border-ocean-300"
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
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Tin học • Khối {asm.gradeLevel}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {asm.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>{asm.items?.length || 0} câu</span>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                {/* Pre-attempt Metadata Card: Subject, Duration, Allowed Attempts, Status */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedAssessment.mode === "EXAM"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {selectedAssessment.mode === "EXAM"
                          ? "Đề Kiểm tra chính thức"
                          : "Bài Tự luyện tập"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Trạng thái:{" "}
                        {selectedAssessment.status === "CLOSED"
                          ? "Đã đóng"
                          : "Đang mở"}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {selectedAssessment.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {selectedAssessment.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-canvas border border-slate-200">
                        <span className="text-ink-muted block">Môn / Khối:</span>
                        <strong className="text-ink">
                          Tin học {selectedAssessment.gradeLevel}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-slate-200">
                        <span className="text-ink-muted block">Thời lượng:</span>
                        <strong className="text-ink">
                          {selectedAssessment.timeLimitMinutes
                            ? `${selectedAssessment.timeLimitMinutes} phút`
                            : "Không giới hạn"}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-slate-200">
                        <span className="text-ink-muted block">
                          Số lượt đã nộp:
                        </span>
                        <strong className="text-ocean-700">
                          {completedAttemptsOfSelected.length} /{" "}
                          {selectedAssessment.maxAttempts === 0
                            ? "Không giới hạn"
                            : `${selectedAssessment.maxAttempts} lượt`}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-slate-200">
                        <span className="text-ink-muted block">
                          Chính sách đáp án:
                        </span>
                        <strong className="text-ink">
                          {selectedAssessment.revealAnswersMode === "IMMEDIATE"
                            ? "Xem ngay sau nộp"
                            : "Sau khi đóng đề"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeAttempt?.status === "IN_PROGRESS" &&
                      remainingSeconds !== null && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ocean-950 text-white text-xs font-bold">
                          <Clock className="w-4 h-4 text-sky-400" />
                          Thời gian còn:{" "}
                          {Math.floor(remainingSeconds / 60)}:
                          {String(remainingSeconds % 60).padStart(2, "0")}
                        </div>
                      )}

                    {(!activeAttempt ||
                      activeAttempt.status !== "IN_PROGRESS") &&
                      canStartNewAttempt && (
                        <button
                          type="button"
                          onClick={() => handleStartOrResume(selectedAssessment)}
                          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] transition-all text-white shadow-sm"
                        >
                          <Play className="w-4 h-4" />
                          {completedAttemptsOfSelected.length > 0
                            ? `Làm lượt thứ ${
                                completedAttemptsOfSelected.length + 1
                              }`
                            : "Bắt đầu làm bài"}
                        </button>
                      )}
                  </div>
                </div>

                {statusBanner && (
                  <div
                    role="status"
                    className={`rounded-xl p-3.5 text-xs sm:text-sm font-medium border ${
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

                {/* Post-submission summary card */}
                {activeAttempt && activeAttempt.status !== "IN_PROGRESS" && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase text-ocean-800">
                          Kết quả lượt làm thứ #{activeAttempt.attemptNumber}
                        </span>
                        <div className="text-lg font-extrabold text-ink">
                          Điểm đạt được:{" "}
                          <span className="text-ocean-700">
                            {activeAttempt.totalScore !== null &&
                            activeAttempt.totalScore !== undefined
                              ? `${activeAttempt.totalScore}/${
                                  activeAttempt.maxScore || 10
                                }`
                              : "Chưa chấm"}
                          </span>{" "}
                          • Tổng số lần đã nộp:{" "}
                          <strong>{completedAttemptsOfSelected.length}</strong>
                        </div>
                        <p className="text-xs text-ink-muted">
                          Chính sách đáp án:{" "}
                          {selectedAssessment.revealAnswersMode === "IMMEDIATE"
                            ? "Hiển thị đáp án đúng và lời giải thích ngay bên dưới từng câu."
                            : "Đề kiểm tra chính thức đang mở nên chỉ hiển thị điểm tổng; đáp án chi tiết mở khi kết thúc kỳ thi."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canStartNewAttempt && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStartOrResume(selectedAssessment)
                            }
                            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Làm lại lượt mới</span>
                          </button>
                        )}
                        <Link
                          href={`/hoc-sinh/ai-tutor?grade=${selectedAssessment.gradeLevel}&subject=Tin%20h%E1%BB%8Dc`}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5 text-violet-700" />
                          <span>Hỏi gia sư về bài này</span>
                        </Link>
                      </div>
                    </div>
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
                      const isSubmitted =
                        activeAttempt.status !== "IN_PROGRESS";

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
                                  className={`min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                                    isSelected
                                      ? "border-ocean-600 bg-ocean-50 text-ocean-950 font-semibold"
                                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>
                                    <strong>{opt.id}.</strong>{" "}
                                    {opt.text.replace(/^[A-D]\.\s*/, "")}
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
                                    Chưa chính xác (Đã chọn:{" "}
                                    {submittedAns.studentResponse || "Bỏ trống"})
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
                          className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] transition-all text-white disabled:opacity-50 shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          {submitting
                            ? "Đang nộp & chấm điểm..."
                            : `Nộp bài lượt #${activeAttempt.attemptNumber}`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                    Nhấn nút <strong>&quot;Bắt đầu làm bài&quot;</strong> ở góc trên bên phải để khởi tạo phiên làm bài.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentAssessmentsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-ink-muted">
            Đang tải trang Kiểm tra & Luyện tập...
          </div>
        }
      >
        <StudentAssessmentsContent />
      </Suspense>
    </AppShell>
  );
}
