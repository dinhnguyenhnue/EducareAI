"use client";

import React, { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudentAiCenterTabs } from "@/components/ai/StudentAiCenterTabs";
import {
  TEACHER_GEM_SYSTEM_INSTRUCTIONS,
  STUDENT_PROMPT_TEMPLATES,
  STUDENT_AI_SAFETY_CHECKLIST,
} from "@/lib/tin-hoc-prompts";
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  Code2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function CreativeWithAiPage() {
  // Interactive placeholder variables for all 8 prompts (Section 10)
  const [grade, setGrade] = useState("7 (Lớp 7A1)");
  const [lesson, setLesson] = useState(
    "Bài 15: Thuật toán tìm kiếm nhị phân (SGK Tin học 7)"
  );
  const [sourceNotes, setSourceNotes] = useState(
    "SGK Tin học 7 - Kết nối tri thức (Trang 75-79): Tìm kiếm nhị phân áp dụng cho danh sách đã sắp xếp. Mỗi bước so sánh giá trị cần tìm với phần tử ở vị trí giữa để thu hẹp một nửa phạm vi tìm kiếm."
  );
  const [goal, setGoal] = useState(
    "Giúp các bạn trong lớp phân biệt điều kiện áp dụng tìm kiếm nhị phân so với tìm kiếm tuần tự và biết đếm số bước chia đôi."
  );
  const [idea, setIdea] = useState(
    "Trò chơi giải mật thư kho báu gồm 10 câu hỏi hoặc 3 nhiệm vụ chọn phần tử ở giữa dãy số."
  );

  // Configurable Teacher Gem Link — default empty (DISCONNECTED) until teacher enters a verified Gem URL
  const [teacherGemUrl, setTeacherGemUrl] = useState("");
  const isGemUrlValid = useMemo(() => {
    const trimmed = teacherGemUrl.trim();
    if (!trimmed) return false;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") return false;
      if (
        parsed.hostname === "gemini.google.com" &&
        (parsed.pathname === "/" ||
          parsed.pathname === "/app" ||
          parsed.pathname === "/gems" ||
          parsed.pathname === "/gems/" ||
          parsed.pathname === "/gem/tin-hoc-sang-tao-unigo")
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, [teacherGemUrl]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGemInstructions, setShowGemInstructions] = useState(false);

  const fillTemplate = useMemo(() => {
    return (raw: string) =>
      raw
        .replace(/\[Lớp\]/g, grade || "[Lớp]")
        .replace(/\[Bài học\]/g, lesson || "[Bài học]")
        .replace(/\[Nguồn kiến thức\]/g, sourceNotes || "[Nguồn kiến thức]")
        .replace(/\[Mục tiêu\]/g, goal || "[Mục tiêu]")
        .replace(/\[Ý tưởng\]/g, idea || "[Ý tưởng]");
  }, [grade, lesson, sourceNotes, goal, idea]);

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
    <div className="space-y-6">
      <StudentAiCenterTabs />
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <Sparkles className="w-3.5 h-3.5" />
              SÁNG TẠO CÙNG AI – TRỢ LÝ GEM TIN HỌC SÁNG TẠO
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hướng Dẫn Sử Dụng Gem & Bộ 8 Prompt Thiết Kế Trò Chơi HTML
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Điền thông tin bài học của em vào bảng biến bên dưới để tự động tạo câu lệnh (Prompt) chuẩn, sao chép sang Gem do Giáo viên cấu hình, kiểm chứng lại kiến thức SGK và gửi duyệt tại Xưởng Trò Chơi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGemInstructions((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
          >
            <BookOpen className="w-4 h-4 text-teal-700" />
            {showGemInstructions
              ? "Ẩn cấu hình Gem của Giáo viên"
              : "Xem cấu hình Gem Instructions (Dành cho Giáo viên)"}
          </button>
          <Link
            href="/hoc-sinh/xuong-tro-choi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Code2 className="w-4 h-4" />
            Mở Xưởng Trò Chơi & Chạy Thử Sandbox
          </Link>
        </div>
      </div>

      {/* Teacher Gem System Instructions Box (Section 9) */}
      {showGemInstructions && (
        <div className="rounded-2xl border border-teal-300 bg-teal-50/40 p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bản Cấu Hình Gem Mẫu Cho Giáo Viên (“TIN HỌC SÁNG TẠO”)
              </h2>
              <p className="text-xs text-slate-600">
                Giáo viên sao chép nguyên văn nội dung dưới đây vào ô <strong>Instructions (Hướng dẫn hệ thống)</strong> khi tạo Gem trên Google Gemini và đính kèm tệp PDF/Docs tóm tắt bài học của từng khối lớp.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy("gem-system-instructions", TEACHER_GEM_SYSTEM_INSTRUCTIONS)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
            >
              {copiedId === "gem-system-instructions" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Đã sao chép Gem Instructions
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép nguyên văn Gem Instructions
                </>
              )}
            </button>
          </div>
          <pre className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-800 whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
            {TEACHER_GEM_SYSTEM_INSTRUCTIONS}
          </pre>
        </div>
      )}

      {/* 7-Step Workflow & Gem Link + Fallback Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          {/* Teacher Gem Link Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              1. Liên kết mở Gem do Giáo viên cấu hình
            </h2>
            <p className="text-xs text-slate-600">
              Giáo viên có thể cập nhật đường dẫn Gem chia sẻ cho lớp tại đây:
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Nhập URL Gem cụ thể đã được Giáo viên cấu hình..."
                value={teacherGemUrl}
                onChange={(e) => setTeacherGemUrl(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
              />
              {isGemUrlValid ? (
                <a
                  href={teacherGemUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở Gem
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Chưa cấu hình URL Gem cụ thể. Vui lòng dùng 8 câu lệnh mẫu bên phải hoặc Xưởng Trò Chơi."
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-500 cursor-not-allowed shrink-0"
                >
                  Chưa cấu hình URL
                </button>
              )}
            </div>

            {/* Honest Fallback Workflow when student account cannot access Gemini/Gem (Section 1 & 9) */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Phương án dự phòng khi tài khoản học sinh không mở được Gem:
              </div>
              <p>
                Nếu tài khoản Google Workspace của trường giới hạn độ tuổi hoặc chưa bật quyền truy cập Gemini/Gem được chia sẻ:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Cách 1:</strong> Sử dụng trực tiếp 2 mẫu khung HTML chuẩn (Quiz 10 câu & Mô phỏng 3 nhiệm vụ) có sẵn trong{" "}
                  <Link href="/hoc-sinh/xuong-tro-choi" className="underline font-semibold">
                    Xưởng Trò Chơi
                  </Link>{" "}
                  để tự thay câu hỏi và màu sắc mà không cần gọi AI.
                </li>
                <li>
                  <strong>Cách 2:</strong> Sao chép câu lệnh (Prompt) đã điền ở trang này gửi cho Giáo viên trong giờ thực hành tại phòng máy để chạy chung dưới sự giám sát của Giáo viên.
                </li>
              </ul>
            </div>
          </div>

          {/* 7-Step Student Process (Section 9) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              2. Quy trình 7 bước Sáng tạo cùng AI an toàn
            </h2>
            <ol className="space-y-2 text-xs text-slate-700 list-decimal pl-4">
              <li>
                <strong>Chọn chủ đề và bài học</strong> trong chương trình Tin học của lớp em.
              </li>
              <li>
                <strong>Mở Gem</strong> bằng nút phía trên hoặc chọn một trong <strong>8 câu lệnh mẫu (Prompt)</strong> bên phải.
              </li>
              <li>
                <strong>Dán nội dung kiến thức</strong> từ sách giáo khoa hoặc tài liệu của giáo viên vào biến <code>[Nguồn kiến thức]</code>.
              </li>
              <li>
                <strong>Nhận ý tưởng, bộ câu hỏi hoặc mã HTML</strong> từ Gem (yêu cầu duy nhất 1 tệp HTML tự chứa).
              </li>
              <li>
                <strong>Tự kiểm tra lại kiến thức</strong> với SGK và chạy thử sản phẩm trong khung Sandbox cô lập.
              </li>
              <li>
                <strong>Tự chỉnh sửa ít nhất 3 phần</strong> (nội dung câu hỏi, màu sắc, hoặc luật tính điểm) để hiểu rõ mã nguồn.
              </li>
              <li>
                <strong>Gửi sản phẩm lên Xưởng Trò Chơi</strong> kèm bản thuyết minh sử dụng AI để chờ Giáo viên duyệt.
              </li>
            </ol>
          </div>

          {/* Mandatory Verification & Privacy Checklist */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              3. Bảng kiểm bắt buộc trước khi nộp sản phẩm
            </h2>
            <ul className="space-y-2 text-xs text-slate-700">
              {STUDENT_AI_SAFETY_CHECKLIST.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Variable Builder + All 8 Prompt Templates */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Placeholder Inputs */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bộ điền biến thông minh cho 8 Prompt Học Sinh
              </h2>
              <p className="text-xs text-slate-500">
                Mọi thay đổi ở 5 ô dưới đây sẽ tự động điền vào vị trí <code>[Lớp]</code>,{" "}
                <code>[Bài học]</code>, <code>[Nguồn kiến thức]</code>,{" "}
                <code>[Mục tiêu]</code>, <code>[Ý tưởng]</code> của cả 8 Prompt mẫu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biến [Lớp]
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biến [Bài học]
                </label>
                <input
                  type="text"
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Biến [Nguồn kiến thức] (Dán tóm tắt từ SGK hoặc vở ghi — Không dán thông tin cá nhân)
              </label>
              <textarea
                rows={2}
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biến [Mục tiêu]
                </label>
                <textarea
                  rows={2}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biến [Ý tưởng] / Vấn đề cần hỏi
                </label>
                <textarea
                  rows={2}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* All 8 Prompt Templates Cards */}
          <div className="space-y-3">
            {STUDENT_PROMPT_TEMPLATES.map((tpl) => {
              const renderedPrompt = fillTemplate(tpl.template);
              const isCopied = copiedId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
                        Prompt #{tpl.number} • {tpl.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-slate-500">{tpl.purpose}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(tpl.id, renderedPrompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Sao chép Prompt #{tpl.number}
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {renderedPrompt}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}

