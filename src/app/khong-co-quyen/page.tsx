"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo, OceanButtonLink, PageTransition } from "@/components/ui";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "trang nội bộ";
  const homePath = searchParams.get("home") || "/dang-nhap";

  return (
    <div className="min-h-screen bg-ocean-mesh flex flex-col justify-between">
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-border bg-surface/85 backdrop-blur-md">
        <BrandLogo href="/" subtitle="Bảo vệ RBAC" size="sm" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <PageTransition className="max-w-md w-full">
          <div className="bg-surface border border-border rounded-panel shadow-panel p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-status-danger-soft text-status-danger flex items-center justify-center mx-auto border border-red-200">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-bold text-red-700">
                <Lock className="w-3 h-3" />
                <span>HTTP 403 • RBAC Access Control</span>
              </div>
              <h1 className="text-xl font-extrabold text-ink">
                Không đủ quyền truy cập không gian này
              </h1>
              <p className="text-xs text-ink-muted leading-relaxed">
                Tài khoản hiện tại của bạn không có quyền mở đường dẫn{" "}
                <code className="font-mono text-ink bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                  {fromPath}
                </code>
                . Mọi yêu cầu truy cập trái quyền đều được kiểm soát bởi hệ thống phân quyền RBAC của EDUCARE AI.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <OceanButtonLink
                href={homePath}
                variant="gradient"
                icon={<ArrowLeft className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Về không gian làm việc của bạn
              </OceanButtonLink>
              <OceanButtonLink
                href="/dang-nhap"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Đổi tài khoản
              </OceanButtonLink>
            </div>
          </div>
        </PageTransition>
      </main>

      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số UNIGO.
      </footer>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ocean-mesh" />}>
      <ForbiddenContent />
    </Suspense>
  );
}
