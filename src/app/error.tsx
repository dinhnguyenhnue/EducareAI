"use client";

import React, { useEffect } from "react";
import {
  BrandLogo,
  ErrorState,
  OceanButton,
  OceanButtonLink,
  PageTransition,
} from "@/components/ui";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EDUCARE_APP_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ocean-mesh text-ink flex flex-col justify-between">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-button focus:bg-ocean-600 focus:text-white focus:font-bold focus:text-xs focus:shadow-dialog"
      >
        Chuyển đến nội dung chính
      </a>

      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-border bg-surface/85 backdrop-blur-md">
        <BrandLogo href="/" subtitle="Hệ sinh thái học tập số UNIGO" size="sm" />
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center p-6 focus:outline-none"
      >
        <PageTransition className="max-w-lg w-full">
          <div className="bg-surface border border-border rounded-panel shadow-panel p-6 sm:p-8 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-status-danger-soft text-status-danger border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-bold text-red-700">
                Gián đoạn hiển thị tạm thời
              </span>
              <h1 className="text-xl font-extrabold text-ink text-balance">
                Đã xảy ra sự cố khi tải trang này
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed text-pretty">
                Hệ thống gặp lỗi ngoài dự kiến trong quá trình hiển thị dữ liệu. Dữ liệu học tập và phiên đăng nhập của bạn vẫn được bảo toàn.
              </p>
            </div>

            <ErrorState
              title="Chi tiết kỹ thuật"
              message={
                error?.message ||
                "Không thể hoàn tất yêu cầu hiển thị. Vui lòng thử tải lại trang hoặc quay về trang chủ."
              }
            />

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <OceanButton
                type="button"
                variant="gradient"
                onClick={() => reset()}
                icon={<RotateCcw className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Thử tải lại trang
              </OceanButton>
              <OceanButtonLink
                href="/"
                variant="secondary"
                icon={<Home className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Về trang chủ EDUCARE AI
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
