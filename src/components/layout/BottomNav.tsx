"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Gamepad2,
  Flame,
  Users,
  CheckSquare,
  LineChart,
  Sparkles,
  Layers,
  Network,
} from "lucide-react";

interface BottomItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPrefix?: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { role, isSuperAdmin } = useRole();

  const studentItems: BottomItem[] = [
    {
      label: "Hôm nay",
      href: "/hoc-sinh/tong-quan",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Bài học",
      href: "/hoc-sinh/mon-hoc",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      label: "Bài tập",
      href: "/hoc-sinh/bai-tap",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      label: "Trò chơi",
      href: "/hoc-sinh/xuong-tro-choi",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      label: "AI Tutor",
      href: "/hoc-sinh/ai-tutor",
      icon: <Flame className="w-4 h-4" />,
    },
  ];

  const teacherItems: BottomItem[] = [
    {
      label: "Bàn làm việc",
      href: "/giao-vien/tong-quan",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Lớp học",
      href: "/giao-vien/lop-hoc",
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: "Học liệu",
      href: "/giao-vien/bai-giang",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      label: "Chấm bài",
      href: "/giao-vien/cham-bai",
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      label: "Phân tích",
      href: "/giao-vien/phan-tich",
      icon: <LineChart className="w-4 h-4" />,
    },
  ];

  const parentItems: BottomItem[] = [
    {
      label: "Tổng quan",
      href: "/phu-huynh/tong-quan",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Bài tập",
      href: "/phu-huynh/bai-tap-kiem-tra",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      label: "Tiến bộ",
      href: "/phu-huynh/diem-manh-can-cai-thien",
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      label: "Đồng hành",
      href: "/phu-huynh/goi-y-dong-hanh",
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const adminItems: BottomItem[] = [
    {
      label: "Tổng quan",
      href: "/quan-tri/tong-quan",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Người dùng",
      href: "/quan-tri/nguoi-dung",
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: "Lớp học",
      href: "/quan-tri/lop-hoc",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      label: "Tích hợp",
      href: isSuperAdmin ? "/admin/settings/integrations" : "/quan-tri/google-integrations",
      icon: <Network className="w-4 h-4" />,
    },
  ];

  const itemsMap: Record<string, BottomItem[]> = {
    STUDENT: studentItems,
    TEACHER: teacherItems,
    PARENT: parentItems,
    ADMIN: adminItems,
  };

  const currentItems = itemsMap[role] || studentItems;

  return (
    <nav
      aria-label="Điều hướng nhanh di động"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-border shadow-lg"
    >
      <div className="grid grid-flow-col auto-cols-fr items-center h-16 max-w-lg mx-auto px-2">
        {currentItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 gap-1 text-[11px] font-semibold transition-colors duration-150 rounded-lg",
                isActive
                  ? "text-ocean-600 bg-ocean-50/80 font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-muted/50"
              )}
            >
              <span className={cn("transition-transform", isActive ? "scale-110 text-ocean-600" : "text-ink-muted")}>
                {item.icon}
              </span>
              <span className="truncate max-w-[72px] text-center leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
