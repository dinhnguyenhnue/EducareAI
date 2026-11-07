import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  FolderKanban,
  PlusCircle,
  Eye,
  CheckCircle2,
  ExternalLink,
  Award,
  Calendar,
  Layers,
} from "lucide-react";

export default async function StudentProductsPage() {
  const posts = await prisma.communityPost.findMany({
    where: { author: { email: "minhanh.nguyen@unigo.edu.vn" } },
    include: { author: true },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Sản phẩm học tập của em (Portfolio)</h1>
            <p className="text-xs text-ink-muted mt-1">
              Hồ sơ số lưu giữ tất cả infographic, dự án Scratch, slide thuyết trình và bài nghiên cứu của em tại UNIGO.
            </p>
          </div>

          <Link
            href="/hoc-sinh/cong-dong"
            className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng sản phẩm mới</span>
          </Link>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs font-semibold text-ink-muted">Sản phẩm đã xuất bản</span>
            <div className="text-2xl font-bold text-ink mt-2">2 dự án</div>
            <p className="text-[11px] text-status-success mt-1">Được giáo viên kiểm duyệt</p>
          </div>
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs font-semibold text-ink-muted">Lượt bạn học xem & học hỏi</span>
            <div className="text-2xl font-bold text-ink mt-2">156 lượt</div>
            <p className="text-[11px] text-brand-teal mt-1">Cộng đồng THCS UNIGO</p>
          </div>
          <div className="p-5 rounded-panel bg-surface border border-border shadow-card">
            <span className="text-xs font-semibold text-ink-muted">Đánh giá quá trình</span>
            <div className="text-2xl font-bold text-ink mt-2">Xuất sắc</div>
            <p className="text-[11px] text-ink-muted mt-1">Có đầy đủ bản tự nhận xét</p>
          </div>
        </div>

        {/* Product Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
            Danh sách sản phẩm đã ghi nhận
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                    <span className="text-xs text-status-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã duyệt
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink">{post.title}</h3>
                  <p className="text-xs text-ink-muted mt-2 leading-relaxed">{post.description}</p>

                  {post.processDescription && (
                    <div className="mt-4 p-3 rounded-button bg-canvas border border-border/70 text-xs">
                      <span className="font-bold text-ink block mb-1">Quy trình thực hiện:</span>
                      <p className="text-ink-muted leading-relaxed">{post.processDescription}</p>
                    </div>
                  )}

                  {post.selfEvaluation && (
                    <div className="mt-2 p-3 rounded-button bg-brand-teal-soft/30 border border-brand-teal/20 text-xs">
                      <span className="font-bold text-brand-teal block mb-1">Tự đánh giá:</span>
                      <p className="text-ink leading-relaxed">{post.selfEvaluation}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-ink-muted flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {post.viewCount} lượt xem
                  </span>
                  <Link
                    href="/hoc-sinh/cong-dong"
                    className="font-semibold text-brand-teal hover:underline"
                  >
                    Xem trên Cộng đồng →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

