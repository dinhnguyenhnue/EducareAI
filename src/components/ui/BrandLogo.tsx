import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  subtitle = "Hệ sinh thái học tập số",
  showBadge = true,
  size = "md",
  className,
}: {
  href?: string;
  subtitle?: string | null;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const boxClass =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : size === "lg"
      ? "w-11 h-11 rounded-xl"
      : "w-9 h-9 rounded-[11px]";

  const titleClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  const content = (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          boxClass,
          "bg-gradient-primary flex items-center justify-center text-white shadow-ocean/40 transition-transform duration-200 group-hover:scale-[1.04] shrink-0"
        )}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 7.5C4 5.84315 5.34315 4.5 7 4.5H12.5C15.5376 4.5 18 6.96243 18 10V10.5C18 13.5376 15.5376 16 12.5 16H7C5.34315 16 4 14.6569 4 13V7.5Z"
            fill="white"
            fillOpacity="0.22"
          />
          <path
            d="M6.5 8.5L12 5.5L17.5 8.5L12 11.5L6.5 8.5Z"
            fill="white"
          />
          <path
            d="M8.5 11.5V15.5C8.5 16.6046 10.067 17.5 12 17.5C13.933 17.5 15.5 16.6046 15.5 15.5V11.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="6" r="1.75" fill="#FDE68A" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold text-ink tracking-tight leading-none",
              titleClass
            )}
          >
            EDUCARE AI
          </span>
          {showBadge && (
            <span className="text-[10px] font-bold bg-ocean-light text-ocean-deep px-1.5 py-0.5 rounded-md border border-ocean-200/70">
              UNIGO
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] text-ink-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0">
      {content}
    </Link>
  );
}

