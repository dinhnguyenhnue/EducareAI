"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { modalBackdropVariants, modalPanelVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  wasOpenRef.current = open;

  useEffect(() => {
    if (!open) return;

    if (
      !previousFocusRef.current ||
      (dialogRef.current && dialogRef.current.contains(previousFocusRef.current))
    ) {
      // Keep previously captured opener element if autoFocus already moved inside dialog
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      const firstInput = focusable.find(
        (el) =>
          el.tagName === "INPUT" ||
          el.tagName === "SELECT" ||
          el.tagName === "TEXTAREA"
      );
      (firstInput || focusable[0] || container).focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusable.length === 0) {
          e.preventDefault();
          container.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !container.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !container.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      const targetToFocus = previousFocusRef.current;
      window.requestAnimationFrame(() => {
        if (targetToFocus && document.body.contains(targetToFocus)) {
          targetToFocus.focus();
        }
      });
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 focus:outline-none"
        >
          <m.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
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
                    <h2
                      id={titleId}
                      className="text-sm sm:text-base font-bold text-ink leading-snug"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="text-xs text-ink-muted mt-0.5">
                      {description}
                    </p>
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
    </AnimatePresence>,
    document.body
  );
}
