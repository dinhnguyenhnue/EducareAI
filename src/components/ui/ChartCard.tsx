"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export interface ChartDatum {
  label: string;
  value: number;
  max?: number;
  hint?: string;
  tone?: ModuleToneKey;
}

export function ChartCard({
  title,
  subtitle,
  data,
  unit = "",
  tone = "overview",
  variant = "horizontal",
  emptyMessage = "Chưa có dữ liệu thống kê để hiển thị biểu đồ.",
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  unit?: string;
  tone?: ModuleToneKey;
  variant?: "horizontal" | "vertical";
  emptyMessage?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const theme = getModuleTheme(tone);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue =
    data.length > 0
      ? Math.max(...data.map((d) => (typeof d.max === "number" ? d.max : d.value)), 1)
      : 1;

  return (
    <section
      className={cn(
        "p-5 sm:p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between gap-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/80">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {data.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu biểu đồ" description={emptyMessage} tone={tone} />
      ) : variant === "vertical" ? (
        <div className="pt-2">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1">
            {data.map((item, idx) => {
              const barTheme = item.tone ? getModuleTheme(item.tone) : theme;
              const pct = Math.max(4, Math.min(100, Math.round((item.value / maxValue) * 100)));
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 group relative"
                >
                  {isHovered && (
                    <div className="absolute -top-2 z-10 px-2 py-1 rounded-lg bg-ocean-navy text-white text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none">
                      {item.label}: {item.value}
                      {unit}
                      {item.hint ? ` (${item.hint})` : ""}
                    </div>
                  )}
                  <span className="text-[11px] font-bold font-mono text-ink tabular-nums">
                    {item.value}
                    {unit}
                  </span>
                  <div className="w-full max-w-[44px] flex-1 flex items-end rounded-t-xl bg-surface-muted/80 overflow-hidden p-0.5">
                    <m.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ ...OCEAN_TRANSITION.chart, delay: idx * 0.05 }}
                      className={cn(
                        "w-full rounded-t-[10px] transition-opacity",
                        barTheme.barFill,
                        isHovered ? "opacity-100" : "opacity-90"
                      )}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-ink-muted text-center truncate max-w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {data.map((item, idx) => {
            const barTheme = item.tone ? getModuleTheme(item.tone) : theme;
            const denom = typeof item.max === "number" && item.max > 0 ? item.max : maxValue;
            const pct = Math.max(0, Math.min(100, Math.round((item.value / denom) * 100)));
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink truncate">{item.label}</span>
                  <span className="font-mono font-bold text-ink tabular-nums shrink-0">
                    {item.value}
                    {unit}
                    {item.hint && (
                      <span className="font-sans font-normal text-[11px] text-ink-muted ml-1.5">
                        • {item.hint}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-muted overflow-hidden border border-border/50">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...OCEAN_TRANSITION.chart, delay: idx * 0.05 }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      barTheme.barFill,
                      hoveredIdx === idx ? "brightness-105" : ""
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

