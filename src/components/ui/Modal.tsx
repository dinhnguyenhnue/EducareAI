"use client";

import React, { useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { modalBackdropVariants, modalPanelVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <m.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
          />
          <m.div
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "relative z-10 w-full rounded-panel bg-surface border border-border shadow-dialog overflow-hidden",
              maxWidth,
              className
            )}
          >
            {(title || description) && (
              <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-sm sm:text-base font-bold text-ink leading-snug">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs text-ink-muted mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng hộp thoại"
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-5 py-3.5 bg-canvas border-t border-border flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

