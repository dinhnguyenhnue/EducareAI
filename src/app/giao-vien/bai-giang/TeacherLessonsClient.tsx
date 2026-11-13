"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  FileText,
  ExternalLink,
  CheckCircle2,
  X,
  Network,
} from "lucide-react";
import {
  MultiFileAssetUploader,
  type UploadedAssetItem,
} from "@/components/assets/MultiFileAssetUploader";

export function TeacherLessonsClient({
  initialLessons,
  topics,
}: {
  initialLessons: any[];
  topics: any[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [showModal, setShowModal] = useState(false);
  const [topicId, setTopicId] = useState(topics[0]?.id || "");
  const [title, setTitle] = useState("");
  const [summaryParagraph, setSummaryParagraph] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [driveFileUrl, setDriveFileUrl] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>([]);
  const [createGoogleDoc, setCreateGoogleDoc] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const primaryAssetUrl =
        uploadedAssets.length > 0
          ? `/api/assets/${uploadedAssets[0].id}`
          : driveFileUrl;
      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          title,
          summaryParagraph,
          activityContent,
          driveFileUrl: primaryAssetUrl,
          assetIds: uploadedAssets.map((a) => a.id),
          createGoogleDoc,
        }),
      });
      const data = await res.json();
      if (res.ok && data.lesson) {
        setLessons((prev) => [data.lesson, ...prev]);
        setShowModal(false);
        setTitle("");
        setSummaryParagraph("");
        setActivityContent("");
        setDriveFileUrl("");
        setNotice(
          `Đã xuất bản bài giảng "${data.lesson.title}" ${
            data.lesson.googleDocId
              ? `kèm tài liệu Google Docs (${data.lesson.googleDocId})`
              : ""
          }.`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              Biên soạn Bài giảng & Học liệu Số
            </h1>
            <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full">
              Lesson Studio + Google Docs/Drive
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Soạn kế hoạch bài dạy, đính kèm tài liệu Google Drive và tự động khởi tạo phiếu học tập Google Docs theo ngữ cảnh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Soạn bài giảng mới</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-status-success-soft border border-status-success/30 text-xs text-status-success font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((l) => (
          <div
            key={l.id}
            className="p-6 rounded-2xl bg-surface border border-border hover:border-sky-300 shadow-card transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full">
                  {l.topic?.subject?.name} • {l.topic?.name}
                </span>
                <span className="text-[11px] font-semibold bg-status-success-soft text-status-success px-2.5 py-0.5 rounded-full">
                  {l.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-ink">{l.title}</h3>
              <p className="text-xs text-ink-muted">
                Giáo viên biên soạn: {l.teacher?.user?.fullName || "Chưa có dữ liệu"}
              </p>

              {l.googleDocId && (
                <div className="p-2.5 rounded-xl bg-canvas border border-border text-xs flex items-center justify-between">
                  <span className="font-mono text-[11px] text-ink">
                    Google Docs ID: <strong>{l.googleDocId}</strong>
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-700">
                    Đã liên kết Docs
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <Link
                href={`/hoc-sinh/mon-hoc/${l.id}`}
                className="font-semibold text-sky-700 hover:text-ocean-600 hover:underline flex items-center gap-1"
              >
                <span>Xem giao diện bài học của Học sinh</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <span className="text-ink-muted text-[11px]">
                {new Date(l.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateLesson}
            className="w-full max-w-lg bg-surface rounded-panel border border-border shadow-dialog p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-ink">
                Soạn Bài giảng & Đính kèm Google Docs / Drive
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Thuộc Chủ đề Môn học:
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subject?.name} — {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Tiêu đề bài giảng:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài 5: Sử dụng hàm tính toán cơ bản trên Google Sheets"
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Tóm tắt kiến thức & Câu hỏi khởi động:
              </label>
              <textarea
                rows={3}
                required
                value={summaryParagraph}
                onChange={(e) => setSummaryParagraph(e.target.value)}
                placeholder="Nội dung trọng tâm giúp học sinh tự đặt câu hỏi và khám phá..."
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <MultiFileAssetUploader
              onAssetsChange={setUploadedAssets}
              label="Tải học liệu trực tiếp lên Kho Bài giảng (PDF, DOCX, PPTX, XLSX, Ảnh, Video, HTML, ZIP):"
            />

            <div>
              <label className="font-semibold text-ink block mb-1">
                Hoặc dán Link tài liệu Google Drive đính kèm (Tùy chọn):
              </label>
              <input
                type="url"
                value={driveFileUrl}
                onChange={(e) => setDriveFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
              <div className="font-bold text-sky-700 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                <span>Tích hợp Google Docs theo ngữ cảnh:</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createGoogleDoc}
                  onChange={(e) => setCreateGoogleDoc(e.target.checked)}
                  className="accent-ocean-600"
                />
                <span>
                  Tự động khởi tạo <strong>Giáo án / Phiếu học tập Google Docs</strong> từ mẫu chuẩn UNIGO
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-canvas text-ink font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold"
              >
                {isSaving ? "Đang xuất bản..." : "Xuất bản bài giảng"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

