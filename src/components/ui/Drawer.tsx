"use client";

import React, { useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import {
  drawerSlideVariants,
  drawerRightSlideVariants,
  modalBackdropVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
  widthClass = "w-[272px]",
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex",
            side === "right" ? "justify-end" : "justify-start"
          )}
        >
          <m.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <m.aside
            variants={side === "right" ? drawerRightSlideVariants : drawerSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "relative z-10 h-full bg-surface border-border shadow-dialog flex flex-col overflow-hidden",
              side === "right" ? "border-l" : "border-r",
              widthClass,
              className
            )}
          >
            {title && (
              <div className="px-4 py-3.5 border-b border-border flex items-center justify-between gap-2">
                <div className="min-w-0 font-bold text-sm text-ink">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng bảng điều hướng"
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

