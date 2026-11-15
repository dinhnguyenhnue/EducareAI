"use client";

import React, { useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal, OceanButton, PageHeader, useToast } from "@/components/ui";
import {
  Compass,
  MessageSquare,
  Eye,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

interface CommunityPost {
  id: string;
  author: string;
  title: string;
  desc: string;
  category: string;
  zone: "CURATED" | "STUDENT_SHOWCASE";
  views: number;
  comments: number;
  process: string;
  selfEval: string;
  pendingModeration?: boolean;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "cp-1",
    author: "Nguyễn Minh Anh (Lớp 7A1)",
    title: "Trò chơi tương tác 'Bảo vệ thành phố số UNIGO' bằng Scratch",
    desc: "Trò chơi giúp các bạn khối 6 & 7 nhận diện nguy cơ mã độc và email giả mạo thông qua các tình huống thực tế.",
    category: "Sáng tạo với AI & Công nghệ",
    zone: "STUDENT_SHOWCASE",
    views: 156,
    comments: 8,
    process:
      "1. Lên ý tưởng kịch bản. 2. Thiết kế nhân vật. 3. Lập trình vòng lặp và điều kiện trong Scratch.",
    selfEval: "Game chạy tốt trên máy tính, cần tối ưu thêm cho điện thoại.",
  },
  {
    id: "cp-2",
    author: "Trần Gia Bảo (Lớp 7A1)",
    title:
      "Slide infographic: 5 bước bảo mật dữ liệu cá nhân khi dùng Google Workspace",
    desc: "Tài liệu trực quan đúc kết sau bài học Tin học số 1, có thể in làm áp phích dán tại phòng máy.",
    category: "Góc Tin học",
    zone: "STUDENT_SHOWCASE",
    views: 112,
    comments: 5,
    process: "Thu thập tài liệu sách giáo khoa và tổng hợp trên Canva.",
    selfEval: "Màu sắc hài hòa, thông điệp rõ ràng.",
  },
  {
    id: "cp-3",
    author: "Tổ Chuyên môn Tin học UNIGO",
    title: "Cẩm nang: Phương pháp tự học Tin học qua đặt câu hỏi Socratic",
    desc: "Tài liệu học liệu mở định hướng cho học sinh khối 6, 7 tự nghiên cứu tại nhà.",
    category: "Khám phá tri thức",
    zone: "CURATED",
    views: 340,
    comments: 14,
    process: "Tổng kết kinh nghiệm giảng dạy và phản hồi của học sinh.",
    selfEval: "Đã qua thẩm định chuyên môn của Tổ THCS UNIGO.",
  },
];

export default function StudentCommunityPage() {
  const { pushToast } = useToast();
  const [activeZone, setActiveZone] = useState<
    "ALL" | "CURATED" | "STUDENT_SHOWCASE"
  >("ALL");
  const zoneOrder: Array<"ALL" | "STUDENT_SHOWCASE" | "CURATED"> = [
    "ALL",
    "STUDENT_SHOWCASE",
    "CURATED",
  ];
  const zoneTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleZoneTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIdx = (idx + 1) % zoneOrder.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIdx = (idx - 1 + zoneOrder.length) % zoneOrder.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = zoneOrder.length - 1;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      setActiveZone(zoneOrder[nextIdx]);
      zoneTabRefs.current[nextIdx]?.focus();
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);

  // New post form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dự án học sinh");
  const [description, setDescription] = useState("");
  const [process, setProcess] = useState("");
  const [selfEval, setSelfEval] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedTitle, setLastSubmittedTitle] = useState<string | null>(
    null
  );

  const filteredPosts =
    activeZone === "ALL" ? posts : posts.filter((p) => p.zone === activeZone);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitted(true);
    window.setTimeout(() => {
      const cleanTitle = title.trim();
      const newPost: CommunityPost = {
        id: `cp-user-${Date.now()}`,
        author: "Học sinh UNIGO (Chờ duyệt)",
        title: cleanTitle,
        desc: description.trim(),
        category,
        zone: "STUDENT_SHOWCASE",
        views: 1,
        comments: 0,
        process:
          process.trim() || "Đã hoàn thiện quy trình nghiên cứu và thử nghiệm.",
        selfEval:
          selfEval.trim() || "Mong nhận được góp ý từ thầy cô và các bạn.",
        pendingModeration: true,
      };
      setPosts((prev) => [newPost, ...prev]);
      setLastSubmittedTitle(cleanTitle);
      setSubmitted(false);
      setShowModal(false);
      setTitle("");
      setDescription("");
      setProcess("");
      setSelfEval("");

      pushToast({
        variant: "success",
        title: "Đã gửi sản phẩm chờ kiểm duyệt",
        description: `Sản phẩm "${cleanTitle}" đã được gửi tới giáo viên bộ môn để thẩm định trước khi công khai.`,
      });
    }, 500);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          tone="community"
          badge="Learning Community"
          badgeIcon={<Compass className="w-3.5 h-3.5" />}
          title="Cộng đồng học tập mở UNIGO"
          description="Không gian chia sẻ tri thức, trưng bày sản phẩm số và rèn luyện kỹ năng phản biện văn minh giữa học sinh và thầy cô."
          actions={
            <OceanButton
              type="button"
              variant="primary"
              onClick={() => setShowModal(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Đăng sản phẩm của em
            </OceanButton>
          }
        />

        {lastSubmittedTitle && (
          <div
            role="status"
            className="p-3.5 rounded-panel bg-status-success-soft border border-emerald-200 text-status-success text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate sm:whitespace-normal">
                Sản phẩm <strong>&ldquo;{lastSubmittedTitle}&rdquo;</strong> của
                em đã được ghi nhận và đang chờ giáo viên bộ môn kiểm duyệt!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLastSubmittedTitle(null)}
              className="text-[11px] font-bold underline shrink-0 hover:opacity-80"
            >
              Ẩn thông báo
            </button>
          </div>
        )}

        {/* 2-Zone Tabs */}
        <div
          role="tablist"
          aria-label="Phân khu Cộng đồng học tập"
          className="flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs"
        >
          <button
            ref={(el) => {
              zoneTabRefs.current[0] = el;
            }}
            id="community-tab-ALL"
            type="button"
            role="tab"
            aria-selected={activeZone === "ALL"}
            aria-controls="community-posts-tabpanel"
            tabIndex={activeZone === "ALL" ? 0 : -1}
            onClick={() => setActiveZone("ALL")}
            onKeyDown={(e) => handleZoneTabKeyDown(e, 0)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeZone === "ALL"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Tất cả nội dung ({posts.length})
          </button>
          <button
            ref={(el) => {
              zoneTabRefs.current[1] = el;
            }}
            id="community-tab-STUDENT_SHOWCASE"
            type="button"
            role="tab"
            aria-selected={activeZone === "STUDENT_SHOWCASE"}
            aria-controls="community-posts-tabpanel"
            tabIndex={activeZone === "STUDENT_SHOWCASE" ? 0 : -1}
            onClick={() => setActiveZone("STUDENT_SHOWCASE")}
            onKeyDown={(e) => handleZoneTabKeyDown(e, 1)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeZone === "STUDENT_SHOWCASE"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Góc Sản phẩm Học sinh
          </button>
          <button
            ref={(el) => {
              zoneTabRefs.current[2] = el;
            }}
            id="community-tab-CURATED"
            type="button"
            role="tab"
            aria-selected={activeZone === "CURATED"}
            aria-controls="community-posts-tabpanel"
            tabIndex={activeZone === "CURATED" ? 0 : -1}
            onClick={() => setActiveZone("CURATED")}
            onKeyDown={(e) => handleZoneTabKeyDown(e, 2)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeZone === "CURATED"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Học liệu Kiểm duyệt (Giáo viên)
          </button>
        </div>

        {/* Posts Stream */}
        <div
          id="community-posts-tabpanel"
          role="tabpanel"
          aria-labelledby={`community-tab-${activeZone}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="p-6 rounded-panel bg-surface border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-pink-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-[10px] text-ink-muted font-semibold">
                    {post.pendingModeration
                      ? "Đang chờ GV duyệt"
                      : post.zone === "CURATED"
                      ? "Học liệu chuẩn"
                      : "Sản phẩm HS"}
                  </span>
                </div>

                <h2 className="text-base font-bold text-ink leading-snug line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed text-pretty">
                  {post.desc}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-canvas border border-border/80 text-xs space-y-1">
                  <span className="font-semibold text-ink block text-[11px]">
                    Quy trình thực hiện:
                  </span>
                  <p className="text-ink-muted text-[11px] line-clamp-2">
                    {post.process}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-ink-muted">
                <span className="truncate max-w-[170px] font-medium text-ink">
                  {post.author}
                </span>

                <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                  <span
                    className="flex items-center gap-1"
                    title="Số lượt xem"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    {post.views}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    title="Số bình luận"
                  >
                    <MessageSquare
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                    {post.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Accessible Modal: Đăng sản phẩm mới */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          maxWidth="max-w-xl"
          title={
            <span className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-pink-600 shrink-0" />
              <span>Đăng tải sản phẩm lên Cộng đồng</span>
            </span>
          }
          description="Chia sẻ dự án, trình bày quy trình thực hiện và tự đánh giá trước khi gửi giáo viên kiểm duyệt."
        >
          <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
            <div>
              <label
                htmlFor="community-post-title"
                className="block font-bold text-ink mb-1"
              >
                Tên sản phẩm / Dự án: *
              </label>
              <input
                id="community-post-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Mô phỏng bài toán tỉ lệ thức bằng Scratch..."
                className="w-full px-3 py-2.5 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
              />
            </div>

            <div>
              <label
                htmlFor="community-post-category"
                className="block font-bold text-ink mb-1"
              >
                Chuyên mục:
              </label>
              <select
                id="community-post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
              >
                <option value="Dự án học sinh">Dự án học sinh</option>
                <option value="Sáng tạo với AI & Công nghệ">
                  Sáng tạo với AI & Công nghệ
                </option>
                <option value="Góc Tin học">Góc Tin học</option>
                <option value="Góc Toán học">Góc Toán học</option>
                <option value="Góc Ngữ văn">Góc Ngữ văn</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="community-post-desc"
                className="block font-bold text-ink mb-1"
              >
                Mô tả sản phẩm: *
              </label>
              <textarea
                id="community-post-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu mục tiêu của sản phẩm và lợi ích đem lại..."
                className="w-full p-3 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
              />
            </div>

            <div>
              <label
                htmlFor="community-post-process"
                className="block font-bold text-ink mb-1"
              >
                Quy trình thực hiện (Tổ THCS yêu cầu):
              </label>
              <textarea
                id="community-post-process"
                rows={2}
                value={process}
                onChange={(e) => setProcess(e.target.value)}
                placeholder="Nêu các bước em đã làm (nghiên cứu, thiết kế, lập trình, kiểm thử)..."
                className="w-full p-3 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
              />
            </div>

            <div>
              <label
                htmlFor="community-post-self-eval"
                className="block font-bold text-ink mb-1"
              >
                Bản tự đánh giá của em:
              </label>
              <textarea
                id="community-post-self-eval"
                rows={2}
                value={selfEval}
                onChange={(e) => setSelfEval(e.target.value)}
                placeholder="Điều em thấy tốt nhất và điều em muốn các bạn góp ý..."
                className="w-full p-3 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light"
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <OceanButton
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Hủy bỏ
              </OceanButton>
              <OceanButton
                type="submit"
                variant="primary"
                loading={submitted}
              >
                {submitted ? "Đang gửi duyệt..." : "Gửi giáo viên duyệt"}
              </OceanButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
