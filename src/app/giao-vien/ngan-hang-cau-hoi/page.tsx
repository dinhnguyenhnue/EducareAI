"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Database,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  Sparkles,
  BookOpen,
  Layers,
  ShieldCheck,
  Edit3,
} from "lucide-react";

interface QuestionRecord {
  id: string;
  code: string;
  gradeLevel: number;
  topicName: string;
  lessonTitle: string;
  learningObjective: string;
  cognitiveLevel: string;
  sourceBook: string | null;
  sourcePage: string | null;
  questionText: string;
  optionsJson: string;
  correctAnswer: string;
  explanation: string;
  version: number;
  status: string;
  isAiDraft: boolean;
  isDemoData: boolean;
}

export default function TeacherQuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cognitiveFilter, setCognitiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Create Question Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState(
    "Bài 15: Thuật toán tìm kiếm nhị phân"
  );
  const [newObjective, setNewObjective] = useState(
    "Xác định được bước chia đôi dãy đã sắp xếp trong tìm kiếm nhị phân."
  );
  const [newCognitive, setNewCognitive] = useState("UNDERSTAND");
  const [newSourceBook, setNewSourceBook] = useState(
    "SGK Tin học 7 - Kết nối tri thức với cuộc sống"
  );
  const [newSourcePage, setNewSourcePage] = useState("Trang 76");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [newCorrect, setNewCorrect] = useState("A");
  const [newExplanation, setNewExplanation] = useState("");
  const [newIsAiDraft, setNewIsAiDraft] = useState(false);

  // Create Assessment from Matrix Form
  const [asmTitle, setAsmTitle] = useState("");
  const [asmMode, setAsmMode] = useState<"PRACTICE" | "EXAM">("EXAM");
  const [asmMinutes, setAsmMinutes] = useState(15);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tin-hoc/questions?status=${statusFilter}&cognitiveLevel=${cognitiveFilter}`
      );
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cognitiveFilter]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleApproveAiDraft = async (id: string) => {
    setFeedbackMsg(null);
    const res = await fetch("/api/tin-hoc/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE_AI_DRAFT", id }),
    });
    const data = await res.json();
    if (res.ok) {
      setFeedbackMsg(
        `Đã duyệt câu hỏi ${data.question.code} vào Ngân hàng câu hỏi chính thức.`
      );
      await loadQuestions();
    }
  };

  const handleBumpVersion = async (q: QuestionRecord) => {
    const editedText = window.prompt(
      "Chỉnh sửa nội dung câu hỏi (Hệ thống sẽ tăng số phiên bản v" +
        (q.version + 1) +
        ", các đề kiểm tra đã phát hành vẫn giữ nguyên bản chốt cũ):",
      q.questionText
    );
    if (!editedText || editedText === q.questionText) return;

    const res = await fetch("/api/tin-hoc/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_QUESTION",
        id: q.id,
        questionText: editedText,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFeedbackMsg(data.message);
      await loadQuestions();
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tin-hoc/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_QUESTION",
        gradeLevel: 7,
        topicName: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
        lessonTitle: newLessonTitle,
        learningObjective: newObjective,
        cognitiveLevel: newCognitive,
        sourceBook: newSourceBook,
        sourcePage: newSourcePage,
        questionText: newQuestionText,
        options: [
          { id: "A", text: optA },
          { id: "B", text: optB },
          { id: "C", text: optC },
          { id: "D", text: optD },
        ],
        correctAnswer: newCorrect,
        explanation: newExplanation,
        isAiDraft: newIsAiDraft,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowCreateModal(false);
      setNewQuestionText("");
      setFeedbackMsg(
        newIsAiDraft
          ? `Đã lưu câu hỏi nháp AI (${data.question.code}) ở trạng thái CHỜ DUYỆT.`
          : `Đã thêm câu hỏi ${data.question.code} vào Ngân hàng câu hỏi.`
      );
      await loadQuestions();
    } else {
      setFeedbackMsg(data.error || "Lỗi tạo câu hỏi.");
    }
  };

  const handleCreateAssessmentFromSelected = async () => {
    if (!asmTitle.trim() || selectedIds.length === 0) {
      setFeedbackMsg("Vui lòng nhập tên đề và tích chọn ít nhất 1 câu hỏi đã duyệt.");
      return;
    }
    const res = await fetch("/api/tin-hoc/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_ASSESSMENT",
        title: asmTitle,
        mode: asmMode,
        timeLimitMinutes: asmMode === "EXAM" ? asmMinutes : null,
        maxAttempts: asmMode === "EXAM" ? 1 : 0,
        questionIds: selectedIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedbackMsg(data.error || "Không thể phát hành đề.");
      return;
    }
    setAsmTitle("");
    setSelectedIds([]);
    setFeedbackMsg(
      `Đã phát hành đề "${data.assessment.title}" (${data.assessment.code}) gồm ${data.assessment.items.length} câu hỏi chốt phiên bản bất biến!`
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <AppShell>
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Database className="w-3.5 h-3.5" />
              NGÂN HÀNG CÂU HỎI & MA TRẬN ĐỀ TIN HỌC
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-ocean-600" />
              Chốt phiên bản câu hỏi (Version Pinning) • AI chỉ tạo bản nháp chờ duyệt
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Ngân Hàng Câu Hỏi & Phát Hành Đề Kiểm Tra
          </h1>
          <p className="text-sm text-slate-600">
            Mỗi câu hỏi gắn mã định danh ổn định (không dùng số dòng Google Sheets làm ID), trích dẫn nguồn SGK/trang và tự động chốt phiên bản khi đưa vào đề thi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi / Bản nháp AI
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-ocean-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-ocean-800 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-ocean-600 underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Matrix Assessment Builder Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Đóng gói Đề Luyện tập / Đề Kiểm tra từ các câu hỏi đang chọn ({selectedIds.length} câu)
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              setSelectedIds(
                questions
                  .filter((q) => q.status === "APPROVED")
                  .map((q) => q.id)
              )
            }
            className="text-xs font-semibold text-ocean-600 hover:underline"
          >
            Chọn tất cả câu Đã Duyệt
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <input
            type="text"
            value={asmTitle}
            onChange={(e) => setAsmTitle(e.target.value)}
            placeholder="Nhập tiêu đề đề bài (VD: Kiểm tra 15 phút Chủ đề F - Lớp 7A1)..."
            className="md:col-span-5 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <select
            value={asmMode}
            onChange={(e) =>
              setAsmMode(e.target.value === "EXAM" ? "EXAM" : "PRACTICE")
            }
            className="md:col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-medium"
          >
            <option value="EXAM">Chế độ KIỂM TRA (1 lượt, ẩn đáp án)</option>
            <option value="PRACTICE">Chế độ LUYỆN TẬP (Nhiều lượt, giải thích ngay)</option>
          </select>
          <input
            type="number"
            min={5}
            max={90}
            value={asmMinutes}
            onChange={(e) => setAsmMinutes(Number(e.target.value))}
            className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            title="Thời gian làm bài (phút)"
          />
          <button
            type="button"
            onClick={handleCreateAssessmentFromSelected}
            className="md:col-span-2 rounded-lg bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-3 py-2"
          >
            Phát hành đề
          </button>
        </div>
      </div>

      {/* Filter & Question Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-800 font-medium"
            >
              <option value="ALL">Mọi trạng thái duyệt</option>
              <option value="APPROVED">Đã duyệt (APPROVED)</option>
              <option value="PENDING_REVIEW">Bản nháp AI chờ duyệt (PENDING_REVIEW)</option>
            </select>
            <select
              value={cognitiveFilter}
              onChange={(e) => setCognitiveFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-800 font-medium"
            >
              <option value="ALL">Mọi mức độ nhận thức</option>
              <option value="REMEMBER">Nhận biết (REMEMBER)</option>
              <option value="UNDERSTAND">Thông hiểu (UNDERSTAND)</option>
              <option value="APPLY">Vận dụng (APPLY)</option>
              <option value="HIGH_APPLY">Vận dụng cao (HIGH_APPLY)</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
            Hỗ trợ đồng bộ Google Sheets & tạo Google Forms qua gói Apps Script đính kèm
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Đang tải Ngân hàng câu hỏi...
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              const isChecked = selectedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-4 space-y-2 transition-colors ${
                    q.isAiDraft && q.status !== "APPROVED"
                      ? "border-amber-300 bg-amber-50/40"
                      : isChecked
                      ? "border-ocean-500 bg-sky-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={q.status !== "APPROVED"}
                        onChange={() => toggleSelect(q.id)}
                        className="rounded border-slate-300 text-ocean-600"
                      />
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {q.code} (v{q.version})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ocean-100 text-ocean-700">
                        {q.cognitiveLevel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          q.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-200 text-amber-900"
                        }`}
                      >
                        {q.status === "APPROVED"
                          ? "ĐÃ DUYỆT"
                          : "BẢN NHÁP AI CHỜ DUYỆT"}
                      </span>
                      {q.isDemoData && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          DỮ LIỆU MẪU
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleApproveAiDraft(q.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Duyệt câu hỏi AI này
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleBumpVersion(q)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Sửa & Tăng Version
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-900">
                    {q.questionText}
                  </p>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>
                      <strong>Bài học:</strong> {q.lessonTitle}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Nguồn:</strong> {q.sourceBook} ({q.sourcePage})
                    </span>
                    <span>•</span>
                    <span className="text-ocean-700 font-semibold">
                      Đáp án đúng (Chỉ GV thấy): {q.correctAnswer}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-slate-700 flex items-start gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Giải thích sư phạm:</strong> {q.explanation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Thêm Câu Hỏi Mới Hoặc Lưu Bản Nháp Từ AI
            </h3>
            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bài học SGK
                  </label>
                  <input
                    type="text"
                    required
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mức độ nhận thức
                  </label>
                  <select
                    value={newCognitive}
                    onChange={(e) => setNewCognitive(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="REMEMBER">Nhận biết (REMEMBER)</option>
                    <option value="UNDERSTAND">Thông hiểu (UNDERSTAND)</option>
                    <option value="APPLY">Vận dụng (APPLY)</option>
                    <option value="HIGH_APPLY">Vận dụng cao (HIGH_APPLY)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sách giáo khoa / Nguồn
                  </label>
                  <input
                    type="text"
                    value={newSourceBook}
                    onChange={(e) => setNewSourceBook(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trang SGK
                  </label>
                  <input
                    type="text"
                    value={newSourcePage}
                    onChange={(e) => setNewSourcePage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Phương án A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5"
                />
                <input
                  type="text"
                  required
                  placeholder="Phương án B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5"
                />
                <input
                  type="text"
                  required
                  placeholder="Phương án C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5"
                />
                <input
                  type="text"
                  required
                  placeholder="Phương án D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đáp án đúng
                  </label>
                  <select
                    value={newCorrect}
                    onChange={(e) => setNewCorrect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsAiDraft}
                      onChange={(e) => setNewIsAiDraft(e.target.checked)}
                    />
                    <span className="font-semibold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Đánh dấu là câu hỏi do AI sinh (Bắt buộc chờ duyệt)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giải thích vì sao đáp án đúng *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-ocean-600 hover:bg-ocean-700 text-white font-bold"
                >
                  Lưu câu hỏi
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

