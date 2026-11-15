import React from "react";
import {
  BrandLogo,
  EmptyState,
  OceanButtonLink,
} from "@/components/ui";
import { Compass, Home, LogIn } from "lucide-react";

export default function NotFoundPage() {
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
        <div className="max-w-lg w-full bg-surface border border-border rounded-panel shadow-panel p-6 sm:p-8 space-y-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-light border border-ocean-200 text-[11px] font-bold text-ocean-700 font-mono">
            HTTP 404 • KHÔNG TÌM THẤY TRANG
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-ink text-balance">
            Đường dẫn này không tồn tại hoặc đã được chuyển vị trí
          </h1>

          <EmptyState
            tone="overview"
            icon={<Compass className="w-6 h-6" />}
            title="Không tìm thấy nội dung yêu cầu"
            description="Vui lòng kiểm tra lại địa chỉ URL hoặc sử dụng các lối tắt bên dưới để quay về không gian học tập và làm việc của bạn."
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <OceanButtonLink
                  href="/"
                  variant="gradient"
                  icon={<Home className="w-4 h-4" />}
                >
                  Về trang chủ EDUCARE AI
                </OceanButtonLink>
                <OceanButtonLink
                  href="/dang-nhap"
                  variant="secondary"
                  icon={<LogIn className="w-4 h-4" />}
                >
                  Đến cổng Đăng nhập
                </OceanButtonLink>
              </div>
            }
          />
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
        © 2026 EDUCARE AI — Hệ sinh thái học tập số UNIGO.
      </footer>
    </div>
  );
}
