"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Network,
  AlertCircle,
  Link2,
} from "lucide-react";
import { Modal } from "@/components/ui";
import {
  MultiFileAssetUploader,
  type UploadedAssetItem,
} from "@/components/assets/MultiFileAssetUploader";
import {
  parseAndNormalizeDriveMaterial,
  parseLessonDriveLinksJson,
  type DriveKindHint,
} from "@/lib/drive-url";
import { DriveMaterialCard } from "@/components/materials/DriveMaterialViewer";

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
  const [objectiveText, setObjectiveText] = useState("");
  const [summaryParagraph, setSummaryParagraph] = useState("");
  const [activityContent, setActivityContent] = useState("");

  // Primary: Google Drive Link state
  const [driveFileUrl, setDriveFileUrl] = useState("");
  const [driveMaterialTitle, setDriveMaterialTitle] = useState("");
  const [driveMaterialDescription, setDriveMaterialDescription] = useState("");
  const [driveKindHint, setDriveKindHint] = useState<DriveKindHint>("AUTO");

  // Secondary: Direct file upload state
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>([]);
  const [createGoogleDoc, setCreateGoogleDoc] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const liveDrivePreview = useMemo(() => {
    if (!driveFileUrl.trim()) return null;
    return parseAndNormalizeDriveMaterial({
      url: driveFileUrl,
      title: driveMaterialTitle || title || "Tài liệu Google Drive đính kèm",
      description: driveMaterialDescription,
      kindHint: driveKindHint,
    });
  }, [driveFileUrl, driveMaterialTitle, driveMaterialDescription, driveKindHint, title]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (driveFileUrl.trim() && liveDrivePreview && !liveDrivePreview.valid) {
      setFormError(
        liveDrivePreview.error ||
          "Liên kết Google Drive không hợp lệ. Vui lòng kiểm tra lại trước khi lưu."
      );
      return;
    }

    setIsSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          title,
          objectiveText,
          summaryParagraph,
          activityContent,
          driveFileUrl: driveFileUrl.trim() || undefined,
          driveMaterialTitle: driveMaterialTitle.trim() || undefined,
          driveMaterialDescription: driveMaterialDescription.trim() || undefined,
          driveKindHint,
          assetIds: uploadedAssets.map((a) => a.id),
          createGoogleDoc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Không thể lưu bài giảng.");
        return;
      }
      if (data.lesson) {
        setLessons((prev) => [data.lesson, ...prev]);
        setShowModal(false);
        setTitle("");
        setObjectiveText("");
        setSummaryParagraph("");
        setActivityContent("");
        setDriveFileUrl("");
        setDriveMaterialTitle("");
        setDriveMaterialDescription("");
        setDriveKindHint("AUTO");
        setUploadedAssets([]);
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
              Lesson Studio + Google Drive
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Soạn kế hoạch bài dạy, dán liên kết ảnh/tài liệu Google Drive hiển thị trực tiếp trong bài học của học sinh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-ocean-600 text-white text-sm font-semibold hover:bg-ocean-700 transition-colors shadow-sm flex items-center justify-center gap-2"
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
        {lessons.map((l) => {
          const parsedDriveItems = parseLessonDriveLinksJson(l.driveFileLinks);
          return (
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
                  {parsedDriveItems.length > 0 && (
                    <span className="text-[11px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200 px-2.5 py-0.5 rounded-full">
                      {parsedDriveItems.length} học liệu Drive
                    </span>
                  )}
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
          );
        })}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Soạn Bài giảng & Đính kèm Học liệu Google Drive"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lesson-topic-select"
                className="font-semibold text-ink block mb-1"
              >
                Thuộc Chủ đề Môn học:
              </label>
              <select
                id="lesson-topic-select"
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
              <label
                htmlFor="lesson-title-input"
                className="font-semibold text-ink block mb-1"
              >
                Tiêu đề bài giảng:
              </label>
              <input
                id="lesson-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài 1: Thông tin và dữ liệu"
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lesson-objective-input"
              className="font-semibold text-ink block mb-1"
            >
              Mục tiêu ngắn của bài học (Hiển thị ngay đầu bài cho học sinh):
            </label>
            <input
              id="lesson-objective-input"
              type="text"
              value={objectiveText}
              onChange={(e) => setObjectiveText(e.target.value)}
              placeholder="VD: Phân biệt được thông tin, dữ liệu và vật mang tin qua ví dụ thực tế."
              className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="lesson-summary-textarea"
              className="font-semibold text-ink block mb-1"
            >
              Tóm tắt kiến thức & Câu hỏi khởi động:
            </label>
            <textarea
              id="lesson-summary-textarea"
              rows={3}
              required
              value={summaryParagraph}
              onChange={(e) => setSummaryParagraph(e.target.value)}
              placeholder="Nội dung trọng tâm giúp học sinh tự đặt câu hỏi và khám phá..."
              className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
            />
          </div>

          {/* PRIMARY METHOD: Google Drive Link + Instant Preview */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-ocean-800 flex items-center gap-1.5 text-xs">
                <Link2 className="w-4 h-4 text-ocean-600" />
                <span>Cách chính: Dán liên kết Google Drive (Ảnh, PDF, Docs, Slides, Thư mục)</span>
              </span>
              <span className="text-[11px] font-semibold text-ocean-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                Khuyên dùng
              </span>
            </div>

            <div>
              <label
                htmlFor="lesson-drive-url"
                className="font-semibold text-ink block mb-1"
              >
                Đường dẫn Google Drive (HTTPS):
              </label>
              <input
                id="lesson-drive-url"
                type="url"
                value={driveFileUrl}
                onChange={(e) => setDriveFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/<ID>/view hoặc https://drive.google.com/open?id=<ID>"
                className="w-full px-3 py-2 rounded-button bg-white border border-border text-ink"
              />
              {liveDrivePreview && !liveDrivePreview.valid && (
                <p
                  role="alert"
                  className="mt-1.5 text-[11px] font-semibold text-rose-700 flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{liveDrivePreview.error}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="lesson-drive-title"
                  className="font-semibold text-ink block mb-1"
                >
                  Tên tài liệu / hình ảnh hiển thị:
                </label>
                <input
                  id="lesson-drive-title"
                  type="text"
                  value={driveMaterialTitle}
                  onChange={(e) => setDriveMaterialTitle(e.target.value)}
                  placeholder="VD: Sơ đồ đèn giao thông ngã tư.png"
                  className="w-full px-3 py-2 rounded-button bg-white border border-border text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="lesson-drive-kind"
                  className="font-semibold text-ink block mb-1"
                >
                  Loại học liệu:
                </label>
                <select
                  id="lesson-drive-kind"
                  value={driveKindHint}
                  onChange={(e) =>
                    setDriveKindHint(e.target.value as DriveKindHint)
                  }
                  className="w-full px-3 py-2 rounded-button bg-white border border-border text-ink"
                >
                  <option value="AUTO">Tự động nhận diện theo link/tên</option>
                  <option value="IMAGE">Hình ảnh (Hiển thị trực tiếp trong bài)</option>
                  <option value="PDF">Tài liệu PDF (Khung đọc trong bài)</option>
                  <option value="DOCUMENT">Google Docs / Slides / Sheets</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="lesson-drive-desc"
                className="font-semibold text-ink block mb-1"
              >
                Mô tả ảnh / Chú thích cho học sinh (Tùy chọn):
              </label>
              <input
                id="lesson-drive-desc"
                type="text"
                value={driveMaterialDescription}
                onChange={(e) => setDriveMaterialDescription(e.target.value)}
                placeholder="VD: Hình 1.1 - Bạn Minh quan sát tín hiệu đèn giao thông trước khi qua đường"
                className="w-full px-3 py-2 rounded-button bg-white border border-border text-ink"
              />
            </div>

            {liveDrivePreview && liveDrivePreview.valid && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[11px] font-bold text-ocean-800 block">
                  Xem trước hiển thị bên trang Học sinh:
                </span>
                <DriveMaterialCard
                  item={liveDrivePreview}
                  defaultExpandPreview={false}
                />
              </div>
            )}
          </div>

          {/* SECONDARY METHOD: File Upload with fallback hint */}
          <div className="space-y-1.5">
            <MultiFileAssetUploader
              onAssetsChange={setUploadedAssets}
              label="Hoặc tải tệp nhỏ trực tiếp lên Kho Bài giảng (Nếu tệp lớn hoặc lỗi tải lên, hãy dùng ô Dán liên kết Google Drive ở trên):"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-2">
            <div className="font-bold text-ink flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-ocean-600" />
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
                Tự động khởi tạo{" "}
                <strong>Giáo án / Phiếu học tập Google Docs</strong> từ mẫu chuẩn UNIGO
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
      </Modal>
    </div>
  );
}
