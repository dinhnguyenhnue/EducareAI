import crypto from "crypto";
import path from "path";
import { analyzeStudentHtmlCode } from "@/lib/html-game-sandbox";

export type AssetCategory =
  | "DOCUMENT"
  | "OFFICE"
  | "SPREADSHEET"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "HTML_SANDBOX"
  | "ARCHIVE";

export type AssetPreviewMode =
  | "INLINE_PREVIEW"
  | "DOWNLOAD_ONLY"
  | "SANDBOX_HTML";

export interface ValidatedAssetMetadata {
  originalFileName: string;
  safeFileName: string;
  extension: string;
  mimeType: string;
  category: AssetCategory;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  previewMode: AssetPreviewMode;
  status: "CLEAN_PUBLISHED" | "QUARANTINED" | "REJECTED";
  zipSummary?: {
    entryCount: number;
    totalUncompressedBytes: number;
    entries: string[];
  };
}

export interface AssetValidationResult {
  ok: boolean;
  code:
    | "OK"
    | "EMPTY_FILE"
    | "DISALLOWED_EXTENSION"
    | "DISALLOWED_MIME"
    | "SIGNATURE_MISMATCH"
    | "FILE_TOO_LARGE"
    | "ZIP_PATH_TRAVERSAL"
    | "ZIP_BOMB_DETECTED"
    | "ZIP_FORBIDDEN_ENTRY"
    | "ZIP_CORRUPT"
    | "HTML_UNSAFE";
  message: string;
  metadata?: ValidatedAssetMetadata;
}

const FORBIDDEN_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".ps1",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".wsf",
  ".wsh",
  ".msi",
  ".msp",
  ".com",
  ".scr",
  ".pif",
  ".dll",
  ".sys",
  ".sh",
  ".bash",
  ".php",
  ".jsp",
  ".asp",
  ".aspx",
  ".jar",
  ".hta",
  ".reg",
]);

interface AllowedTypeSpec {
  extensions: string[];
  mimes: string[];
  category: AssetCategory;
  maxBytes: number;
  previewMode: AssetPreviewMode;
}

const ALLOWED_SPECS: AllowedTypeSpec[] = [
  {
    extensions: [".pdf"],
    mimes: ["application/pdf"],
    category: "DOCUMENT",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".docx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "application/zip",
    ],
    category: "OFFICE",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "DOWNLOAD_ONLY",
  },
  {
    extensions: [".pptx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/octet-stream",
      "application/zip",
    ],
    category: "OFFICE",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "DOWNLOAD_ONLY",
  },
  {
    extensions: [".xlsx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "application/zip",
    ],
    category: "SPREADSHEET",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "DOWNLOAD_ONLY",
  },
  {
    extensions: [".csv"],
    mimes: ["text/csv", "text/plain", "application/vnd.ms-excel"],
    category: "SPREADSHEET",
    maxBytes: 15 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".txt"],
    mimes: ["text/plain"],
    category: "DOCUMENT",
    maxBytes: 10 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".png"],
    mimes: ["image/png"],
    category: "IMAGE",
    maxBytes: 10 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".jpg", ".jpeg"],
    mimes: ["image/jpeg", "image/jpg"],
    category: "IMAGE",
    maxBytes: 10 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".webp"],
    mimes: ["image/webp"],
    category: "IMAGE",
    maxBytes: 10 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".mp3"],
    mimes: ["audio/mpeg", "audio/mp3"],
    category: "AUDIO",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".wav"],
    mimes: ["audio/wav", "audio/x-wav", "audio/wave"],
    category: "AUDIO",
    maxBytes: 25 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".mp4"],
    mimes: ["video/mp4"],
    category: "VIDEO",
    maxBytes: 100 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".webm"],
    mimes: ["video/webm", "audio/webm"],
    category: "VIDEO",
    maxBytes: 100 * 1024 * 1024,
    previewMode: "INLINE_PREVIEW",
  },
  {
    extensions: [".html", ".htm"],
    mimes: ["text/html", "text/plain"],
    category: "HTML_SANDBOX",
    maxBytes: 2 * 1024 * 1024,
    previewMode: "SANDBOX_HTML",
  },
  {
    extensions: [".zip"],
    mimes: [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ],
    category: "ARCHIVE",
    maxBytes: 50 * 1024 * 1024,
    previewMode: "DOWNLOAD_ONLY",
  },
];

export function sanitizeDisplayFileName(rawName: string): string {
  const base = path.posix.basename(rawName.replace(/\\/g, "/")).trim();
  const cleaned = base
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "tep-dinh-kem";
}

function checkMagicSignature(ext: string, buf: Buffer): boolean {
  if (buf.length === 0) return false;

  switch (ext) {
    case ".pdf":
      return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
    case ".png":
      return (
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      );
    case ".jpg":
    case ".jpeg":
      return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case ".webp":
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case ".wav":
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WAVE"
      );
    case ".mp3":
      return (
        (buf.length >= 3 && buf.subarray(0, 3).toString("ascii") === "ID3") ||
        (buf.length >= 2 &&
          buf[0] === 0xff &&
          (buf[1] === 0xfb || buf[1] === 0xf3 || buf[1] === 0xf2 || (buf[1] & 0xe0) === 0xe0))
      );
    case ".mp4":
      return buf.length >= 8 && buf.subarray(4, 8).toString("ascii") === "ftyp";
    case ".webm":
      return (
        buf.length >= 4 &&
        buf[0] === 0x1a &&
        buf[1] === 0x45 &&
        buf[2] === 0xdf &&
        buf[3] === 0xa3
      );
    case ".docx":
    case ".pptx":
    case ".xlsx":
    case ".zip":
      return (
        buf.length >= 4 &&
        buf[0] === 0x50 &&
        buf[1] === 0x4b &&
        ((buf[2] === 0x03 && buf[3] === 0x04) ||
          (buf[2] === 0x05 && buf[3] === 0x06))
      );
    case ".txt":
    case ".csv":
    case ".html":
    case ".htm": {
      // Must not start with MZ (Windows PE executable), ELF, or Mach-O binary headers
      if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) return false;
      if (
        buf.length >= 4 &&
        buf[0] === 0x7f &&
        buf[1] === 0x45 &&
        buf[2] === 0x4c &&
        buf[3] === 0x46
      ) {
        return false;
      }
      // Reject binary NUL bytes in text files
      const sample = buf.subarray(0, Math.min(buf.length, 4096));
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0x00) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

const MAX_ZIP_ENTRIES = 100;
const MAX_ZIP_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_ZIP_COMPRESSION_RATIO = 100;

/**
 * Inspects a ZIP buffer (Local File Headers & Central Directory) without extracting to disk.
 * Prevents Zip Slip (`../`, absolute paths), Zip Bomb (excessive uncompressed size/ratio/entries),
 * and embedded executables.
 */
export function inspectZipBuffer(buf: Buffer): {
  ok: boolean;
  code:
    | "OK"
    | "ZIP_PATH_TRAVERSAL"
    | "ZIP_BOMB_DETECTED"
    | "ZIP_FORBIDDEN_ENTRY"
    | "ZIP_CORRUPT";
  message: string;
  entryCount: number;
  totalUncompressedBytes: number;
  entries: string[];
} {
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    return {
      ok: false,
      code: "ZIP_CORRUPT",
      message: "Tệp nén ZIP không đúng định dạng chữ ký PK.",
      entryCount: 0,
      totalUncompressedBytes: 0,
      entries: [],
    };
  }

  let offset = 0;
  let entryCount = 0;
  let totalUncompressedBytes = 0;
  let totalCompressedBytes = 0;
  const entries: string[] = [];

  // Scan Local File Headers (0x04034b50) and Central Directory Headers (0x02014b50)
  while (offset + 4 <= buf.length) {
    const sig = buf.readUInt32LE(offset);

    if (sig === 0x04034b50) {
      // Local file header is at least 30 bytes
      if (offset + 30 > buf.length) {
        return {
          ok: false,
          code: "ZIP_CORRUPT",
          message: "Cấu trúc Local Header của tệp ZIP bị cắt cụt.",
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }
      const compressedSize = buf.readUInt32LE(offset + 18);
      const uncompressedSize = buf.readUInt32LE(offset + 22);
      const fileNameLength = buf.readUInt16LE(offset + 26);
      const extraFieldLength = buf.readUInt16LE(offset + 28);

      const nameStart = offset + 30;
      const nameEnd = nameStart + fileNameLength;
      if (nameEnd > buf.length) {
        return {
          ok: false,
          code: "ZIP_CORRUPT",
          message: "Tên tệp bên trong ZIP vượt quá kích thước gói tin.",
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      const rawEntryName = buf.subarray(nameStart, nameEnd).toString("utf8");
      entryCount += 1;
      entries.push(rawEntryName);

      if (entryCount > MAX_ZIP_ENTRIES) {
        return {
          ok: false,
          code: "ZIP_BOMB_DETECTED",
          message: `Tệp ZIP chứa quá nhiều tệp con (>${MAX_ZIP_ENTRIES} mục).`,
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      // Check Zip Slip / path traversal
      const normalized = rawEntryName.replace(/\\/g, "/");
      const segments = normalized.split("/");
      if (
        normalized.startsWith("/") ||
        normalized.includes("../") ||
        normalized.includes("..\\") ||
        segments.includes("..") ||
        /^[a-zA-Z]:/.test(normalized)
      ) {
        return {
          ok: false,
          code: "ZIP_PATH_TRAVERSAL",
          message: `Phát hiện đường dẫn nguy hiểm (Zip Slip) trong tệp nén: "${rawEntryName}".`,
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      // Check forbidden executable extension inside ZIP
      const entryExt = path.posix.extname(normalized).toLowerCase();
      if (FORBIDDEN_EXTENSIONS.has(entryExt)) {
        return {
          ok: false,
          code: "ZIP_FORBIDDEN_ENTRY",
          message: `Tệp nén chứa định dạng thực thi bị cấm (${entryExt}): "${rawEntryName}".`,
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      totalCompressedBytes += compressedSize;
      totalUncompressedBytes += uncompressedSize;

      if (totalUncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES) {
        return {
          ok: false,
          code: "ZIP_BOMB_DETECTED",
          message: `Tổng dung lượng giải nén vượt ngưỡng an toàn (${Math.round(
            MAX_ZIP_UNCOMPRESSED_BYTES / (1024 * 1024)
          )}MB).`,
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      if (
        compressedSize > 0 &&
        uncompressedSize / compressedSize > MAX_ZIP_COMPRESSION_RATIO &&
        uncompressedSize > 10 * 1024 * 1024
      ) {
        return {
          ok: false,
          code: "ZIP_BOMB_DETECTED",
          message: `Phát hiện tỷ lệ nén bất thường (nghi vấn Zip Bomb) ở mục "${rawEntryName}".`,
          entryCount,
          totalUncompressedBytes,
          entries,
        };
      }

      offset = nameEnd + extraFieldLength + compressedSize;
    } else if (sig === 0x02014b50 || sig === 0x06054b50) {
      // Reached Central Directory or End of Central Directory
      break;
    } else {
      // Advance 1 byte if data descriptor or padding encountered
      offset += 1;
    }
  }

  return {
    ok: true,
    code: "OK",
    message: "Tệp nén hợp lệ.",
    entryCount,
    totalUncompressedBytes,
    entries,
  };
}

export function validateUploadedAsset(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): AssetValidationResult {
  const { fileName, mimeType, buffer } = params;

  if (!buffer || buffer.length === 0) {
    return {
      ok: false,
      code: "EMPTY_FILE",
      message: "Tệp tải lên rỗng (0 byte).",
    };
  }

  const safeFileName = sanitizeDisplayFileName(fileName);
  const ext = path.posix.extname(safeFileName).toLowerCase();

  if (!ext || FORBIDDEN_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      code: "DISALLOWED_EXTENSION",
      message: `Định dạng tệp "${ext || "không rõ"}" bị từ chối vì lý do an toàn bảo mật.`,
    };
  }

  const spec = ALLOWED_SPECS.find((s) => s.extensions.includes(ext));
  if (!spec) {
    return {
      ok: false,
      code: "DISALLOWED_EXTENSION",
      message: `Định dạng tệp "${ext}" không nằm trong danh mục học liệu được phép tải lên.`,
    };
  }

  const normalizedMime = (mimeType || "application/octet-stream")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (
    normalizedMime !== "application/octet-stream" &&
    !spec.mimes.includes(normalizedMime)
  ) {
    return {
      ok: false,
      code: "DISALLOWED_MIME",
      message: `Kiểu MIME "${normalizedMime}" không khớp với phần mở rộng "${ext}".`,
    };
  }

  if (buffer.length > spec.maxBytes) {
    const maxMb = Math.round((spec.maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `Dung lượng tệp vượt quá giới hạn cho phép (${maxMb} MB) đối với nhóm ${spec.category}.`,
    };
  }

  if (!checkMagicSignature(ext, buffer)) {
    return {
      ok: false,
      code: "SIGNATURE_MISMATCH",
      message: `Nội dung nhị phân (Magic Bytes) của tệp "${safeFileName}" không khớp với định dạng "${ext}".`,
    };
  }

  let zipSummary: ValidatedAssetMetadata["zipSummary"] | undefined;
  if (ext === ".zip") {
    const zipCheck = inspectZipBuffer(buffer);
    if (!zipCheck.ok) {
      return {
        ok: false,
        code: zipCheck.code,
        message: zipCheck.message,
      };
    }
    zipSummary = {
      entryCount: zipCheck.entryCount,
      totalUncompressedBytes: zipCheck.totalUncompressedBytes,
      entries: zipCheck.entries,
    };
  }

  if (ext === ".html" || ext === ".htm") {
    const htmlContent = buffer.toString("utf8");
    const scan = analyzeStudentHtmlCode(htmlContent);
    const highRisk = scan.findings.filter((f) => f.severity === "HIGH");
    if (highRisk.length > 0) {
      return {
        ok: false,
        code: "HTML_UNSAFE",
        message: `Tệp HTML chứa mã không an toàn cho Sandbox: ${highRisk
          .map((f) => f.description)
          .join("; ")}`,
      };
    }
  }

  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const randomId = crypto.randomUUID();
  const storageKey = `assets/${new Date().toISOString().slice(0, 10)}/${randomId}${ext}`;

  return {
    ok: true,
    code: "OK",
    message: "Tệp hợp lệ và đã vượt qua kiểm tra bảo mật.",
    metadata: {
      originalFileName: fileName,
      safeFileName,
      extension: ext,
      mimeType: spec.mimes[0],
      category: spec.category,
      sizeBytes: buffer.length,
      sha256,
      storageKey,
      previewMode: spec.previewMode,
      status: "CLEAN_PUBLISHED",
      zipSummary,
    },
  };
}
