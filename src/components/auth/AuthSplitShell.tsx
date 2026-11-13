"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { BrandLogo, EduIllustration, PageTransition } from "@/components/ui";
import { CheckCircle2, Sparkles } from "lucide-react";

export function AuthSplitShell({
  variant = "login",
  headerAction,
  heroTitle,
  heroSubtitle,
  highlights,
  children,
}: {
  variant?: "login" | "register" | "forgot";
  headerAction?: React.ReactNode;
  heroTitle: string;
  heroSubtitle: string;
  highlights: Array<{ icon: React.ReactNode; title: string; desc: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ocean-mesh text-ink flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 px-5 sm:px-10 flex items-center justify-between border-b border-border/80 bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <BrandLogo href="/" subtitle="Hệ sinh thái học tập số" size="md" />
        <div className="flex items-center gap-3 text-sm">{headerAction}</div>
      </header>

      {/* Main Split Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-10">
        <PageTransition className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-ocean-100 bg-surface shadow-panel overflow-hidden">
            {/* Left Hero Pane */}
            <aside className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-ocean-deep via-ocean-600 to-sky-500 p-9 text-white flex-col justify-between relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-ocean-navy/25 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>EDUCARE AI 3.0 • UNIGO Ecosystem</span>
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
                    {heroTitle}
                  </h2>
                  <p className="text-xs text-white/85 mt-2 leading-relaxed">
                    {heroSubtitle}
                  </p>
                </div>

                <EduIllustration variant={variant} />
              </div>

              <div className="relative z-10 space-y-2.5 my-5">
                {highlights.map((item, idx) => (
                  <m.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.06 * idx }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/12 backdrop-blur-sm border border-white/15"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-white/80 mt-0.5 leading-snug">
                        {item.desc}
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>

              <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-white/85">
                <span>Trường Tiểu học & THCS UNIGO</span>
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Chuẩn bảo mật OIDC
                </span>
              </div>
            </aside>

            {/* Right Form Pane */}
            <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-surface">
              {children}
            </div>
          </div>
        </PageTransition>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-ink-muted border-t border-border/80 bg-surface/85 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5">
        <span>© 2026 EDUCARE AI — Trường Tiểu học & THCS UNIGO.</span>
        <div className="flex items-center gap-4">
          <Link href="/chinh-sach-bao-mat" className="hover:text-ocean-600 transition-colors">
            Chính sách bảo mật
          </Link>
          <span>•</span>
          <Link href="/dieu-khoan-su-dung" className="hover:text-ocean-600 transition-colors">
            Điều khoản sử dụng
          </Link>
        </div>
      </footer>
    </div>
  );
}

