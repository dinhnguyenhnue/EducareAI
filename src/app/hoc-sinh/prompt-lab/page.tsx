"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudentAiCenterTabs } from "@/components/ai/StudentAiCenterTabs";
import { PageHeader } from "@/components/ui";
import {
  MessageSquareQuote,
  Sparkles,
  Copy,
  Check,
  Send,
  BookOpen,
  Filter,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"library" | "builder">("library");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Builder States
  const [role, setRole] = useState("Một chuyên gia phản biện học thuật thân thiện");
  const [context, setContext] = useState("Học sinh lớp 7 đang học môn Tin học về phân tích dữ liệu bảng tính");
  const [task, setTask] = useState("Kiểm tra tính logic của bảng dữ liệu và đặt 3 câu hỏi gợi ý cải thiện");
  const [outputFormat, setOutputFormat] = useState("Dạng gạch đầu dòng, kèm lời giải thích ngắn gọn");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [submittedToReview, setSubmittedToReview] = useState(false);

  const samplePrompts = [
    {
      id: "p1",
      title: "Gia sư Socratic: Gợi ý tìm lời giải Tin học",
      subject: "Tin học",
      grade: 7,
      difficulty: "Trung bình",
      content:
        "Bạn là gia sư Socratic môn Tin học cho học sinh lớp 7 trường UNIGO. Hãy giải thích khái niệm [KHÁI_NIỆM] không bằng cách đưa định nghĩa sẵn, mà bằng cách đặt 3 câu hỏi liên hệ với thực tế đời sống để tôi tự suy luận ra câu trả lời.",
      author: "Thầy Trần Minh Tuấn (GV Tin học)",
      useCount: 42,
    },
    {
      id: "p2",
      title: "Trợ lý Phản biện: Kiểm chứng tin giả trên mạng",
      subject: "Tin học / Xã hội",
      grade: 7,
      difficulty: "Cơ bản",
      content:
        "Tôi có đoạn tin tức sau: [ĐOẠN_TIN]. Hãy giúp tôi đóng vai một biên tập viên kiểm chứng thông tin: chỉ ra 3 điểm nghi vấn cần kiểm tra nguồn, ai là tác giả và có dấu hiệu giật gân/sai lệch nào không?",
      author: "Thầy Trần Minh Tuấn",
      useCount: 29,
    },
    {
      id: "p3",
      title: "Cố vấn Dàn ý Nghị luận Xã hội",
      subject: "Ngữ văn",
      grade: 7,
      difficulty: "Nâng cao",
      content:
        "Tôi đang viết bài văn nghị luận về chủ đề [CHỦ_ĐỀ]. Hãy giúp tôi phân tích 2 góc nhìn trái chiều về vấn đề này và gợi ý 1 câu hỏi phản đề để bài viết có chiều sâu tư duy.",
      author: "Cô Phạm Thu Hà (GV Ngữ văn)",
      useCount: 38,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleBuildPrompt = () => {
    const full = `[VAI TRÒ]: Bạn là ${role}.
[BỐI CẢNH]: ${context}.
[NHIỆM VỤ]: ${task}.
[ĐỊNH DẠNG ĐẦU RA]: ${outputFormat}.
[TIÊU CHÍ UNIGO]: Không giải hộ trực tiếp; hãy đặt câu hỏi gợi mở và khuyến khích học sinh tự kiểm tra lại kết quả.`;
    setGeneratedPrompt(full);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <StudentAiCenterTabs />
        <PageHeader
          tone="promptLab"
          badge="UNIGO Innovation Hub"
          badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
          title="Prompt Lab — Không gian sáng tạo với AI"
          description="Học sinh UNIGO không chỉ dùng AI mà phải làm chủ kỹ năng ra lệnh (Prompt Engineering) và chịu trách nhiệm với sản phẩm."
          actions={
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "library"
                    ? "bg-white text-fuchsia-700 shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Thư viện Prompt mẫu
              </button>
              <button
                onClick={() => {
                  setActiveTab("builder");
                  if (!generatedPrompt) handleBuildPrompt();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "builder"
                    ? "bg-white text-fuchsia-700 shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trình tạo Prompt (Builder)</span>
              </button>
            </div>
          }
        />

        {activeTab === "library" ? (
          /* Tab 1: Library */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {samplePrompts.map((p) => (
                <div
                  key={p.id}
                  className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-fuchsia-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2.5 py-0.5 rounded-full">
                        {p.subject} • Khối {p.grade}
                      </span>
                      <span className="text-[11px] text-ink-muted font-medium">{p.difficulty}</span>
                    </div>

                    <h3 className="text-base font-bold text-ink">{p.title}</h3>
                    <div className="mt-3 p-3 rounded-xl bg-canvas border border-slate-200/80 text-xs text-ink-muted font-mono leading-relaxed line-clamp-4">
                      {p.content}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Tác giả: {p.author}</span>
                      <span>{p.useCount} lượt áp dụng</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(p.id, p.content)}
                      className="px-3.5 py-1.5 rounded-xl bg-canvas hover:bg-fuchsia-50/60 border border-slate-200 text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === p.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-fuchsia-600" />
                          <span>Sao chép Prompt</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setTask(p.content);
                        setActiveTab("builder");
                      }}
                      className="text-xs font-semibold text-fuchsia-700 hover:underline"
                    >
                      Tùy biến →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Tab 2: Prompt Builder */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-600" />
                <span>Cấu trúc 4 thành phần của một Prompt chuẩn UNIGO</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">1. Vai trò của AI (Role):</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">2. Bối cảnh của em (Context):</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">3. Nhiệm vụ cụ thể (Task):</label>
                <textarea
                  rows={3}
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full p-3 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">4. Định dạng đầu ra mong muốn:</label>
                <input
                  type="text"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <button
                onClick={handleBuildPrompt}
                className="w-full py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm"
              >
                Tạo cấu trúc Prompt hoàn chỉnh
              </button>
            </div>

            {/* Generated Prompt Output & Moderation Submit */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-slate-200 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                    Kết quả Prompt hoàn thiện
                  </h3>
                  <button
                    onClick={() => handleCopy("generated", generatedPrompt)}
                    className="text-xs text-fuchsia-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    {copiedId === "generated" ? "Đã sao chép" : "Sao chép"}
                  </button>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-canvas border border-slate-200 font-mono text-xs text-ink leading-relaxed whitespace-pre-line min-h-[220px]">
                  {generatedPrompt || "Nhấn 'Tạo cấu trúc Prompt' để xem kết quả..."}
                </div>

                {/* Socratic Improvement Suggestion */}
                <div className="mt-4 p-3.5 rounded-xl bg-fuchsia-50/60 border border-fuchsia-200 text-xs text-ink space-y-1">
                  <span className="font-bold text-fuchsia-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
                    <span>AI Gợi ý cải tiến:</span>
                  </span>
                  <p>
                    Prompt của em đã có đủ bối cảnh. Để trả lời sâu hơn, hãy thử thêm: "Yêu cầu AI chỉ ra 1 sai lầm thường gặp của học sinh lớp 7 khi làm dạng bài này".
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                {submittedToReview ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Đã gửi yêu cầu duyệt vào thư viện trường (chờ giáo viên xét duyệt).
                  </span>
                ) : (
                  <>
                    <span className="text-[11px] text-ink-muted">
                      Em có thể chia sẻ prompt này với các bạn UNIGO
                    </span>
                    <button
                      onClick={() => setSubmittedToReview(true)}
                      className="px-4 py-2 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi duyệt thư viện</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

