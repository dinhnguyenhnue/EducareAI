"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import {
  PILOT_CURRICULUM,
  GRADE6_GEMINI_GEMS,
  STUDENT_GUIDE_PROMPTS,
  type PilotGradeModule,
  type PilotGameQuestion,
} from "@/lib/pilot-curriculum";
import {
  BookOpen,
  Gamepad2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Target,
  HelpCircle,
  Layers,
  Award,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Play,
} from "lucide-react";

type PilotTab = "LESSON" | "GAME" | "PROMPTS" | "GEMS";

/**
 * Selects 10 non-repeating questions from the 20-question verified bank,
 * ensuring all 3 interaction types (MCQ, MATCH, ORDER) are included in every 10-question session.
 */
function pickTenSessionQuestions(bank: PilotGameQuestion[], seed: number): PilotGameQuestion[] {
  const matchItems = bank.filter((q) => q.interactionType === "MATCH");
  const orderItems = bank.filter((q) => q.interactionType === "ORDER");
  const mcqItems = bank.filter(
    (q) => !q.interactionType || q.interactionType === "MCQ"
  );

  // Rotate based on seed so replays draw fresh subsets while staying deterministic per run
  const rotate = <T,>(arr: T[], offset: number): T[] => {
    if (arr.length === 0) return [];
    const k = offset % arr.length;
    return [...arr.slice(k), ...arr.slice(0, k)];
  };

  const chosenMatch = rotate(matchItems, seed).slice(0, 2);
  const chosenOrder = rotate(orderItems, seed).slice(0, 2);
  const neededMcq = Math.max(0, 10 - chosenMatch.length - chosenOrder.length);
  const chosenMcq = rotate(mcqItems, seed * 3).slice(0, neededMcq);

  return [...chosenMcq.slice(0, 3), ...chosenMatch.slice(0, 1), ...chosenMcq.slice(3, 5), ...chosenOrder.slice(0, 1), ...chosenMcq.slice(5), ...chosenMatch.slice(1), ...chosenOrder.slice(1)].slice(0, 10);
}

export function PilotLearningHub({
  initialGrade = 6,
  studentClassName,
}: {
  initialGrade?: 6 | 7 | 8;
  studentClassName?: string | null;
}) {
  const [selectedGrade, setSelectedGrade] = useState<6 | 7 | 8>(initialGrade);
  const [activeTab, setActiveTab] = useState<PilotTab>("LESSON");

  // Practice & application reveal states
  const [revealedPractice, setRevealedPractice] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  // Game states (Start screen -> 10 questions -> Summary screen)
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<PilotGameQuestion[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [recordedPlayInfo, setRecordedPlayInfo] = useState<{
    saving: boolean;
    saved: boolean;
    attemptNumber?: number;
  }>({ saving: false, saved: false });

  // Interactive states for MATCH and ORDER question types
  const [matchSelections, setMatchSelections] = useState<Record<number, number>>({});
  const [orderedIndices, setOrderedIndices] = useState<number[]>([]);

  // Prompt copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const moduleData: PilotGradeModule = PILOT_CURRICULUM[selectedGrade];
  const fullBank = moduleData.game.questions;

  const sessionQuestions = useMemo(
    () => pickTenSessionQuestions(fullBank, sessionSeed),
    [fullBank, sessionSeed]
  );

  const currentQuestion = sessionQuestions[currentQIdx] || sessionQuestions[0];
  const totalQuestions = sessionQuestions.length;

  // Initialize shuffled order indices when switching to an ORDER question
  useEffect(() => {
    if (currentQuestion?.interactionType === "ORDER" && currentQuestion.orderSteps) {
      const len = currentQuestion.orderSteps.length;
      // Start in a deterministic reversed/rotated order so student must reorder
      const initial = Array.from({ length: len }, (_, i) => i).reverse();
      setOrderedIndices(initial);
    } else {
      setOrderedIndices([]);
    }
    setMatchSelections({});
  }, [currentQIdx, currentQuestion]);

  const handleGradeChange = (grade: 6 | 7 | 8) => {
    setSelectedGrade(grade);
    setGameStarted(false);
    setCurrentQIdx(0);
    setSelectedOption(null);
    setIsCurrentCorrect(null);
    setScore(0);
    setAnsweredCount(0);
    setWrongQuestions([]);
    setGameFinished(false);
    setRecordedPlayInfo({ saving: false, saved: false });
    setRevealedPractice({});
    setRevealedHints({});
  };

  const startNewGameSession = (nextSeed: number) => {
    setSessionSeed(nextSeed);
    setGameStarted(true);
    setCurrentQIdx(0);
    setSelectedOption(null);
    setIsCurrentCorrect(null);
    setScore(0);
    setAnsweredCount(0);
    setWrongQuestions([]);
    setGameFinished(false);
    setRecordedPlayInfo({ saving: false, saved: false });
  };

  const recordPracticeGameCompletion = useCallback(
    async (finalScore: number, wrongList: PilotGameQuestion[], seedVal: number) => {
      setRecordedPlayInfo({ saving: true, saved: false });
      try {
        const res = await fetch("/api/tin-hoc/game-plays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: `pilot-game-tin${moduleData.grade}-b1`,
            title: moduleData.game.title,
            gradeLevel: moduleData.grade,
            score: finalScore,
            maxScore: totalQuestions,
            timeSpentSeconds: 120,
            wrongTopics: wrongList.map(
              (w) => w.objective || w.question.slice(0, 60)
            ),
            eventType: "PILOT_PRACTICE_GAME",
            idempotencyKey: `pilot-gp-${moduleData.grade}-${seedVal}-${Date.now()}`,
          }),
        });
        const data = await res.json();
        if (res.ok && data.recorded) {
          setRecordedPlayInfo({
            saving: false,
            saved: true,
            attemptNumber: data.attemptNumber,
          });
          return;
        }
      } catch {
        // Ignore network error on practice record
      }
      setRecordedPlayInfo({ saving: false, saved: false });
    },
    [moduleData, totalQuestions]
  );

  const finalizeQuestionAnswer = (correct: boolean, chosenIdx = 0) => {
    if (selectedOption !== null) return;
    setSelectedOption(chosenIdx);
    setIsCurrentCorrect(correct);
    setAnsweredCount((c) => c + 1);
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setWrongQuestions((prev) => [...prev, currentQuestion]);
    }
  };

  const handleMcqSelect = (optIdx: number) => {
    const correct = optIdx === currentQuestion.correctIndex;
    finalizeQuestionAnswer(correct, optIdx);
  };

  const handleCheckMatching = () => {
    if (!currentQuestion.matchPairs) return;
    const allCorrect = currentQuestion.matchPairs.every(
      (_, idx) => matchSelections[idx] === idx
    );
    finalizeQuestionAnswer(allCorrect, allCorrect ? 0 : 1);
  };

  const handleMoveOrderItem = (pos: number, direction: -1 | 1) => {
    if (selectedOption !== null) return;
    const targetPos = pos + direction;
    if (targetPos < 0 || targetPos >= orderedIndices.length) return;
    const copy = [...orderedIndices];
    const temp = copy[pos];
    copy[pos] = copy[targetPos];
    copy[targetPos] = temp;
    setOrderedIndices(copy);
  };

  const handleCheckOrder = () => {
    const allInOrder = orderedIndices.every((val, idx) => val === idx);
    finalizeQuestionAnswer(allInOrder, allInOrder ? 0 : 1);
  };

  const handleNextQuestion = () => {
    if (currentQIdx + 1 < totalQuestions) {
      setCurrentQIdx((idx) => idx + 1);
      setSelectedOption(null);
      setIsCurrentCorrect(null);
    } else {
      setGameFinished(true);
      recordPracticeGameCompletion(score, wrongQuestions, sessionSeed);
    }
  };

  const handleCopyPrompt = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const askTutorPrompt = useMemo(
    () =>
      STUDENT_GUIDE_PROMPTS.askTutor.buildPrompt(
        moduleData.grade,
        moduleData.lessonTitle,
        moduleData.sourcePages
      ),
    [moduleData]
  );

  const createGamePrompt = useMemo(
    () =>
      STUDENT_GUIDE_PROMPTS.createGame.buildPrompt(
        moduleData.grade,
        moduleData.lessonTitle,
        moduleData.sourcePages
      ),
    [moduleData]
  );

  const qTypeLabel =
    currentQuestion?.interactionType === "MATCH"
      ? "Ghép cặp khái niệm"
      : currentQuestion?.interactionType === "ORDER"
      ? "Sắp xếp thứ tự"
      : "Chọn đáp án đúng";

  return (
    <div className="space-y-6">
      <PageHeader
        tone="materials"
        badge={
          studentClassName
            ? `Thí điểm Khối 6–8 • Lớp ${studentClassName}`
            : "Chương trình Thí điểm Khối 6 – 7 – 8 (Năm học 2026–2027)"
        }
        badgeIcon={<BookOpen className="w-3.5 h-3.5" />}
        title={`Không gian Học tập Thí điểm — ${moduleData.label}`}
        description={`${moduleData.subject} (${moduleData.bookSeries}) • ${moduleData.lessonTitle} • Ngân hàng ${fullBank.length} câu hỏi chuẩn SGK (mỗi lượt rút 10 câu không lặp).`}
        actions={
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {([6, 7, 8] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGradeChange(g)}
                className={`min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedGrade === g
                    ? "bg-ocean-600 text-white shadow-sm"
                    : "text-ink-muted hover:text-ink hover:bg-white/70"
                }`}
              >
                Khối {g} {g === 6 ? "(Chuẩn)" : ""}
              </button>
            ))}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Khu vực học tập thí điểm"
        className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-surface border border-slate-200 shadow-xs"
      >
        {(
          [
            {
              id: "LESSON" as const,
              label: "1. Bài học SGK",
              icon: <BookOpen className="w-4 h-4" />,
            },
            {
              id: "GAME" as const,
              label: `2. Trò chơi ôn tập (10/${fullBank.length} câu)`,
              icon: <Gamepad2 className="w-4 h-4" />,
            },
            {
              id: "PROMPTS" as const,
              label: "3. Prompt hỏi bài & Tạo trò chơi",
              icon: <Sparkles className="w-4 h-4" />,
            },
            {
              id: "GEMS" as const,
              label:
                selectedGrade === 6
                  ? "4. Gia sư Gemini Gem (Lớp 6)"
                  : "4. Gia sư Gemini Gem",
              icon: <ExternalLink className="w-4 h-4" />,
            },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] flex-1 min-w-[160px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? "bg-ocean-600 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-canvas"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LESSON CONTENT */}
      {activeTab === "LESSON" && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                  Khối {moduleData.grade} • {moduleData.subject}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã đối chiếu SGK gốc ({fullBank.length} câu hỏi ôn tập)
                </span>
              </div>
              <span className="text-xs font-medium text-ink-muted">
                {moduleData.chapterTitle}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
              {moduleData.lessonTitle}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              <strong>Nguồn tham khảo:</strong> {moduleData.sourcePages}
            </p>

            {/* Câu hỏi khởi động */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Khởi động</span>
              </div>
              <p className="text-sm sm:text-base text-ink leading-relaxed">
                {moduleData.startupQuestion}
              </p>
            </div>

            {/* Mục tiêu */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900 uppercase tracking-wide">
                <Target className="w-4 h-4 text-sky-700" />
                <span>Mục tiêu – Yêu cầu cần đạt (Sau bài này em sẽ)</span>
              </div>
              <ul className="space-y-1.5 text-sm sm:text-base text-ink list-disc pl-5">
                {moduleData.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Nội dung hình thành kiến thức */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-6">
            <h3 className="text-lg font-extrabold text-ink border-b border-slate-100 pb-3">
              Nội dung hình thành kiến thức
            </h3>
            {moduleData.knowledgeSections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-base font-bold text-ocean-700">
                  {sec.heading}
                </h4>
                <div className="space-y-2 text-sm sm:text-base text-ink leading-relaxed">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
                {sec.highlightBox && sec.highlightBox.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                    <div className="text-xs font-bold text-rose-800 uppercase">
                      Hộp kiến thức trọng tâm (SGK)
                    </div>
                    <ul className="space-y-1 text-sm sm:text-base font-medium text-ink list-disc pl-5">
                      {sec.highlightBox.map((item, hIdx) => (
                        <li key={hIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Minh hoạ sơ đồ trực quan */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ocean-700">
              <Layers className="w-4 h-4" />
              <span>{moduleData.illustrationCaption}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {moduleData.illustrationNodes.map((node) => (
                <div
                  key={node.step}
                  className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-1.5"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ocean-600 text-white text-xs font-bold">
                    {node.step}
                  </span>
                  <div className="text-sm font-bold text-ink">{node.title}</div>
                  <div className="text-xs text-ink-muted leading-relaxed">
                    {node.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ví dụ + Chốt kiến thức */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-3">
              <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Ví dụ & Tình huống thực tế (SGK)</span>
              </h3>
              <div className="space-y-3">
                {moduleData.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-canvas border border-slate-200/80 space-y-1"
                  >
                    <div className="text-xs font-bold text-ocean-700">
                      {ex.title}
                    </div>
                    <p className="text-sm text-ink leading-relaxed">
                      {ex.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-card space-y-3">
              <h3 className="text-base font-extrabold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Chốt kiến thức cần nhớ</span>
              </h3>
              <ul className="space-y-2.5 text-sm text-ink list-disc pl-5 leading-relaxed">
                {moduleData.keyTakeaways.map((kt, idx) => (
                  <li key={idx}>{kt}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bài luyện tập có đáp án và giải thích */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
            <h3 className="text-base font-extrabold text-ink">
              Bài luyện tập (Có đáp án & giải thích)
            </h3>
            <div className="space-y-3">
              {moduleData.practiceItems.map((item) => {
                const isShown = Boolean(revealedPractice[item.id]);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-2.5"
                  >
                    <p className="text-sm font-semibold text-ink">
                      {item.question}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedPractice((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold bg-ocean-600 text-white hover:bg-ocean-700 transition-colors"
                    >
                      {isShown ? "Ẩn đáp án" : "Xem đáp án & giải thích"}
                    </button>
                    {isShown && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm space-y-1">
                        <div className="font-bold text-emerald-800">
                          Đáp án: {item.answer}
                        </div>
                        <div className="text-ink leading-relaxed">
                          Giải thích: {item.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hoạt động vận dụng */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
            <h3 className="text-base font-extrabold text-ink">
              Hoạt động vận dụng thực tế
            </h3>
            <div className="space-y-3">
              {moduleData.applicationTasks.map((appItem, idx) => {
                const isHintShown = Boolean(revealedHints[idx]);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-2"
                  >
                    <p className="text-sm font-medium text-ink">
                      {appItem.task}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedHints((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                      className="min-h-[44px] text-xs font-bold text-ocean-700 hover:underline"
                    >
                      {isHintShown ? "Ẩn gợi ý" : "Xem gợi ý thực hiện"}
                    </button>
                    {isHintShown && (
                      <p className="text-xs sm:text-sm text-ink-muted bg-white p-3 rounded-lg border border-slate-200">
                        {appItem.hint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("GAME")}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Chuyển sang Luyện bằng trò chơi (10 câu)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW GAME (START SCREEN -> 10 MULTI-TYPE QUESTIONS -> SUMMARY) */}
      {activeTab === "GAME" && (
        <div className="p-5 sm:p-7 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-5 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 px-2.5 py-0.5 rounded-full">
                  Khối {moduleData.grade} • {moduleData.lessonTitle}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Chế độ Tự luyện (Ngân hàng {fullBank.length} câu SGK)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-ink mt-2">
                {moduleData.game.title}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                Mục tiêu: {moduleData.game.objective}
              </p>
            </div>
            {gameStarted && (
              <div className="text-right">
                <div className="text-xs text-ink-muted">Điểm hiện tại</div>
                <div className="text-2xl font-extrabold text-ocean-700">
                  {score}/{totalQuestions}
                </div>
              </div>
            )}
          </div>

          {!gameStarted ? (
            /* START SCREEN */
            <div className="py-6 space-y-5">
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <h3 className="text-base font-extrabold text-ocean-900">
                  Cấu trúc lượt chơi ôn tập (10 câu không lặp):
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-ink list-disc pl-5">
                  <li>
                    Rút ngẫu nhiên <strong>10 câu hỏi không trùng lặp</strong> từ ngân hàng{" "}
                    <strong>{fullBank.length} câu đã đối chiếu {moduleData.bookTitle}</strong>.
                  </li>
                  <li>
                    Kết hợp <strong>3 dạng tương tác</strong>: Chọn đáp án đúng, Ghép cặp khái niệm bằng chạm/phím và Sắp xếp thứ tự bằng nút Lên/Xuống.
                  </li>
                  <li>
                    Có phản hồi Đúng/Sai và giải thích kiến thức SGK ngay sau mỗi câu; lưu lịch sử <strong>Tự luyện</strong> khi hoàn thành.
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => startNewGameSession(0)}
                  className="min-h-[48px] px-8 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-base font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Bắt đầu</span>
                </button>
              </div>
            </div>
          ) : !gameFinished ? (
            /* IN-PLAY SCREEN */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-ink-muted">
                <span className="text-sm font-extrabold text-ocean-800">
                  Câu {currentQIdx + 1}/{totalQuestions}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-ink">
                    Dạng: {qTypeLabel}
                  </span>
                  {currentQuestion.questionCode && (
                    <span className="font-mono text-[11px] text-ink-muted">
                      Mã: {currentQuestion.questionCode}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-ocean-600 transition-all duration-200"
                  style={{
                    width: `${((currentQIdx + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              {/* Prominent Question Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-2">
                {currentQuestion.objective && (
                  <div className="text-xs font-semibold text-ocean-700">
                    Mục tiêu: {currentQuestion.objective}
                  </div>
                )}
                <p className="text-base sm:text-lg font-extrabold text-ink leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Interaction Type 1: MATCH (Tap/Keyboard Pair Selection) */}
              {currentQuestion.interactionType === "MATCH" &&
              currentQuestion.matchPairs ? (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-ink-muted">
                    Hướng dẫn: Với mỗi mục ở cột bên trái, em hãy bấm chọn mô tả đúng tương ứng ở cột bên phải rồi nhấn &quot;Kiểm tra ghép cặp&quot;.
                  </p>
                  <div className="space-y-3">
                    {currentQuestion.matchPairs.map((pair, leftIdx) => {
                      const chosenRightIdx = matchSelections[leftIdx];
                      return (
                        <div
                          key={leftIdx}
                          className="p-3.5 rounded-xl bg-canvas border border-slate-200 space-y-2.5"
                        >
                          <div className="text-sm font-bold text-ink">
                            {pair.left}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {currentQuestion.matchPairs!.map((candidate, rIdx) => {
                              const isChosen = chosenRightIdx === rIdx;
                              return (
                                <button
                                  key={rIdx}
                                  type="button"
                                  disabled={selectedOption !== null}
                                  onClick={() =>
                                    setMatchSelections((prev) => ({
                                      ...prev,
                                      [leftIdx]: rIdx,
                                    }))
                                  }
                                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${
                                    isChosen
                                      ? "border-ocean-600 bg-ocean-50 text-ocean-950 font-bold"
                                      : "border-slate-200 bg-white hover:border-ocean-300 text-ink"
                                  }`}
                                >
                                  → {candidate.right}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedOption === null && (
                    <button
                      type="button"
                      disabled={
                        Object.keys(matchSelections).length <
                        currentQuestion.matchPairs.length
                      }
                      onClick={handleCheckMatching}
                      className="min-h-[48px] w-full py-2.5 px-4 rounded-xl bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white text-sm font-bold"
                    >
                      Kiểm tra ghép cặp
                    </button>
                  )}
                </div>
              ) : currentQuestion.interactionType === "ORDER" &&
                currentQuestion.orderSteps ? (
                /* Interaction Type 2: ORDER (Up/Down Buttons >=44px) */
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-ink-muted">
                    Hướng dẫn: Sử dụng nút Lên (↑) hoặc Xuống (↓) bên cạnh mỗi bước để sắp xếp theo đúng thứ tự, sau đó nhấn &quot;Kiểm tra thứ tự&quot;.
                  </p>
                  <div className="space-y-2.5">
                    {orderedIndices.map((stepIdx, pos) => {
                      const stepText = currentQuestion.orderSteps![stepIdx];
                      return (
                        <div
                          key={stepIdx}
                          className="p-3 rounded-xl bg-canvas border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-ocean-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {pos + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-ink">
                              {stepText}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={selectedOption !== null || pos === 0}
                              onClick={() => handleMoveOrderItem(pos, -1)}
                              aria-label={`Chuyển bước ${pos + 1} lên trên`}
                              className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:border-ocean-500 disabled:opacity-40 flex items-center justify-center text-ink"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                selectedOption !== null ||
                                pos === orderedIndices.length - 1
                              }
                              onClick={() => handleMoveOrderItem(pos, 1)}
                              aria-label={`Chuyển bước ${pos + 1} xuống dưới`}
                              className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:border-ocean-500 disabled:opacity-40 flex items-center justify-center text-ink"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedOption === null && (
                    <button
                      type="button"
                      onClick={handleCheckOrder}
                      className="min-h-[48px] w-full py-2.5 px-4 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold"
                    >
                      Kiểm tra thứ tự
                    </button>
                  )}
                </div>
              ) : (
                /* Interaction Type 3: Standard MCQ */
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isAnswered = selectedOption !== null;
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let btnClass =
                      "border-slate-200 bg-canvas hover:border-ocean-400 hover:bg-sky-50/40 text-ink";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass =
                          "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold";
                      } else if (isSelected) {
                        btnClass =
                          "border-rose-400 bg-rose-50 text-rose-900";
                      } else {
                        btnClass = "border-slate-200 bg-canvas opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleMcqSelect(idx)}
                        className={`w-full min-h-[48px] text-left px-4 py-3 rounded-xl border text-sm sm:text-base transition-all flex items-center justify-between gap-3 ${btnClass}`}
                      >
                        <span>
                          <strong className="mr-2">
                            {String.fromCharCode(65 + idx)}.
                          </strong>
                          {opt}
                        </span>
                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Feedback & Next Button */}
              {selectedOption !== null && (
                <div
                  role="status"
                  className={`p-4 rounded-xl border text-sm space-y-2 ${
                    isCurrentCorrect
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="font-extrabold">
                    {isCurrentCorrect
                      ? "Chính xác! +1 điểm"
                      : `Chưa chính xác. Đáp án đúng: ${
                          currentQuestion.options[currentQuestion.correctIndex]
                        }`}
                  </div>
                  <p className="leading-relaxed">
                    <strong>Giải thích:</strong> {currentQuestion.explanation}
                  </p>
                  {currentQuestion.sourceRef && (
                    <p className="text-xs opacity-80">
                      Nguồn đối chiếu: {currentQuestion.sourceRef}
                    </p>
                  )}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold transition-colors"
                    >
                      {currentQIdx + 1 < totalQuestions
                        ? "Câu tiếp theo"
                        : "Xem tổng kết"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SUMMARY SCREEN */
            <div className="py-4 space-y-5">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-ocean-50 border border-ocean-200 flex items-center justify-center mx-auto text-ocean-700">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-ink">
                  Hoàn thành lượt Tự luyện Khối {moduleData.grade}!
                </h3>
                <div className="text-3xl font-black text-ocean-700">
                  {score} / {totalQuestions} điểm (Thang 10:{" "}
                  {Math.round((score / totalQuestions) * 10 * 10) / 10}/10)
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  {recordedPlayInfo.saving
                    ? "Đang lưu kết quả Tự luyện..."
                    : recordedPlayInfo.saved
                    ? `Đã lưu vào lịch sử Tự luyện (Lượt chơi #${
                        recordedPlayInfo.attemptNumber || 1
                      } — tách biệt với điểm kiểm tra chính thức)`
                    : "Chế độ Tự luyện — không ghi đè điểm kiểm tra chính thức"}
                </div>
              </div>

              {/* Questions to review */}
              {wrongQuestions.length > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <h4 className="text-sm font-extrabold text-amber-950">
                    Các câu em cần ôn lại ({wrongQuestions.length} câu):
                  </h4>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {wrongQuestions.map((wq, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1"
                      >
                        <div className="font-bold text-ink">{wq.question}</div>
                        <div className="text-emerald-800 font-semibold">
                          Đáp án đúng: {wq.options[wq.correctIndex]}
                        </div>
                        <div className="text-ink-muted">{wq.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-sm font-bold text-emerald-900">
                  Tuyệt vời! Em trả lời đúng toàn bộ 10/10 câu hỏi trong lượt này!
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startNewGameSession(sessionSeed + 1)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("LESSON")}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-canvas hover:bg-slate-100 border border-slate-200 text-ink text-sm font-bold"
                >
                  Về bài học
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TWO GUIDE PROMPTS FOR STUDENTS */}
      {activeTab === "PROMPTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Khối {moduleData.grade} • Gia sư hỏi bài
              </span>
              <h3 className="text-lg font-extrabold text-ink">
                {STUDENT_GUIDE_PROMPTS.askTutor.title}
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {STUDENT_GUIDE_PROMPTS.askTutor.description}
              </p>
              <pre className="p-4 rounded-xl bg-canvas border border-slate-200 text-xs text-ink whitespace-pre-wrap font-sans leading-relaxed">
                {askTutorPrompt}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => handleCopyPrompt("ASK", askTutorPrompt)}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {copiedKey === "ASK" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã sao chép Prompt hỏi bài!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Prompt hỏi bài (Lớp {moduleData.grade})</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-slate-200 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                Khối {moduleData.grade} • Tạo trò chơi HTML
              </span>
              <h3 className="text-lg font-extrabold text-ink">
                {STUDENT_GUIDE_PROMPTS.createGame.title}
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {STUDENT_GUIDE_PROMPTS.createGame.description}
              </p>
              <pre className="p-4 rounded-xl bg-canvas border border-slate-200 text-xs text-ink whitespace-pre-wrap font-sans leading-relaxed">
                {createGamePrompt}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => handleCopyPrompt("GAME", createGamePrompt)}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {copiedKey === "GAME" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã sao chép Prompt tạo trò chơi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    Sao chép Prompt tạo trò chơi (Lớp {moduleData.grade})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: GEMINI GEMS */}
      {activeTab === "GEMS" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-xs sm:text-sm text-ink">
            <AlertCircle className="w-5 h-5 text-ocean-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-900">
                Lưu ý sử dụng Gemini Gem ngoài hệ thống:
              </p>
              <p>
                Các nút bên dưới mở trực tiếp liên kết Gemini Gem tương ứng do giáo viên chia sẻ. Em hãy sao chép kèm{" "}
                <strong>Prompt hỏi bài</strong> ở Tab 3 khi cần hỏi sâu theo đúng bài SGK đang học.
              </p>
            </div>
          </div>

          {selectedGrade === 6 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {GRADE6_GEMINI_GEMS.map((gem) => (
                <div
                  key={gem.url}
                  className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                      {gem.subject}
                    </span>
                    <h3 className="text-lg font-extrabold text-ink">
                      {gem.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {gem.description}
                    </p>
                  </div>
                  <a
                    href={gem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Mở {gem.title}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 text-center space-y-3">
              <p className="text-sm font-bold text-ink">
                Lớp em chưa có Gem môn này.
              </p>
              <p className="text-xs sm:text-sm text-ink-muted max-w-lg mx-auto">
                Em có thể chuyển sang Tab{" "}
                <strong>3. Prompt hỏi bài & Tạo trò chơi</strong> để sao chép Prompt đã cấu hình sẵn cho Lớp {selectedGrade} hoặc hỏi trực tiếp Gia sư Socratic nội bộ.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("PROMPTS")}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold"
              >
                Mở Prompt Lớp {selectedGrade}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
