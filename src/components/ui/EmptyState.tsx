import React from "react";
import { Inbox } from "lucide-react";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  tone = "overview",
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tone?: ModuleToneKey;
  action?: React.ReactNode;
  className?: string;
}) {
  const theme = getModuleTheme(tone);

  return (
    <div
      className={cn(
        "rounded-panel border border-dashed border-border bg-canvas/60 px-6 py-10 text-center flex flex-col items-center justify-center",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
          theme.iconBg
        )}
      >
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && (
        <p className="text-xs text-ink-muted mt-1.5 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

