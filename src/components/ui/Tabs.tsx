"use client";

import React from "react";
import { m } from "framer-motion";
import { SPRING_GENTLE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export function Tabs({
  items,
  activeId,
  onChange,
  layoutId = "ocean-tabs-indicator",
  className,
}: {
  items: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-muted border border-border",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-2 rounded-[9px] text-xs font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600",
              isActive ? "text-ocean-deep" : "text-ink-muted hover:text-ink"
            )}
          >
            {isActive && (
              <m.span
                layoutId={layoutId}
                transition={SPRING_GENTLE}
                className="absolute inset-0 rounded-[9px] bg-surface shadow-card border border-ocean-200/80"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-ocean-light text-ocean-700"
                      : "bg-slate-200/80 text-ink-muted"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

