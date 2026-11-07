"use client";

import React from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import {
  GraduationCap,
  Briefcase,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const { setRole } = useRole();

  const portals = [
    {
      title: "Cổng Học sinh",
      desc: "Không gian tự học, luyện tập thích ứng, nộp sản phẩm số và đồng hành cùng AI Tutor gợi mở.",
      role: "STUDENT" as const,
      href: "/hoc-sinh/tong-quan",
      icon: <GraduationCap className="w-6 h-6 text-brand-teal" />,
      features: ["Lộ trình học theo năng lực", "Rubric tự đánh giá", "Prompt Lab sáng tạo", "AI Tutor Socratic"],
      badge: "Dành cho HS Khối 6, 7, 8",
    },
    {
      title: "Cổng Giáo viên",
      desc: "Bàn làm việc sư phạm: quản lý lớp, soạn học liệu, giao bài, chấm bài theo rubric và phân tích học tập.",
      role: "TEACHER" as const,
      href: "/giao-vien/tong-quan",
      icon: <Briefcase className="w-6 h-6 text-brand-teal" />,
      features: ["Soạn bài & nhúng Drive", "Chấm bài + AI gợi ý nhận xét", "Đồng bộ Classroom", "Phân tích yêu cầu cần đạt"],
      badge: "Tổ Chuyên môn THCS",
    },
    {
      title: "Cổng Phụ huynh",
      desc: "Minh bạch học tập: theo dõi tiến độ, nhận xét của thầy cô và nhận lời khuyên đồng hành tại nhà từ AI.",
      role: "PARENT" as const,
      href: "/phu-huynh/tong-quan",
      icon: <HeartHandshake className="w-6 h-6 text-brand-teal" />,
      features: ["Báo cáo tiến bộ đa chiều", "Điểm mạnh & Cần cải thiện", "Lịch thi & hoạt động", "Bảo mật riêng tư tuyệt đối"],
      badge: "Đồng hành cùng con",
    },
    {
      title: "Cổng Quản trị viên",
      desc: "Điều hành hệ sinh thái: quản lý người dùng, phân quyền RBAC, giám sát Google sync và hạn mức Gemini AI.",
      role: "ADMIN" as const,
      href: "/quan-tri/tong-quan",
      icon: <ShieldCheck className="w-6 h-6 text-brand-teal" />,
      features: ["Import danh sách Excel", "Kiểm duyệt học liệu & prompt", "Quản lý kết nối Google", "Nhật ký kiểm toán Audit"],
      badge: "Vận hành hệ thống",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-surface border-b border-border px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-button bg-brand-teal flex items-center justify-center text-white font-bold text-base shadow-sm">
            EA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink tracking-tight text-lg">EDUCARE AI</span>
              <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                UNIGO
              </span>
            </div>
            <p className="text-xs text-ink-muted hidden sm:block">
              Hệ sinh thái học tập số • Trường Tiểu học và THCS UNIGO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="text-xs font-medium text-ink-muted hover:text-brand-teal hidden md:inline"
          >
            Chính sách Bảo mật
          </Link>
          <Link
            href="/terms"
            className="text-xs font-medium text-ink-muted hover:text-brand-teal hidden md:inline"
          >
            Điều khoản Sử dụng
          </Link>
          <Link
            href="/dang-nhap"
            className="px-3.5 py-2 rounded-button bg-canvas border border-border text-ink text-xs font-semibold hover:bg-surface-muted transition-colors"
          >
            Đăng nhập Google OAuth
          </Link>
          <Link
            href="/hoc-sinh/tong-quan"
            className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm"
          >
            Vào ứng dụng ngay
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-6 sm:px-12 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-soft text-brand-teal text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Định hướng Tổ THCS UNIGO: Biết hỏi • Biết làm • Biết phản biện</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight max-w-3xl mx-auto leading-tight">
          Hệ sinh thái học tập số lấy học sinh làm trung tâm
        </h1>

        <p className="mt-4 text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
          EDUCARE AI là trung tâm điều phối dữ liệu, giao bài, đánh giá và cá nhân hóa; kết hợp hạ tầng lưu trữ{" "}
          <strong className="text-ink font-semibold">Google Workspace</strong> và trí tuệ nhân tạo{" "}
          <strong className="text-ink font-semibold">Gemini AI</strong>.
        </p>

        {/* 6 Pedagogical Principles Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-medium text-ink">
          {[
            "1. Biết đặt câu hỏi",
            "2. Biết làm & thực hành",
            "3. Biết phản biện",
            "4. Tự nghiên cứu",
            "5. Tự tạo sản phẩm",
            "6. Tự đánh giá",
          ].map((principle, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm text-ink"
            >
              {principle}
            </span>
          ))}
        </div>
      </section>

      {/* Portals Grid */}
      <section className="px-6 sm:px-12 max-w-6xl mx-auto w-full pb-16 flex-1">
        <div className="text-left mb-6">
          <h2 className="text-xl font-bold text-ink">Chọn Cổng đăng nhập để trải nghiệm</h2>
          <p className="text-xs text-ink-muted">
            Hệ thống đã chuẩn bị sẵn tài khoản và dữ liệu mẫu thực tế cho cả 4 vai trò.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((p) => (
            <Link
              key={p.role}
              href={p.href}
              onClick={() => setRole(p.role)}
              className="group p-6 rounded-panel bg-surface border border-border shadow-card hover:border-brand-teal hover:shadow-panel transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal-soft/30 rounded-bl-full pointer-events-none group-hover:bg-brand-teal-soft transition-colors" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-panel bg-brand-teal-soft flex items-center justify-center">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-brand-teal bg-brand-teal-soft px-2 py-0.8 rounded">
                    {p.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink group-hover:text-brand-teal transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">{p.desc}</p>

                <div className="mt-4 pt-4 border-t border-border/70 space-y-2">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-brand-teal group-hover:translate-x-1 transition-transform">
                <span>Truy cập không gian làm việc</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture Highlights Footer */}
      <footer className="bg-surface border-t border-border py-8 px-6 sm:px-12 text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-ink">EDUCARE AI</span>
            <span>•</span>
            <span>Đơn vị: Trường Tiểu học và THCS UNIGO</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="hover:text-brand-teal font-medium underline">
              Chính sách Bảo mật (Privacy Policy)
            </Link>
            <Link href="/terms" className="hover:text-brand-teal font-medium underline">
              Điều khoản Sử dụng (Terms of Use)
            </Link>
            <Link href="/dang-nhap" className="hover:text-brand-teal font-medium underline">
              Cổng Google OAuth 2.0
            </Link>
            <span className="flex items-center gap-1.5 text-status-success font-medium">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              Core LMS & Google Workspace Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

