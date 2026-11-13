"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { RoleSwitcher, ROLE_META } from "./RoleSwitcher";
import { BrandLogo, Modal } from "@/components/ui";
import { modalPanelVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  KeyRound,
  Eye,
  ChevronRight,
  Command,
  ShieldCheck,
} from "lucide-react";

const BREADCRUMB_MAP: Record<string, string> = {
  admin: "Super Admin",
  overview: "Tổng quan Điều hành",
  settings: "Cài đặt",
  integrations: "Tích hợp Google & Bảo mật",
  "quan-tri": "Quản trị Hệ thống",
  "tong-quan": "Tổng quan",
  "nguoi-dung": "Người dùng & Phân quyền",
  "lop-hoc": "Năm học & Lớp học",
  "mon-hoc": "Môn học & Học liệu",
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
  "ngan-hang-cau-hoi": "Ngân hàng Câu hỏi",
  "duyet-tro-choi": "Duyệt Trò chơi HTML",
  "hoc-sinh": "Học sinh",
  "ai-tutor": "AI Tutor (Gia sư)",
  "gemini-gems": "Gemini Gems",
  "prompt-lab": "Prompt Lab",
  "sang-tao-cung-ai": "Sáng tạo cùng AI",
  "xuong-tro-choi": "Xưởng Trò chơi HTML",
  "kiem-tra": "Luyện tập & Kiểm tra",
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

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const segments = pathname.split("/").filter(Boolean);

  const quickCommands = [
    { label: "Super Admin Overview", href: "/admin/overview", group: "Quản trị" },
    { label: "Bảo mật & Tích hợp Google", href: "/admin/settings/integrations", group: "Quản trị" },
    { label: "Quản lý Người dùng & Nhập Excel UNIGO", href: "/quan-tri/nguoi-dung", group: "Quản trị" },
    { label: "Quản lý Năm học & Lớp học", href: "/quan-tri/lop-hoc", group: "Quản trị" },
    { label: "Nhật ký Bảo mật & Audit Logs", href: "/quan-tri/nhat-ky", group: "Quản trị" },
    { label: "Bàn làm việc Giáo viên", href: "/giao-vien/tong-quan", group: "Giáo viên" },
    { label: "Biên soạn Bài giảng & Học liệu", href: "/giao-vien/bai-giang", group: "Giáo viên" },
    { label: "Chấm bài & Đánh giá Rubric", href: "/giao-vien/cham-bai", group: "Giáo viên" },
    { label: "Không gian Học tập Học sinh", href: "/hoc-sinh/tong-quan", group: "Học sinh" },
    { label: "AI Tutor Socratic & Prompt Lab", href: "/hoc-sinh/ai-tutor", group: "Học sinh" },
    { label: "Xưởng Trò chơi HTML Sandbox", href: "/hoc-sinh/xuong-tro-choi", group: "Học sinh" },
    { label: "Cổng Đồng hành Phụ huynh", href: "/phu-huynh/tong-quan", group: "Phụ huynh" },
  ].filter(
    (item) =>
      !searchQuery ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initials = (user.name || "EA")
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Super Admin Multi-View Isolation Banner */}
      {isSuperAdmin && role !== "ADMIN" && (
        <div className="bg-gradient-primary text-white px-4 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              <strong>Chế độ Kiểm tra Giao diện (Super Admin Multi-View):</strong> Đang xem dưới góc nhìn{" "}
              <strong className="underline">{ROLE_META[role].label}</strong> ({user.email}). Không giả danh danh tính người dùng thật.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRole("ADMIN")}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors text-[11px] shrink-0"
          >
            Quay về Admin View
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 h-16 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between shadow-xs">
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
            aria-label={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="p-2 rounded-button text-ink-muted hover:text-ocean-600 hover:bg-ocean-light/60 border border-transparent hover:border-ocean-200 transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <BrandLogo
            href="/"
            subtitle="Năm học 2026–2027 • Tổ THCS"
            size="sm"
            className="hidden sm:flex"
          />
          <BrandLogo
            href="/"
            subtitle={null}
            showBadge={false}
            size="sm"
            className="flex sm:hidden"
          />

          {/* Dynamic Breadcrumb */}
          {segments.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden xl:flex items-center gap-1.5 pl-3 ml-1 border-l border-border text-xs text-ink-muted truncate"
            >
              {segments.slice(0, 2).map((seg, idx) => (
                <React.Fragment key={seg + idx}>
                  {idx > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-ink-muted/60 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      idx === segments.slice(0, 2).length - 1
                        ? "font-bold text-ink"
                        : "text-ink-muted"
                    )}
                  >
                    {BREADCRUMB_MAP[seg] || seg}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-button bg-canvas hover:bg-surface-muted border border-border hover:border-ocean-300 text-xs text-ink-muted transition-all"
          >
            <Search className="w-3.5 h-3.5 text-ocean-600" />
            <span>Tìm nhanh...</span>
            <kbd className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded text-ink-muted">
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
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-button bg-cyan-50/70 hover:bg-cyan-50 border border-cyan-200/80 text-[11px] font-semibold text-cyan-800 transition-colors"
            title="Trạng thái kết nối Google Workspace"
          >
            <Network className="w-3.5 h-3.5 text-cyan-600" />
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                user.googleConnected ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            <span>Workspace</span>
          </Link>

          {/* Role View Switcher (Strictly for SUPER_ADMIN) */}
          {isSuperAdmin && (
            <RoleSwitcher
              role={role}
              userEmail={user.email}
              onSelectRole={setRole}
            />
          )}

          {/* Notification Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                setNotifOpen((prev) => !prev);
              }}
              aria-label="Trung tâm thông báo"
              title="Trung tâm thông báo"
              className="relative p-2 rounded-button text-ink-muted hover:text-ocean-600 hover:bg-ocean-light/60 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ocean-600 ring-2 ring-surface" />
            </button>

            <AnimatePresence>
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotifOpen(false)}
                  />
                  <m.div
                    variants={modalPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute right-0 mt-2 w-80 bg-surface rounded-panel border border-border shadow-dialog z-30 p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="font-bold text-ink">Thông báo hệ thống</span>
                      <span className="text-[11px] text-ocean-600 font-semibold bg-ocean-light px-2 py-0.5 rounded-full">
                        Trực tuyến
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-ocean-50/60 border border-ocean-200/70 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-ink">
                            Bảo mật RBAC & Phiên HttpOnly đang bật
                          </p>
                          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                            Mọi thao tác quản trị và chuyển góc nhìn đều được ghi nhận trong AuditLog.
                          </p>
                        </div>
                      </div>
                      {user.mfaRecommended && (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                          <p className="font-semibold text-amber-800">
                            Khuyến nghị bảo mật Super Admin
                          </p>
                          <p className="text-[11px] mt-0.5 leading-relaxed">
                            Vui lòng duy trì Google 2-Step Verification cho tài khoản {user.email}.
                          </p>
                        </div>
                      )}
                    </div>
                  </m.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative pl-2 border-l border-border">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setProfileOpen((prev) => !prev);
              }}
              data-testid="profile-menu-button"
              className="flex items-center gap-2 text-left hover:bg-surface-muted px-2 py-1 rounded-button transition-colors"
            >
              {!avatarError && user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-full object-cover border border-ocean-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
              )}
              <div className="hidden sm:block text-xs leading-tight max-w-[150px]">
                <p className="font-semibold text-ink truncate">{user.name}</p>
                <p className="text-[11px] text-ink-muted truncate">{user.badge}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden sm:block" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProfileOpen(false)}
                  />
                  <m.div
                    variants={modalPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute right-0 mt-2 w-72 bg-surface rounded-panel border border-border shadow-dialog z-30 py-2 text-xs overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-ocean-50/50 border-b border-border space-y-1.5">
                      <p className="font-bold text-ink">{user.name}</p>
                      <p className="text-[11px] font-mono text-ink-muted break-all">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold bg-ocean-light text-ocean-700 px-2 py-0.5 rounded-full">
                          Role: {user.systemRole}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            user.accountStatus === "PENDING_ACTIVATION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {user.accountStatus === "PENDING_ACTIVATION"
                            ? "Chờ kích hoạt OIDC"
                            : "Đã kích hoạt"}
                        </span>
                      </div>
                    </div>

                    {user.mfaRecommended && (
                      <div className="px-4 py-2.5 bg-canvas border-b border-border text-[11px] text-ink-muted flex items-start gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-ocean-600 shrink-0 mt-0.5" />
                        <span>
                          Khuyến nghị bật <strong>Google 2-Step Verification (MFA)</strong> cho tài khoản quản trị cao nhất.
                        </span>
                      </div>
                    )}

                    <div className="py-1.5">
                      {isSuperAdmin && (
                        <>
                          <Link
                            href="/quan-tri/nhat-ky"
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2 text-ink hover:bg-ocean-50 hover:text-ocean-700 transition-colors"
                          >
                            Nhật ký đăng nhập & phiên (Audit Log)
                          </Link>
                          <Link
                            href="/admin/settings/integrations"
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2 text-ink hover:bg-ocean-50 hover:text-ocean-700 transition-colors"
                          >
                            Cấu hình OAuth & Quyền kết nối
                          </Link>
                        </>
                      )}
                      {role === "TEACHER" && !isSuperAdmin && (
                        <Link
                          href="/giao-vien/google-workspace"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-ink hover:bg-ocean-50 hover:text-ocean-700 transition-colors"
                        >
                          Quản lý kết nối Google Workspace
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-border">
                      <button
                        type="button"
                        data-testid="logout-button"
                        onClick={async () => {
                          setProfileOpen(false);
                          await logout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-red-700 font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất khỏi hệ thống</span>
                      </button>
                    </div>
                  </m.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command Palette Modal (Ctrl+K) */}
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          <div className="pb-3 border-b border-border flex items-center gap-2.5">
            <Command className="w-4 h-4 text-ocean-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên phân hệ, lớp học, hoặc công cụ cần mở..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-ink focus:outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {quickCommands.map((cmd) => (
              <button
                key={cmd.href}
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(cmd.href);
                }}
                className="w-full px-3 py-2.5 text-left rounded-button hover:bg-ocean-50 flex items-center justify-between text-xs transition-colors"
              >
                <span className="font-semibold text-ink">{cmd.label}</span>
                <span className="text-[10px] font-bold bg-ocean-light text-ocean-700 px-2 py-0.5 rounded-full">
                  {cmd.group}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
