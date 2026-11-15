"use client";

import React, { useRef } from "react";
import { m } from "framer-motion";
import { SPRING_GENTLE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  panelId?: string;
}

export function Tabs({
  items,
  activeId,
  onChange,
  layoutId = "ocean-tabs-indicator",
  ariaLabel = "Danh sách phân mục",
  className,
}: {
  items: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;
    let nextIndex: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % items.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = items[nextIndex];
      onChange(nextTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-muted border border-border",
        className
      )}
    >
      {items.map((tab, idx) => {
        const isActive = tab.id === activeId;
        const tabDomId = `tab-${layoutId}-${tab.id}`;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            id={tabDomId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={tab.panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
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
