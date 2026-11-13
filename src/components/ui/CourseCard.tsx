"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function CourseCard({
  subjectName,
  topicName,
  title,
  href,
  footerLabel = "Học liệu số UNIGO",
  ctaLabel = "Vào học ngay",
  accentClass = "from-sky-500 to-ocean-600",
  badge,
}: {
  subjectName: string;
  topicName?: string;
  title: string;
  href: string;
  footerLabel?: string;
  ctaLabel?: string;
  accentClass?: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="block h-full focus-visible:rounded-panel">
      <m.div
        whileHover={{ y: -3 }}
        transition={OCEAN_TRANSITION.hover}
        className="group h-full rounded-panel bg-surface border border-border hover:border-sky-300 shadow-card hover:shadow-card-hover overflow-hidden flex flex-col justify-between transition-colors"
      >
        <div>
          <div className={cn("h-1.5 w-full bg-gradient-to-r", accentClass)} />
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full truncate">
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {subjectName}
                  {topicName ? ` • ${topicName}` : ""}
                </span>
              </span>
              {badge && (
                <span className="text-[10px] font-semibold text-ink-muted shrink-0">
                  {badge}
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-ink group-hover:text-ocean-600 transition-colors line-clamp-2 leading-snug">
              {title}
            </h4>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-canvas/70 border-t border-border/70 flex items-center justify-between text-[11px] text-ink-muted">
          <span>{footerLabel}</span>
          <span className="font-semibold text-sky-700 inline-flex items-center gap-1 group-hover:text-ocean-600 transition-colors">
            {ctaLabel}
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </m.div>
    </Link>
  );
}

