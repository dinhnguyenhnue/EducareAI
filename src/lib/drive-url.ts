export type DriveMaterialKind =
  | "IMAGE"
  | "PDF"
  | "DOC"
  | "SLIDE"
  | "SHEET"
  | "FOLDER"
  | "INTERNAL_ASSET"
  | "OTHER_DRIVE_FILE";

export type DriveKindHint = "AUTO" | "IMAGE" | "PDF" | "DOCUMENT";

export interface ParsedDriveMaterial {
  valid: boolean;
  error?: string;
  rawUrl: string;
  normalizedUrl: string;
  fileId: string | null;
  resourceKey: string | null;
  kind: DriveMaterialKind;
  title: string;
  description: string;
  directImageUrl: string | null;
  embedPreviewUrl: string | null;
  openInDriveUrl: string;
}

const ALLOWED_GOOGLE_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "lh3.googleusercontent.com",
]);

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;
const PDF_EXT_REGEX = /\.pdf$/i;

/**
 * Parses, validates, and normalizes a Google Drive / Google Docs link or internal asset path.
 * Blocks non-HTTPS URLs, arbitrary external hosts, and private IPs to prevent SSRF/XSS.
 */
export function parseAndNormalizeDriveMaterial(input: {
  url: string;
  title?: string;
  description?: string;
  kindHint?: DriveKindHint;
}): ParsedDriveMaterial {
  const rawUrl = (input.url || "").trim();
  const title = (input.title || "").trim() || "Tài liệu học tập đính kèm";
  const description = (input.description || "").trim();
  const kindHint = input.kindHint || "AUTO";

  if (!rawUrl) {
    return {
      valid: false,
      error: "Vui lòng nhập đường dẫn liên kết Google Drive.",
      rawUrl: "",
      normalizedUrl: "",
      fileId: null,
      resourceKey: null,
      kind: "OTHER_DRIVE_FILE",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: "",
    };
  }

  // Support legacy/internal uploaded assets: /api/assets/<id>
  if (/^\/api\/assets\/[a-zA-Z0-9_-]+$/.test(rawUrl)) {
    const isImg =
      kindHint === "IMAGE" || IMAGE_EXT_REGEX.test(title);
    const isPdf = kindHint === "PDF" || PDF_EXT_REGEX.test(title);
    const kind: DriveMaterialKind = isImg
      ? "IMAGE"
      : isPdf
      ? "PDF"
      : "INTERNAL_ASSET";
    return {
      valid: true,
      rawUrl,
      normalizedUrl: rawUrl,
      fileId: null,
      resourceKey: null,
      kind,
      title,
      description,
      directImageUrl: isImg ? rawUrl : null,
      embedPreviewUrl: isPdf ? rawUrl : null,
      openInDriveUrl: rawUrl,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      valid: false,
      error:
        "Đường dẫn không đúng định dạng URL (cần bắt đầu bằng https://drive.google.com/...).",
      rawUrl,
      normalizedUrl: "",
      fileId: null,
      resourceKey: null,
      kind: "OTHER_DRIVE_FILE",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: "",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Chỉ chấp nhận liên kết bảo mật HTTPS (https://).",
      rawUrl,
      normalizedUrl: "",
      fileId: null,
      resourceKey: null,
      kind: "OTHER_DRIVE_FILE",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: "",
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_GOOGLE_HOSTS.has(host)) {
    return {
      valid: false,
      error:
        "Chỉ chấp nhận liên kết từ Google Drive (drive.google.com) hoặc Google Docs/Slides/Sheets (docs.google.com).",
      rawUrl,
      normalizedUrl: "",
      fileId: null,
      resourceKey: null,
      kind: "OTHER_DRIVE_FILE",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: "",
    };
  }

  const resourceKey =
    parsed.searchParams.get("resourcekey") ||
    parsed.searchParams.get("resourceKey") ||
    null;
  const rkQuery = resourceKey
    ? `resourcekey=${encodeURIComponent(resourceKey)}`
    : "";

  // 1. Check Google Drive Folder: /drive/folders/<id> or /drive/u/0/folders/<id>
  const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folderMatch) {
    const folderId = folderMatch[1];
    const openUrl = `https://drive.google.com/drive/folders/${folderId}${
      rkQuery ? `?${rkQuery}` : ""
    }`;
    return {
      valid: true,
      rawUrl,
      normalizedUrl: openUrl,
      fileId: folderId,
      resourceKey,
      kind: "FOLDER",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: openUrl,
    };
  }

  // 2. Check Google Docs / Slides / Sheets on docs.google.com
  if (host === "docs.google.com") {
    const docMatch = parsed.pathname.match(
      /^\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{10,})/
    );
    if (!docMatch) {
      return {
        valid: false,
        error:
          "Liên kết Google Docs/Slides/Sheets thiếu mã định danh tài liệu (/d/<ID>).",
        rawUrl,
        normalizedUrl: "",
        fileId: null,
        resourceKey: null,
        kind: "OTHER_DRIVE_FILE",
        title,
        description,
        directImageUrl: null,
        embedPreviewUrl: null,
        openInDriveUrl: "",
      };
    }
    const [, docType, docId] = docMatch;
    const kind: DriveMaterialKind =
      docType === "document"
        ? "DOC"
        : docType === "presentation"
        ? "SLIDE"
        : "SHEET";
    const baseDocUrl = `https://docs.google.com/${docType}/d/${docId}`;
    return {
      valid: true,
      rawUrl,
      normalizedUrl: `${baseDocUrl}/edit${rkQuery ? `?${rkQuery}` : ""}`,
      fileId: docId,
      resourceKey,
      kind,
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: `${baseDocUrl}/preview${rkQuery ? `?${rkQuery}` : ""}`,
      openInDriveUrl: `${baseDocUrl}/view${rkQuery ? `?${rkQuery}` : ""}`,
    };
  }

  // 3. Extract fileId from drive.google.com/file/d/<id> or ?id=<id>
  let fileId: string | null = null;
  const filePathMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (filePathMatch) {
    fileId = filePathMatch[1];
  } else if (
    parsed.pathname === "/open" ||
    parsed.pathname === "/uc" ||
    parsed.pathname === "/thumbnail"
  ) {
    const idParam = parsed.searchParams.get("id");
    if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) {
      fileId = idParam;
    }
  }

  if (!fileId && host === "lh3.googleusercontent.com") {
    return {
      valid: true,
      rawUrl,
      normalizedUrl: rawUrl,
      fileId: null,
      resourceKey: null,
      kind: "IMAGE",
      title,
      description,
      directImageUrl: rawUrl,
      embedPreviewUrl: null,
      openInDriveUrl: rawUrl,
    };
  }

  if (!fileId) {
    return {
      valid: false,
      error:
        "Không tìm thấy mã tệp Google Drive hợp lệ. Hãy dùng link dạng https://drive.google.com/file/d/<ID>/view hoặc https://drive.google.com/open?id=<ID>.",
      rawUrl,
      normalizedUrl: "",
      fileId: null,
      resourceKey: null,
      kind: "OTHER_DRIVE_FILE",
      title,
      description,
      directImageUrl: null,
      embedPreviewUrl: null,
      openInDriveUrl: "",
    };
  }

  // Determine kind for drive file
  let kind: DriveMaterialKind = "OTHER_DRIVE_FILE";
  if (kindHint === "IMAGE" || IMAGE_EXT_REGEX.test(title) || parsed.pathname === "/thumbnail") {
    kind = "IMAGE";
  } else if (kindHint === "PDF" || PDF_EXT_REGEX.test(title)) {
    kind = "PDF";
  }

  const openInDriveUrl = `https://drive.google.com/file/d/${fileId}/view${
    rkQuery ? `?${rkQuery}` : ""
  }`;
  const embedPreviewUrl = `https://drive.google.com/file/d/${fileId}/preview${
    rkQuery ? `?${rkQuery}` : ""
  }`;
  const directImageUrl =
    kind === "IMAGE"
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          fileId
        )}&sz=w1600${rkQuery ? `&${rkQuery}` : ""}`
      : null;

  return {
    valid: true,
    rawUrl,
    normalizedUrl: openInDriveUrl,
    fileId,
    resourceKey,
    kind,
    title,
    description,
    directImageUrl,
    embedPreviewUrl,
    openInDriveUrl,
  };
}

/**
 * Parses stored `driveFileLinks` JSON from a Lesson record into normalized items,
 * maintaining full backward compatibility with legacy `{ title, url }` records.
 */
export function parseLessonDriveLinksJson(
  rawJson: string | null | undefined
): ParsedDriveMaterial[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    const results: ParsedDriveMaterial[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const normalized = parseAndNormalizeDriveMaterial({
        url: String(item.url || item.normalizedUrl || item.rawUrl || ""),
        title: String(item.title || "Tài liệu bài học"),
        description: String(item.description || ""),
        kindHint:
          item.kind === "IMAGE"
            ? "IMAGE"
            : item.kind === "PDF"
            ? "PDF"
            : "AUTO",
      });
      if (normalized.valid) {
        results.push(normalized);
      }
    }
    return results;
  } catch {
    return [];
  }
}
