"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import {
  Sparkles,
  Send,
  Lightbulb,
  Bot,
  User as UserIcon,
  RotateCcw,
} from "lucide-react";

export default function StudentAITutorPage() {
  const [selectedSubject, setSelectedSubject] = useState("TIN7");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; time: string }>>([
    {
      role: "assistant",
      text: "Chào Minh Anh! Thầy là Trợ lý AI đồng hành môn Tin học 7 của UNIGO. Thầy ở đây để cùng em tìm tòi và đặt câu hỏi gợi mở, giúp em tự xây dựng kiến thức và tạo ra sản phẩm của riêng mình. Em muốn cùng thầy thảo luận về nội dung nào hôm nay?",
      time: "14:30",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const subjects = [
    { id: "TIN7", name: "Tin học 7", teacher: "Thầy Trần Minh Tuấn", topic: "Bảng tính và phân tích dữ liệu" },
    { id: "TOAN7", name: "Toán 7", teacher: "Cô Hoàng Mai Lan", topic: "Tỉ lệ thức và bài toán thực tế" },
    { id: "VAN7", name: "Ngữ văn 7", teacher: "Cô Phạm Thu Hà", topic: "Nghị luận xã hội và phản biện" },
  ];

  const suggestedQuestions = {
    TIN7: [
      "Làm sao để biết khi nào nên vẽ biểu đồ cột, khi nào nên vẽ biểu đồ tròn?",
      "Em muốn bảo mật mật khẩu tài khoản học tập thì nên đặt quy tắc thế nào?",
      "Tại sao khi copy công thức trong Excel thì địa chỉ ô lại tự thay đổi?",
    ],
    TOAN7: [
      "Làm thế nào để nhận biết hai đại lượng tỉ lệ thuận hay nghịch trong đời sống?",
      "Gợi ý cho em cách lập luận bài toán chia kinh phí câu lạc bộ.",
    ],
    VAN7: [
      "Làm sao để luận điểm trong bài văn nghị luận không bị chung chung?",
      "Cách đưa dẫn chứng từ sự kiện thực tế để tăng tính thuyết phục?",
    ],
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      role: "user" as const,
      text: query,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let response = "";
      if (selectedSubject === "TIN7") {
        response = `Câu hỏi rất hay! Để trả lời điều này, em hãy thử nhớ lại: biểu đồ cột thường so sánh các đại lượng riêng biệt (như điểm số từng môn), còn biểu đồ tròn lại thể hiện tỉ lệ phần trăm của các phần trong một tổng thể (như ngân sách 100%). Theo em, nếu muốn biểu diễn cơ cấu thời gian tự học trong ngày, ta nên chọn loại nào?`;
      } else if (selectedSubject === "TOAN7") {
        response = `Để giải bài toán này theo phương pháp UNIGO, bước 1 em hãy gọi các phần cần tìm là x, y, z. Sau đó thiết lập dãy tỉ số bằng nhau. Em đã tìm ra tổng x + y + z bằng bao nhiêu chưa?`;
      } else {
        response = `Để luận điểm sắc bén, em có thể áp dụng mô hình 'Khẳng định - Giải thích - Dẫn chứng thực tế - Phản đề'. Em dự định đưa ra ví dụ nào trong đời sống học đường của chính mình?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="aiTutor"
          badge="Socratic Pedagogical Engine"
          badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
          title="AI Tutor — Trợ lý học tập cá nhân hóa"
          description="Được định hướng theo phương pháp Tổ THCS: Không giải hộ • Gợi mở tư duy • Rèn luyện năng lực phản biện."
        />

        {/* 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
          {/* Left Panel: Subject selector & pedagogical config (4 cols) */}
          <div className="lg:col-span-4 bg-surface rounded-2xl border border-slate-200 shadow-card p-5 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  1. Chọn môn học đồng hành
                </h3>
                <div className="space-y-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSubject(s.id);
                        setMessages([
                          {
                            role: "assistant",
                            text: `Thầy đã chuyển sang ngữ cảnh môn ${s.name} (${s.topic}). Chúng ta cùng bắt đầu thảo luận nhé!`,
                            time: "Bây giờ",
                          },
                        ]);
                      }}
                      className={`w-full p-3.5 rounded-xl text-left text-xs transition-all flex flex-col gap-1 border ${
                        selectedSubject === s.id
                          ? "bg-violet-50 border-violet-400 text-violet-900 font-semibold shadow-xs ring-1 ring-violet-400/30"
                          : "bg-canvas border-slate-200 text-ink hover:bg-violet-50/40 hover:border-violet-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{s.name}</span>
                        <span className="text-[11px] font-mono text-ink-muted">{s.id}</span>
                      </div>
                      <span className="text-[11px] text-ink-muted">{s.teacher}</span>
                      <span className="text-[10px] font-medium text-violet-700 mt-0.5">
                        Chủ đề: {s.topic}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  2. Câu hỏi gợi mở thường gặp
                </h3>
                <div className="space-y-2">
                  {suggestedQuestions[selectedSubject as keyof typeof suggestedQuestions]?.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="w-full p-2.5 rounded-xl bg-canvas hover:bg-violet-50/70 border border-slate-200 hover:border-violet-200 text-left text-xs text-ink transition-all flex items-start gap-2 group"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                      <span className="group-hover:text-violet-800 leading-relaxed">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Standard Card */}
            <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-200 text-[11px] text-ink-muted space-y-1">
              <span className="font-bold text-violet-900 block">Tiêu chuẩn AI UNIGO:</span>
              <p>Mỗi câu trả lời đều có minh chứng, không phán xét năng lực và luôn khuyến khích tự thử nghiệm.</p>
            </div>
          </div>

          {/* Right Panel: Interactive Conversation Stream (8 cols) */}
          <div className="lg:col-span-8 bg-surface rounded-2xl border border-slate-200 shadow-card flex flex-col overflow-hidden">
            {/* Conversation Header */}
            <div className="p-4 bg-violet-50/40 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    AI Tutor • {subjects.find((s) => s.id === selectedSubject)?.name}
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Phong cách: Gợi mở từng bước • Cấp độ Lớp 7
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      role: "assistant",
                      text: "Cuộc trò chuyện đã được làm mới. Em muốn khám phá vấn đề gì tiếp theo?",
                      time: "Vừa xong",
                    },
                  ])
                }
                title="Làm mới hội thoại"
                className="p-2 rounded-xl text-ink-muted hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-canvas/40 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                      m.role === "user"
                        ? "bg-ocean-600"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className="max-w-[75%] space-y-1">
                    <div
                      className={`p-4 rounded-2xl leading-relaxed shadow-xs ${
                        m.role === "user"
                          ? "bg-ocean-600 text-white rounded-tr-none"
                          : "bg-surface border border-slate-200 text-ink rounded-tl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-ink-muted px-1 block">{m.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-violet-700 italic">
                  <Bot className="w-4 h-4 text-violet-600 animate-pulse" />
                  <span>Trợ lý AI đang suy nghĩ câu hỏi gợi ý...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3.5 bg-surface border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập câu hỏi hoặc trình bày cách hiểu của em về bài học..."
                className="flex-1 px-4 py-2.5 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                onClick={() => handleSend()}
                className="px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

