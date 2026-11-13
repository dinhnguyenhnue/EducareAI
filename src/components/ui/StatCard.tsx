"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "overview",
  href,
  testId,
  valueClassName,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  hint?: string;
  icon?: React.ReactNode;
  tone?: ModuleToneKey;
  href?: string;
  testId?: string;
  valueClassName?: string;
  className?: string;
}) {
  const theme = getModuleTheme(tone);
  const displayValue =
    value === null || value === undefined || value === "" ? "Chưa có dữ liệu" : value;

  const inner = (
    <m.div
      whileHover={{ y: -3 }}
      transition={OCEAN_TRANSITION.hover}
      className={cn(
        "group relative p-5 rounded-panel bg-surface border border-border shadow-card hover:shadow-card-hover transition-colors duration-200",
        theme.hoverBorder,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-ink-muted leading-snug">{label}</span>
        {icon && (
          <span
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
              theme.iconBg
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        data-testid={testId}
        className={cn(
          "text-2xl font-extrabold text-ink mt-2.5 tracking-tight tabular-nums font-mono",
          value === null || value === undefined ? "text-base text-ink-muted font-sans font-semibold" : "",
          valueClassName
        )}
      >
        {displayValue}
      </div>

      {hint && (
        <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed line-clamp-2">
          {hint}
        </p>
      )}
    </m.div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:rounded-panel">
        {inner}
      </Link>
    );
  }
  return inner;
}

