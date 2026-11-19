"use client";

import React, { useState } from "react";
import type { ParsedDriveMaterial } from "@/lib/drive-url";
import {
  FileText,
  Image as ImageIcon,
  FolderOpen,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export function DriveMaterialCard({
  item,
  defaultExpandPreview = true,
}: {
  item: ParsedDriveMaterial;
  defaultExpandPreview?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(
    defaultExpandPreview && (item.kind === "PDF" || item.kind === "DOC" || item.kind === "SLIDE")
  );

  const kindBadgeMap: Record<ParsedDriveMaterial["kind"], string> = {
    IMAGE: "Hình ảnh minh họa",
    PDF: "Tài liệu PDF",
    DOC: "Google Docs",
    SLIDE: "Google Slides",
    SHEET: "Google Sheets",
    FOLDER: "Thư mục Drive",
    INTERNAL_ASSET: "Tệp học liệu nội bộ",
    OTHER_DRIVE_FILE: "Tệp Google Drive",
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {item.kind === "IMAGE" ? (
              <ImageIcon className="w-4 h-4 text-ocean-600 shrink-0" />
            ) : item.kind === "FOLDER" ? (
              <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wide text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-full border border-ocean-200">
              {kindBadgeMap[item.kind]}
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-ink">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {item.embedPreviewUrl && item.kind !== "IMAGE" && (
            <button
              type="button"
              onClick={() => setShowEmbed((v) => !v)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-canvas hover:bg-slate-100 border border-slate-200 text-xs font-bold text-ink inline-flex items-center gap-1.5 transition-colors"
            >
              {showEmbed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Thu gọn khung xem</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem ngay trong bài</span>
                </>
              )}
            </button>
          )}

          <a
            href={item.openInDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>
              {item.kind === "FOLDER"
                ? "Mở thư mục trong Drive"
                : item.kind === "INTERNAL_ASSET"
                ? "Mở tệp gốc"
                : "Mở trong Drive"}
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Direct Image Rendering for IMAGE kind */}
      {item.kind === "IMAGE" && item.directImageUrl && (
        <div className="space-y-2">
          {!imageFailed ? (
            <figure className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[200px] flex flex-col items-center justify-center">
              {!imageLoaded && (
                <div className="py-12 text-xs font-medium text-ink-muted animate-pulse">
                  Đang tải hình ảnh minh họa từ học liệu...
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.directImageUrl}
                alt={item.description || item.title}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                className={`max-h-[520px] w-auto max-w-full object-contain mx-auto transition-opacity duration-200 ${
                  imageLoaded ? "opacity-100" : "opacity-0 h-0"
                }`}
              />
              {(item.description || item.title) && imageLoaded && (
                <figcaption className="w-full px-4 py-2 bg-white/95 border-t border-slate-100 text-xs text-ink-muted text-center italic">
                  {item.description || item.title}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className="space-y-3">
              {item.embedPreviewUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video w-full">
                  <iframe
                    src={item.embedPreviewUrl}
                    title={item.title}
                    className="w-full h-full border-0"
                    allow="autoplay"
                  />
                </div>
              )}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">
                    Lưu ý hiển thị hình ảnh từ Google Drive:
                  </p>
                  <p>
                    Nếu khung hình phía trên chưa hiện rõ ảnh, nguyên nhân thường do tệp Drive yêu cầu đăng nhập đúng tài khoản Google được chia sẻ của lớp hoặc trình duyệt đang chặn cookie nhúng khác miền. Em hãy bấm nút{" "}
                    <strong>&quot;Mở trong Drive&quot;</strong> ở góc phải để xem ảnh gốc đầy đủ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded Document/PDF/Slide Preview */}
      {item.kind !== "IMAGE" && item.embedPreviewUrl && showEmbed && (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-full h-[420px]">
            <iframe
              src={item.embedPreviewUrl}
              title={item.title}
              className="w-full h-full border-0"
              allow="autoplay"
            />
          </div>
          <p className="text-[11px] text-ink-muted">
            Nếu trình duyệt chặn khung nhúng hoặc tài liệu yêu cầu quyền truy cập theo tài khoản Google, hãy bấm{" "}
            <strong>&quot;Mở trong Drive&quot;</strong> để đọc trực tiếp.
          </p>
        </div>
      )}
    </div>
  );
}

export function DriveMaterialList({
  materials,
}: {
  materials: ParsedDriveMaterial[];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="space-y-4">
      {materials.map((item, idx) => (
        <DriveMaterialCard key={`${item.rawUrl}-${idx}`} item={item} />
      ))}
    </div>
  );
}
