"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
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
  X,
  Gamepad2,
  FileCheck2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
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

  const studentNav: NavItem[] = [
    { label: "Tổng quan học tập", href: "/hoc-sinh/tong-quan", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Xưởng Trò Chơi HTML", href: "/hoc-sinh/xuong-tro-choi", icon: <Gamepad2 className="w-4 h-4 text-brand-teal" />, badge: "Mới" },
    { label: "Luyện tập & Kiểm tra", href: "/hoc-sinh/kiem-tra", icon: <FileCheck2 className="w-4 h-4 text-brand-teal" /> },
    { label: "Sáng tạo cùng AI (8 Prompt)", href: "/hoc-sinh/sang-tao-cung-ai", icon: <Sparkles className="w-4 h-4 text-brand-teal" /> },
    { label: "Lớp học & Môn học", href: "/hoc-sinh/mon-hoc", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Bài tập & Nộp bài", href: "/hoc-sinh/bai-tap", icon: <ClipboardList className="w-4 h-4" /> },
    { label: "AI Tutor (Gia sư)", href: "/hoc-sinh/ai-tutor", icon: <Sparkles className="w-4 h-4 text-brand-teal" /> },
    { label: "Gemini Gems", href: "/hoc-sinh/gemini-gems", icon: <Flame className="w-4 h-4 text-brand-teal" /> },
    { label: "Prompt Lab", href: "/hoc-sinh/prompt-lab", icon: <MessageSquareQuote className="w-4 h-4" /> },
    { label: "Sản phẩm của tôi", href: "/hoc-sinh/san-pham", icon: <FolderKanban className="w-4 h-4" /> },
    { label: "Cộng đồng học tập", href: "/hoc-sinh/cong-dong", icon: <Compass className="w-4 h-4" /> },
    { label: "Hồ sơ năng lực", href: "/hoc-sinh/ho-so-nang-luc", icon: <LineChart className="w-4 h-4" /> },
  ];

  const teacherNav: NavItem[] = [
    { label: "Bàn làm việc sư phạm", href: "/giao-vien/tong-quan", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Ngân hàng câu hỏi & Đề", href: "/giao-vien/ngan-hang-cau-hoi", icon: <Database className="w-4 h-4 text-brand-teal" />, badge: "Mới" },
    { label: "Duyệt Trò chơi HTML", href: "/giao-vien/duyet-tro-choi", icon: <Gamepad2 className="w-4 h-4 text-brand-teal" />, badge: "Sandbox" },
    { label: "Quản lý Lớp & HS", href: "/giao-vien/lop-hoc", icon: <Users className="w-4 h-4" /> },
    { label: "Bài giảng & Học liệu", href: "/giao-vien/bai-giang", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Giao bài & Bài tập", href: "/giao-vien/bai-tap", icon: <FileEdit className="w-4 h-4" /> },
    { label: "Chấm bài & Rubric", href: "/giao-vien/cham-bai", icon: <CheckSquare className="w-4 h-4" /> },
    { label: "Phân tích học tập", href: "/giao-vien/phan-tich", icon: <LineChart className="w-4 h-4" /> },
    { label: "Google Workspace Hub", href: "/giao-vien/google-workspace", icon: <Network className="w-4 h-4 text-brand-teal" /> },
    { label: "Thư viện Prompt", href: "/giao-vien/prompt-library", icon: <MessageSquareQuote className="w-4 h-4" /> },
  ];

  const adminNav: NavItem[] = [
    ...(isSuperAdmin
      ? [
          {
            label: "Super Admin Overview",
            href: "/admin/overview",
            icon: <ShieldCheck className="w-4 h-4 text-brand-teal" />,
          },
          {
            label: "Bảo mật & Tích hợp Google",
            href: "/admin/settings/integrations",
            icon: <Network className="w-4 h-4 text-brand-teal" />,
          },
        ]
      : []),
    { label: "Tổng quan hệ thống", href: "/quan-tri/tong-quan", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Người dùng & Nhập Excel", href: "/quan-tri/nguoi-dung", icon: <Users className="w-4 h-4" /> },
    { label: "Năm học & Lớp học", href: "/quan-tri/lop-hoc", icon: <Layers className="w-4 h-4" /> },
    { label: "Môn học & Học liệu", href: "/quan-tri/mon-hoc", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Google Workspace Hub", href: "/quan-tri/google-integrations", icon: <Network className="w-4 h-4 text-brand-teal" /> },
    { label: "Cấu hình Gemini & Prompt", href: "/quan-tri/gemini-config", icon: <Sparkles className="w-4 h-4 text-brand-teal" /> },
    { label: "Audit Logs & Nhật ký", href: "/quan-tri/nhat-ky", icon: <Database className="w-4 h-4" /> },
  ];

  const parentNav: NavItem[] = [
    { label: "Tổng quan tiến độ con", href: "/phu-huynh/tong-quan", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Bài tập & Kết quả", href: "/phu-huynh/bai-tap-kiem-tra", icon: <ClipboardList className="w-4 h-4" /> },
    { label: "Điểm mạnh & Cần cải thiện", href: "/phu-huynh/diem-manh-can-cai-thien", icon: <LineChart className="w-4 h-4" /> },
    { label: "Gợi ý đồng hành (AI)", href: "/phu-huynh/goi-y-dong-hanh", icon: <Sparkles className="w-4 h-4 text-brand-teal" /> },
  ];

  const navMap = {
    STUDENT: studentNav,
    TEACHER: teacherNav,
    ADMIN: adminNav,
    PARENT: parentNav,
  };

  const currentNav = navMap[role] || studentNav;

  const renderLinks = (collapsed: boolean) => (
    <div className="px-2.5 space-y-1">
      {!collapsed && (
        <div className="px-3 pb-2 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
          Điều hướng phân hệ
        </div>
      )}
      {currentNav.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center ${
              collapsed ? "justify-center px-2" : "justify-between px-3"
            } py-2.5 rounded-button text-xs font-medium transition-all ${
              isActive
                ? "bg-brand-teal-soft text-brand-teal font-semibold border-l-2 border-brand-teal"
                : "text-ink hover:bg-canvas hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`shrink-0 ${
                  isActive ? "text-brand-teal" : "text-ink-muted"
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="text-[10px] font-bold bg-brand-teal text-white px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar (248px expanded / 68px collapsed) */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-surface border-r border-border min-h-[calc(100vh-4rem)] py-4 transition-all duration-200 ease-out ${
          sidebarCollapsed ? "w-[68px]" : "w-[248px]"
        }`}
      >
        {renderLinks(sidebarCollapsed)}

        <div className="px-3 pt-4 border-t border-border/80 text-xs text-ink-muted space-y-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            } px-2.5 py-2 rounded-button hover:bg-canvas text-ink-muted hover:text-ink transition-colors`}
            title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {!sidebarCollapsed && (
              <span className="text-[11px] font-medium">Thu gọn thanh bên</span>
            )}
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="px-2 flex items-center justify-between text-[11px]">
                <span>Phiên bản:</span>
                <span className="font-mono font-medium text-ink">
                  v2.5 (RBAC)
                </span>
              </div>
              <div className="px-2 pt-1 border-t border-border/50 flex items-center justify-between text-[11px]">
                <Link href="/privacy" className="hover:text-brand-teal underline">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-brand-teal underline">
                  Terms
                </Link>
                <Link
                  href="/dang-nhap"
                  className="hover:text-brand-teal font-semibold"
                >
                  OAuth
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-[248px] bg-surface border-r border-border h-full flex flex-col justify-between py-4 shadow-dialog">
            <div>
              <div className="px-4 pb-3 mb-2 border-b border-border flex items-center justify-between">
                <span className="font-bold text-sm text-ink">EDUCARE AI</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderLinks(false)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
