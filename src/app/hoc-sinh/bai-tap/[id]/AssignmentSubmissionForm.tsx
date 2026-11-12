"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Link as LinkIcon, CheckSquare } from "lucide-react";
import {
  MultiFileAssetUploader,
  type UploadedAssetItem,
} from "@/components/assets/MultiFileAssetUploader";

export function AssignmentSubmissionForm({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [selfAssessment, setSelfAssessment] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!content.trim() && !driveUrl.trim() && uploadedAssets.length === 0) {
      setErrorMsg("Vui lòng nhập nội dung bài làm, tải tệp đính kèm trực tiếp hoặc dán liên kết sản phẩm.");
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryAssetUrl =
        uploadedAssets.length > 0
          ? `/api/assets/${uploadedAssets[0].id}`
          : driveUrl;

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          content,
          driveUrl: primaryAssetUrl,
          assetIds: uploadedAssets.map((a) => a.id),
          selfAssessment,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi xảy ra khi gửi bài làm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 rounded-panel bg-status-success-soft border border-status-success/30 text-center space-y-2">
        <h3 className="text-sm font-bold text-status-success">
          🎉 Nộp bài tập thành công!
        </h3>
        <p className="text-xs text-ink-muted">
          Bài làm đã được chuyển đến Thầy Tuấn để chấm điểm và nhận xét.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-status-danger-soft border border-status-danger/30 text-xs text-status-danger font-semibold">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-ink uppercase tracking-wide mb-1.5">
          1. Tóm tắt nội dung bài làm hoặc thuyết minh sản phẩm
        </label>
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mô tả các bước thực hiện, giải pháp em đã áp dụng..."
          className="w-full p-3 rounded-button bg-canvas border border-border text-xs text-ink focus:outline-none focus:border-brand-teal leading-relaxed"
        />
      </div>

      <MultiFileAssetUploader
        assignmentId={assignmentId}
        onAssetsChange={setUploadedAssets}
        label="2. Tải tệp bài làm trực tiếp lên hệ thống (PDF, DOCX, PPTX, XLSX, Ảnh, Âm thanh, Video, HTML, ZIP)"
      />

      <div>
        <label className="block text-xs font-bold text-ink uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-brand-teal" />
          <span>3. Hoặc đính kèm liên kết Google Drive / sản phẩm số (Tùy chọn)</span>
        </label>
        <input
          type="url"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/... (hoặc link Canva, Scratch, Figma)"
          className="w-full px-3 py-2.5 rounded-button bg-canvas border border-border text-xs text-ink focus:outline-none focus:border-brand-teal"
        />
        <p className="text-[11px] text-ink-muted mt-1">
          Lưu ý: Hãy chắc chắn em đã chia sẻ quyền "Người xem" cho thầy cô giáo nhé.
        </p>
      </div>

      <div className="p-4 rounded-panel bg-canvas border border-border space-y-2">
        <label className="block text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-brand-teal" />
          <span>3. Phần tự đánh giá của học sinh (Tiêu chí Tổ THCS)</span>
        </label>
        <textarea
          rows={3}
          value={selfAssessment}
          onChange={(e) => setSelfAssessment(e.target.value)}
          placeholder="Em tự đánh giá bài mình đạt mức nào theo 4 tiêu chí rubric? Điều gì em hài lòng nhất và điều gì cần hoàn thiện thêm?"
          className="w-full p-2.5 rounded-button bg-surface border border-border text-xs text-ink focus:outline-none focus:border-brand-teal"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? "Đang ghi nhận..." : "Nộp bài cho giáo viên"}</span>
        </button>
      </div>
    </form>
  );
}

