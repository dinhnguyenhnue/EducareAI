"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OCEAN_TRANSITION } from "@/lib/motion";

export type ButtonVariant =
  | "primary"
  | "gradient"
  | "ai"
  | "secondary"
  | "soft"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-ocean-600 hover:bg-ocean-700 text-white shadow-card hover:shadow-ocean/30 border border-transparent",
  gradient:
    "bg-gradient-primary text-white shadow-ocean/40 hover:brightness-105 border border-transparent",
  ai: "bg-gradient-ai text-white shadow-ai/40 hover:brightness-105 border border-transparent",
  secondary:
    "bg-surface hover:bg-surface-muted text-ink border border-border hover:border-slate-300 shadow-card",
  soft: "bg-ocean-light/85 hover:bg-ocean-100 text-ocean-700 border border-ocean-200/80",
  ghost:
    "bg-transparent hover:bg-surface-muted text-ink-muted hover:text-ink border border-transparent",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-card border border-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-[9px]",
  md: "px-4 py-2.5 text-xs sm:text-sm gap-2 rounded-button",
  lg: "px-5 py-3 text-sm gap-2 rounded-[12px]",
};

export interface OceanButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function OceanButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: OceanButtonProps) {
  return (
    <m.button
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={OCEAN_TRANSITION.micro}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 focus-visible:ring-offset-2 disabled:opacity-55 disabled:pointer-events-none select-none cursor-pointer",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
      {children}
    </m.button>
  );
}

export function OceanButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 focus-visible:ring-offset-2 select-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

