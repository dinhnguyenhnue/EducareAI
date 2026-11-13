"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  ShieldCheck,
} from "lucide-react";

export interface UploadedAssetItem {
  id: string;
  safeFileName: string;
  mimeType: string;
  extension: string;
  category: string;
  sizeBytes: number;
  sha256: string;
  previewMode: "INLINE_PREVIEW" | "DOWNLOAD_ONLY" | "SANDBOX_HTML";
  externalDriveUrl?: string | null;
}

interface FileQueueItem {
  localId: string;
  file: File;
  status: "UPLOADING" | "SUCCESS" | "ERROR";
  progress: number;
  errorMessage?: string;
  errorCode?: string;
  asset?: UploadedAssetItem;
}

export function MultiFileAssetUploader({
  classId,
  lessonId,
  assignmentId,
  submissionId,
  onAssetsChange,
  label = "Kho Học liệu & Tệp đính kèm trực tiếp (Hỗ trợ kéo thả nhiều tệp)",
}: {
  classId?: string;
  lessonId?: string;
  assignmentId?: string;
  submissionId?: string;
  onAssetsChange?: (assets: UploadedAssetItem[]) => void;
  label?: string;
}) {
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notifyParent = (nextQueue: FileQueueItem[]) => {
    if (!onAssetsChange) return;
    const uploaded = nextQueue
      .filter((item) => item.status === "SUCCESS" && item.asset)
      .map((item) => item.asset!);
    onAssetsChange(uploaded);
  };

  const uploadSingleFile = async (localId: string, file: File) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.localId === localId
          ? { ...q, status: "UPLOADING", progress: 35, errorMessage: undefined }
          : q
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (classId) formData.append("classId", classId);
      if (lessonId) formData.append("lessonId", lessonId);
      if (assignmentId) formData.append("assignmentId", assignmentId);
      if (submissionId) formData.append("submissionId", submissionId);

      const res = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setQueue((prev) => {
          const updated = prev.map((q) =>
            q.localId === localId
              ? {
                  ...q,
                  status: "ERROR" as const,
                  progress: 0,
                  errorMessage: data.error || "Tải tệp thất bại.",
                  errorCode: data.code,
                }
              : q
          );
          notifyParent(updated);
          return updated;
        });
        return;
      }

      setQueue((prev) => {
        const updated = prev.map((q) =>
          q.localId === localId
            ? {
                ...q,
                status: "SUCCESS" as const,
                progress: 100,
                asset: data.asset as UploadedAssetItem,
              }
            : q
        );
        notifyParent(updated);
        return updated;
      });
    } catch {
      setQueue((prev) => {
        const updated = prev.map((q) =>
          q.localId === localId
            ? {
                ...q,
                status: "ERROR" as const,
                progress: 0,
                errorMessage: "Lỗi kết nối mạng khi tải tệp lên.",
              }
            : q
        );
        notifyParent(updated);
        return updated;
      });
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming: FileQueueItem[] = Array.from(fileList).map((file) => ({
      localId: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      status: "UPLOADING",
      progress: 10,
    }));

    setQueue((prev) => [...prev, ...incoming]);
    for (const item of incoming) {
      void uploadSingleFile(item.localId, item.file);
    }
  };

  const handleRemove = (localId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((q) => q.localId !== localId);
      notifyParent(updated);
      return updated;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-ink">{label}</label>
        <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Kiểm tra Magic Bytes & chống Zip Slip
        </span>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center space-y-1.5 ${
          isDragging
            ? "border-sky-500 bg-sky-50"
            : "border-border bg-canvas hover:border-sky-400 hover:bg-sky-50/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.mp3,.wav,.mp4,.webm,.html,.zip"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadCloud className="w-6 h-6 text-sky-600 mx-auto" />
        <p className="text-xs font-semibold text-ink">
          Kéo thả nhiều tệp vào đây hoặc nhấn để chọn tệp từ máy tính
        </p>
        <p className="text-[11px] text-ink-muted">
          Hỗ trợ: PDF, DOCX, PPTX, XLSX, CSV, TXT, PNG/JPG/WEBP, MP3/WAV, MP4/WEBM, HTML (Sandbox), ZIP (kiểm tra an toàn). Từ chối mọi tệp thực thi (.exe, .bat, .ps1, .js...).
        </p>
      </div>

      {/* Queue List */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.localId}
              className="p-3 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-ink truncate">
                    {item.asset?.safeFileName || item.file.name}
                    <span className="ml-2 text-[11px] font-normal text-ink-muted">
                      ({formatSize(item.file.size)})
                    </span>
                  </div>

                  {item.status === "UPLOADING" && (
                    <div className="text-[11px] text-sky-700 font-medium">
                      Đang kiểm tra chữ ký nhị phân & tải lên ({item.progress}%)...
                    </div>
                  )}

                  {item.status === "SUCCESS" && item.asset && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-status-success font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã lưu kho an toàn
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-canvas border border-border text-ink-muted font-mono text-[10px]">
                        {item.asset.previewMode === "INLINE_PREVIEW"
                          ? "Xem trực tiếp"
                          : item.asset.previewMode === "SANDBOX_HTML"
                          ? "Chạy trong Sandbox CSP"
                          : "Tải về máy"}
                      </span>
                    </div>
                  )}

                  {item.status === "ERROR" && (
                    <div className="text-[11px] text-status-danger font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>
                        {item.errorCode ? `[${item.errorCode}] ` : ""}
                        {item.errorMessage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.status === "SUCCESS" && item.asset && (
                  <>
                    {item.asset.previewMode !== "DOWNLOAD_ONLY" && (
                      <a
                        href={`/api/assets/${item.asset.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-sky-50 border border-border text-[11px] font-semibold text-ink flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-sky-600" />
                        <span>Xem</span>
                      </a>
                    )}
                    <a
                      href={`/api/assets/${item.asset.id}?download=1`}
                      className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-sky-50 border border-border text-[11px] font-semibold text-ink flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-sky-600" />
                      <span>Tải về</span>
                    </a>
                  </>
                )}

                {item.status === "ERROR" && (
                  <button
                    type="button"
                    onClick={() => uploadSingleFile(item.localId, item.file)}
                    className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-ocean-50 border border-border text-[11px] font-semibold text-ocean-600 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Thử lại</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item.localId)}
                  className="p-1 rounded hover:bg-status-danger-soft text-ink-muted hover:text-status-danger"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

