"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, MessageSquareQuote, Flame, Gamepad2 } from "lucide-react";

const AI_CENTER_TABS = [
  {
    id: "assistant",
    label: "1. Trợ lý bài học & Danh mục Gem",
    href: "/hoc-sinh/gemini-gems",
    matchPaths: ["/hoc-sinh/gemini-gems", "/hoc-sinh/ai-tutor"],
    icon: Flame,
    desc: "Cổng tích hợp AI/Gem theo môn & chế độ sao chép Prompt dự phòng",
  },
  {
    id: "prompt-lab",
    label: "2. Thư viện & Trình tạo Prompt",
    href: "/hoc-sinh/prompt-lab",
    matchPaths: ["/hoc-sinh/prompt-lab"],
    icon: MessageSquareQuote,
    desc: "Mẫu câu lệnh Socratic theo bài học & công cụ lắp ghép 4 thành phần",
  },
  {
    id: "html-creator",
    label: "3. Sáng tạo sản phẩm HTML (8 Prompt)",
    href: "/hoc-sinh/sang-tao-cung-ai",
    matchPaths: ["/hoc-sinh/sang-tao-cung-ai"],
    icon: Sparkles,
    desc: "Bộ biến thông minh tạo trò chơi HTML chạy trong Sandbox cô lập",
  },
];

export function StudentAiCenterTabs() {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2.5 mb-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-brand-teal-soft text-brand-teal">
            <Sparkles className="w-3.5 h-3.5" />
            TRUNG TÂM TRỢ LÝ & HỌC LIỆU AI
          </span>
          <span className="text-xs text-ink-muted">
            Tích hợp theo ngữ cảnh bài học — Minh bạch trạng thái kết nối
          </span>
        </div>
        <Link
          href="/hoc-sinh/xuong-tro-choi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Mở Xưởng Trò Chơi HTML Sandbox →</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {AI_CENTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matchPaths.some(
            (p) => pathname === p || pathname.startsWith(p + "/")
          );
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                isActive
                  ? "bg-brand-teal-soft/70 border-brand-teal text-ink shadow-sm"
                  : "bg-canvas border-border hover:bg-surface-muted text-ink-muted hover:text-ink"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isActive ? "text-brand-teal" : "text-ink-muted"
                }`}
              />
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    isActive ? "text-brand-teal" : "text-ink"
                  }`}
                >
                  {tab.label}
                </div>
                <div className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                  {tab.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

