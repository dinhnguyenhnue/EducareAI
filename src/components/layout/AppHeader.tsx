"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole, type UserRole } from "@/context/RoleContext";
import {
  Bell,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Check,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  KeyRound,
  Eye,
  ChevronRight,
  Command,
  X,
} from "lucide-react";

const BREADCRUMB_MAP: Record<string, string> = {
  admin: "Super Admin",
  overview: "Tổng quan Điều hành",
  "quan-tri": "Quản trị Hệ thống",
  "tong-quan": "Tổng quan",
  "nguoi-dung": "Người dùng & Phân quyền",
  "lop-hoc": "Năm học & Lớp học",
  "mon-hoc": "Môn học & Ngân hàng đề",
  "google-integrations": "Google Workspace",
  "gemini-config": "Cấu hình AI & Prompt",
  "nhat-ky": "Audit Logs & Nhật ký",
  "giao-vien": "Giáo viên",
  "bai-giang": "Bài giảng & Học liệu",
  "bai-tap": "Giao bài & Bài tập",
  "cham-bai": "Chấm bài & Rubric",
  "phan-tich": "Phân tích Học tập",
  "google-workspace": "Google Workspace",
  "prompt-library": "Thư viện Prompt",
  "hoc-sinh": "Học sinh",
  "ai-tutor": "AI Tutor (Gia sư)",
  "gemini-gems": "Gemini Gems",
  "prompt-lab": "Prompt Lab",
  "san-pham": "Sản phẩm Học tập",
  "cong-dong": "Cộng đồng Học tập",
  "ho-so-nang-luc": "Hồ sơ Năng lực",
  "phu-huynh": "Phụ huynh",
  "bai-tap-kiem-tra": "Bài tập & Kết quả",
  "diem-manh-can-cai-thien": "Điểm mạnh & Cần cải thiện",
  "goi-y-dong-hanh": "Gợi ý Đồng hành",
};

export function AppHeader({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    role,
    user,
    isSuperAdmin,
    sidebarCollapsed,
    setSidebarCollapsed,
    setRole,
    logout,
  } = useRole();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const roleLabels: Record<
    UserRole,
    { label: string; viewName: string; icon: React.ReactNode; path: string; desc: string }
  > = {
    ADMIN: {
      label: "Admin View",
      viewName: "Quản trị hệ thống",
      icon: <ShieldCheck className="w-4 h-4 text-brand-teal" />,
      path: "/admin/overview",
      desc: "Toàn quyền điều hành, RBAC, nhập Excel & Audit Log",
    },
    TEACHER: {
      label: "Teacher View",
      viewName: "Giáo viên",
      icon: <Briefcase className="w-4 h-4 text-brand-teal" />,
      path: "/giao-vien/tong-quan",
      desc: "Bàn làm việc sư phạm, soạn giảng, giao bài & chấm Rubric",
    },
    STUDENT: {
      label: "Student View",
      viewName: "Học sinh",
      icon: <GraduationCap className="w-4 h-4 text-brand-teal" />,
      path: "/hoc-sinh/tong-quan",
      desc: "Không gian học tập, nộp bài, AI Tutor & Prompt Lab",
    },
    PARENT: {
      label: "Parent View",
      viewName: "Phụ huynh",
      icon: <HeartHandshake className="w-4 h-4 text-brand-teal" />,
      path: "/phu-huynh/tong-quan",
      desc: "Theo dõi tiến độ, điểm số & nhận xét chính thức của con",
    },
  };

  const segments = pathname.split("/").filter(Boolean);

  const quickCommands = [
    { label: "Super Admin Overview", href: "/admin/overview", group: "Quản trị" },
    { label: "Quản lý Người dùng & Nhập Excel UNIGO", href: "/quan-tri/nguoi-dung", group: "Quản trị" },
    { label: "Quản lý Năm học & Lớp học", href: "/quan-tri/lop-hoc", group: "Quản trị" },
    { label: "Nhật ký Bảo mật & Audit Logs", href: "/quan-tri/nhat-ky", group: "Quản trị" },
    { label: "Bàn làm việc Giáo viên", href: "/giao-vien/tong-quan", group: "Giáo viên" },
    { label: "Biên soạn Bài giảng & Google Docs", href: "/giao-vien/bai-giang", group: "Giáo viên" },
    { label: "Chấm bài & Đánh giá Rubric", href: "/giao-vien/cham-bai", group: "Giáo viên" },
    { label: "Không gian Học tập Học sinh", href: "/hoc-sinh/tong-quan", group: "Học sinh" },
    { label: "AI Tutor Socratic & Prompt Lab", href: "/hoc-sinh/ai-tutor", group: "Học sinh" },
    { label: "Cổng Đồng hành Phụ huynh", href: "/phu-huynh/tong-quan", group: "Phụ huynh" },
  ].filter(
    (item) =>
      !searchQuery ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Super Admin Multi-View Isolation Banner (When previewing non-Admin view) */}
      {isSuperAdmin && role !== "ADMIN" && (
        <div className="bg-brand-teal text-white px-4 sm:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Chế độ Kiểm tra Giao diện (Super Admin Multi-View):</strong> Đang xem dưới góc nhìn{" "}
              <strong className="underline">{roleLabels[role].label}</strong> ({user.email}). Không giả danh danh tính người dùng thật; lịch sử hội thoại AI riêng tư của học sinh được bảo vệ.
            </span>
          </div>
          <button
            onClick={() => setRole("ADMIN")}
            className="px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors text-[11px]"
          >
            Quay về Admin View
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between shadow-card">
        {/* Left: Sidebar Toggle, Brand & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024 && onOpenMobileSidebar) {
                onOpenMobileSidebar();
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="p-2 rounded-button text-ink-muted hover:text-ink hover:bg-canvas border border-transparent hover:border-border transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-brand-teal-hover transition-colors">
              EA
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-ink tracking-tight text-sm">
                  EDUCARE AI
                </span>
                <span className="text-[10px] font-semibold bg-brand-teal-soft text-brand-teal px-1.5 py-0.5 rounded">
                  UNIGO
                </span>
              </div>
              <p className="text-[10px] text-ink-muted -mt-0.5">
                Năm học 2026–2027 • Tổ THCS
              </p>
            </div>
          </Link>

          {/* Dynamic Breadcrumb */}
          {segments.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden xl:flex items-center gap-1.5 pl-3 ml-1 border-l border-border text-xs text-ink-muted truncate"
            >
              {segments.slice(0, 2).map((seg, idx) => (
                <React.Fragment key={seg + idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-ink-muted/60" />}
                  <span
                    className={
                      idx === segments.slice(0, 2).length - 1
                        ? "font-semibold text-ink truncate"
                        : "text-ink-muted"
                    }
                  >
                    {BREADCRUMB_MAP[seg] || seg}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Global Search, Google Status, Super Admin Role View Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Global Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-button bg-canvas hover:bg-surface-muted border border-border text-xs text-ink-muted transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm nhanh...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded text-ink-muted">
              Ctrl K
            </kbd>
          </button>

          {/* Google Workspace Status Pill */}
          <Link
            href={
              role === "ADMIN"
                ? "/quan-tri/google-integrations"
                : "/giao-vien/google-workspace"
            }
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-button bg-canvas hover:bg-surface-muted border border-border text-[11px] font-medium text-ink transition-colors"
            title="Trạng thái kết nối Google Workspace"
          >
            <Network className="w-3.5 h-3.5 text-brand-teal" />
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            <span className="text-ink-muted">Workspace</span>
          </Link>

          {/* Super Admin Multi-View Switcher (Strictly for SUPER_ADMIN dinhnguyenhnue@gmail.com) */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                data-testid="role-view-switcher"
                className="flex items-center gap-2 px-3 py-1.5 rounded-button bg-brand-teal-soft/60 hover:bg-brand-teal-soft border border-brand-teal/30 text-xs font-medium text-ink transition-colors"
              >
                <span className="text-[11px] text-ink-muted hidden sm:inline">
                  Multi-View:
                </span>
                <div className="flex items-center gap-1.5 font-bold text-brand-teal">
                  {roleLabels[role].icon}
                  <span>{roleLabels[role].label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-brand-teal" />
              </button>

              {switcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSwitcherOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-panel border border-border shadow-dialog z-20 py-2">
                    <div className="px-3.5 py-2 border-b border-border">
                      <div className="text-[11px] font-bold text-brand-teal uppercase tracking-wider">
                        Super Admin Multi-View Switcher
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Tài khoản: <span className="font-mono text-ink">{user.email}</span>
                      </p>
                    </div>
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => {
                      const isSelected = r === role;
                      const item = roleLabels[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          data-testid={`switch-view-${r}`}
                          onClick={async () => {
                            setSwitcherOpen(false);
                            await setRole(r);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-canvas transition-colors ${
                            isSelected ? "bg-brand-teal-soft/40" : ""
                          }`}
                        >
                          <div className="mt-0.5">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-ink">
                                {item.label} ({item.viewName})
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-brand-teal" />
                              )}
                            </div>
                            <p className="text-[11px] text-ink-muted mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notification Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Trung tâm thông báo"
              className="relative p-2 rounded-button text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-teal ring-2 ring-surface" />
            </button>

            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-surface rounded-panel border border-border shadow-dialog z-20 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-bold text-ink">Thông báo hệ thống</span>
                    <span className="text-[11px] text-brand-teal font-semibold">
                      Mới nhất
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded bg-canvas border border-border/70">
                      <p className="font-semibold text-ink">
                        Bảo mật RBAC & Phiên HttpOnly đang bật
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Mọi thao tác quản trị và chuyển góc nhìn đều được ghi nhận trong AuditLog.
                      </p>
                    </div>
                    {user.mfaRecommended && (
                      <div className="p-2.5 rounded bg-status-warning-soft/50 border border-status-warning/30">
                        <p className="font-semibold text-status-warning">
                          Khuyến nghị bảo mật Super Admin
                        </p>
                        <p className="text-[11px] text-ink mt-0.5">
                          Vui lòng duy trì xác thực 2 bước (Google 2-Step Verification) cho tài khoản {user.email}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Menu & Logout */}
          <div className="relative pl-2 border-l border-border">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              data-testid="profile-menu-button"
              className="flex items-center gap-2 text-left hover:bg-canvas px-2 py-1 rounded-button transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
              <div className="hidden sm:block text-xs leading-tight max-w-[150px]">
                <p className="font-semibold text-ink truncate">{user.name}</p>
                <p className="text-[11px] text-ink-muted truncate">{user.badge}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-surface rounded-panel border border-border shadow-dialog z-20 py-2 text-xs">
                  <div className="px-4 py-2.5 border-b border-border space-y-1">
                    <p className="font-bold text-ink">{user.name}</p>
                    <p className="text-[11px] font-mono text-ink-muted break-all">
                      {user.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                        Role: {user.systemRole}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          user.accountStatus === "PENDING_ACTIVATION"
                            ? "bg-status-warning-soft text-status-warning"
                            : "bg-status-success-soft text-status-success"
                        }`}
                      >
                        {user.accountStatus === "PENDING_ACTIVATION"
                          ? "Chờ kích hoạt OIDC"
                          : "Đã kích hoạt"}
                      </span>
                    </div>
                  </div>

                  {user.mfaRecommended && (
                    <div className="px-4 py-2 bg-canvas border-b border-border text-[11px] text-ink-muted flex items-start gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" />
                      <span>
                        Khuyến nghị bật <strong>Google 2-Step Verification (MFA)</strong> cho tài khoản quản trị cao nhất.
                      </span>
                    </div>
                  )}

                  <div className="py-1">
                    <Link
                      href="/quan-tri/nhat-ky"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-ink hover:bg-canvas transition-colors"
                    >
                      Nhật ký đăng nhập & phiên (Audit Log)
                    </Link>
                    <Link
                      href="/dang-nhap"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-ink hover:bg-canvas transition-colors"
                    >
                      Cấu hình OAuth & Quyền kết nối
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-border">
                    <button
                      type="button"
                      data-testid="logout-button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                      }}
                      className="w-full px-4 py-2 text-left text-status-danger font-semibold hover:bg-status-danger-soft/40 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất khỏi hệ thống</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-panel border border-border shadow-dialog overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2.5">
              <Command className="w-4 h-4 text-brand-teal" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên phân hệ, lớp học, hoặc công cụ cần mở..."
                className="flex-1 bg-transparent text-xs text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border/50 p-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.href}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(cmd.href);
                  }}
                  className="w-full px-3 py-2.5 text-left rounded-button hover:bg-canvas flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-medium text-ink">{cmd.label}</span>
                  <span className="text-[10px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                    {cmd.group}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
