import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Flame,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function GeminiGemsCatalogPage() {
  const gemList = [
    {
      id: "gem-tin-7",
      title: "Gem Tin học 7 — UNIGO Assistant",
      subject: "Tin học",
      grade: 7,
      desc: "Trợ lý chuyên sâu về bảng tính điện tử, tư duy thuật toán và an toàn thông tin số.",
      gemUrl: "https://gemini.google.com/gems",
      isConfigured: true,
    },
    {
      id: "gem-toan-7",
      title: "Gem Toán 7 — Logic & Tỉ lệ thức",
      subject: "Toán học",
      grade: 7,
      desc: "Hỗ trợ phân tích bài toán thực tế, kiểm tra cách giải từng bước mà không đưa đáp án ngay.",
      gemUrl: "https://gemini.google.com/gems",
      isConfigured: true,
    },
    {
      id: "gem-van-7",
      title: "Gem Ngữ văn 7 — Phản biện & Nghị luận",
      subject: "Ngữ văn",
      grade: 7,
      desc: "Gợi ý cấu trúc dàn ý, cách mở rộng góc nhìn và kiểm tra dẫn chứng văn bản.",
      gemUrl: "https://gemini.google.com/gems",
      isConfigured: true,
    },
    {
      id: "gem-tin-6",
      title: "Gem Tin học 6 — Khởi đầu Kỷ nguyên số",
      subject: "Tin học",
      grade: 6,
      desc: "Giải thích khái niệm công nghệ bằng ngôn ngữ trực quan, dễ hiểu.",
      gemUrl: "https://gemini.google.com/gems",
      isConfigured: false,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Gemini Gems — Bộ Gem chuyên biệt theo Môn</h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Phương thức A: Liên kết Google Gem
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Mỗi môn học có một cấu hình Gem riêng do giáo viên UNIGO chuẩn bị sẵn. Học sinh mở bằng tài khoản Google trường.
          </p>
        </div>

        {/* Fallback Notice per Architecture */}
        <div className="p-4 rounded-panel bg-brand-teal-soft/60 border border-brand-teal/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
          <div className="text-xs text-ink space-y-1">
            <p className="font-bold text-brand-teal">Phương án vận hành thực tế (Không giả lập API):</p>
            <p>
              Gemini Gems là tính năng giao diện người dùng của Google, không có API tự động quản trị trong tài khoản học sinh. Nếu em không thể truy cập Gem qua Google, em có thể sử dụng ngay{" "}
              <Link href="/hoc-sinh/ai-tutor" className="font-bold text-brand-teal underline">
                Trợ lý AI nội bộ của EDUCARE AI (Gemini API)
              </Link>{" "}
              đã được tích hợp sẵn 100% trong nền tảng.
            </p>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gemList.map((gem) => (
            <div
              key={gem.id}
              className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold bg-canvas text-ink px-2.5 py-1 rounded border border-border">
                    {gem.subject} • Khối {gem.grade}
                  </span>
                  <Flame className="w-4 h-4 text-brand-teal" />
                </div>

                <h3 className="text-base font-bold text-ink">{gem.title}</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">{gem.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-medium text-status-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã cấu hình
                </span>

                <a
                  href={gem.gemUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5"
                >
                  <span>Mở Gem</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Activation Guide Card */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <span>Hướng dẫn 3 bước kích hoạt Gem trên tài khoản học sinh</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ink">
            <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-brand-teal">Bước 1: Đăng nhập Google</span>
              <p className="text-ink-muted">
                Đăng nhập tài khoản email UNIGO (@unigo.edu.vn) hoặc tài khoản học tập được cấp phép.
              </p>
            </div>

            <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-brand-teal">Bước 2: Mở liên kết Gem</span>
              <p className="text-ink-muted">
                Nhấn "Mở Gem" ở danh mục phía trên để nạp cấu hình chỉ dẫn sư phạm từ giáo viên.
              </p>
            </div>

            <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
              <span className="font-bold text-brand-teal">Bước 3: Lưu vào danh sách</span>
              <p className="text-ink-muted">
                Nhấn biểu tượng Pin/Lưu trên Gemini Web để Gem hiển thị ở thanh bên của em.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

