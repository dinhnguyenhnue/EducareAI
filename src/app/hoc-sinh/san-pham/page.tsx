import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  FolderKanban,
  PlusCircle,
  Eye,
  CheckCircle2,
  Award,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentProductsPage() {
  const session = await getServerSession();
  const isStudentSession =
    session?.user.role === "STUDENT" && !session.isSuperAdmin;

  const posts = await prisma.communityPost.findMany({
    where: isStudentSession
      ? { authorId: session.user.id }
      : { author: { email: "minhanh.nguyen@unigo.edu.vn" } },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const selfEvalCount = posts.filter((p) => Boolean(p.selfEvaluation?.trim())).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="achievements"
          badge="Portfolio Học tập số"
          badgeIcon={<Award className="w-3.5 h-3.5" />}
          title="Sản phẩm học tập của em (Portfolio)"
          description="Hồ sơ số lưu giữ tất cả infographic, dự án Scratch, slide thuyết trình và bài nghiên cứu của em tại UNIGO."
          actions={
            <Link
              href="/hoc-sinh/cong-dong"
              className="px-4 py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng sản phẩm mới</span>
            </Link>
          }
        />

        {/* Portfolio Stats (Real DB Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            tone="achievements"
            label="Sản phẩm đã ghi nhận"
            value={posts.length > 0 ? `${posts.length} dự án` : "Chưa có dữ liệu"}
            hint="Lưu trữ trong hồ sơ UNIGO"
            icon={<FolderKanban className="w-5 h-5" />}
          />
          <StatCard
            tone="community"
            label="Lượt bạn học xem & học hỏi"
            value={posts.length > 0 ? `${totalViews} lượt` : "Chưa có dữ liệu"}
            hint="Cộng đồng THCS UNIGO"
            icon={<Eye className="w-5 h-5" />}
          />
          <StatCard
            tone="progress"
            label="Bản tự đánh giá kèm theo"
            value={posts.length > 0 ? `${selfEvalCount}/${posts.length} bài` : "Chưa có dữ liệu"}
            hint="Có đầy đủ quy trình & tự nhận xét"
            icon={<Sparkles className="w-5 h-5" />}
          />
        </div>

        {/* Product Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
            Danh sách sản phẩm đã ghi nhận
          </h2>

          {posts.length === 0 ? (
            <EmptyState
              tone="achievements"
              icon={<FolderKanban className="w-6 h-6" />}
              title="Chưa có sản phẩm học tập nào"
              description="Em hãy đăng sản phẩm đầu tiên lên Cộng đồng học tập để lưu vào Portfolio cá nhân nhé."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã ghi nhận
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-ink">{post.title}</h3>
                    <p className="text-xs text-ink-muted mt-2 leading-relaxed">{post.description}</p>

                    {post.processDescription && (
                      <div className="mt-4 p-3 rounded-xl bg-canvas border border-slate-200/80 text-xs">
                        <span className="font-bold text-ink block mb-1">Quy trình thực hiện:</span>
                        <p className="text-ink-muted leading-relaxed">{post.processDescription}</p>
                      </div>
                    )}

                    {post.selfEvaluation && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                        <span className="font-bold text-amber-800 block mb-1">Tự đánh giá:</span>
                        <p className="text-ink leading-relaxed">{post.selfEvaluation}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-ink-muted flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {post.viewCount} lượt xem
                    </span>
                    <Link
                      href="/hoc-sinh/cong-dong"
                      className="font-semibold text-ocean-700 hover:underline"
                    >
                      Xem trên Cộng đồng →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

