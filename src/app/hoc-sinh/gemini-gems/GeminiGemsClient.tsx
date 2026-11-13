"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StudentAiCenterTabs } from "@/components/ai/StudentAiCenterTabs";
import { PageHeader } from "@/components/ui";
import type { IntegrationSlotRecord } from "@/lib/integration-slots";
import {
  Flame,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Lock,
} from "lucide-react";

export function GeminiGemsClient({
  initialSlots,
}: {
  initialSlots: IntegrationSlotRecord[];
}) {
  const [slots] = useState<IntegrationSlotRecord[]>(initialSlots);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyPrompt = async (slotCode: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedCode(slotCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <StudentAiCenterTabs />

      <PageHeader
        tone="aiTutor"
        badge="Kiến trúc IntegrationSlot Minh bạch"
        badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
        title="Trợ lý Bài học & Cổng Tích hợp Gemini Gems (Integration Slots)"
        description="Mỗi khe tích hợp (Slot) chỉ hiển thị trạng thái Đã cấu hình khi Quản trị viên hoặc Giáo viên đã gắn liên kết Gem cụ thể và xác thực. Khi chưa cấu hình, hệ thống cung cấp sẵn Prompt chuẩn Socratic để sao chép trực tiếp."
      />

      {/* Honest Fallback Notice */}
      <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div className="text-xs text-ink space-y-1">
          <p className="font-bold text-violet-800">
            Cơ chế Vận hành Minh bạch (Không điều hướng sang trang chủ chung):
          </p>
          <p>
            Hệ thống không gắn đường dẫn chung <code>https://gemini.google.com/gems</code> để tránh việc học sinh bấm vào nhưng không thấy trợ lý môn học. Nếu một cổng đang ở trạng thái <strong>Chưa cấu hình (DISCONNECTED)</strong>, em hãy bấm <strong>Sao chép Prompt dự phòng</strong> hoặc sử dụng{" "}
            <Link
              href="/hoc-sinh/ai-tutor"
              className="font-bold text-violet-700 underline"
            >
              Trợ lý AI nội bộ
            </Link>{" "}
            và{" "}
            <Link
              href="/hoc-sinh/sang-tao-cung-ai"
              className="font-bold text-fuchsia-700 underline"
            >
              Sáng tạo sản phẩm HTML (8 Prompt)
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Integration Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slots.map((slot) => {
          const isConfigured =
            slot.status === "CONFIGURED" &&
            (slot.providerType === "GEMINI_API" || Boolean(slot.externalUrl));
          const isDisabled = slot.status === "DISABLED";

          return (
            <div
              key={slot.slotCode}
              className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-violet-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200">
                    {slot.subject}
                    {slot.grade ? ` • Khối ${slot.grade}` : ""}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">
                    {slot.slotCode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink">{slot.title}</h3>
                <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                  {slot.description}
                </p>

                {/* Fallback Prompt Box (Always available) */}
                <div className="mt-3 p-3 rounded-xl bg-canvas border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink">
                      Prompt Socratic dự phòng:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(slot.slotCode, slot.fallbackPrompt)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline"
                    >
                      {copiedCode === slot.slotCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted font-mono line-clamp-3">
                    {slot.fallbackPrompt}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {isConfigured ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã cấu hình ({slot.providerType})
                  </span>
                ) : isDisabled ? (
                  <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Đã tắt (DISABLED)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Chưa cấu hình (Chế độ Prompt)
                  </span>
                )}

                {isConfigured && slot.externalUrl ? (
                  <a
                    href={slot.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Mở Gem</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : isConfigured && slot.providerType === "GEMINI_API" ? (
                  <Link
                    href="/hoc-sinh/ai-tutor"
                    className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Mở AI Nội bộ</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Quản trị viên chưa gắn URL Gem cụ thể. Vui lòng dùng nút Sao chép Prompt phía trên."
                    className="px-3 py-2 rounded-xl bg-canvas border border-slate-200 text-ink-muted text-xs font-semibold cursor-not-allowed opacity-70"
                  >
                    Chưa gắn URL Gem
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activation Guide Card */}
      <div className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          <span>Hướng dẫn sử dụng Cổng tích hợp AI & Prompt dự phòng</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ink">
          <div className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-1.5">
            <span className="font-bold text-violet-700">
              Bước 1: Kiểm tra trạng thái Slot
            </span>
            <p className="text-ink-muted">
              Quan sát nhãn trạng thái: <strong>Đã cấu hình</strong> (có liên kết Gem xác thực hoặc API nội bộ) hoặc <strong>Chưa cấu hình (Chế độ Prompt)</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-1.5">
            <span className="font-bold text-violet-700">
              Bước 2: Sao chép Prompt Socratic
            </span>
            <p className="text-ink-muted">
              Khi cổng chưa gắn URL Gem riêng, nhấn <strong>Sao chép</strong> ở hộp Prompt dự phòng và điền nội dung bài học đang học vào ngoặc vuông.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-slate-200 space-y-1.5">
            <span className="font-bold text-violet-700">
              Bước 3: Đối chiếu kiến thức SGK
            </span>
            <p className="text-ink-muted">
              Mọi gợi ý từ AI chỉ mang tính tham khảo sư phạm. Em luôn đối chiếu lại với sách giáo khoa và bài giảng của thầy cô.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

