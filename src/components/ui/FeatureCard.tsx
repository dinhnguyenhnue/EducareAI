"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function FeatureCard({
  title,
  description,
  href,
  ctaLabel = "Mở ngay",
  badge,
  icon,
  tone = "overview",
  gradientAccent,
  className,
}: {
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  tone?: ModuleToneKey;
  gradientAccent?: "primary" | "ai" | "achievement" | "creative" | "success";
  className?: string;
}) {
  const theme = getModuleTheme(tone);
  const gradientClass =
    gradientAccent === "primary"
      ? "bg-gradient-primary text-white border-transparent shadow-ocean/30"
      : gradientAccent === "ai"
      ? "bg-gradient-ai text-white border-transparent shadow-ai/30"
      : gradientAccent === "achievement"
      ? "bg-gradient-achievement text-white border-transparent shadow-card-hover"
      : gradientAccent === "creative"
      ? "bg-gradient-creative text-white border-transparent shadow-card-hover"
      : gradientAccent === "success"
      ? "bg-gradient-success text-white border-transparent shadow-card-hover"
      : "";

  const isGradient = Boolean(gradientClass);

  const card = (
    <m.div
      whileHover={{ y: -3 }}
      transition={OCEAN_TRANSITION.hover}
      className={cn(
        "group h-full p-5 rounded-panel border transition-all duration-200 flex flex-col justify-between",
        isGradient
          ? gradientClass
          : cn(
              "bg-surface border-border shadow-card hover:shadow-card-hover",
              theme.hoverBorder
            ),
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {icon && (
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isGradient ? "bg-white/20 text-white" : theme.iconBg
              )}
            >
              {icon}
            </div>
          )}
          {badge && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                isGradient
                  ? "bg-white/20 text-white border-white/25"
                  : cn(theme.bgSoft, theme.text, theme.border)
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <h3
          className={cn(
            "text-sm font-bold tracking-tight",
            isGradient ? "text-white" : "text-ink"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-xs mt-1.5 leading-relaxed",
            isGradient ? "text-white/90" : "text-ink-muted"
          )}
        >
          {description}
        </p>
      </div>

      {href && (
        <div
          className={cn(
            "mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold",
            isGradient
              ? "border-white/20 text-white"
              : cn("border-border/70", theme.text)
          )}
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </m.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:rounded-panel">
        {card}
      </Link>
    );
  }
  return card;
}

