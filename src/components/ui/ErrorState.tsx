import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Không thể tải dữ liệu",
  message,
  action,
  className,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-panel border border-red-200 bg-status-danger-soft px-5 py-4 flex items-start gap-3 text-status-danger",
        className
      )}
    >
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-bold">{title}</h3>
        <p className="text-xs mt-0.5 leading-relaxed opacity-90">{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

