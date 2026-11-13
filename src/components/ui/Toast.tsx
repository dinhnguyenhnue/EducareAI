"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { OCEAN_TRANSITION } from "@/lib/motion";

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; iconBg: string; title: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    border: "border-emerald-200 bg-white",
    iconBg: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-900",
    Icon: CheckCircle2,
  },
  info: {
    border: "border-ocean-200 bg-white",
    iconBg: "bg-ocean-light text-ocean-600",
    title: "text-ink",
    Icon: Info,
  },
  warning: {
    border: "border-amber-200 bg-white",
    iconBg: "bg-amber-100 text-amber-700",
    title: "text-amber-900",
    Icon: AlertTriangle,
  },
  error: {
    border: "border-red-200 bg-white",
    iconBg: "bg-red-100 text-red-700",
    title: "text-red-900",
    Icon: AlertCircle,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ durationMs = 4200, variant = "info", ...rest }: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, variant, durationMs, ...rest }]);
      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 left-4 sm:left-auto sm:right-6 z-[70] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant || "info"];
            const Icon = style.Icon;
            return (
              <m.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={OCEAN_TRANSITION.modal}
                role="status"
                className={`pointer-events-auto rounded-panel border ${style.border} p-3.5 shadow-dialog flex items-start gap-3`}
              >
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${style.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${style.title}`}>{toast.title}</p>
                  {toast.description && (
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Đóng thông báo"
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      pushToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}

