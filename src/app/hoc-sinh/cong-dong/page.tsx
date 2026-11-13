"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import {
  Compass,
  MessageSquare,
  Eye,
  PlusCircle,
} from "lucide-react";

export default function StudentCommunityPage() {
  const [activeZone, setActiveZone] = useState<"ALL" | "CURATED" | "STUDENT_SHOWCASE">("ALL");
  const [showModal, setShowModal] = useState(false);

  // New post form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dự án học sinh");
  const [description, setDescription] = useState("");
  const [process, setProcess] = useState("");
  const [selfEval, setSelfEval] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const posts = [
    {
      id: "cp-1",
      author: "Nguyễn Minh Anh (Lớp 7A1)",
      title: "Trò chơi tương tác 'Bảo vệ thành phố số UNIGO' bằng Scratch",
      desc: "Trò chơi giúp các bạn khối 6 & 7 nhận diện nguy cơ mã độc và email giả mạo thông qua các tình huống thực tế.",
      category: "Sáng tạo với AI & Công nghệ",
      zone: "STUDENT_SHOWCASE",
      views: 156,
      comments: 8,
      process: "1. Lên ý tưởng kịch bản. 2. Thiết kế nhân vật. 3. Lập trình vòng lặp và điều kiện trong Scratch.",
      selfEval: "Game chạy tốt trên máy tính, cần tối ưu thêm cho điện thoại.",
    },
    {
      id: "cp-2",
      author: "Trần Gia Bảo (Lớp 7A1)",
      title: "Slide infographic: 5 bước bảo mật dữ liệu cá nhân khi dùng Google Workspace",
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
      author: "Thầy Trần Minh Tuấn (GV Tin học)",
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

  const filteredPosts =
    activeZone === "ALL" ? posts : posts.filter((p) => p.zone === activeZone);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
      alert("Sản phẩm của em đã được gửi đến Thầy Tuấn để kiểm duyệt trước khi xuất bản!");
    }, 1200);
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
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng sản phẩm của em</span>
            </button>
          }
        />

        {/* 2-Zone Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs">
          <button
            onClick={() => setActiveZone("ALL")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              activeZone === "ALL"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Tất cả nội dung ({posts.length})
          </button>
          <button
            onClick={() => setActiveZone("STUDENT_SHOWCASE")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              activeZone === "STUDENT_SHOWCASE"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Góc Sản phẩm Học sinh
          </button>
          <button
            onClick={() => setActiveZone("CURATED")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              activeZone === "CURATED"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-pink-50/60"
            }`}
          >
            Học liệu Kiểm duyệt (Giáo viên)
          </button>
        </div>

        {/* Posts Stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-2xl bg-surface border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-pink-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-[10px] text-ink-muted font-medium">
                    {post.zone === "CURATED" ? "Học liệu chuẩn" : "Sản phẩm HS"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink leading-snug">{post.title}</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">{post.desc}</p>

                <div className="mt-4 p-3 rounded-xl bg-canvas border border-slate-200/80 text-xs space-y-1">
                  <span className="font-semibold text-ink block text-[11px]">
                    Quy trình thực hiện:
                  </span>
                  <p className="text-ink-muted text-[11px] line-clamp-2">{post.process}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-ink-muted">
                <span className="truncate max-w-[150px] font-medium text-ink">
                  {post.author}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Đăng sản phẩm mới */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <div className="w-full max-w-xl bg-surface rounded-2xl border border-slate-200 shadow-dialog p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-pink-600" />
                  <span>Đăng tải sản phẩm lên Cộng đồng</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xs text-ink-muted hover:text-ink font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">Tên sản phẩm / Dự án:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Mô phỏng bài toán tỉ lệ thức bằng Scratch..."
                    className="w-full px-3 py-2 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Chuyên mục:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  >
                    <option value="Dự án học sinh">Dự án học sinh</option>
                    <option value="Sáng tạo với AI & Công nghệ">Sáng tạo với AI & Công nghệ</option>
                    <option value="Góc Tin học">Góc Tin học</option>
                    <option value="Góc Toán học">Góc Toán học</option>
                    <option value="Góc Ngữ văn">Góc Ngữ văn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Mô tả sản phẩm:</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Giới thiệu mục tiêu của sản phẩm và lợi ích đem lại..."
                    className="w-full p-3 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Quy trình thực hiện (Tổ THCS yêu cầu):
                  </label>
                  <textarea
                    rows={2}
                    value={process}
                    onChange={(e) => setProcess(e.target.value)}
                    placeholder="Nêu các bước em đã làm (nghiên cứu, thiết kế, lập trình, kiểm thử)..."
                    className="w-full p-3 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Bản tự đánh giá của em:
                  </label>
                  <textarea
                    rows={2}
                    value={selfEval}
                    onChange={(e) => setSelfEval(e.target.value)}
                    placeholder="Điều em thấy tốt nhất và điều em muốn các bạn góp ý..."
                    className="w-full p-3 bg-canvas border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-canvas hover:bg-slate-100 text-ink font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitted}
                    className="px-5 py-2 rounded-xl bg-ocean-600 text-white font-semibold hover:bg-ocean-700 transition-colors shadow-sm"
                  >
                    {submitted ? "Đang gửi duyệt..." : "Gửi giáo viên duyệt"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

