"use client";

import React, { useState } from "react";
import { useRole } from "@/context/RoleContext";
import { Sparkles, X, Send, Maximize2 } from "lucide-react";
import Link from "next/link";

export function FloatingAIAssistant() {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([
    {
      role: "assistant",
      text:
        role === "STUDENT"
          ? "Chào em! Thầy là Trợ lý AI Socratic của UNIGO. Thầy không giải bài hộ mà sẽ cùng em đặt câu hỏi gợi mở để tự tìm ra cách làm. Em đang cần tìm hiểu bài nào hôm nay?"
          : role === "TEACHER"
          ? "Kính chào Thầy/Cô! Trợ lý chuyên môn sẵn sàng hỗ trợ soạn rubric, phân tích bài nộp hoặc sinh câu hỏi phân hóa."
          : role === "PARENT"
          ? "Kính chào Quý phụ huynh! Tôi là trợ lý giải thích báo cáo học tập chính thức của con và gợi ý câu hỏi đồng hành tại nhà."
          : "Chào Quản trị viên! Tôi có thể hỗ trợ tra cứu nhật ký đồng bộ hoặc giải thích thông số hệ thống.",
    },
  ]);

  const handleSend = async (customQuery?: string) => {
    const userText = (customQuery ?? input).trim();
    if (!userText) return;
    if (!customQuery) setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          roleContext: role,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            data.reply ||
            "Vui lòng đăng nhập để sử dụng Trợ lý AI Socratic của UNIGO.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Không thể kết nối máy chủ AI lúc này. Vui lòng thử lại sau.",
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-teal text-white shadow-dialog hover:bg-brand-teal-hover transition-colors"
        >
          <Sparkles className="w-4 h-4 text-brand-teal-soft" />
          <span className="text-xs font-semibold tracking-wide">
            Trợ lý AI Socratic
          </span>
          <span className="w-2 h-2 rounded-full bg-status-success"></span>
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] h-[500px] max-h-[80vh] bg-surface rounded-panel border border-border shadow-dialog flex flex-col overflow-hidden">
          <div className="p-3.5 bg-canvas border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-button bg-brand-teal text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span>Trợ lý AI • UNIGO</span>
                  <span className="text-[10px] bg-brand-teal-soft text-brand-teal font-medium px-1.5 py-0.5 rounded">
                    Socratic Mode
                  </span>
                </h4>
                <p className="text-[10px] text-ink-muted">
                  {role === "STUDENT"
                    ? "Đồng hành gợi mở • Không giải hộ"
                    : "Hỗ trợ chuyên môn"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/hoc-sinh/ai-tutor"
                title="Mở toàn màn hình"
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-muted rounded"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-muted rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-canvas/30 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-panel leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-teal text-white"
                      : "bg-surface border border-border text-ink shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-surface border-t border-border/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-brand-teal">
            {role === "STUDENT" ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleSend("Gợi ý cho em 3 câu hỏi để phân tích bài Tin học 7")
                  }
                  className="px-2 py-1 bg-brand-teal-soft rounded whitespace-nowrap hover:bg-brand-teal-soft/80 font-medium"
                >
                  Câu hỏi gợi mở
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSend("Làm sao để tự đánh giá bài làm theo Rubric?")
                  }
                  className="px-2 py-1 bg-brand-teal-soft rounded whitespace-nowrap hover:bg-brand-teal-soft/80 font-medium"
                >
                  Kiểm tra Rubric
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleSend("Đề xuất nhận xét khích lệ cho bài nộp dự án")
                  }
                  className="px-2 py-1 bg-brand-teal-soft rounded whitespace-nowrap hover:bg-brand-teal-soft/80 font-medium"
                >
                  Gợi ý nhận xét
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSend("Sinh câu hỏi vận dụng thực tiễn môn Tin học 7")
                  }
                  className="px-2 py-1 bg-brand-teal-soft rounded whitespace-nowrap hover:bg-brand-teal-soft/80 font-medium"
                >
                  Sinh câu hỏi phân hóa
                </button>
              </>
            )}
          </div>

          <div className="p-2.5 bg-surface border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập câu hỏi hoặc yêu cầu..."
              className="flex-1 px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-brand-teal"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="p-2 rounded-button bg-brand-teal text-white hover:bg-brand-teal-hover transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
