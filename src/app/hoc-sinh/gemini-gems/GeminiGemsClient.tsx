"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StudentAiCenterTabs } from "@/components/ai/StudentAiCenterTabs";
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

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">
            Trợ lý Bài học & Cổng Tích hợp Gemini Gems (Integration Slots)
          </h1>
          <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
            Kiến trúc IntegrationSlot Minh bạch
          </span>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Mỗi khe tích hợp (Slot) chỉ hiển thị trạng thái <strong>Đã cấu hình</strong> khi Quản trị viên hoặc Giáo viên đã gắn liên kết Gem cụ thể và xác thực. Khi chưa cấu hình, hệ thống cung cấp sẵn <strong>Prompt chuẩn Socratic</strong> để sao chép trực tiếp.
        </p>
      </div>

      {/* Honest Fallback Notice */}
      <div className="p-4 rounded-panel bg-brand-teal-soft/60 border border-brand-teal/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
        <div className="text-xs text-ink space-y-1">
          <p className="font-bold text-brand-teal">
            Cơ chế Vận hành Minh bạch (Không điều hướng sang trang chủ chung):
          </p>
          <p>
            Hệ thống không gắn đường dẫn chung <code>https://gemini.google.com/gems</code> để tránh việc học sinh bấm vào nhưng không thấy trợ lý môn học. Nếu một cổng đang ở trạng thái <strong>Chưa cấu hình (DISCONNECTED)</strong>, em hãy bấm <strong>Sao chép Prompt dự phòng</strong> hoặc sử dụng{" "}
            <Link
              href="/hoc-sinh/ai-tutor"
              className="font-bold text-brand-teal underline"
            >
              Trợ lý AI nội bộ
            </Link>{" "}
            và{" "}
            <Link
              href="/hoc-sinh/sang-tao-cung-ai"
              className="font-bold text-brand-teal underline"
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
              className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold bg-canvas text-ink px-2.5 py-1 rounded border border-border">
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
                <div className="mt-3 p-3 rounded-lg bg-canvas border border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink">
                      Prompt Socratic dự phòng:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(slot.slotCode, slot.fallbackPrompt)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-teal hover:underline"
                    >
                      {copiedCode === slot.slotCode ? (
                        <>
                          <Check className="w-3 h-3 text-status-success" />
                          <span className="text-status-success">Đã chép</span>
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

              <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                {isConfigured ? (
                  <span className="text-[11px] font-semibold text-status-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã cấu hình ({slot.providerType})
                  </span>
                ) : isDisabled ? (
                  <span className="text-[11px] font-semibold text-status-danger flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Đã tắt (DISABLED)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-status-warning flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Chưa cấu hình (Chế độ Prompt)
                  </span>
                )}

                {isConfigured && slot.externalUrl ? (
                  <a
                    href={slot.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5"
                  >
                    <span>Mở Gem</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : isConfigured && slot.providerType === "GEMINI_API" ? (
                  <Link
                    href="/hoc-sinh/ai-tutor"
                    className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Mở AI Nội bộ</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Quản trị viên chưa gắn URL Gem cụ thể. Vui lòng dùng nút Sao chép Prompt phía trên."
                    className="px-3 py-2 rounded-button bg-canvas border border-border text-ink-muted text-xs font-semibold cursor-not-allowed opacity-70"
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
      <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-teal" />
          <span>Hướng dẫn sử dụng Cổng tích hợp AI & Prompt dự phòng</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ink">
          <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
            <span className="font-bold text-brand-teal">
              Bước 1: Kiểm tra trạng thái Slot
            </span>
            <p className="text-ink-muted">
              Quan sát nhãn trạng thái: <strong>Đã cấu hình</strong> (có liên kết Gem xác thực hoặc API nội bộ) hoặc <strong>Chưa cấu hình (Chế độ Prompt)</strong>.
            </p>
          </div>

          <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
            <span className="font-bold text-brand-teal">
              Bước 2: Sao chép Prompt Socratic
            </span>
            <p className="text-ink-muted">
              Khi cổng chưa gắn URL Gem riêng, nhấn <strong>Sao chép</strong> ở hộp Prompt dự phòng và điền nội dung bài học đang học vào ngoặc vuông.
            </p>
          </div>

          <div className="p-4 rounded-button bg-canvas border border-border space-y-1.5">
            <span className="font-bold text-brand-teal">
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

