"use client";

import React from "react";
import { m } from "framer-motion";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 6,
  colorHex = "#10B981",
  label,
}: {
  percent: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  colorHex?: string;
  label?: string;
}) {
  const validPercent =
    typeof percent === "number" && Number.isFinite(percent)
      ? Math.max(0, Math.min(100, percent))
      : null;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    validPercent === null ? circumference : circumference * (1 - validPercent / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={label || (validPercent !== null ? `${validPercent}%` : "Chưa có dữ liệu")}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {validPercent !== null && (
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={OCEAN_TRANSITION.chart}
          />
        )}
      </svg>
      <span className="absolute text-xs font-extrabold font-mono text-ink tabular-nums">
        {validPercent !== null ? `${Math.round(validPercent)}%` : "--"}
      </span>
    </div>
  );
}

export function ProgressCard({
  title,
  subtitle,
  percent,
  detail,
  tone = "progress",
  showRing = false,
  className,
}: {
  title: string;
  subtitle?: string;
  percent: number | null | undefined;
  detail?: string | null;
  tone?: ModuleToneKey;
  showRing?: boolean;
  className?: string;
}) {
  const theme = getModuleTheme(tone);
  const validPercent =
    typeof percent === "number" && Number.isFinite(percent)
      ? Math.max(0, Math.min(100, percent))
      : null;

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-canvas/70 border border-border/80 flex items-center gap-4",
        className
      )}
    >
      {showRing && (
        <ProgressRing
          percent={validPercent}
          colorHex={theme.hex}
          size={56}
          strokeWidth={5.5}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate">{title}</p>
            {subtitle && (
              <p className="text-[11px] text-ink-muted truncate">{subtitle}</p>
            )}
          </div>
          <span
            className={cn(
              "text-xs font-extrabold font-mono tabular-nums shrink-0",
              validPercent !== null ? theme.text : "text-ink-muted"
            )}
          >
            {validPercent !== null ? `${validPercent}%` : "Chưa có dữ liệu"}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden border border-border/50">
          {validPercent !== null && (
            <m.div
              className={cn("h-full rounded-full", theme.barFill)}
              initial={{ width: 0 }}
              animate={{ width: `${validPercent}%` }}
              transition={OCEAN_TRANSITION.chart}
            />
          )}
        </div>

        {detail && (
          <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed line-clamp-2">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

