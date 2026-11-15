import React from "react";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  badgeIcon,
  tone = "overview",
  variant = "card",
  meta,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  tone?: ModuleToneKey;
  variant?: "card" | "hero" | "clean";
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const theme = getModuleTheme(tone);

  if (variant === "hero") {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-panel bg-gradient-to-r from-ocean-50/80 via-sky-50/40 to-surface border border-ocean-100 p-6 sm:p-7 shadow-xs",
          className
        )}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-surface/90 shadow-2xs",
                    theme.text,
                    theme.border
                  )}
                >
                  {badgeIcon}
                  <span>{badge}</span>
                </span>
              )}
              {meta}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink text-balance">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base text-ink-muted max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        variant === "card"
          ? "p-5 sm:p-6 rounded-panel bg-surface border border-border shadow-xs"
          : "pb-5 border-b border-border",
        "flex flex-col lg:flex-row lg:items-center justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {(badge || meta) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                  theme.bgSoft,
                  theme.text,
                  theme.border
                )}
              >
                {badgeIcon}
                <span>{badge}</span>
              </span>
            )}
            {meta}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm sm:text-[15px] text-ink-muted max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </section>
  );
}

