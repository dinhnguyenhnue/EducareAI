"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { BrandLogo, OceanButtonLink, PageTransition } from "@/components/ui";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Briefcase,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const PORTALS: Array<{
  title: string;
  desc: string;
  role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
  href: string;
  tone: ModuleToneKey;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  badge: string;
}> = [
  {
    title: "Cổng Học sinh",
    desc: "Không gian tự học sinh động: lộ trình năng lực, bài tập, xưởng trò chơi HTML Sandbox và AI Tutor Socratic.",
    role: "STUDENT",
    href: "/hoc-sinh/tong-quan",
    tone: "progress",
    icon: GraduationCap,
    features: [
      "Lộ trình học tập trực quan",
      "Xưởng trò chơi HTML Sandbox",
      "Prompt Lab & Gemini Gems",
      "AI Tutor gợi mở tư duy",
    ],
    badge: "HS Khối 6, 7, 8",
  },
  {
    title: "Cổng Giáo viên",
    desc: "Bàn làm việc sư phạm hiệu suất cao: quản lý lớp, soạn học liệu đa định dạng, chấm Rubric và phân tích dữ liệu.",
    role: "TEACHER",
    href: "/giao-vien/tong-quan",
    tone: "overview",
    icon: Briefcase,
    features: [
      "Học liệu số & Upload an toàn",
      "Chấm bài Rubric + AI gợi ý",
      "Đồng bộ Google Workspace Hub",
      "Ngân hàng câu hỏi & Đề kiểm tra",
    ],
    badge: "Tổ Chuyên môn",
  },
  {
    title: "Cổng Phụ huynh",
    desc: "Minh bạch và tin cậy: theo dõi tiến độ học tập, điểm mạnh nổi bật, nhận xét thầy cô và gợi ý đồng hành.",
    role: "PARENT",
    href: "/phu-huynh/tong-quan",
    tone: "aiTutor",
    icon: HeartHandshake,
    features: [
      "Báo cáo tiến bộ trực quan",
      "Điểm mạnh & Gợi ý hỗ trợ",
      "Lịch bài tập & kiểm tra",
      "Bảo mật hội thoại riêng tư",
    ],
    badge: "Đồng hành cùng con",
  },
  {
    title: "Cổng Quản trị viên",
    desc: "Điều hành chuẩn SaaS: quản lý người dùng, phân quyền RBAC 6 vai trò, Google Workspace và Audit Logs.",
    role: "ADMIN",
    href: "/quan-tri/tong-quan",
    tone: "security",
    icon: ShieldCheck,
    features: [
      "Import danh sách Excel chuẩn",
      "Quản lý khe tích hợp Gem/AI",
      "Giám sát Google Workspace Sync",
      "Nhật ký kiểm toán Audit Log",
    ],
    badge: "Điều hành Hệ thống",
  },
];

export default function HomePage() {
  const { setRole } = useRole();

  return (
    <div className="min-h-screen bg-ocean-mesh text-ink flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-surface/85 backdrop-blur-md border-b border-border px-5 sm:px-10 flex items-center justify-between sticky top-0 z-30">
        <BrandLogo
          href="/"
          subtitle="Hệ sinh thái học tập số • Trường Tiểu học & THCS UNIGO"
          size="md"
        />

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/chinh-sach-bao-mat"
            className="text-xs font-medium text-ink-muted hover:text-ocean-600 hidden md:inline transition-colors"
          >
            Chính sách Bảo mật
          </Link>
          <Link
            href="/dieu-khoan-su-dung"
            className="text-xs font-medium text-ink-muted hover:text-ocean-600 hidden md:inline transition-colors"
          >
            Điều khoản
          </Link>
          <OceanButtonLink href="/dang-ky" variant="secondary" size="sm">
            Đăng ký
          </OceanButtonLink>
          <OceanButtonLink href="/dang-nhap" variant="gradient" size="sm">
            Đăng nhập
          </OceanButtonLink>
        </div>
      </header>

      <PageTransition className="flex-1">
        {/* Hero Overview Banner */}
        <section className="pt-10 pb-8 sm:pt-14 sm:pb-10 px-5 sm:px-10 max-w-6xl mx-auto w-full text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ocean-light border border-ocean-200 text-ocean-deep text-xs font-bold mb-5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
            <span>EDUCARE AI 3.0 • Biết hỏi • Biết làm • Biết phản biện</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight max-w-3xl mx-auto leading-[1.15]">
            Hệ sinh thái Học tập Số{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              UNIGO Ocean Blue
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Trung tâm điều phối dữ liệu học tập, giao bài, đánh giá năng lực và sáng tạo cùng{" "}
            <strong className="text-ink font-semibold">Gemini AI</strong> &{" "}
            <strong className="text-ink font-semibold">Google Workspace</strong>.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-semibold">
            {[
              "1. Biết đặt câu hỏi",
              "2. Thực hành số",
              "3. Tư duy phản biện",
              "4. Tự nghiên cứu",
              "5. Sáng tạo sản phẩm",
              "6. Đánh giá minh bạch",
            ].map((principle, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-surface border border-border shadow-card text-ink-muted"
              >
                {principle}
              </span>
            ))}
          </div>
        </section>

        {/* Role Portals Grid */}
        <section className="px-5 sm:px-10 max-w-6xl mx-auto w-full pb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
                Không gian làm việc theo Vai trò
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Truy cập phân hệ được cấp quyền của bạn (yêu cầu xác thực tài khoản hợp lệ).
              </p>
            </div>
            <Link
              href="/dang-nhap"
              className="text-xs font-bold text-ocean-600 hover:text-ocean-deep inline-flex items-center gap-1"
            >
              <span>Đăng nhập Google OAuth 2.0</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const theme = getModuleTheme(portal.tone);
              return (
                <Link
                  key={portal.role}
                  href={portal.href}
                  onClick={() => setRole(portal.role)}
                  className="block group focus-visible:rounded-panel"
                >
                  <m.div
                    whileHover={{ y: -3 }}
                    transition={OCEAN_TRANSITION.hover}
                    className={cn(
                      "h-full p-6 rounded-panel bg-surface border border-border shadow-card hover:shadow-card-hover transition-colors flex flex-col justify-between",
                      theme.hoverBorder
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
                            theme.iconBg
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2.5 py-1 rounded-full border",
                            theme.bgSoft,
                            theme.text,
                            theme.border
                          )}
                        >
                          {portal.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-ink group-hover:text-ocean-600 transition-colors">
                        {portal.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                        {portal.desc}
                      </p>

                      <div className="mt-4 pt-4 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {portal.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-ink">
                            <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", theme.text)} />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold",
                        theme.text
                      )}
                    >
                      <span>Mở không gian làm việc</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </m.div>
                </Link>
              );
            })}
          </div>
        </section>
      </PageTransition>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-6 px-5 sm:px-10 text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-ink">EDUCARE AI</span>
            <span>•</span>
            <span>Trường Tiểu học và THCS UNIGO</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/chinh-sach-bao-mat" className="hover:text-ocean-600 font-medium">
              Chính sách Bảo mật
            </Link>
            <Link href="/dieu-khoan-su-dung" className="hover:text-ocean-600 font-medium">
              Điều khoản Sử dụng
            </Link>
            <Link href="/dang-nhap" className="hover:text-ocean-600 font-medium">
              Cổng Google OAuth 2.0
            </Link>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Core LMS & RBAC Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
