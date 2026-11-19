"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import {
  QUICK_INTENT_ACTIONS,
  resolveTutorCatalogForClass,
  type TutorSubjectOption,
} from "@/lib/ai-tutor-config";
import {
  Sparkles,
  Send,
  Lightbulb,
  Bot,
  User as UserIcon,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  isError?: boolean;
}

function StudentAITutorContent() {
  const searchParams = useSearchParams();
  const queryGrade = Number(searchParams.get("grade") || "");
  const queryClassName = searchParams.get("className") || "";
  const querySubject = searchParams.get("subject") || "";
  const queryLessonTitle = searchParams.get("lessonTitle") || "";

  const [studentId, setStudentId] = useState<string>("student");
  const [gradeLevel, setGradeLevel] = useState<number>(
    [6, 7, 8].includes(queryGrade) ? queryGrade : 6
  );
  const [className, setClassName] = useState<string>(
    queryClassName || `${[6, 7, 8].includes(queryGrade) ? queryGrade : 6}A1`
  );
  const [isTeacherPreview, setIsTeacherPreview] = useState(false);
  const [activeExamInProgress, setActiveExamInProgress] = useState(false);
  const [catalog, setCatalog] = useState<TutorSubjectOption[]>(() =>
    resolveTutorCatalogForClass(
      [6, 7, 8].includes(queryGrade) ? queryGrade : 6,
      queryClassName || "6A1"
    )
  );
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("");
  const [customLessonTitle, setCustomLessonTitle] = useState<string>(
    queryLessonTitle
  );

  // Thread-isolated conversation store: key = `${studentId}::${className}::${subjectCode}::${lessonTitle}`
  const [threadsByKey, setThreadsByKey] = useState<
    Record<string, ChatMessageItem[]>
  >({});

  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [loadingThreadKey, setLoadingThreadKey] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedGemPrompt, setCopiedGemPrompt] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load verified class/grade/subject context from server session
  const fetchTutorContext = useCallback(
    async (overrideClass?: string, overrideGrade?: number) => {
      try {
        const qs = new URLSearchParams();
        if (overrideClass) qs.set("className", overrideClass);
        if (overrideGrade) qs.set("grade", String(overrideGrade));
        const res = await fetch(`/api/ai/chat?${qs.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setStudentId(data.studentId || "student");
        setGradeLevel(data.gradeLevel || 6);
        setClassName(data.className || "6A1");
        setIsTeacherPreview(Boolean(data.isTeacherOrAdminPreview));
        setActiveExamInProgress(Boolean(data.activeExamInProgress));

        if (Array.isArray(data.catalog) && data.catalog.length > 0) {
          setCatalog(data.catalog);
          setSelectedSubjectCode((prev) => {
            if (
              querySubject &&
              !prev &&
              data.catalog.some((c: TutorSubjectOption) =>
                c.subjectName
                  .toLowerCase()
                  .includes(querySubject.toLowerCase())
              )
            ) {
              const found = data.catalog.find((c: TutorSubjectOption) =>
                c.subjectName
                  .toLowerCase()
                  .includes(querySubject.toLowerCase())
              );
              if (found) return found.subjectCode;
            }
            if (
              prev &&
              data.catalog.some(
                (c: TutorSubjectOption) => c.subjectCode === prev
              )
            ) {
              return prev;
            }
            return data.catalog[0].subjectCode;
          });
        }
      } catch {
        // Fallback to local catalog if offline
      }
    },
    [querySubject]
  );

  useEffect(() => {
    fetchTutorContext(queryClassName || undefined, queryGrade || undefined);
  }, [fetchTutorContext, queryClassName, queryGrade]);

  const currentSubject: TutorSubjectOption = useMemo(() => {
    return (
      catalog.find((c) => c.subjectCode === selectedSubjectCode) ||
      catalog[0] ||
      resolveTutorCatalogForClass(gradeLevel, className)[0]
    );
  }, [catalog, selectedSubjectCode, gradeLevel, className]);

  const effectiveLessonTitle =
    customLessonTitle.trim() || currentSubject.defaultLessonTitle;

  const activeThreadKey = useMemo(() => {
    return `${studentId}::${className}::${currentSubject.subjectCode}::${effectiveLessonTitle}`;
  }, [studentId, className, currentSubject.subjectCode, effectiveLessonTitle]);

  const currentMessages: ChatMessageItem[] = useMemo(() => {
    const existing = threadsByKey[activeThreadKey];
    if (existing && existing.length > 0) return existing;
    return [
      {
        id: "welcome",
        role: "assistant",
        text: `Chào em! Thầy/cô là ${currentSubject.tutorName} phụ trách Lớp ${className}. Bài học hiện tại là "${effectiveLessonTitle}" (Mục tiêu: ${currentSubject.defaultObjective}). Em có thể bấm một nút gợi ý bên dưới hoặc đặt câu hỏi để thầy/cô hướng dẫn từng bước nhé!`,
        time: "Bây giờ",
      },
    ];
  }, [threadsByKey, activeThreadKey, currentSubject, className, effectiveLessonTitle]);

  const handleSubjectSwitch = (newSubjectCode: string) => {
    // Cancel any in-flight request from previous subject so late network responses never pollute the new thread
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoadingThreadKey(null);
    setLastFailedPrompt(null);
    setCustomLessonTitle("");
    setSelectedSubjectCode(newSubjectCode);
  };

  const handlePreviewClassSwitch = (newClass: string, newGrade: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoadingThreadKey(null);
    setLastFailedPrompt(null);
    setCustomLessonTitle("");
    setClassName(newClass);
    setGradeLevel(newGrade);
    const nextCat = resolveTutorCatalogForClass(newGrade, newClass);
    setCatalog(nextCat);
    setSelectedSubjectCode(nextCat[0].subjectCode);
    fetchTutorContext(newClass, newGrade);
  };

  const handleSend = async (overrideText?: string) => {
    const query = (overrideText ?? input).trim();
    if (!query) return;

    const targetThreadKey = activeThreadKey;
    const nowTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      text: query,
      time: nowTime,
    };

    const previousHistory = currentMessages.filter((m) => !m.isError);
    setThreadsByKey((prev) => ({
      ...prev,
      [targetThreadKey]: [...previousHistory, userMsg],
    }));

    if (overrideText === undefined) {
      setInput("");
    }
    setLastFailedPrompt(null);
    setLoadingThreadKey(targetThreadKey);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: query,
          subjectCode: currentSubject.subjectCode,
          className,
          gradeLevel,
          lessonTitle: effectiveLessonTitle,
          objective: currentSubject.defaultObjective,
          history: previousHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Dịch vụ Gia sư AI tạm thời gián đoạn. Em hãy bấm Thử lại."
        );
      }

      const replyMsg: ChatMessageItem = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setThreadsByKey((prev) => ({
        ...prev,
        [targetThreadKey]: [...(prev[targetThreadKey] || previousHistory), replyMsg],
      }));
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return; // Ignored cleanly on subject/class switch
      }
      setLastFailedPrompt(query);
      const errMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text:
          err?.message ||
          "Không thể kết nối tới Gia sư AI lúc này. Em vui lòng bấm nút Thử lại hoặc sao chép câu hỏi sang Gemini Gem.",
        time: nowTime,
        isError: true,
      };
      setThreadsByKey((prev) => ({
        ...prev,
        [targetThreadKey]: [...(prev[targetThreadKey] || previousHistory), errMsg],
      }));
    } finally {
      setLoadingThreadKey((curr) => (curr === targetThreadKey ? null : curr));
    }
  };

  const handleCopyQuestionForGem = async () => {
    const textToCopy =
      input.trim() ||
      `Em là học sinh Lớp ${className}, đang học bài "${effectiveLessonTitle}" (${currentSubject.subjectName}). ${currentSubject.starterPrompts[0]}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedGemPrompt(true);
      setTimeout(() => setCopiedGemPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  const isCurrentThreadLoading = loadingThreadKey === activeThreadKey;

  return (
    <div className="space-y-6">
      <PageHeader
        tone="aiTutor"
        badge={`Lớp ${className} • Khối ${gradeLevel} • Socratic AI`}
        badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
        title={`${currentSubject.tutorName} — Đồng hành theo Lớp & Môn`}
        description="Gợi mở từng bước theo đúng chương trình lớp và bài đang học • Không giải hộ đáp án • Tự động ẩn thông tin cá nhân."
        actions={
          isTeacherPreview ? (
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <span className="px-2 font-bold text-ink-muted">Xem thử lớp:</span>
              {[
                { cls: "6A1", g: 6 },
                { cls: "6A2", g: 6 },
                { cls: "7A1", g: 7 },
                { cls: "8A1", g: 8 },
              ].map((item) => (
                <button
                  key={item.cls}
                  type="button"
                  onClick={() => handlePreviewClassSwitch(item.cls, item.g)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg font-bold transition-all ${
                    className === item.cls
                      ? "bg-ocean-600 text-white"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.cls}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      {activeExamInProgress && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">
              Chế độ bảo mật khi đang có Bài kiểm tra diễn ra:
            </strong>
            <p className="mt-0.5">
              Hệ thống xác định em đang trong thời gian làm đề kiểm tra nên Gia sư chỉ giải thích khái niệm chung và giữ kín lời giải, đáp án của đề.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Panel: Subject selector, External Gem link & Starter Prompts (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-slate-200 shadow-card p-5 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* 1. Chọn môn học của lớp */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                1. Môn học của Lớp {className}
              </h2>
              <div className="space-y-2">
                {catalog.map((s) => {
                  const isSelected = s.subjectCode === currentSubject.subjectCode;
                  return (
                    <button
                      key={s.subjectCode}
                      type="button"
                      onClick={() => handleSubjectSwitch(s.subjectCode)}
                      className={`w-full min-h-[48px] p-3.5 rounded-xl text-left text-xs transition-all flex flex-col gap-1 border ${
                        isSelected
                          ? "bg-violet-50 border-violet-500 text-violet-950 font-semibold shadow-xs"
                          : "bg-canvas border-slate-200 text-ink hover:bg-violet-50/40 hover:border-violet-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{s.subjectName}</span>
                        <span className="text-[11px] font-mono text-ink-muted">
                          {s.subjectCode}
                        </span>
                      </div>
                      <span className="text-xs text-ink-muted line-clamp-1">
                        Bài: {s.defaultLessonTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Liên kết Gemini Gem ngoài của Lớp + Môn */}
            <div className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-ink">
                2. Gemini Gem chuyên biệt ({currentSubject.subjectName} • Lớp{" "}
                {className})
              </div>
              {currentSubject.externalGemUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Lớp {className} đã được gắn liên kết{" "}
                    <strong>{currentSubject.tutorName}</strong> trên Google Gemini.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={currentSubject.externalGemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Mở Gem ({currentSubject.subjectName})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyQuestionForGem}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-ink text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      {copiedGemPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">
                            Đã sao chép câu hỏi!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép câu hỏi để dán vào Gem</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-950">
                  <strong>Lớp em chưa có Gem môn này.</strong> Em hãy trò chuyện trực tiếp với Gia sư Socratic ở khung bên phải nhé!
                </div>
              )}
            </div>

            {/* 3. Câu mở đầu mẫu (bấm để đưa vào ô chat sửa hoặc gửi) */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                3. Câu hỏi mẫu (Bấm để chỉnh sửa hoặc gửi)
              </h2>
              <div className="space-y-2">
                {currentSubject.starterPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInput(q)}
                    className="w-full p-3 rounded-xl bg-canvas hover:bg-violet-50/70 border border-slate-200 hover:border-violet-200 text-left text-xs text-ink transition-all flex items-start gap-2 group"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                    <span className="group-hover:text-violet-900 leading-relaxed">
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Conversation Stream (8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-slate-200 shadow-card flex flex-col overflow-hidden">
          {/* Conversation Header showing Tutor Name, Class, Subject, Lesson */}
          <div className="p-4 bg-violet-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ocean-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-ink">
                    {currentSubject.tutorName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white border border-violet-200 text-violet-800">
                    Lớp {className} • {currentSubject.subjectName}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Bài đang học: <strong className="text-ink">{effectiveLessonTitle}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setThreadsByKey((prev) => ({
                  ...prev,
                  [activeThreadKey]: [
                    {
                      id: `reset-${Date.now()}`,
                      role: "assistant",
                      text: `Đã làm mới cuộc trò chuyện môn ${currentSubject.subjectName} (Lớp ${className}) — Bài "${effectiveLessonTitle}". Em cần gợi ý phần nào tiếp theo?`,
                      time: "Vừa xong",
                    },
                  ],
                }))
              }
              title="Làm mới hội thoại môn này"
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-ink-muted hover:text-violet-800 hover:bg-violet-100/60 inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          {/* 3 Quick Pedagogical Actions */}
          <div className="px-4 py-2.5 bg-canvas border-b border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-ink-muted">
              Thao tác nhanh:
            </span>
            {QUICK_INTENT_ACTIONS.map((act) => (
              <button
                key={act.id}
                type="button"
                disabled={isCurrentThreadLoading}
                onClick={() => handleSend(act.buildText(effectiveLessonTitle))}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-xs font-bold text-ink transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-canvas/40 text-sm">
            {currentMessages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-4 rounded-2xl space-y-1.5 leading-relaxed ${
                    m.role === "user"
                      ? "bg-ocean-600 text-white rounded-br-xs shadow-xs"
                      : m.isError
                      ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs"
                      : "bg-surface text-ink border border-slate-200 rounded-bl-xs shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[10px] ${
                      m.role === "user" ? "text-sky-100 text-right" : "text-ink-muted"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-ocean-700 flex items-center justify-center shrink-0 mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isCurrentThreadLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-muted pl-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                <span>
                  {currentSubject.tutorName} đang phân tích và chuẩn bị câu hỏi gợi mở...
                </span>
              </div>
            )}

            {lastFailedPrompt && !isCurrentThreadLoading && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Gửi câu hỏi chưa thành công. Em có muốn gửi lại không?</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSend(lastFailedPrompt)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            )}
          </div>

          {/* IME-Safe Input Bar */}
          <div className="p-4 bg-surface border-t border-slate-200">
            <div className="flex items-center gap-2">
              <label htmlFor="ai-tutor-chat-input" className="sr-only">
                Nhập câu hỏi hoặc bước giải của em cho {currentSubject.tutorName}
              </label>
              <input
                id="ai-tutor-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !isComposing &&
                    !e.nativeEvent.isComposing &&
                    e.keyCode !== 229
                  ) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Hỏi ${currentSubject.tutorName} về "${effectiveLessonTitle}"...`}
                className="flex-1 min-h-[48px] bg-canvas border border-slate-200 rounded-xl px-4 py-2.5 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ocean-600 transition-colors"
              />
              <button
                type="button"
                disabled={isCurrentThreadLoading || !input.trim()}
                onClick={() => handleSend()}
                aria-label="Gửi câu hỏi"
                className="min-h-[48px] px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <span>Gửi</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentAITutorPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-ink-muted">
            Đang khởi tạo không gian Gia sư Socratic...
          </div>
        }
      >
        <StudentAITutorContent />
      </Suspense>
    </AppShell>
  );
}
