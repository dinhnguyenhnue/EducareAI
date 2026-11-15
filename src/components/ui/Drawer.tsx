"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import {
  drawerSlideVariants,
  drawerRightSlideVariants,
  modalBackdropVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  ariaLabel = "Bảng điều hướng",
  children,
  widthClass = "w-[272px]",
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: React.ReactNode;
  ariaLabel?: string;
  children: React.ReactNode;
  widthClass?: string;
  className?: string;
}) {
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement | null>(null);
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      const container = drawerRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      (focusable[0] || container).focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        const container = drawerRef.current;
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
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={!title ? ariaLabel : undefined}
          tabIndex={-1}
          className={cn(
            "fixed inset-0 z-50 flex focus:outline-none",
            side === "right" ? "justify-end" : "justify-start"
          )}
        >
          <m.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <m.div
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
                <div id={titleId} className="min-w-0 font-bold text-sm text-ink">
                  {title}
                </div>
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
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
