"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { SPRING_GENTLE } from "@/lib/motion";
import { Drawer, BrandLogo } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Sparkles,
  Compass,
  FolderKanban,
  Users,
  LineChart,
  FileEdit,
  CheckSquare,
  Network,
  Database,
  Layers,
  MessageSquareQuote,
  Flame,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  FileCheck2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  tone: ModuleToneKey;
  badge?: string;
  matchPaths?: string[];
}

export interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

export function AppSidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const { role, isSuperAdmin, sidebarCollapsed, setSidebarCollapsed } = useRole();
  const pathname = usePathname();

  const studentGroups: NavGroup[] = [
    {
      groupLabel: "Hôm nay",
      items: [
        {
          label: "Tổng quan học tập",
          href: "/hoc-sinh/tong-quan",
          icon: <LayoutDashboard className="w-4 h-4" />,
          tone: "overview",
        },
      ],
    },
    {
      groupLabel: "Học tập",
      items: [
        {
          label: "Lớp học & Bài giảng",
          href: "/hoc-sinh/mon-hoc",
          icon: <BookOpen className="w-4 h-4" />,
          tone: "materials",
        },
        {
          label: "Bài tập & Nộp bài",
          href: "/hoc-sinh/bai-tap",
          icon: <ClipboardList className="w-4 h-4" />,
          tone: "assignments",
        },
        {
          label: "Luyện tập & Kiểm tra",
          href: "/hoc-sinh/kiem-tra",
          icon: <FileCheck2 className="w-4 h-4" />,
          tone: "assessments",
        },
      ],
    },
    {
      groupLabel: "Sáng tạo",
      items: [
        {
          label: "Xưởng trò chơi",
          href: "/hoc-sinh/xuong-tro-choi",
          icon: <Gamepad2 className="w-4 h-4" />,
          tone: "games",
        },
        {
          label: "Sản phẩm của em",
          href: "/hoc-sinh/san-pham",
          icon: <FolderKanban className="w-4 h-4" />,
          tone: "achievements",
        },
        {
          label: "Cộng đồng học tập",
          href: "/hoc-sinh/cong-dong",
          icon: <Compass className="w-4 h-4" />,
          tone: "community",
        },
      ],
    },
    {
      groupLabel: "Trợ lý AI",
      items: [
        {
          label: "Trợ lý sáng tạo & Prompt",
          href: "/hoc-sinh/sang-tao-cung-ai",
          matchPaths: [
            "/hoc-sinh/sang-tao-cung-ai",
            "/hoc-sinh/prompt-lab",
            "/hoc-sinh/gemini-gems",
          ],
          icon: <Sparkles className="w-4 h-4" />,
          tone: "promptLab",
        },
        {
          label: "Gia sư Socratic",
          href: "/hoc-sinh/ai-tutor",
          icon: <Flame className="w-4 h-4" />,
          tone: "aiTutor",
        },
      ],
    },
    {
      groupLabel: "Tiến bộ",
      items: [
        {
          label: "Hồ sơ năng lực & Tiến bộ",
          href: "/hoc-sinh/ho-so-nang-luc",
          icon: <LineChart className="w-4 h-4" />,
          tone: "progress",
        },
      ],
    },
  ];

  const teacherGroups: NavGroup[] = [
    {
      groupLabel: "Hôm nay",
      items: [
        {
          label: "Bàn làm việc sư phạm",
          href: "/giao-vien/tong-quan",
          icon: <LayoutDashboard className="w-4 h-4" />,
          tone: "overview",
        },
      ],
    },
    {
      groupLabel: "Lớp học",
      items: [
        {
          label: "Quản lý Lớp & HS",
          href: "/giao-vien/lop-hoc",
          icon: <Users className="w-4 h-4" />,
          tone: "overview",
        },
      ],
    },
    {
      groupLabel: "Học liệu & Đề thi",
      items: [
        {
          label: "Bài giảng & Học liệu",
          href: "/giao-vien/bai-giang",
          icon: <BookOpen className="w-4 h-4" />,
          tone: "materials",
        },
        {
          label: "Ngân hàng câu hỏi & Đề",
          href: "/giao-vien/ngan-hang-cau-hoi",
          icon: <Database className="w-4 h-4" />,
          tone: "assessments",
        },
      ],
    },
    {
      groupLabel: "Giao & Chấm bài",
      items: [
        {
          label: "Giao bài & Bài tập",
          href: "/giao-vien/bai-tap",
          icon: <FileEdit className="w-4 h-4" />,
          tone: "assignments",
        },
        {
          label: "Chấm bài & Rubric",
          href: "/giao-vien/cham-bai",
          icon: <CheckSquare className="w-4 h-4" />,
          tone: "assignments",
        },
        {
          label: "Duyệt Trò chơi HTML",
          href: "/giao-vien/duyet-tro-choi",
          icon: <Gamepad2 className="w-4 h-4" />,
          tone: "games",
        },
      ],
    },
    {
      groupLabel: "Phân tích",
      items: [
        {
          label: "Phân tích học tập",
          href: "/giao-vien/phan-tich",
          icon: <LineChart className="w-4 h-4" />,
          tone: "progress",
        },
      ],
    },
    {
      groupLabel: "Công cụ",
      items: [
        {
          label: "Google Workspace Hub",
          href: "/giao-vien/google-workspace",
          icon: <Network className="w-4 h-4" />,
          tone: "workspace",
        },
        {
          label: "Thư viện Prompt",
          href: "/giao-vien/prompt-library",
          icon: <MessageSquareQuote className="w-4 h-4" />,
          tone: "aiTutor",
        },
      ],
    },
  ];

  const adminGroups: NavGroup[] = [
    {
      groupLabel: "Tổng quan",
      items: [
        ...(isSuperAdmin
          ? [
              {
                label: "Super Admin Overview",
                href: "/admin/overview",
                icon: <ShieldCheck className="w-4 h-4" />,
                tone: "security" as ModuleToneKey,
              },
            ]
          : []),
        {
          label: "Tổng quan hệ thống",
          href: "/quan-tri/tong-quan",
          icon: <LayoutDashboard className="w-4 h-4" />,
          tone: "overview",
        },
      ],
    },
    {
      groupLabel: "Người dùng & Lớp học",
      items: [
        {
          label: "Người dùng & Nhập học sinh",
          href: "/quan-tri/nguoi-dung",
          icon: <Users className="w-4 h-4" />,
          tone: "overview",
        },
        {
          label: "Năm học & Lớp học",
          href: "/quan-tri/lop-hoc",
          icon: <Layers className="w-4 h-4" />,
          tone: "progress",
        },
        {
          label: "Môn học & Học liệu",
          href: "/quan-tri/mon-hoc",
          icon: <BookOpen className="w-4 h-4" />,
          tone: "materials",
        },
      ],
    },
    {
      groupLabel: "Tích hợp & AI",
      items: [
        ...(isSuperAdmin
          ? [
              {
                label: "Cấu hình Google & Gemini",
                href: "/admin/settings/integrations",
                icon: <Network className="w-4 h-4" />,
                tone: "workspace" as ModuleToneKey,
              },
            ]
          : []),
        {
          label: "Google Workspace Hub",
          href: "/quan-tri/google-integrations",
          icon: <Network className="w-4 h-4" />,
          tone: "workspace",
        },
        {
          label: "Cấu hình Gemini & Prompt",
          href: "/quan-tri/gemini-config",
          icon: <Sparkles className="w-4 h-4" />,
          tone: "aiTutor",
        },
      ],
    },
    {
      groupLabel: "Nhật ký & Giám sát",
      items: [
        {
          label: "Audit Logs & Nhật ký",
          href: "/quan-tri/nhat-ky",
          icon: <Database className="w-4 h-4" />,
          tone: "assessments",
        },
      ],
    },
  ];

  const parentGroups: NavGroup[] = [
    {
      groupLabel: "Hôm nay",
      items: [
        {
          label: "Tổng quan tiến độ con",
          href: "/phu-huynh/tong-quan",
          icon: <LayoutDashboard className="w-4 h-4" />,
          tone: "overview",
        },
      ],
    },
    {
      groupLabel: "Học tập",
      items: [
        {
          label: "Bài tập & Kết quả",
          href: "/phu-huynh/bai-tap-kiem-tra",
          icon: <ClipboardList className="w-4 h-4" />,
          tone: "assignments",
        },
      ],
    },
    {
      groupLabel: "Tiến bộ",
      items: [
        {
          label: "Điểm mạnh & Cần cải thiện",
          href: "/phu-huynh/diem-manh-can-cai-thien",
          icon: <LineChart className="w-4 h-4" />,
          tone: "progress",
        },
      ],
    },
    {
      groupLabel: "Đồng hành",
      items: [
        {
          label: "Gợi ý đồng hành cùng con",
          href: "/phu-huynh/goi-y-dong-hanh",
          icon: <Sparkles className="w-4 h-4" />,
          tone: "aiTutor",
        },
      ],
    },
  ];

  const groupMap = {
    STUDENT: studentGroups,
    TEACHER: teacherGroups,
    ADMIN: adminGroups,
    PARENT: parentGroups,
  };

  const currentGroups = groupMap[role] || studentGroups;

  const renderLinks = (collapsed: boolean, idSuffix: string) => (
    <nav aria-label="Điều hướng chính" className="px-2.5 space-y-4">
      {currentGroups.map((group, gIdx) => (
        <div key={group.groupLabel || gIdx} className="space-y-1">
          {!collapsed && group.groupLabel && (
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap">
              {group.groupLabel}
            </div>
          )}
          {group.items.map((item) => {
            const isActive = item.matchPaths
              ? item.matchPaths.some(
                  (p) => pathname === p || pathname.startsWith(p + "/")
                )
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const theme = getModuleTheme(item.tone);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={cn(
                  "group relative flex items-center rounded-button py-2 text-sm font-medium transition-colors duration-150 min-h-[40px]",
                  collapsed ? "justify-center px-2" : "justify-between px-3",
                  isActive
                    ? "text-ocean-deep font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-surface-muted/75"
                )}
              >
                {isActive && (
                  <m.span
                    layoutId={`sidebar-active-pill-${idSuffix}`}
                    transition={SPRING_GENTLE}
                    className="absolute inset-0 rounded-button bg-ocean-light/85 border border-ocean-200/80 shadow-2xs"
                  />
                )}

                <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105",
                      isActive
                        ? theme.iconBg
                        : cn("bg-transparent", theme.text, "opacity-80 group-hover:opacity-100")
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate whitespace-nowrap text-[13.5px]">{item.label}</span>
                  )}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                      theme.bgSoft,
                      theme.text,
                      theme.border
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar (256px expanded / 72px collapsed) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col justify-between shrink-0 bg-surface border-r border-border min-h-[calc(100vh-4rem)] py-4 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
          sidebarCollapsed ? "w-[72px]" : "w-[256px]"
        )}
      >
        {renderLinks(sidebarCollapsed, "desktop")}

        <div className="px-3 pt-4 border-t border-border text-xs text-ink-muted space-y-2.5">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Mở rộng menu điều hướng" : "Thu gọn menu điều hướng"}
            aria-expanded={!sidebarCollapsed}
            className={cn(
              "w-full flex items-center px-2.5 py-2 rounded-button hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}
            title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {!sidebarCollapsed && (
              <span className="text-[11px] font-semibold whitespace-nowrap">
                Thu gọn thanh bên
              </span>
            )}
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0 text-ocean-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 shrink-0" />
            )}
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="px-2 flex items-center justify-between text-[11px] whitespace-nowrap">
                <span>Phiên bản:</span>
                <span className="font-mono font-bold text-ocean-700 bg-ocean-light px-1.5 py-0.5 rounded">
                  v3.0 Ocean
                </span>
              </div>
              <div className="px-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px] whitespace-nowrap">
                <Link href="/chinh-sach-bao-mat" className="hover:text-ocean-600 transition-colors">
                  Bảo mật
                </Link>
                <Link href="/dieu-khoan-su-dung" className="hover:text-ocean-600 transition-colors">
                  Điều khoản
                </Link>
                <Link href="/hoc-sinh/cong-dong" className="hover:text-ocean-600 transition-colors">
                  Cộng đồng
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <Drawer
        open={mobileOpen}
        onClose={() => onCloseMobile && onCloseMobile()}
        side="left"
        title={<BrandLogo href="/" subtitle="UNIGO Ecosystem" size="sm" />}
        widthClass="w-[272px]"
      >
        <div className="py-4">{renderLinks(false, "mobile")}</div>
      </Drawer>
    </>
  );
}
