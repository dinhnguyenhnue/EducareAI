"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  ChevronDown,
  Check,
} from "lucide-react";
import type { UserRole } from "@/context/RoleContext";
import { modalPanelVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const ROLE_META: Record<
  UserRole,
  {
    label: string;
    viewName: string;
    icon: React.ReactNode;
    pillClass: string;
    iconBgClass: string;
    path: string;
    desc: string;
  }
> = {
  ADMIN: {
    label: "Admin View",
    viewName: "Quản trị hệ thống",
    icon: <ShieldCheck className="w-4 h-4 text-ocean-600" />,
    pillClass: "bg-ocean-light/80 border-ocean-200 text-ocean-700 hover:bg-ocean-100",
    iconBgClass: "bg-ocean-light text-ocean-600",
    path: "/admin/overview",
    desc: "Toàn quyền điều hành, RBAC, nhập Excel & Audit Log",
  },
  TEACHER: {
    label: "Teacher View",
    viewName: "Giáo viên",
    icon: <Briefcase className="w-4 h-4 text-sky-700" />,
    pillClass: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100",
    iconBgClass: "bg-sky-100 text-sky-700",
    path: "/giao-vien/tong-quan",
    desc: "Bàn làm việc sư phạm, soạn giảng, giao bài & chấm Rubric",
  },
  STUDENT: {
    label: "Student View",
    viewName: "Học sinh",
    icon: <GraduationCap className="w-4 h-4 text-emerald-700" />,
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    iconBgClass: "bg-emerald-100 text-emerald-700",
    path: "/hoc-sinh/tong-quan",
    desc: "Không gian học tập, nộp bài, AI Tutor & Prompt Lab",
  },
  PARENT: {
    label: "Parent View",
    viewName: "Phụ huynh",
    icon: <HeartHandshake className="w-4 h-4 text-violet-700" />,
    pillClass: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100",
    iconBgClass: "bg-violet-100 text-violet-700",
    path: "/phu-huynh/tong-quan",
    desc: "Theo dõi tiến độ, điểm số & nhận xét chính thức của con",
  },
};

export function RoleSwitcher({
  role,
  userEmail,
  onSelectRole,
}: {
  role: UserRole;
  userEmail: string;
  onSelectRole: (r: UserRole) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const current = ROLE_META[role];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="role-view-switcher"
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-button border text-xs font-semibold transition-all duration-150 active:scale-[0.98]",
          current.pillClass
        )}
      >
        <span className="text-[11px] opacity-75 hidden sm:inline font-medium">
          Multi-View:
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          {current.icon}
          <span>{current.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-150",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpen(false)}
            />
            <m.div
              role="menu"
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 mt-2 w-80 bg-surface rounded-panel border border-border shadow-dialog z-30 py-2 overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-ocean-50/60 border-b border-border">
                <div className="text-[11px] font-bold text-ocean-700 uppercase tracking-wider">
                  Super Admin Multi-View Switcher
                </div>
                <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                  Tài khoản: <span className="font-mono text-ink">{userEmail}</span>
                </p>
              </div>
              <div className="p-1.5 space-y-1">
                {(Object.keys(ROLE_META) as UserRole[]).map((r) => {
                  const isSelected = r === role;
                  const item = ROLE_META[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      data-testid={`switch-view-${r}`}
                      onClick={async () => {
                        setOpen(false);
                        await onSelectRole(r);
                      }}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors",
                        isSelected
                          ? "bg-ocean-50 border border-ocean-200/70"
                          : "hover:bg-surface-muted border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          item.iconBgClass
                        )}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-ink">
                            {item.label} ({item.viewName})
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-ocean-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

