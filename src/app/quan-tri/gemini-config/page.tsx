import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Sparkles, CheckCircle2, ShieldCheck, MessageSquareQuote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminGeminiConfigPage() {
  const [prompts, posts] = await Promise.all([
    prisma.promptTemplate.findMany({
      include: { author: true, subject: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.communityPost.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="aiTutor"
          badge="AI Governance"
          badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
          title="Cấu hình Gemini AI, Gem Registry & Kiểm duyệt Cộng đồng"
          description="Quản lý phương thức Socratic, bảo vệ quyền riêng tư hội thoại học sinh và kiểm duyệt Thư viện Prompt."
        />

        {/* AI Governance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">Kết nối Gemini API Server</span>
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-sm font-bold text-violet-700">
              {hasGeminiKey
                ? "GEMINI_API_KEY Active"
                : "Socratic Pedagogical Engine (Local Fallback Ready)"}
            </div>
            <p className="text-[11px] text-ink-muted">
              Không bao giờ lộ API Key ở phía trình duyệt người dùng.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">Bảo vệ Quyền riêng tư Trẻ em</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-emerald-700">
              Cô lập Lịch sử Chat AI Học sinh
            </div>
            <p className="text-[11px] text-ink-muted">
              Phụ huynh và chế độ Multi-View mặc định không xem trộm hội thoại riêng tư của học sinh.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">Thư viện Prompt & Cộng đồng</span>
              <MessageSquareQuote className="w-4 h-4 text-fuchsia-600" />
            </div>
            <div className="text-sm font-bold text-ink font-mono">
              {prompts.length} Prompt mẫu • {posts.length} Bài đăng
            </div>
            <p className="text-[11px] text-ink-muted">
              Đã kiểm duyệt theo tiêu chuẩn sư phạm Tổ THCS UNIGO.
            </p>
          </div>
        </div>

        {/* Prompt Templates Table */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border">
            Danh mục Prompt Sư phạm đã xuất bản ({prompts.length})
          </h2>
          <div className="divide-y divide-border/60 text-xs">
            {prompts.map((p) => (
              <div
                key={p.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{p.title}</span>
                    <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      Khối {p.gradeLevel || 7} • {p.difficulty}
                    </span>
                  </div>
                  <p className="text-ink-muted line-clamp-2">{p.promptContent}</p>
                </div>
                <span className="text-[11px] font-semibold text-status-success bg-status-success-soft px-2.5 py-1 rounded shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {p.status} ({p.useCount} lượt dùng)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

