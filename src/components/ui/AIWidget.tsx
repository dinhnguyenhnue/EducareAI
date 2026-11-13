import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIWidget({
  title = "Trợ lý AI Socratic",
  badge = "AI Assistant",
  description,
  principle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: {
  title?: string;
  badge?: string;
  description: React.ReactNode;
  principle?: React.ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-panel bg-surface border border-violet-200 shadow-card overflow-hidden flex flex-col justify-between",
        className
      )}
    >
      <div className="bg-gradient-ai px-5 py-4 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold truncate">{title}</h3>
            <p className="text-[10px] text-white/85 truncate">UNIGO AI Pedagogy</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full shrink-0">
          {badge}
        </span>
      </div>

      <div className="p-5 space-y-3 text-xs text-ink leading-relaxed flex-1">
        <div>{description}</div>
        {principle && (
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-[11px] text-violet-950 leading-relaxed">
            {principle}
          </div>
        )}
      </div>

      {(primaryHref || secondaryHref) && (
        <div className="px-5 pb-5 space-y-2">
          {primaryHref && primaryLabel && (
            <Link
              href={primaryHref}
              className="w-full py-2.5 px-4 rounded-button bg-gradient-ai text-white text-xs font-semibold hover:brightness-105 transition-all shadow-ai/30 flex items-center justify-center gap-1.5"
            >
              <span>{primaryLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="w-full py-2 px-4 rounded-button bg-surface border border-border hover:bg-surface-muted text-ink text-xs font-semibold transition-colors flex items-center justify-center"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

