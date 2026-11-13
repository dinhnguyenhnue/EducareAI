"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { modalPanelVariants, OCEAN_TRANSITION } from "@/lib/motion";
import { Sparkles, X, Send, Maximize2 } from "lucide-react";

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
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <m.button
            key="ai-fab"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={OCEAN_TRANSITION.micro}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-ai text-white shadow-ai hover:brightness-105 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-bold tracking-wide">
              Trợ lý AI Socratic
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
          </m.button>
        ) : (
          <m.div
            key="ai-panel"
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-[calc(100vw-2.5rem)] sm:w-[390px] h-[510px] max-h-[82vh] bg-surface rounded-panel border border-violet-200 shadow-dialog flex flex-col overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-ai text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <span>Trợ lý AI • UNIGO</span>
                    <span className="text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full">
                      Socratic
                    </span>
                  </h4>
                  <p className="text-[10px] text-white/80">
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
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Thu nhỏ trợ lý AI"
                  title="Thu nhỏ"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-canvas/50 text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-ocean-600 text-white rounded-br-sm"
                        : "bg-surface border border-border text-ink shadow-xs rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 bg-surface border-t border-border/70 flex items-center gap-1.5 overflow-x-auto text-[11px] text-violet-700">
              {role === "STUDENT" ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend("Gợi ý cho em 3 câu hỏi để phân tích bài Tin học 7")
                    }
                    className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full whitespace-nowrap hover:bg-violet-100 font-semibold transition-colors"
                  >
                    Câu hỏi gợi mở
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend("Làm sao để tự đánh giá bài làm theo Rubric?")
                    }
                    className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full whitespace-nowrap hover:bg-violet-100 font-semibold transition-colors"
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
                    className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full whitespace-nowrap hover:bg-violet-100 font-semibold transition-colors"
                  >
                    Gợi ý nhận xét
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSend("Sinh câu hỏi vận dụng thực tiễn môn Tin học 7")
                    }
                    className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full whitespace-nowrap hover:bg-violet-100 font-semibold transition-colors"
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
                className="flex-1 px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                aria-label="Gửi tin nhắn"
                className="p-2.5 rounded-button bg-gradient-ai text-white hover:brightness-105 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
