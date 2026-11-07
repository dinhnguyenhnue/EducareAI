"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "trang nội bộ";
  const homePath = searchParams.get("home") || "/dang-nhap";

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-panel shadow-card p-8 space-y-5 text-center">
        <div className="w-12 h-12 rounded-panel bg-status-danger-soft text-status-danger flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-canvas border border-border text-[11px] font-semibold text-ink-muted">
            <Lock className="w-3 h-3 text-status-danger" />
            <span>HTTP 403 • RBAC Access Control</span>
          </div>
          <h1 className="text-xl font-bold text-ink">
            Không đủ quyền truy cập không gian này
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            Tài khoản hiện tại của bạn không có quyền mở đường dẫn{" "}
            <code className="font-mono text-ink bg-canvas px-1.5 py-0.5 rounded border border-border">
              {fromPath}
            </code>
            . Mọi yêu cầu truy cập trái quyền đều được kiểm soát bởi hệ thống phân quyền RBAC của EDUCARE AI.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={homePath}
            className="w-full sm:w-auto px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về không gian làm việc của bạn</span>
          </Link>
          <Link
            href="/dang-nhap"
            className="w-full sm:w-auto px-4 py-2.5 rounded-button bg-canvas border border-border text-ink text-xs font-semibold hover:bg-surface-muted transition-colors"
          >
            Đổi tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <ForbiddenContent />
    </Suspense>
  );
}

