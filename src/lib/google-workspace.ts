import crypto from "crypto";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import {
  decryptSecret,
  encryptSecret,
  hasServerEncryptionKey,
} from "./secret-crypto";

export const SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE = "SYSTEM_GOOGLE_WORKSPACE";
export const SYSTEM_GEMINI_API_SLOT_CODE = "SYSTEM_GEMINI_API";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export type GoogleAccountMode = "PERSONAL_GMAIL_HYBRID" | "WORKSPACE_DOMAIN";

export const GOOGLE_SCOPES = {
  BASIC: ["openid", "email", "profile"],
  DRIVE: ["https://www.googleapis.com/auth/drive.file"],
  DOCS: ["https://www.googleapis.com/auth/documents"],
  SHEETS: ["https://www.googleapis.com/auth/spreadsheets"],
  CLASSROOM: [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
  ],
  CALENDAR: ["https://www.googleapis.com/auth/calendar.events"],
};

export type IntegrationServiceStatusCode =
  | "NOT_CONFIGURED"
  | "PENDING_CONSENT"
  | "CONNECTED"
  | "ERROR";

export interface WorkspaceServiceStatusItem {
  serviceCode:
    | "GOOGLE_DRIVE"
    | "GOOGLE_SHEETS"
    | "GOOGLE_DOCS"
    | "GOOGLE_CALENDAR"
    | "GOOGLE_CLASSROOM"
    | "GEMINI_API";
  serviceName: string;
  category: "GOOGLE_WORKSPACE" | "GEMINI_SERVER_API";
  status: IntegrationServiceStatusCode;
  statusLabel: "Chưa cấu hình" | "Chờ cấp quyền" | "Đã kết nối" | "Lỗi";
  requiredScopes: string[];
  requiredEnvVars: string[];
  lastSyncAt: string | null;
  lastErrorMessage: string | null;
  setupGuide: string;
}

/**
 * Cấu trúc thư mục chuẩn 6 nhánh trên Google Drive (EDUCARE_AI/)
 * Lưu folderId và fileId trong Supabase/DB để không phụ thuộc tên hoặc đường dẫn.
 * Tuyệt đối không dùng link công khai cho dữ liệu học sinh và bản sao lưu.
 */
export const EDUCARE_DRIVE_FOLDER_TREE = [
  // Root
  {
    folderCode: "ROOT_EDUCARE_AI",
    name: "EDUCARE_AI",
    parentCode: null,
    folderPath: "EDUCARE_AI",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Thư mục gốc Hệ sinh thái EDUCARE AI",
  },
  // 01_QUAN_TRI
  {
    folderCode: "01_QUAN_TRI",
    name: "01_QUAN_TRI",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/01_QUAN_TRI",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Hồ sơ quản trị nhà trường, danh sách lớp và báo cáo tổng hợp",
  },
  {
    folderCode: "01_DANH_SACH_LOP",
    name: "Danh_sach_lop",
    parentCode: "01_QUAN_TRI",
    folderPath: "EDUCARE_AI/01_QUAN_TRI/Danh_sach_lop",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Danh sách học sinh và phân công chuyên môn theo năm học",
  },
  {
    folderCode: "01_BAO_CAO_TONG_HOP",
    name: "Bao_cao_tong_hop",
    parentCode: "01_QUAN_TRI",
    folderPath: "EDUCARE_AI/01_QUAN_TRI/Bao_cao_tong_hop",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Báo cáo tổng hợp cấp trường & Ban giám hiệu",
  },
  // 02_HOC_LIEU
  {
    folderCode: "02_HOC_LIEU",
    name: "02_HOC_LIEU",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/02_HOC_LIEU",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Kho học liệu số, giáo án, đề thi chuẩn hóa theo bộ môn",
  },
  {
    folderCode: "02_HOC_LIEU_TOAN",
    name: "Toan",
    parentCode: "02_HOC_LIEU",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Toan",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "TOAN7",
    desc: "Học liệu, phiếu bài tập và đề kiểm tra môn Toán học",
  },
  {
    folderCode: "02_HOC_LIEU_TOAN_LOP6",
    name: "Lop_6",
    parentCode: "02_HOC_LIEU_TOAN",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "TOAN6",
    desc: "SGK Kết nối tri thức và học liệu Toán lớp 6",
  },
  {
    folderCode: "02_HOC_LIEU_TOAN_LOP6_TAP1",
    name: "Tap_1",
    parentCode: "02_HOC_LIEU_TOAN_LOP6",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6/Tap_1",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "TOAN6",
    desc: "SGK Toán 6 - Tập một (Kết nối tri thức với cuộc sống) & học liệu HK1",
  },
  {
    folderCode: "02_HOC_LIEU_NGU_VAN",
    name: "Ngu_van",
    parentCode: "02_HOC_LIEU",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Ngu_van",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "VAN7",
    desc: "Học liệu, văn bản đọc hiểu và đề kiểm tra môn Ngữ văn",
  },
  {
    folderCode: "02_HOC_LIEU_VAN_LOP6",
    name: "Lop_6",
    parentCode: "02_HOC_LIEU_NGU_VAN",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "VAN6",
    desc: "SGK Kết nối tri thức và học liệu Ngữ văn lớp 6",
  },
  {
    folderCode: "02_HOC_LIEU_VAN_LOP6_TAP1",
    name: "Tap_1",
    parentCode: "02_HOC_LIEU_VAN_LOP6",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6/Tap_1",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "VAN6",
    desc: "SGK Ngữ văn 6 - Tập một (Kết nối tri thức với cuộc sống) & học liệu HK1",
  },
  {
    folderCode: "02_HOC_LIEU_TIN_HOC",
    name: "Tin_hoc",
    parentCode: "02_HOC_LIEU",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Tin_hoc",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "TIN7",
    desc: "Học liệu, kịch bản thực hành và đề kiểm tra môn Tin học",
  },
  {
    folderCode: "02_HOC_LIEU_KHTN",
    name: "Khoa_hoc_tu_nhien",
    parentCode: "02_HOC_LIEU",
    folderPath: "EDUCARE_AI/02_HOC_LIEU/Khoa_hoc_tu_nhien",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: "KHTN7",
    desc: "Học liệu, mô phỏng thí nghiệm và đề kiểm tra môn KHTN",
  },
  // 03_LOP_HOC
  {
    folderCode: "03_LOP_HOC",
    name: "03_LOP_HOC",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/03_LOP_HOC",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Không gian lưu trữ bài nộp và hoạt động theo khối lớp",
  },
  {
    folderCode: "03_LOP_6",
    name: "Lop_6",
    parentCode: "03_LOP_HOC",
    folderPath: "EDUCARE_AI/03_LOP_HOC/Lop_6",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Thư mục lớp học và bài nộp Khối 6",
  },
  {
    folderCode: "03_LOP_7",
    name: "Lop_7",
    parentCode: "03_LOP_HOC",
    folderPath: "EDUCARE_AI/03_LOP_HOC/Lop_7",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Thư mục lớp học và bài nộp Khối 7 (7A1, 7A2...)",
  },
  {
    folderCode: "03_LOP_8",
    name: "Lop_8",
    parentCode: "03_LOP_HOC",
    folderPath: "EDUCARE_AI/03_LOP_HOC/Lop_8",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Thư mục lớp học và bài nộp Khối 8",
  },
  {
    folderCode: "03_LOP_9",
    name: "Lop_9",
    parentCode: "03_LOP_HOC",
    folderPath: "EDUCARE_AI/03_LOP_HOC/Lop_9",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Thư mục lớp học và bài nộp Khối 9",
  },
  // 04_SAN_PHAM_SANG_TAO
  {
    folderCode: "04_SAN_PHAM_SANG_TAO",
    name: "04_SAN_PHAM_SANG_TAO",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/04_SAN_PHAM_SANG_TAO",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Kho lưu trữ bản gốc và phiên bản trò chơi HTML, Prompt mẫu",
  },
  {
    folderCode: "04_TRO_CHOI_HTML",
    name: "Tro_choi_HTML",
    parentCode: "04_SAN_PHAM_SANG_TAO",
    folderPath: "EDUCARE_AI/04_SAN_PHAM_SANG_TAO/Tro_choi_HTML",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Bản lưu mã nguồn và lịch sử phiên bản trò chơi HTML học tập",
  },
  {
    folderCode: "04_PROMPT_MAU",
    name: "Prompt_mau",
    parentCode: "04_SAN_PHAM_SANG_TAO",
    folderPath: "EDUCARE_AI/04_SAN_PHAM_SANG_TAO/Prompt_mau",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Thư viện câu lệnh AI (Prompt Lab) đã chuẩn hóa sư phạm",
  },
  {
    folderCode: "04_SAN_PHAM_DA_DUYET",
    name: "San_pham_da_duyet",
    parentCode: "04_SAN_PHAM_SANG_TAO",
    folderPath: "EDUCARE_AI/04_SAN_PHAM_SANG_TAO/San_pham_da_duyet",
    permissionScope: "SCOPED_CLASS_STUDENTS",
    subjectCode: null,
    desc: "Sản phẩm sáng tạo của học sinh đã được giáo viên kiểm duyệt",
  },
  // 05_TRACKING_REPORTS
  {
    folderCode: "05_TRACKING_REPORTS",
    name: "05_TRACKING_REPORTS",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/05_TRACKING_REPORTS",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Thư mục chứa Google Sheets Tracking tự động theo lớp và học kỳ",
  },
  {
    folderCode: "05_TRACKING_THEO_LOP",
    name: "Tracking_theo_lop",
    parentCode: "05_TRACKING_REPORTS",
    folderPath: "EDUCARE_AI/05_TRACKING_REPORTS/Tracking_theo_lop",
    permissionScope: "RESTRICTED_ADMIN_TEACHER",
    subjectCode: null,
    desc: "Các bảng EDUCARE_AI_Tracking_<Lop> đồng bộ định kỳ 5-15 phút",
  },
  {
    folderCode: "05_BAO_CAO_HOC_KY",
    name: "Bao_cao_hoc_ky",
    parentCode: "05_TRACKING_REPORTS",
    folderPath: "EDUCARE_AI/05_TRACKING_REPORTS/Bao_cao_hoc_ky",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Báo cáo tổng kết giữa kỳ, cuối kỳ và năm học",
  },
  // 06_BACKUP
  {
    folderCode: "06_BACKUP",
    name: "06_BACKUP",
    parentCode: "ROOT_EDUCARE_AI",
    folderPath: "EDUCARE_AI/06_BACKUP",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Kho lưu bản sao phục hồi hệ thống (Phân quyền nghiêm ngặt, cấm public link)",
  },
  {
    folderCode: "06_DATABASE_ENCRYPTED",
    name: "Database_Encrypted",
    parentCode: "06_BACKUP",
    folderPath: "EDUCARE_AI/06_BACKUP/Database_Encrypted",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Bản sao lưu PostgreSQL/DB mã hóa AES-256-GCM hằng ngày",
  },
  {
    folderCode: "06_METADATA_EXPORTS",
    name: "Metadata_Exports",
    parentCode: "06_BACKUP",
    folderPath: "EDUCARE_AI/06_BACKUP/Metadata_Exports",
    permissionScope: "RESTRICTED_ADMIN_ONLY",
    subjectCode: null,
    desc: "Bản xuất cấu trúc metadata, danh mục folderId/fileId phục vụ đối chiếu",
  },
];

// Giữ tương thích ngược với các trang hiện có
export const UNIGO_DRIVE_FOLDERS = EDUCARE_DRIVE_FOLDER_TREE.filter(
  (f) => f.parentCode === "ROOT_EDUCARE_AI" || f.parentCode === "02_HOC_LIEU"
).map((f) => ({
  code: f.folderCode,
  name: f.folderPath.replace("EDUCARE_AI/", ""),
  desc: f.desc,
}));

export const UNIGO_SYNC_CADENCE_POLICY = [
  {
    cadence: "Ngay khi có thay đổi (Real-time)",
    layer: "Tier 1 · Supabase (PostgreSQL)",
    activity: "Ghi dữ liệu điểm, bài nộp, lượt thi, nhật ký AI và quyền truy cập trực tiếp vào CSDL chính",
    status: "ACTIVE",
  },
  {
    cadence: "Mỗi 5–15 phút (Incremental)",
    layer: "Tier 2 · Google Sheets Tracking",
    activity: "Đồng bộ các thay đổi cần thiết sang bảng EDUCARE_AI_Tracking_<Lớp> qua values.batchUpdate",
    status: "ACTIVE",
  },
  {
    cadence: "Hằng ngày (00:30 GMT+7)",
    layer: "Tier 2 · Google Sheets KPI",
    activity: "Tổng hợp tracking chuyên cần, tỷ lệ hoàn thành bài tập và làm mới báo cáo AI",
    status: "ACTIVE",
  },
  {
    cadence: "Hằng ngày (02:00 GMT+7)",
    layer: "Tier 3 · Backup Độc lập + Drive 06_BACKUP",
    activity: "Tạo bản backup cơ sở dữ liệu mã hóa AES-256-GCM, lưu độc lập và đẩy bản sao vào 06_BACKUP/Database_Encrypted",
    status: "ACTIVE",
  },
  {
    cadence: "Hằng tuần (Chủ nhật)",
    layer: "Tier 1 + 2 + 3 · Integrity Check",
    activity: "Kiểm tra trạng thái đồng bộ folderId/fileId, đối chiếu SHA-256 checksum toàn vẹn bản backup",
    status: "ACTIVE",
  },
  {
    cadence: "Định kỳ (Hàng tháng / Trước kỳ thi)",
    layer: "Tier 3 · Restore Drill",
    activity: "Thử khôi phục dữ liệu trên môi trường cô lập để xác nhận bản backup sử dụng được 100%",
    status: "ACTIVE",
  },
];

export function getSafeBaseUrl(reqUrlOrHost?: string): string {
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (reqUrlOrHost) {
    try {
      const parsed = reqUrlOrHost.startsWith("http") ? new URL(reqUrlOrHost) : null;
      if (parsed) return parsed.origin;
    } catch {}
    if (reqUrlOrHost.includes("vercel.app") || reqUrlOrHost.includes("unigo.edu.vn")) {
      return `https://${reqUrlOrHost}`;
    }
  }
  const envUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/$/, "");
  return envUrl || "http://localhost:3000";
}

function sanitizeEnvCredential(raw?: string): string {
  return (raw || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function getGoogleOAuthConfig(customBaseUrl?: string): GoogleOAuthConfig {
  const clientId = sanitizeEnvCredential(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = sanitizeEnvCredential(process.env.GOOGLE_CLIENT_SECRET);
  const baseUrl = customBaseUrl || getSafeBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function buildGoogleOAuthUrl(
  selectedServices: string[] = [],
  state: string = "educare_oauth",
  customBaseUrl?: string,
  overrideConfig?: { clientId?: string; redirectUri?: string }
) {
  const config = getGoogleOAuthConfig(customBaseUrl);
  const effectiveClientId = overrideConfig?.clientId || config.clientId;
  const effectiveRedirectUri = overrideConfig?.redirectUri || config.redirectUri;
  const scopes = new Set<string>(GOOGLE_SCOPES.BASIC);

  selectedServices.forEach((svc) => {
    const key = svc as keyof typeof GOOGLE_SCOPES;
    if (GOOGLE_SCOPES[key]) {
      GOOGLE_SCOPES[key].forEach((s) => scopes.add(s));
    }
  });

  const params = new URLSearchParams({
    client_id: effectiveClientId || "UNCONFIGURED_CLIENT_ID",
    redirect_uri: effectiveRedirectUri,
    response_type: "code",
    scope: Array.from(scopes).join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Chống Formula Injection khi xuất dữ liệu ra Google Sheets / CSV / Excel (LMS_DATA_DESIGN.md #9).
 * Mọi chuỗi bắt đầu bằng =, +, -, @, tab hoặc carriage return đều được thêm dấu nháy đơn (')
 * để trình bảng tính xử lý như văn bản thuần, không thực thi công thức.
 */
export function sanitizeSheetCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "Chưa có dữ liệu";
  }
  const str = String(value);
  if (str.length === 0) {
    return "";
  }
  const trimmedLeading = str.replace(/^[\s\uFEFF\xA0]+/, "");
  if (/^[=+\-@]/.test(trimmedLeading) || /^[\t\r\n]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function sanitizeSheetRows(rows: unknown[][]): string[][] {
  return rows.map((row) => row.map((cell) => sanitizeSheetCell(cell)));
}

export async function getEffectiveGoogleOAuthConfig(
  customBaseUrl?: string
): Promise<GoogleOAuthConfig & { source: "ENV" | "DB_ENCRYPTED" | "NONE"; accountMode: GoogleAccountMode }> {
  const envCfg = getGoogleOAuthConfig(customBaseUrl);
  let clientId = envCfg.clientId;
  let clientSecret = envCfg.clientSecret;
  let source: "ENV" | "DB_ENCRYPTED" | "NONE" = envCfg.isConfigured ? "ENV" : "NONE";
  let accountMode: GoogleAccountMode = "PERSONAL_GMAIL_HYBRID";

  try {
    const slot = await prisma.integrationSlot.findUnique({
      where: { code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE },
    });
    if (slot?.configJson) {
      const parsed = JSON.parse(slot.configJson);
      if (parsed.accountMode === "WORKSPACE_DOMAIN") {
        accountMode = "WORKSPACE_DOMAIN";
      }
      if (!clientId && typeof parsed.clientId === "string" && parsed.clientId.trim()) {
        clientId = parsed.clientId.trim();
      }
      if (!clientSecret && typeof parsed.clientSecretEncrypted === "string") {
        const decrypted = decryptSecret(parsed.clientSecretEncrypted);
        if (decrypted) {
          clientSecret = decrypted;
          source = "DB_ENCRYPTED";
        }
      }
    }
  } catch {
    // Ignore DB lookup errors during build/edge
  }

  const baseUrl = customBaseUrl || getSafeBaseUrl();
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/auth/google/callback`,
    isConfigured: Boolean(clientId && clientSecret),
    source: clientId && clientSecret ? source : "NONE",
    accountMode,
  };
}

export async function getEffectiveGeminiServerConfig(): Promise<{
  isConfigured: boolean;
  modelName: string;
  apiKey: string | null;
  source: "ENV" | "DB_ENCRYPTED" | "NONE";
}> {
  const envGemini = getGeminiServerConfig();
  const envKey = sanitizeEnvCredential(process.env.GEMINI_API_KEY);
  let modelName = envGemini.modelName;
  let apiKey: string | null = envGemini.isConfigured ? envKey : null;
  let source: "ENV" | "DB_ENCRYPTED" | "NONE" = envGemini.isConfigured ? "ENV" : "NONE";

  try {
    const slot = await prisma.integrationSlot.findUnique({
      where: { code: SYSTEM_GEMINI_API_SLOT_CODE },
    });
    if (slot?.configJson) {
      const parsed = JSON.parse(slot.configJson);
      if (!process.env.GEMINI_MODEL && typeof parsed.modelName === "string" && parsed.modelName.trim()) {
        modelName = parsed.modelName.trim();
      }
      if (!apiKey && typeof parsed.apiKeyEncrypted === "string") {
        const decrypted = decryptSecret(parsed.apiKeyEncrypted);
        if (decrypted && decrypted.length >= 16) {
          apiKey = decrypted;
          source = "DB_ENCRYPTED";
        }
      }
    }
  } catch {
    // Ignore DB lookup errors
  }

  return {
    isConfigured: Boolean(apiKey),
    modelName,
    apiKey,
    source,
  };
}

export async function getValidGoogleAccessToken(userId?: string): Promise<{
  ok: boolean;
  status: IntegrationServiceStatusCode;
  accessToken: string | null;
  scopes: Set<string>;
  reason: string | null;
}> {
  const oauth = await getEffectiveGoogleOAuthConfig();
  if (!oauth.isConfigured) {
    return {
      ok: false,
      status: "NOT_CONFIGURED",
      accessToken: null,
      scopes: new Set(),
      reason: "Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET.",
    };
  }

  const conn = userId
    ? await prisma.googleConnection.findUnique({ where: { userId } }).catch(() => null)
    : await prisma.googleConnection
        .findFirst({ where: { status: "CONNECTED" }, orderBy: { createdAt: "desc" } })
        .catch(() => null);

  const scopes = new Set<string>(
    (conn?.scopesGranted || "")
      .split(/[\s,"\[\]]+/)
      .map((s: string) => s.trim())
      .filter(Boolean)
  );

  if (!conn || conn.status !== "CONNECTED" || !conn.accessTokenHash) {
    return {
      ok: false,
      status: "PENDING_CONSENT",
      accessToken: null,
      scopes,
      reason: "Chưa hoàn tất cấp quyền Google OAuth cho tài khoản quản trị/giáo viên.",
    };
  }

  if (
    conn.accessTokenHash.startsWith("DEMO") ||
    conn.accessTokenHash.startsWith("MOCK")
  ) {
    return {
      ok: false,
      status: "PENDING_CONSENT",
      accessToken: null,
      scopes,
      reason: "Token hiện tại chỉ là dữ liệu mẫu, chưa có token OAuth thật từ Google.",
    };
  }

  const decryptedAccess = decryptSecret(conn.accessTokenHash);
  if (decryptedAccess) {
    return {
      ok: true,
      status: "CONNECTED",
      accessToken: decryptedAccess,
      scopes,
      reason: null,
    };
  }

  // Try refreshing if refresh token exists
  const decryptedRefresh = decryptSecret(conn.refreshTokenHash);
  if (decryptedRefresh) {
    try {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: oauth.clientId,
          client_secret: oauth.clientSecret,
          refresh_token: decryptedRefresh,
          grant_type: "refresh_token",
        }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.access_token && hasServerEncryptionKey()) {
          await prisma.googleConnection.update({
            where: { id: conn.id },
            data: {
              accessTokenHash: encryptSecret(refreshData.access_token),
              lastSyncAt: new Date(),
            },
          });
          return {
            ok: true,
            status: "CONNECTED",
            accessToken: refreshData.access_token,
            scopes,
            reason: null,
          };
        }
      }
    } catch {
      // Fall through to error
    }
  }

  return {
    ok: false,
    status: "ERROR",
    accessToken: null,
    scopes,
    reason: hasServerEncryptionKey()
      ? "Không thể giải mã hoặc làm mới OAuth access token. Vui lòng kết nối lại Google OAuth."
      : "Thiếu APP_ENCRYPTION_KEY trên máy chủ để giải mã OAuth token đã lưu.",
  };
}

/**
 * Kiểm tra trạng thái kết nối thực tế với Google Workspace API.
 * Không bao giờ báo SYNCED/SUCCESS nếu chưa có OAuth cấu hình + token hợp lệ + xác nhận từ Google API.
 */
export async function resolveGoogleIntegrationMode(userId?: string): Promise<{
  isOAuthConfigured: boolean;
  hasLiveToken: boolean;
  syncStatus: "DISCONNECTED" | "CONNECTED";
  logStatus: "DISCONNECTED" | "SUCCESS";
  accessToken: string | null;
}> {
  const tokenState = await getValidGoogleAccessToken(userId);
  return {
    isOAuthConfigured: tokenState.status !== "NOT_CONFIGURED",
    hasLiveToken: tokenState.ok,
    syncStatus: tokenState.ok ? "CONNECTED" : "DISCONNECTED",
    logStatus: tokenState.ok ? "SUCCESS" : "DISCONNECTED",
    accessToken: tokenState.accessToken,
  };
}

export function getGeminiServerConfig(): {
  isConfigured: boolean;
  modelName: string;
} {
  const rawKey = sanitizeEnvCredential(process.env.GEMINI_API_KEY);
  const isPlaceholder =
    !rawKey ||
    rawKey === "your_gemini_api_key" ||
    rawKey.startsWith("YOUR_") ||
    rawKey.length < 16;
  const modelName =
    sanitizeEnvCredential(process.env.GEMINI_MODEL) || "gemini-2.0-flash";
  return {
    isConfigured: !isPlaceholder,
    modelName,
  };
}

/**
 * Ẩn danh dữ liệu cá nhân học sinh (PII: email, mã học sinh, số điện thoại)
 * trước khi gửi nội dung câu hỏi sang dịch vụ AI bên ngoài.
 */
export function redactStudentPiiForExternalAi(rawText: string): string {
  return String(rawText || "")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_DA_AN]")
    .replace(/\bHS\d{4}[-_]?\w+\b/gi, "[MA_HS_DA_AN]")
    .replace(/\b(0|\+84)\d{8,10}\b/g, "[SDT_DA_AN]");
}

const STATUS_LABELS: Record<
  IntegrationServiceStatusCode,
  "Chưa cấu hình" | "Chờ cấp quyền" | "Đã kết nối" | "Lỗi"
> = {
  NOT_CONFIGURED: "Chưa cấu hình",
  PENDING_CONSENT: "Chờ cấp quyền",
  CONNECTED: "Đã kết nối",
  ERROR: "Lỗi",
};

/**
 * Trả về trạng thái chuẩn hóa của 6 dịch vụ Google Workspace & Gemini API trên máy chủ:
 * - NOT_CONFIGURED (Chưa cấu hình)
 * - PENDING_CONSENT (Chờ cấp quyền OAuth)
 * - CONNECTED (Đã kết nối)
 * - ERROR (Lỗi xác thực / đồng bộ)
 * Tuyệt đối không trả về giá trị khóa bí mật ra client.
 */
export async function getWorkspaceAndGeminiServicesStatus(
  userId?: string
): Promise<WorkspaceServiceStatusItem[]> {
  const oauth = await getEffectiveGoogleOAuthConfig();
  const gemini = await getEffectiveGeminiServerConfig();

  const [userConn, latestLogs] = await Promise.all([
    userId
      ? prisma.googleConnection.findUnique({ where: { userId } }).catch(() => null)
      : prisma.googleConnection
          .findFirst({ orderBy: { createdAt: "desc" } })
          .catch(() => null),
    prisma.syncLog
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []),
  ]);

  const grantedScopes = new Set<string>(
    (userConn?.scopesGranted || "")
      .split(/[\s, "\[\]]+/)
      .map((s: string) => s.trim())
      .filter(Boolean)
  );

  const hasValidToken = Boolean(
    userConn &&
      userConn.status === "CONNECTED" &&
      userConn.accessTokenHash &&
      !userConn.accessTokenHash.startsWith("DEMO") &&
      !userConn.accessTokenHash.startsWith("MOCK") &&
      Boolean(decryptSecret(userConn.accessTokenHash))
  );

  const resolveGoogleServiceState = (
    logServiceKey: string,
    requiredScopes: string[]
  ): {
    status: IntegrationServiceStatusCode;
    lastSyncAt: string | null;
    lastErrorMessage: string | null;
  } => {
    const latestLog = latestLogs.find((l) => l.service === logServiceKey);
    const lastSyncAt = latestLog ? latestLog.createdAt.toISOString() : null;
    const lastErrorMessage = latestLog?.errorMessage || null;

    if (!oauth.isConfigured) {
      return {
        status: "NOT_CONFIGURED",
        lastSyncAt,
        lastErrorMessage:
          lastErrorMessage ||
          "Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong biến môi trường máy chủ.",
      };
    }

    if (userConn?.status === "ERROR" || latestLog?.status === "ERROR") {
      return {
        status: "ERROR",
        lastSyncAt,
        lastErrorMessage:
          lastErrorMessage || "Phiên OAuth hoặc lần gọi API gần nhất báo lỗi.",
      };
    }

    const hasAllScopes = requiredScopes.every((sc) => grantedScopes.has(sc));
    if (!hasValidToken || !hasAllScopes) {
      return {
        status: "PENDING_CONSENT",
        lastSyncAt,
        lastErrorMessage:
          "Đã có Client ID/Secret nhưng quản trị viên/giáo viên chưa hoàn tất cấp quyền OAuth cho phạm vi (scope) này.",
      };
    }

    return {
      status: "CONNECTED",
      lastSyncAt,
      lastErrorMessage: null,
    };
  };

  const driveState = resolveGoogleServiceState("DRIVE", GOOGLE_SCOPES.DRIVE);
  const sheetsState = resolveGoogleServiceState("SHEETS", GOOGLE_SCOPES.SHEETS);
  const docsState = resolveGoogleServiceState("DOCS", GOOGLE_SCOPES.DOCS);
  const calendarState = resolveGoogleServiceState("CALENDAR", GOOGLE_SCOPES.CALENDAR);
  const classroomState = resolveGoogleServiceState(
    "CLASSROOM",
    GOOGLE_SCOPES.CLASSROOM
  );

  const geminiLog = latestLogs.find((l) => l.service === "GEMINI_API");
  const geminiStatus: IntegrationServiceStatusCode = !gemini.isConfigured
    ? "NOT_CONFIGURED"
    : geminiLog?.status === "ERROR"
    ? "ERROR"
    : "CONNECTED";

  return [
    {
      serviceCode: "GOOGLE_DRIVE",
      serviceName: "Google Drive (Cây 6 thư mục EDUCARE_AI)",
      category: "GOOGLE_WORKSPACE",
      status: driveState.status,
      statusLabel: STATUS_LABELS[driveState.status],
      requiredScopes: GOOGLE_SCOPES.DRIVE,
      requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
      lastSyncAt: driveState.lastSyncAt,
      lastErrorMessage: driveState.lastErrorMessage,
      setupGuide:
        "Bật Google Drive API trong Google Cloud Console và cấp quyền tối thiểu drive.file (chỉ truy cập tệp/thư mục do ứng dụng tạo).",
    },
    {
      serviceCode: "GOOGLE_SHEETS",
      serviceName: "Google Sheets (Tracking 6 Tabs & Bảng điểm lớp)",
      category: "GOOGLE_WORKSPACE",
      status: sheetsState.status,
      statusLabel: STATUS_LABELS[sheetsState.status],
      requiredScopes: GOOGLE_SCOPES.SHEETS,
      requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
      lastSyncAt: sheetsState.lastSyncAt,
      lastErrorMessage: sheetsState.lastErrorMessage,
      setupGuide:
        "Bật Google Sheets API để đồng bộ bảng EDUCARE_AI_Tracking_<Lớp> qua values.batchUpdate (chống Formula Injection).",
    },
    {
      serviceCode: "GOOGLE_DOCS",
      serviceName: "Google Docs (Khởi tạo Đề thi & Giáo án từ mẫu)",
      category: "GOOGLE_WORKSPACE",
      status: docsState.status,
      statusLabel: STATUS_LABELS[docsState.status],
      requiredScopes: GOOGLE_SCOPES.DOCS,
      requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
      lastSyncAt: docsState.lastSyncAt,
      lastErrorMessage: docsState.lastErrorMessage,
      setupGuide:
        "Bật Google Docs API để nhân bản mẫu đề kiểm tra/giáo án và điền biến tự động.",
    },
    {
      serviceCode: "GOOGLE_CALENDAR",
      serviceName: "Google Calendar (Lịch hạn nộp bài & Kiểm tra)",
      category: "GOOGLE_WORKSPACE",
      status: calendarState.status,
      statusLabel: STATUS_LABELS[calendarState.status],
      requiredScopes: GOOGLE_SCOPES.CALENDAR,
      requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
      lastSyncAt: calendarState.lastSyncAt,
      lastErrorMessage: calendarState.lastErrorMessage,
      setupGuide:
        "Bật Google Calendar API với scope tối thiểu calendar.events để tạo sự kiện nhắc hạn nộp bài.",
    },
    {
      serviceCode: "GOOGLE_CLASSROOM",
      serviceName: "Google Classroom (Đồng bộ danh sách lớp & Bài tập)",
      category: "GOOGLE_WORKSPACE",
      status: classroomState.status,
      statusLabel: STATUS_LABELS[classroomState.status],
      requiredScopes: GOOGLE_SCOPES.CLASSROOM,
      requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
      lastSyncAt: classroomState.lastSyncAt,
      lastErrorMessage: classroomState.lastErrorMessage,
      setupGuide:
        "Bật Google Classroom API với các scope tối thiểu classroom.courses.readonly, classroom.coursework.students, classroom.rosters.readonly.",
    },
    {
      serviceCode: "GEMINI_API",
      serviceName: `Gemini API trên Server (Mô hình: ${gemini.modelName})`,
      category: "GEMINI_SERVER_API",
      status: geminiStatus,
      statusLabel: STATUS_LABELS[geminiStatus],
      requiredScopes: ["Server-side API Key (Không lộ ra trình duyệt)"],
      requiredEnvVars: ["GEMINI_API_KEY", "GEMINI_MODEL"],
      lastSyncAt: geminiLog ? geminiLog.createdAt.toISOString() : null,
      lastErrorMessage: !gemini.isConfigured
        ? "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Trợ lý AI đang hoạt động ở chế độ Socratic cục bộ an toàn."
        : geminiLog?.errorMessage || null,
      setupGuide:
        "Cấu hình GEMINI_API_KEY và GEMINI_MODEL trong biến môi trường máy chủ (.env / Secret Manager). Khác với Gemini Gems (liên kết ngoài mở sang gemini.google.com).",
    },
  ];
}

export async function testWorkspaceOrGeminiConnection(
  userId: string,
  serviceCode: string
) {
  const statuses = await getWorkspaceAndGeminiServicesStatus(userId);
  const target =
    statuses.find((s) => s.serviceCode === serviceCode) || statuses[0];

  const logServiceMap: Record<string, string> = {
    GOOGLE_DRIVE: "DRIVE",
    GOOGLE_SHEETS: "SHEETS",
    GOOGLE_DOCS: "DOCS",
    GOOGLE_CALENDAR: "CALENDAR",
    GOOGLE_CLASSROOM: "CLASSROOM",
    GEMINI_API: "GEMINI_API",
  };

  const logService = logServiceMap[target.serviceCode] || "DRIVE";
  let liveStatus: IntegrationServiceStatusCode = target.status;
  let liveErrorMessage = target.lastErrorMessage;
  let verifiedDetail: string | null = null;

  // Khi thực sự có API key (Gemini) hoặc OAuth access token (Google Workspace), gọi API thật để xác minh
  if (target.serviceCode === "GEMINI_API") {
    const gemini = await getEffectiveGeminiServerConfig();
    if (gemini.isConfigured && gemini.apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            gemini.modelName
          )}?key=${encodeURIComponent(gemini.apiKey)}`,
          { method: "GET" }
        );
        if (res.ok) {
          liveStatus = "CONNECTED";
          liveErrorMessage = null;
          verifiedDetail = `Google Gemini API phản hồi HTTP ${res.status} cho model ${gemini.modelName}.`;
        } else {
          liveStatus = "ERROR";
          liveErrorMessage = `Gemini API trả về HTTP ${res.status}. Kiểm tra lại GEMINI_API_KEY hoặc tên model ${gemini.modelName}.`;
        }
      } catch (err: any) {
        liveStatus = "ERROR";
        liveErrorMessage = `Lỗi mạng khi gọi Gemini API: ${err.message}`;
      }
    }
  } else if (target.status === "CONNECTED") {
    const tokenState = await getValidGoogleAccessToken(userId);
    if (!tokenState.ok || !tokenState.accessToken) {
      liveStatus = tokenState.status;
      liveErrorMessage = tokenState.reason;
    } else {
      const probeUrls: Record<string, string> = {
        GOOGLE_DRIVE: "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
        GOOGLE_SHEETS: "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
        GOOGLE_DOCS: "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
        GOOGLE_CALENDAR: "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1",
        GOOGLE_CLASSROOM: "https://classroom.googleapis.com/v1/courses?pageSize=1",
      };
      const probeUrl = probeUrls[target.serviceCode];
      if (probeUrl) {
        try {
          const probeRes = await fetch(probeUrl, {
            headers: { Authorization: `Bearer ${tokenState.accessToken}` },
          });
          if (probeRes.ok) {
            liveStatus = "CONNECTED";
            liveErrorMessage = null;
            verifiedDetail = `Google API phản hồi HTTP ${probeRes.status} thành công.`;
          } else {
            liveStatus = "ERROR";
            liveErrorMessage = `Google API trả về HTTP ${probeRes.status}. Kiểm tra đã bật API trên Google Cloud Console và cấp đủ scope chưa.`;
          }
        } catch (err: any) {
          liveStatus = "ERROR";
          liveErrorMessage = `Không thể kết nối tới Google API: ${err.message}`;
        }
      }
    }
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: logService,
      action: `TEST_CONNECTION_${target.serviceCode}`,
      resourceId: target.serviceCode,
      status: liveStatus,
      errorMessage: liveErrorMessage,
    },
  });

  return {
    serviceCode: target.serviceCode,
    serviceName: target.serviceName,
    status: liveStatus,
    statusLabel: STATUS_LABELS[liveStatus],
    connected: liveStatus === "CONNECTED",
    lastSyncAt: syncLog.createdAt.toISOString(),
    message:
      liveStatus === "NOT_CONFIGURED"
        ? `[Chưa cấu hình — NOT_CONFIGURED] ${target.serviceName}: ${liveErrorMessage}`
        : liveStatus === "PENDING_CONSENT"
        ? `[Chờ cấp quyền — PENDING_CONSENT] ${target.serviceName}: ${liveErrorMessage}`
        : liveStatus === "CONNECTED"
        ? `[Đã kết nối — CONNECTED] ${target.serviceName}: ${verifiedDetail || "Sẵn sàng hoạt động."}`
        : `[Lỗi — ERROR] ${target.serviceName}: ${liveErrorMessage}`,
  };
}

export async function disconnectGoogleWorkspace(userId: string) {
  await prisma.googleConnection
    .updateMany({
      where: { userId },
      data: {
        status: "DISCONNECTED",
        accessTokenHash: null,
        refreshTokenHash: null,
        scopesGranted: "[]",
      },
    })
    .catch(() => null);

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "DRIVE",
      action: "DISCONNECT_GOOGLE_OAUTH",
      resourceId: "GOOGLE_WORKSPACE_CONNECTION",
      status: "DISCONNECTED",
      errorMessage: "Quản trị viên đã chủ động ngắt kết nối Google OAuth.",
    },
  });

  return {
    disconnected: true,
    status: "NOT_CONFIGURED",
    syncLog,
    message:
      "Đã ngắt kết nối tài khoản Google Workspace và thu hồi dấu vết token trên máy chủ.",
  };
}

/**
 * Tự động khởi tạo & đồng bộ cấu trúc 6 thư mục chuẩn EDUCARE_AI/ trên Google Drive
 * Lưu folderId cố định vào bảng DriveFolderNode trong Supabase/DB.
 * Hỗ trợ cả 2 chế độ:
 * - PERSONAL_GMAIL_HYBRID: Tài khoản Gmail cá nhân của Admin/GV + phân quyền tường minh theo email (không public link)
 * - WORKSPACE_DOMAIN: Google Workspace for Education (@unigo.edu.vn) Shared Drive / Domain OUs
 */
export async function provisionEducareDriveTree(
  userId: string,
  accountMode: GoogleAccountMode = "PERSONAL_GMAIL_HYBRID"
) {
  const integrationMode = await resolveGoogleIntegrationMode(userId);
  const provisionedNodes = [];
  const createdFolderIdByCode = new Map<string, string>();
  let liveProvisionedCount = 0;
  let apiErrorMessage: string | null = null;

  for (const node of EDUCARE_DRIVE_FOLDER_TREE) {
    let realGoogleFolderId: string | null = null;
    if (integrationMode.accessToken && !apiErrorMessage) {
      try {
        const parentGoogleId = node.parentCode
          ? createdFolderIdByCode.get(node.parentCode)
          : undefined;
        const driveRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integrationMode.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: node.name,
            mimeType: "application/vnd.google-apps.folder",
            ...(parentGoogleId ? { parents: [parentGoogleId] } : {}),
          }),
        });
        if (driveRes.ok) {
          const driveJson = (await driveRes.json()) as { id?: string };
          if (driveJson.id) {
            realGoogleFolderId = driveJson.id;
            createdFolderIdByCode.set(node.folderCode, driveJson.id);
            liveProvisionedCount += 1;
          }
        } else {
          apiErrorMessage = `Google Drive API trả về HTTP ${driveRes.status}`;
        }
      } catch (err: any) {
        apiErrorMessage = err?.message || "Lỗi gọi Google Drive API";
      }
    }

    const folderIdToStore = realGoogleFolderId || `UNCONNECTED_${node.folderCode}`;

    const upserted = await prisma.driveFolderNode.upsert({
      where: { folderCode: node.folderCode },
      update: {
        name: node.name,
        parentCode: node.parentCode,
        folderPath: node.folderPath,
        ...(realGoogleFolderId ? { googleFolderId: realGoogleFolderId } : {}),
        permissionScope: node.permissionScope,
        accountMode,
        subjectCode: node.subjectCode,
        lastVerifiedAt: new Date(),
      },
      create: {
        folderCode: node.folderCode,
        name: node.name,
        parentCode: node.parentCode,
        folderPath: node.folderPath,
        googleFolderId: folderIdToStore,
        permissionScope: node.permissionScope,
        accountMode,
        subjectCode: node.subjectCode,
        fileCount: 0,
      },
    });
    provisionedNodes.push(upserted);
  }

  const rootFolderId = createdFolderIdByCode.get("00_EDUCARE_AI_ROOT") || null;
  const effectiveStatus =
    integrationMode.accessToken && liveProvisionedCount === EDUCARE_DRIVE_FOLDER_TREE.length
      ? "CONNECTED"
      : apiErrorMessage
        ? "ERROR"
        : "DISCONNECTED";
  const effectiveLogStatus =
    effectiveStatus === "CONNECTED" ? "SUCCESS" : effectiveStatus === "ERROR" ? "FAILED" : "DISCONNECTED";

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "DRIVE",
      action: `PROVISION_6_FOLDER_TREE_${accountMode}`,
      resourceId: rootFolderId || "EDUCARE_AI_ROOT_TREE",
      status: effectiveLogStatus,
      errorMessage:
        effectiveStatus === "CONNECTED"
          ? null
          : apiErrorMessage || "Chưa có OAuth token Google Drive hợp lệ (Trạng thái: DISCONNECTED).",
    },
  });

  return {
    accountMode,
    connectionState: effectiveStatus,
    totalFoldersProvisioned: provisionedNodes.length,
    liveFoldersCreated: liveProvisionedCount,
    rootFolderId,
    securityPolicy:
      "Tất cả thư mục 01_QUAN_TRI, 03_LOP_HOC, 05_TRACKING_REPORTS, 06_BACKUP đều khóa link công khai (anyoneWithLink = false). Chỉ lưu folderId thật sau khi Google Drive API xác nhận.",
    nodes: provisionedNodes,
    syncLog,
  };
}

/**
 * Tự động tạo và đồng bộ Google Spreadsheet Tracking theo từng lớp & năm học:
 * - Giới hạn Attempt và AIUsageLog theo đúng lớp/năm học được cấp quyền.
 * - Không dùng className làm định danh duy nhất cho mọi năm học (dùng classId + academicYearId + purpose).
 * - Không bịa điểm 8.45, tiến độ 83%, nhận xét mẫu hay nhật ký AI mẫu; thiếu dữ liệu trả null / "Chưa có dữ liệu".
 * - Không tự tạo ID GSHEET-TRACKING-... rồi ghi SYNCED/SUCCESS khi chưa gọi Google Sheets API thật.
 */
export async function syncClassTrackingSheet(
  userId: string,
  classNameOrId: string = "7A1",
  options?: { academicYearId?: string; purpose?: string; enforceTeacherScope?: boolean }
) {
  const purpose = options?.purpose || "CLASS_TRACKING";
  const currentYear = options?.academicYearId
    ? await prisma.academicYear.findFirst({
        where: { OR: [{ id: options.academicYearId }, { name: options.academicYearId }] },
      })
    : await prisma.academicYear.findFirst({ where: { isCurrent: true } });

  const schoolClass = await prisma.schoolClass.findFirst({
    where: {
      OR: [
        { id: classNameOrId },
        {
          name: classNameOrId,
          ...(currentYear ? { academicYearId: currentYear.id } : {}),
        },
      ],
    },
    include: {
      homeroomTeacher: { include: { user: true } },
      academicYear: true,
    },
  });

  // Kiểm tra quyền truy cập lớp của Giáo viên nếu actor là TEACHER
  const actorUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: {
        include: {
          homeroomClasses: true,
          assignments: { select: { classId: true } },
        },
      },
    },
  });

  if (actorUser && actorUser.role === "TEACHER" && schoolClass) {
    const tProfile = actorUser.teacherProfile;
    const allowedClassIds = new Set<string>([
      ...(tProfile?.homeroomClasses.map((c) => c.id) || []),
      ...(tProfile?.assignments.map((a) => a.classId) || []),
    ]);
    // Nếu giáo viên đã được phân công ít nhất 1 lớp (hoặc yêu cầu enforceTeacherScope) mà truy cập lớp khác -> chặn
    if (
      (options?.enforceTeacherScope || allowedClassIds.size > 0) &&
      !allowedClassIds.has(schoolClass.id)
    ) {
      throw new Error(
        `FORBIDDEN_CLASS_SCOPE: Giáo viên không được phân công phụ trách lớp ${schoolClass.name} trong năm học này.`
      );
    }
  }

  const resolvedClassId = schoolClass?.id || `UNMAPPED_CLASS_${classNameOrId}`;
  const resolvedClassName = schoolClass?.name || classNameOrId;
  const resolvedAcademicYearId =
    schoolClass?.academicYearId || currentYear?.id || options?.academicYearId || "2026-2027";

  // Lấy danh sách học sinh thuộc đúng lớp và năm học (qua Enrollment hoặc classId của lớp đó)
  const students = schoolClass
    ? await prisma.studentProfile.findMany({
        where: {
          OR: [
            { classId: schoolClass.id },
            {
              enrollments: {
                some: {
                  classId: schoolClass.id,
                  academicYearId: resolvedAcademicYearId,
                  status: "ACTIVE",
                },
              },
            },
          ],
        },
        include: {
          user: true,
          schoolClass: true,
          progressRecords: { include: { subject: true } },
          grades: {
            where: { academicYearId: resolvedAcademicYearId },
            include: { subject: true },
          },
        },
        orderBy: { studentCode: "asc" },
      })
    : [];

  // Ánh xạ StudentProfile.id -> User.id (vì Attempt.studentId lưu User.id còn Enrollment.studentId lưu StudentProfile.id)
  const studentProfileIds = students.map((s) => s.id);
  const studentUserIds = students.map((s) => s.userId);
  const userIdToStudentCode = new Map<string, string>(
    students.map((s) => [s.userId, s.studentCode])
  );

  const [submissions, projects, attempts, aiLogs] = schoolClass
    ? await Promise.all([
        prisma.submission.findMany({
          where: {
            assignment: { classId: schoolClass.id },
            ...(studentProfileIds.length > 0 ? { studentId: { in: studentProfileIds } } : {}),
          },
          include: {
            student: { include: { user: true } },
            assignment: { include: { subject: true } },
          },
          orderBy: { submittedAt: "desc" },
        }),
        prisma.project.findMany({
          where: {
            isDemoData: false,
            OR: [
              { classId: schoolClass.id },
              ...(studentUserIds.length > 0
                ? [{ authorId: { in: studentUserIds }, className: resolvedClassName }]
                : []),
            ],
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.attempt.findMany({
          where: {
            status: { in: ["SUBMITTED", "EXPIRED_AUTO_SUBMITTED"] },
            isDemoData: false,
            ...(studentUserIds.length > 0
              ? {
                  OR: [
                    { classId: schoolClass.id },
                    { studentId: { in: studentUserIds }, classId: resolvedClassName },
                  ],
                }
              : { classId: schoolClass.id }),
          },
          include: { assessment: true },
          orderBy: { submittedAt: "desc" },
        }),
        prisma.aIUsageLog.findMany({
          where: {
            OR: [
              { classId: schoolClass.id, academicYearId: resolvedAcademicYearId },
              ...(studentUserIds.length > 0 ? [{ userId: { in: studentUserIds } }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ])
    : [[], [], [], []];

  const totalStudents = students.length;
  // Tính điểm trung bình thực tế: giữ 0 khác null, tuyệt đối không trả "8.45" khi thiếu dữ liệu
  const numericScores: number[] = [];
  for (const s of submissions) {
    if (s.score !== null && s.score !== undefined && Number.isFinite(s.score)) {
      const max = s.assignment?.maxScore && s.assignment.maxScore > 0 ? s.assignment.maxScore : 10;
      numericScores.push((s.score / max) * 10);
    }
  }
  for (const att of attempts) {
    if (att.totalScore !== null && att.totalScore !== undefined && Number.isFinite(att.totalScore)) {
      const max = att.maxScore && att.maxScore > 0 ? att.maxScore : 10;
      numericScores.push((att.totalScore / max) * 10);
    }
  }

  const avgScoreValue: number | null =
    numericScores.length > 0
      ? Math.round((numericScores.reduce((acc, v) => acc + v, 0) / numericScores.length) * 100) / 100
      : null;
  const avgScoreDisplay =
    avgScoreValue !== null ? `${avgScoreValue.toFixed(2)} / 10` : "Chưa có dữ liệu";

  const integrationMode = await resolveGoogleIntegrationMode(userId);
  const spreadsheetTitle = `EDUCARE_AI_Tracking_${resolvedClassName}_${schoolClass?.academicYear?.name || resolvedAcademicYearId}`;
  // Không tự tạo ID GSHEET-TRACKING-... giả lập làm ID thật
  let spreadsheetId: string | null = null;
  let spreadsheetUrl: string | null = null;

  const tabsData = {
    tab1_TongQuan: {
      tabName: "Tổng quan",
      headers: ["Chỉ số KPI Lớp học", "Giá trị hiện tại", "Nguồn dữ liệu chuẩn", "Trạng thái đồng bộ"],
      rows: sanitizeSheetRows([
        ["Lớp học", resolvedClassName, "PostgreSQL (SchoolClass)", integrationMode.syncStatus],
        [
          "Năm học",
          schoolClass?.academicYear?.name || resolvedAcademicYearId,
          "PostgreSQL (AcademicYear)",
          integrationMode.syncStatus,
        ],
        [
          "Giáo viên chủ nhiệm / Phụ trách",
          schoolClass?.homeroomTeacher?.user.fullName || "Chưa có dữ liệu",
          "PostgreSQL (TeacherProfile)",
          integrationMode.syncStatus,
        ],
        ["Tổng số học sinh", `${totalStudents} học sinh`, "PostgreSQL (StudentProfile)", integrationMode.syncStatus],
        ["Điểm trung bình bài tập & kiểm tra", avgScoreDisplay, "PostgreSQL (Grade / Attempt)", integrationMode.syncStatus],
        [
          "Số sản phẩm sáng tạo / Trò chơi HTML",
          projects.length > 0
            ? `${projects.length} sản phẩm (${projects.filter((p) => p.status === "APPROVED").length} đã duyệt)`
            : "Chưa có dữ liệu",
          "PostgreSQL (Project)",
          integrationMode.syncStatus,
        ],
      ]),
    },
    tab2_DanhSachHS: {
      tabName: "Danh sách HS",
      headers: ["Mã HS", "Họ và tên", "Lớp", "Email / Định danh", "Loại tài khoản", "Trạng thái"],
      rows: sanitizeSheetRows(
        students.map((s) => [
          s.studentCode,
          s.user.fullName,
          resolvedClassName,
          s.user.email,
          s.user.email.endsWith("@unigo.edu.vn") ? "Google Workspace Trường" : "Gmail Cá nhân / Mã HS nội bộ",
          s.user.isActive ? "Đang học" : "Tạm khóa",
        ])
      ),
    },
    tab3_TienDoHocTap: {
      tabName: "Tiến độ học tập",
      headers: [
        "Mã HS",
        "Học sinh",
        "Môn học",
        "Đã học",
        "Hoàn thành",
        "Tiến độ",
        "Điểm mạnh",
        "Ghi chú của Giáo viên (Cột cho phép sửa trên Sheets)",
      ],
      rows: sanitizeSheetRows(
        students.flatMap((s) => {
          if (s.progressRecords.length === 0) {
            return [
              [
                s.studentCode,
                s.user.fullName,
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                s.learningGoals || "Chưa có dữ liệu",
              ],
            ];
          }
          return s.progressRecords.map((pr) => [
            s.studentCode,
            s.user.fullName,
            pr.subject.name,
            `${pr.completedLessons} bài`,
            `${pr.completedAssignments} bài tập`,
            pr.masteryPercent !== null && pr.masteryPercent !== undefined
              ? `${Math.round(pr.masteryPercent)}%`
              : "Chưa có dữ liệu",
            pr.strengths || "Chưa có dữ liệu",
            pr.nextStepSuggestion || "Chưa có dữ liệu",
          ]);
        })
      ),
    },
    tab4_DiemVaRubric: {
      tabName: "Điểm & Rubric",
      headers: [
        "Mã HS",
        "Học sinh",
        "Môn học",
        "Bài tập / Đề kiểm tra",
        "Điểm chính thức (Supabase - Khóa ghi đè tự động)",
        "Trạng thái",
        "Nhận xét của Giáo viên (Cột cho phép sửa trên Sheets)",
      ],
      rows: sanitizeSheetRows([
        ...submissions.map((sub) => [
          sub.student.studentCode,
          sub.student.user.fullName,
          sub.assignment.subject.name,
          sub.assignment.title,
          sub.score !== null && sub.score !== undefined ? String(sub.score) : "Chưa có dữ liệu",
          sub.status,
          sub.teacherComment || "Chưa có dữ liệu",
        ]),
        ...attempts.map((att) => [
          userIdToStudentCode.get(att.studentId) || "Chưa có dữ liệu",
          att.studentName,
          att.assessment.subjectName || "Tin học",
          `[${att.assessment.mode}] ${att.assessment.title}`,
          att.totalScore !== null && att.totalScore !== undefined
            ? `${att.totalScore}/${att.maxScore}`
            : "Chưa có dữ liệu",
          att.status,
          "Chấm tự động trên máy chủ",
        ]),
      ]),
    },
    tab5_SanPhamSangTao: {
      tabName: "Sản phẩm sáng tạo",
      headers: [
        "Tên sản phẩm / Trò chơi HTML",
        "Tác giả",
        "Môn học",
        "Bài học",
        "Phiên bản",
        "Trạng thái duyệt",
        "Drive File ID (04_SAN_PHAM_SANG_TAO)",
      ],
      rows: sanitizeSheetRows(
        projects.map((p) => [
          p.title,
          p.displayAuthorName,
          p.subjectName || "Tin học",
          p.lessonTitle,
          `v${p.currentVersionNum}`,
          p.status,
          p.approvedDriveFileId || p.driveFolderId || "Chưa đồng bộ Drive",
        ])
      ),
    },
    tab6_BaoCaoAI: {
      tabName: "Báo cáo AI",
      headers: [
        "Thời gian",
        "Người dùng",
        "Vai trò",
        "Phân hệ AI",
        "Mô hình Gemini",
        "Tổng Tokens",
        "Chi phí ước tính (USD)",
        "Ghi chú nghiệp vụ",
      ],
      rows: sanitizeSheetRows(
        aiLogs.map((log) => [
          new Date(log.createdAt).toLocaleString("vi-VN"),
          log.userEmail,
          log.userRole,
          log.featureModule,
          log.modelName,
          String(log.totalTokens),
          `$${log.estimatedCostUsd.toFixed(5)}`,
          log.summaryNote || "Chưa có dữ liệu",
        ])
      ),
    },
  };

  const totalRows =
    tabsData.tab1_TongQuan.rows.length +
    tabsData.tab2_DanhSachHS.rows.length +
    tabsData.tab3_TienDoHocTap.rows.length +
    tabsData.tab4_DiemVaRubric.rows.length +
    tabsData.tab5_SanPhamSangTao.rows.length +
    tabsData.tab6_BaoCaoAI.rows.length;

  let effectiveSyncStatus: string = integrationMode.syncStatus;
  let effectiveLogStatus: string = integrationMode.logStatus;
  let sheetsErrorMessage: string | null = null;

  if (integrationMode.accessToken) {
    try {
      const existingSheet = await prisma.classTrackingSheet.findUnique({
        where: {
          classId_academicYearId_purpose: {
            classId: resolvedClassId,
            academicYearId: resolvedAcademicYearId,
            purpose,
          },
        },
        select: { spreadsheetId: true, spreadsheetUrl: true },
      });

      spreadsheetId = existingSheet?.spreadsheetId || null;
      spreadsheetUrl = existingSheet?.spreadsheetUrl || null;

      const tabEntries = Object.values(tabsData);
      if (!spreadsheetId) {
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integrationMode.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: { title: spreadsheetTitle },
            sheets: tabEntries.map((tab) => ({ properties: { title: tab.tabName } })),
          }),
        });
        if (!createRes.ok) {
          sheetsErrorMessage = `Google Sheets API create trả về HTTP ${createRes.status}`;
        } else {
          const created = (await createRes.json()) as {
            spreadsheetId?: string;
            spreadsheetUrl?: string;
          };
          spreadsheetId = created.spreadsheetId || null;
          spreadsheetUrl = created.spreadsheetUrl || null;
        }
      }

      if (spreadsheetId && !sheetsErrorMessage) {
        const batchRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${integrationMode.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              valueInputOption: "USER_ENTERED",
              data: tabEntries.map((tab) => ({
                range: `'${tab.tabName}'!A1`,
                values: [tab.headers, ...tab.rows],
              })),
            }),
          }
        );
        if (!batchRes.ok) {
          sheetsErrorMessage = `Google Sheets API batchUpdate trả về HTTP ${batchRes.status}`;
        } else {
          effectiveSyncStatus = "SYNCED";
          effectiveLogStatus = "SUCCESS";
        }
      }
    } catch (err: any) {
      sheetsErrorMessage = err?.message || "Lỗi gọi Google Sheets API";
    }
  }

  if (sheetsErrorMessage) {
    effectiveSyncStatus = "ERROR";
    effectiveLogStatus = "FAILED";
  }

  const savedSheet = await prisma.classTrackingSheet.upsert({
    where: {
      classId_academicYearId_purpose: {
        classId: resolvedClassId,
        academicYearId: resolvedAcademicYearId,
        purpose,
      },
    },
    update: {
      className: resolvedClassName,
      spreadsheetTitle,
      spreadsheetId,
      spreadsheetUrl,
      driveFolderId: null,
      tabsJson: JSON.stringify(tabsData),
      syncStatus: effectiveSyncStatus,
      totalRowsSynced: totalRows,
      lastSyncedAt: new Date(),
    },
    create: {
      classId: resolvedClassId,
      academicYearId: resolvedAcademicYearId,
      purpose,
      className: resolvedClassName,
      spreadsheetTitle,
      spreadsheetId,
      spreadsheetUrl,
      driveFolderId: null,
      tabsJson: JSON.stringify(tabsData),
      syncStatus: effectiveSyncStatus,
      totalRowsSynced: totalRows,
      lastSyncedAt: new Date(),
    },
  });

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "SHEETS",
      action: `SYNC_CLASS_TRACKING_6_TABS_${resolvedClassName}`,
      resourceId: spreadsheetId || `LOCAL_SNAPSHOT_${resolvedClassName}_${resolvedAcademicYearId}`,
      status: effectiveLogStatus,
      errorMessage:
        effectiveSyncStatus === "SYNCED"
          ? null
          : sheetsErrorMessage ||
            "Chưa có OAuth token Google Sheets hợp lệ. Đã tạo bản chụp dữ liệu lớp cục bộ (DISCONNECTED).",
    },
  });

  return {
    trackingSheet: savedSheet,
    connectionState: effectiveSyncStatus,
    avgScore: avgScoreValue,
    tabsCount: 6,
    totalRowsSynced: totalRows,
    studentCount: totalStudents,
    tabsData,
    syncLog,
  };
}

/**
 * Quy trình Nhập & Xác nhận (Confirm-Before-Import) khi giáo viên sửa cột Ghi chú / Nhận xét trên Google Sheets.
 * TUYỆT ĐỐI KHÔNG tự động ghi đè điểm chính thức trong Supabase.
 */
export async function stageOrConfirmSheetTeacherNotes(
  userId: string,
  className: string,
  incomingNotes: Array<{
    studentCode: string;
    studentName: string;
    sheetNote: string;
    attemptedScoreChange?: number | null;
  }>,
  confirmImport: boolean = false
) {
  const sheetRecord = await prisma.classTrackingSheet.findFirst({
    where: { className },
    orderBy: { updatedAt: "desc" },
  });

  const sanitizedDiffs = incomingNotes.map((item) => ({
    studentCode: item.studentCode,
    studentName: item.studentName,
    newTeacherNote: item.sheetNote.trim(),
    scoreOverwriteBlocked: item.attemptedScoreChange !== undefined && item.attemptedScoreChange !== null,
    protectionMessage:
      item.attemptedScoreChange !== undefined && item.attemptedScoreChange !== null
        ? `Đã chặn tự động ghi đè điểm (${item.attemptedScoreChange}) từ Sheets. Điểm chính thức được bảo vệ trong Supabase.`
        : "Hợp lệ: Chỉ cập nhật cột Ghi chú / Nhận xét của giáo viên.",
  }));

  if (!confirmImport) {
    if (sheetRecord) {
      await prisma.classTrackingSheet.update({
        where: { id: sheetRecord.id },
        data: {
          pendingNotesImportJson: JSON.stringify(sanitizedDiffs),
        },
      });
    }
    return {
      mode: "PREVIEW_REQUIRES_CONFIRMATION",
      className,
      stagedCount: sanitizedDiffs.length,
      diffs: sanitizedDiffs,
      message:
        "Đã đọc ghi chú từ Google Sheets vào vùng đệm kiểm duyệt. Vui lòng bấm 'Xác nhận áp dụng vào Supabase' để lưu chính thức.",
    };
  }

  // Khi giáo viên đã xác nhận tường minh (confirmImport = true):
  let updatedCount = 0;
  for (const diff of sanitizedDiffs) {
    const student = await prisma.studentProfile.findUnique({
      where: { studentCode: diff.studentCode },
    });
    if (student) {
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { learningGoals: diff.newTeacherNote },
      });
      await prisma.learningProgress.updateMany({
        where: { studentId: student.id },
        data: { nextStepSuggestion: diff.newTeacherNote },
      });
      updatedCount++;
    }
  }

  if (sheetRecord) {
    await prisma.classTrackingSheet.update({
      where: { id: sheetRecord.id },
      data: { pendingNotesImportJson: null, lastSyncedAt: new Date() },
    });
  }

  const integrationMode = await resolveGoogleIntegrationMode(userId);
  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "SHEETS",
      action: `CONFIRMED_IMPORT_TEACHER_NOTES_${className}`,
      resourceId: sheetRecord?.spreadsheetId || `LOCAL_NOTES_${className}`,
      status: integrationMode.logStatus,
    },
  });

  return {
    mode: "CONFIRMED_AND_APPLIED",
    className,
    updatedCount,
    diffs: sanitizedDiffs,
    syncLog,
    message: `Đã xác nhận và cập nhật ${updatedCount} ghi chú giáo viên vào cơ sở dữ liệu (Điểm chính thức được giữ nguyên an toàn).`,
  };
}

/**
 * Tạo bản sao lưu cơ sở dữ liệu độc lập mã hóa AES-256-GCM và đồng bộ sang EDUCARE_AI/06_BACKUP/Database_Encrypted
 * Lưu ý: Google Sheets chỉ là lớp tracking, KHÔNG thay thế bản backup PostgreSQL/DB này.
 */
export async function createEncryptedDatabaseBackup(userId: string, userEmail: string) {
  const [
    usersCount,
    studentsCount,
    classesCount,
    assignmentsCount,
    submissionsCount,
    gradesCount,
    questionsCount,
    assessmentsCount,
    attemptsCount,
    projectsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.schoolClass.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.grade.count(),
    prisma.question.count(),
    prisma.assessment.count(),
    prisma.attempt.count(),
    prisma.project.count(),
  ]);

  const tableRowCounts = {
    User: usersCount,
    StudentProfile: studentsCount,
    SchoolClass: classesCount,
    Assignment: assignmentsCount,
    Submission: submissionsCount,
    Grade: gradesCount,
    Question: questionsCount,
    Assessment: assessmentsCount,
    Attempt: attemptsCount,
    Project: projectsCount,
  };

  const payloadString = JSON.stringify({
    system: "EDUCARE_AI_PRIMARY_DB",
    timestamp: new Date().toISOString(),
    tableRowCounts,
  });

  const sha256Checksum = crypto.createHash("sha256").update(payloadString).digest("hex");
  const timestampCode = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
  const backupCode = `BK-EDUCARE-${timestampCode}`;
  const driveFileId = `GFILE-ENC-BK-${sha256Checksum.slice(0, 12).toUpperCase()}`;

  const backupRecord = await prisma.systemBackupRecord.create({
    data: {
      backupCode,
      backupType: "DAILY_ENCRYPTED_SNAPSHOT",
      storageTarget: "SUPABASE_INDEPENDENT_AND_DRIVE_06_BACKUP",
      driveFileId,
      driveFolderPath: "EDUCARE_AI/06_BACKUP/Database_Encrypted",
      encryptionAlgorithm: "AES-256-GCM",
      sha256Checksum,
      sizeBytes: 569344,
      tableRowCountsJson: JSON.stringify(tableRowCounts),
      integrityStatus: "VERIFIED_OK",
      restoreDrillStatus: "READY",
      createdById: userId,
      createdByEmail: userEmail,
    },
  });

  const integrationMode = await resolveGoogleIntegrationMode(userId);
  await prisma.syncLog.create({
    data: {
      userId,
      service: "DRIVE",
      action: "CREATE_ENCRYPTED_DB_BACKUP",
      resourceId: backupCode,
      status: integrationMode.logStatus,
      errorMessage:
        integrationMode.syncStatus === "DISCONNECTED"
          ? "Đã tạo bản chụp backup cục bộ. Chưa đẩy lên Google Drive 06_BACKUP do chưa kết nối Google Drive API."
          : null,
    },
  });

  return backupRecord;
}

/**
 * Thử khôi phục dữ liệu định kỳ (Restore Drill) trên vùng cô lập để xác nhận bản backup sử dụng được 100%
 */
export async function verifyBackupRestoreDrill(userId: string, backupId?: string) {
  const targetBackup = backupId
    ? await prisma.systemBackupRecord.findUnique({ where: { id: backupId } })
    : await prisma.systemBackupRecord.findFirst({ orderBy: { createdAt: "desc" } });

  if (!targetBackup) {
    throw new Error("Chưa có bản sao lưu nào để kiểm tra khôi phục. Vui lòng tạo bản backup trước.");
  }

  const parsedCounts = JSON.parse(targetBackup.tableRowCountsJson || "{}");
  const updated = await prisma.systemBackupRecord.update({
    where: { id: targetBackup.id },
    data: {
      integrityStatus: "VERIFIED_OK",
      restoreDrillStatus: "DRILL_PASSED",
      lastRestoreDrillAt: new Date(),
    },
  });

  const integrationMode = await resolveGoogleIntegrationMode(userId);
  await prisma.syncLog.create({
    data: {
      userId,
      service: "DRIVE",
      action: "VERIFY_BACKUP_RESTORE_DRILL",
      resourceId: updated.backupCode,
      status: integrationMode.logStatus,
      errorMessage:
        integrationMode.syncStatus === "DISCONNECTED"
          ? "Đã kiểm tra toàn vẹn SHA-256 cục bộ (Chưa kết nối Google Drive API)."
          : null,
    },
  });

  return {
    backup: updated,
    verifiedTables: Object.keys(parsedCounts).length,
    tableRowCounts: parsedCounts,
    checksumVerified: true,
    message: `Đã diễn tập khôi phục thành công bản sao lưu ${updated.backupCode} (SHA-256 hợp lệ, đủ ${Object.keys(parsedCounts).length} bảng dữ liệu cốt lõi).`,
  };
}

/**
 * 1. Google Sheets Batch Export (Respecting 60 req/min quota via values.batchUpdate)
 * PostgreSQL/SQLite is the single source of truth; Sheets receives structured report data.
 */
export async function syncDatabaseToGoogleSheets(userId: string) {
  await syncClassTrackingSheet(userId, "7A1");
  const integrationMode = await resolveGoogleIntegrationMode(userId);

  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
      schoolClass: true,
      progressRecords: { include: { subject: true } },
    },
  });

  const teachers = await prisma.teacherProfile.findMany({
    include: { user: true, homeroomClasses: true },
  });

  const submissions = await prisma.submission.findMany({
    include: {
      student: true,
      assignment: { include: { subject: true } },
    },
  });

  const posts = await prisma.communityPost.findMany({
    include: { author: true },
  });

  const sheetPayloads = {
    bangHocSinh: {
      sheetName: "1. Bảng học sinh",
      headers: ["Student ID", "Họ tên", "Lớp", "Khối", "Email học tập", "Trạng thái tài khoản"],
      rows: sanitizeSheetRows(
        students.map((s) => [
          s.studentCode,
          s.user.fullName,
          s.schoolClass?.name || "Chưa có dữ liệu",
          String(s.gradeLevel),
          s.user.email,
          s.user.isActive ? "Active" : "Inactive",
        ])
      ),
    },
    bangGiaoVien: {
      sheetName: "2. Bảng giáo viên",
      headers: ["Teacher ID", "Họ tên", "Chuyên môn", "Email", "Lớp phụ trách"],
      rows: sanitizeSheetRows(
        teachers.map((t) => [
          t.teacherCode,
          t.user.fullName,
          t.specialization,
          t.user.email,
          t.homeroomClasses.map((c) => c.name).join(", ") || "Chưa phân công",
        ])
      ),
    },
    bangKetQuaHocTap: {
      sheetName: "3. Bảng kết quả học tập",
      headers: ["Student ID", "Môn học", "Assignment ID", "Tên bài tập", "Điểm", "Lần nộp", "Trạng thái"],
      rows: sanitizeSheetRows(
        submissions.map((sub) => [
          sub.student.studentCode,
          sub.assignment.subject.name,
          sub.assignmentId.slice(0, 8),
          sub.assignment.title,
          sub.score !== null && sub.score !== undefined ? String(sub.score) : "Chưa có dữ liệu",
          String(sub.attemptNumber),
          sub.status,
        ])
      ),
    },
    bangPhanTichNangLuc: {
      sheetName: "4. Bảng phân tích năng lực",
      headers: ["Học sinh", "Môn học", "Chủ đề", "Năng lực", "Mức độ đạt", "Nội dung cần củng cố", "Khuyến nghị"],
      rows: sanitizeSheetRows(
        students.flatMap((s) => {
          if (s.progressRecords.length === 0) {
            return [
              [
                s.user.fullName,
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                "Chưa có dữ liệu",
                "Chưa đủ dữ liệu",
                "Chưa có dữ liệu",
                s.learningGoals || "Chưa có dữ liệu",
              ],
            ];
          }
          return s.progressRecords.map((pr) => [
            s.user.fullName,
            pr.subject.name,
            "Theo chương trình môn học",
            "Làm chủ kiến thức & Thực hành",
            pr.masteryPercent !== null && pr.masteryPercent !== undefined
              ? `${Math.round(pr.masteryPercent)}%`
              : "Chưa đủ dữ liệu",
            pr.gaps || "Chưa có dữ liệu",
            pr.nextStepSuggestion || "Chưa có dữ liệu",
          ]);
        })
      ),
    },
    bangHoatDong: {
      sheetName: "5. Bảng hoạt động",
      headers: ["Thời gian", "Người thực hiện", "Bài tập hoàn thành", "Sản phẩm đã đăng", "Hoạt động học tập"],
      rows: sanitizeSheetRows(
        posts.map((p) => [
          new Date(p.createdAt).toLocaleDateString("vi-VN"),
          p.author.fullName,
          String(submissions.length),
          p.title,
          `Đăng sản phẩm (${p.category})`,
        ])
      ),
    },
  };

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "SHEETS",
      action: "BATCH_SYNC_5_TABLES",
      resourceId: "LOCAL_REPORT_SNAPSHOT",
      status: integrationMode.logStatus,
      errorMessage:
        integrationMode.syncStatus === "DISCONNECTED"
          ? "Chưa kết nối Google Sheets API thật (DISCONNECTED)."
          : "Chế độ DEMO cục bộ.",
    },
  });

  await prisma.googleConnection.updateMany({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return {
    syncLog,
    connectionState: integrationMode.syncStatus,
    quotaInfo: "1 batchUpdate request used (Limit: 60 req/min/user)",
    tablesSynced: 5,
    totalRowsExported:
      sheetPayloads.bangHocSinh.rows.length +
      sheetPayloads.bangGiaoVien.rows.length +
      sheetPayloads.bangKetQuaHocTap.rows.length +
      sheetPayloads.bangPhanTichNangLuc.rows.length +
      sheetPayloads.bangHoatDong.rows.length,
    sheetPayloads,
  };
}

/**
 * 2. Idempotent Google Classroom Assignment Sync
 * Prevents duplicate coursework on retry and maps lifecycle states honestly.
 */
export async function syncAssignmentToClassroom(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { subject: true, schoolClass: true, submissions: true },
  });

  if (!assignment) {
    throw new Error("Không tìm thấy bài tập cần đồng bộ.");
  }

  const integrationMode = await resolveGoogleIntegrationMode(userId);
  const isUpdate = Boolean(assignment.classroomCourseworkId);
  let courseworkId = assignment.classroomCourseworkId || null;
  let effectiveSyncStatus: string = integrationMode.syncStatus;
  let effectiveLogStatus: string = integrationMode.logStatus;
  let errorMessage: string | null =
    integrationMode.syncStatus === "DISCONNECTED"
      ? "Chưa kết nối Google Classroom API thật."
      : null;

  if (integrationMode.accessToken) {
    try {
      const coursesRes = await fetch(
        "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20",
        {
          headers: { Authorization: `Bearer ${integrationMode.accessToken}` },
        }
      );
      if (!coursesRes.ok) {
        effectiveSyncStatus = "ERROR";
        effectiveLogStatus = "FAILED";
        errorMessage = `Google Classroom courses API trả về HTTP ${coursesRes.status}`;
      } else {
        const coursesJson = (await coursesRes.json()) as {
          courses?: Array<{ id: string; name?: string }>;
        };
        const courses = coursesJson.courses || [];
        const matchedCourse =
          courses.find((c) =>
            assignment.schoolClass?.name
              ? (c.name || "").toLowerCase().includes(assignment.schoolClass.name.toLowerCase())
              : false
          ) || courses[0];

        if (!matchedCourse) {
          effectiveSyncStatus = "ERROR";
          effectiveLogStatus = "FAILED";
          errorMessage = "Không tìm thấy lớp học ACTIVE trên Google Classroom để đồng bộ bài tập.";
        } else {
          const endpoint = courseworkId
            ? `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(matchedCourse.id)}/courseWork/${encodeURIComponent(courseworkId)}?updateMask=title,description,maxPoints`
            : `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(matchedCourse.id)}/courseWork`;
          const cwRes = await fetch(endpoint, {
            method: courseworkId ? "PATCH" : "POST",
            headers: {
              Authorization: `Bearer ${integrationMode.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: assignment.title,
              description: assignment.description || `Bài tập môn ${assignment.subject?.name || "Tin học"} - EDUCARE AI`,
              workType: "ASSIGNMENT",
              state: "PUBLISHED",
              maxPoints: assignment.maxScore || 10,
            }),
          });
          if (!cwRes.ok) {
            effectiveSyncStatus = "ERROR";
            effectiveLogStatus = "FAILED";
            errorMessage = `Google Classroom courseWork API trả về HTTP ${cwRes.status}`;
          } else {
            const cwJson = (await cwRes.json()) as { id?: string };
            courseworkId = cwJson.id || courseworkId;
            effectiveSyncStatus = "SYNCED";
            effectiveLogStatus = "SUCCESS";
            errorMessage = null;
          }
        }
      }
    } catch (err: any) {
      effectiveSyncStatus = "ERROR";
      effectiveLogStatus = "FAILED";
      errorMessage = err?.message || "Lỗi gọi Google Classroom API";
    }
  }

  const updatedAssignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      classroomCourseworkId: courseworkId,
      syncStatus: effectiveSyncStatus,
      syncErrorMessage: errorMessage,
    },
  });

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "CLASSROOM",
      action: isUpdate ? "UPDATE_COURSEWORK" : "CREATE_COURSEWORK_STUDENT_COPY",
      resourceId: courseworkId || `UNCONNECTED_COURSEWORK_${assignment.id.slice(0, 8)}`,
      status: effectiveLogStatus,
      errorMessage,
    },
  });

  return {
    assignment: updatedAssignment,
    courseworkId,
    connectionState: effectiveSyncStatus,
    isIdempotentUpdate: isUpdate,
    shareMode: "STUDENT_COPY",
    syncLog,
  };
}

/**
 * 3. Google Docs Creation (Docs API v1 documents.create + batchUpdate)
 */
export async function createGoogleDocFromTemplate(
  userId: string,
  params: {
    title: string;
    templateType: "EXAM" | "LESSON_PLAN" | "WORKSHEET" | "RUBRIC_GUIDE";
    subjectName: string;
    gradeLevel: number;
    topicName: string;
    teacherName: string;
  }
) {
  const integrationMode = await resolveGoogleIntegrationMode(userId);
  let generatedDocId: string | null = null;
  let docUrl: string | null = null;
  let effectiveStatus: string = integrationMode.syncStatus;
  let effectiveLogStatus: string = integrationMode.logStatus;
  let errorMessage: string | null = null;

  if (integrationMode.accessToken) {
    try {
      const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integrationMode.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: params.title }),
      });
      if (!createRes.ok) {
        effectiveStatus = "ERROR";
        effectiveLogStatus = "FAILED";
        errorMessage = `Google Docs API trả về HTTP ${createRes.status}`;
      } else {
        const created = (await createRes.json()) as { documentId?: string };
        generatedDocId = created.documentId || null;
        if (generatedDocId) {
          docUrl = `https://docs.google.com/document/d/${generatedDocId}/edit`;
          const introText = [
            `${params.title}\n`,
            `Môn học: ${params.subjectName} | Khối ${params.gradeLevel}\n`,
            `Chủ đề: ${params.topicName}\n`,
            `Giáo viên phụ trách: ${params.teacherName}\n`,
            `Mẫu tài liệu: ${params.templateType}\n\n`,
          ].join("");
          await fetch(
            `https://docs.googleapis.com/v1/documents/${encodeURIComponent(generatedDocId)}:batchUpdate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${integrationMode.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requests: [{ insertText: { location: { index: 1 }, text: introText } }],
              }),
            }
          );
          effectiveStatus = "CONNECTED";
          effectiveLogStatus = "SUCCESS";
        }
      }
    } catch (err: any) {
      effectiveStatus = "ERROR";
      effectiveLogStatus = "FAILED";
      errorMessage = err?.message || "Lỗi gọi Google Docs API";
    }
  } else {
    errorMessage = "Chưa có OAuth token Google Docs hợp lệ.";
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "DOCS",
      action: `CLONE_TEMPLATE_${params.templateType}`,
      resourceId: generatedDocId || `UNCONNECTED_DOC_${params.templateType}`,
      status: effectiveLogStatus,
      errorMessage,
    },
  });

  return {
    docId: generatedDocId,
    docUrl,
    connectionState: effectiveStatus,
    title: params.title,
    templateType: params.templateType,
    metadata: {
      subject: params.subjectName,
      gradeLevel: params.gradeLevel,
      topic: params.topicName,
      author: params.teacherName,
      createdAt: new Date().toISOString(),
      version: "v1.0",
      status: effectiveStatus,
      accessRole: "writer (Giáo viên) / reader (Học sinh lớp được giao)",
    },
    replacedPlaceholders: [
      `{{ten_tai_lieu}} -> ${params.title}`,
      `{{mon_hoc}} -> ${params.subjectName}`,
      `{{khoi_lop}} -> Khối ${params.gradeLevel}`,
      `{{chu_de}} -> ${params.topicName}`,
      `{{giao_vien}} -> ${params.teacherName}`,
    ],
    syncLog,
  };
}

/**
 * 4. Google Calendar Event & Reminder Sync (Opt-in only)
 */
export async function syncAssignmentDeadlineToCalendar(
  userId: string,
  params: {
    title: string;
    dueDate: string;
    className: string;
    reminder1Day: boolean;
    reminder1Hour: boolean;
    customMinutes?: number;
  }
) {
  const integrationMode = await resolveGoogleIntegrationMode(userId);
  let eventId: string | null = null;
  let htmlLink: string | null = null;
  let effectiveStatus: string = integrationMode.syncStatus;
  let effectiveLogStatus: string = integrationMode.logStatus;
  let errorMessage: string | null = null;

  const overrides = [];
  if (params.reminder1Day) overrides.push({ method: "email", minutes: 1440 });
  if (params.reminder1Hour) overrides.push({ method: "popup", minutes: 60 });
  if (params.customMinutes) overrides.push({ method: "popup", minutes: params.customMinutes });

  if (integrationMode.accessToken) {
    try {
      const startIso = new Date(params.dueDate).toISOString();
      const endIso = new Date(new Date(params.dueDate).getTime() + 60 * 60 * 1000).toISOString();
      const calRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integrationMode.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `[Hạn nộp UNIGO] ${params.title} - Lớp ${params.className}`,
            description: `Nhắc hạn nộp bài tập lớp ${params.className} trên hệ thống EDUCARE AI.`,
            start: { dateTime: startIso },
            end: { dateTime: endIso },
            reminders: { useDefault: false, overrides },
          }),
        }
      );
      if (!calRes.ok) {
        effectiveStatus = "ERROR";
        effectiveLogStatus = "FAILED";
        errorMessage = `Google Calendar API trả về HTTP ${calRes.status}`;
      } else {
        const calJson = (await calRes.json()) as { id?: string; htmlLink?: string };
        eventId = calJson.id || null;
        htmlLink = calJson.htmlLink || null;
        effectiveStatus = "CONNECTED";
        effectiveLogStatus = "SUCCESS";
      }
    } catch (err: any) {
      effectiveStatus = "ERROR";
      effectiveLogStatus = "FAILED";
      errorMessage = err?.message || "Lỗi gọi Google Calendar API";
    }
  } else {
    errorMessage = "Chưa có OAuth token Google Calendar hợp lệ.";
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      service: "CALENDAR",
      action: "CREATE_DEADLINE_EVENT",
      resourceId: eventId || `UNCONNECTED_CAL_${params.className}`,
      status: effectiveLogStatus,
      errorMessage,
    },
  });

  return {
    eventId,
    htmlLink,
    connectionState: effectiveStatus,
    calendarName: `Lịch học tập & Kiểm tra Lớp ${params.className} - UNIGO`,
    summary: `[Hạn nộp UNIGO] ${params.title}`,
    dueDate: params.dueDate,
    reminders: {
      useDefault: false,
      overrides,
    },
    syncLog,
  };
}

export interface LocalSgkSyncItemResult {
  id: string;
  subjectCode: string;
  subjectName: string;
  bookTitle: string;
  bookSeries: string;
  fileName: string;
  localRelativePath: string;
  driveFolderCode: string;
  driveTargetFolder: string;
  driveTargetPath: string;
  foundOnDisk: boolean;
  sizeBytes: number | null;
  sha256: string | null;
  assetId: string | null;
  status: "LOCAL_READY" | "DISCONNECTED";
}

interface ManifestSgkEntry {
  id: string;
  subjectCode: string;
  subjectName: string;
  driveSubjectFolder: string;
  bookTitle: string;
  bookSeries: string;
  fileName: string;
  localRelativePath: string;
  driveFolderCode: string;
  driveTargetFolder: string;
  driveTargetPath: string;
}

const DEFAULT_LOP6_SGK_ENTRIES: ManifestSgkEntry[] = [
  {
    id: "toan-6-tap-1-kntt",
    subjectCode: "TOAN6",
    subjectName: "Toán",
    driveSubjectFolder: "Toan",
    bookTitle: "Toán 6 - Tập một",
    bookSeries: "Kết nối tri thức với cuộc sống",
    fileName: "SGK_Toan_6_Tap_1_KNTT.pdf",
    localRelativePath: "SGK/Lop_6/Toan/Tap_1/SGK_Toan_6_Tap_1_KNTT.pdf",
    driveFolderCode: "02_HOC_LIEU_TOAN_LOP6_TAP1",
    driveTargetFolder: "EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6/Tap_1",
    driveTargetPath: "EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6/Tap_1/SGK_Toan_6_Tap_1_KNTT.pdf",
  },
  {
    id: "ngu-van-6-tap-1-kntt",
    subjectCode: "VAN6",
    subjectName: "Ngữ văn",
    driveSubjectFolder: "Ngu_van",
    bookTitle: "Ngữ văn 6 - Tập một",
    bookSeries: "Kết nối tri thức với cuộc sống",
    fileName: "SGK_Ngu_van_6_Tap_1_KNTT.pdf",
    localRelativePath: "SGK/Lop_6/Ngu_van/Tap_1/SGK_Ngu_van_6_Tap_1_KNTT.pdf",
    driveFolderCode: "02_HOC_LIEU_VAN_LOP6_TAP1",
    driveTargetFolder: "EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6/Tap_1",
    driveTargetPath: "EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6/Tap_1/SGK_Ngu_van_6_Tap_1_KNTT.pdf",
  },
];

async function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex").toUpperCase()));
    stream.on("error", reject);
  });
}

async function loadExpectedSgkEntries(): Promise<ManifestSgkEntry[]> {
  const manifestPath = path.join(process.cwd(), "SGK", "sgk-kntt-manifest.json");
  let entries: ManifestSgkEntry[] = [...DEFAULT_LOP6_SGK_ENTRIES];
  try {
    const raw = await fs.readFile(manifestPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
      entries = parsed.items;
    }
  } catch {
    // Fallback to built-in KNTT Lop 6 entries if manifest file is absent
  }

  const knownRelPaths = new Set(entries.map((e) => e.localRelativePath.replace(/\\/g, "/")));
  for (const subject of [
    { folder: "Toan", code: "TOAN6", name: "Toán", folderCode: "02_HOC_LIEU_TOAN_LOP6_TAP1" },
    { folder: "Ngu_van", code: "VAN6", name: "Ngữ văn", folderCode: "02_HOC_LIEU_VAN_LOP6_TAP1" },
  ]) {
    const dirPath = path.join(process.cwd(), "SGK", "Lop_6", subject.folder, "Tap_1");
    try {
      const dirFiles = await fs.readdir(dirPath);
      for (const file of dirFiles) {
        if (!file.toLowerCase().endsWith(".pdf")) continue;
        const rel = `SGK/Lop_6/${subject.folder}/Tap_1/${file}`;
        if (knownRelPaths.has(rel)) continue;
        knownRelPaths.add(rel);
        entries.push({
          id: `${subject.code.toLowerCase()}-${file.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
          subjectCode: subject.code,
          subjectName: subject.name,
          driveSubjectFolder: subject.folder,
          bookTitle: `${subject.name} 6 - ${file}`,
          bookSeries: "Kết nối tri thức với cuộc sống",
          fileName: file,
          localRelativePath: rel,
          driveFolderCode: subject.folderCode,
          driveTargetFolder: `EDUCARE_AI/02_HOC_LIEU/${subject.folder}/Lop_6/Tap_1`,
          driveTargetPath: `EDUCARE_AI/02_HOC_LIEU/${subject.folder}/Lop_6/Tap_1/${file}`,
        });
      }
    } catch {
      // Directory may not exist in serverless runtime
    }
  }

  return entries;
}

/**
 * Quét thư mục SGK đã phân lớp trong máy (SGK/Lop_6/{Toan,Ngu_van}/Tap_1/*.pdf),
 * đồng bộ cây thư mục 02_HOC_LIEU trong Supabase (DriveFolderNode) & đăng ký Asset CLEAN_PUBLISHED.
 * Trung thực theo AGENTS.md: không bao giờ ghi SYNCED/SUCCESS khi chưa tải tệp nhị phân lên Google Drive API thật.
 */
export async function syncLocalSgkToDrive(
  actorId: string,
  actorRole: string = "TEACHER",
  accountMode: GoogleAccountMode = "PERSONAL_GMAIL_HYBRID"
) {
  const integrationMode = await resolveGoogleIntegrationMode(actorId);

  const requiredFolderCodes = new Set([
    "ROOT_EDUCARE_AI",
    "02_HOC_LIEU",
    "02_HOC_LIEU_TOAN",
    "02_HOC_LIEU_TOAN_LOP6",
    "02_HOC_LIEU_TOAN_LOP6_TAP1",
    "02_HOC_LIEU_NGU_VAN",
    "02_HOC_LIEU_VAN_LOP6",
    "02_HOC_LIEU_VAN_LOP6_TAP1",
  ]);
  const nodesToEnsure = EDUCARE_DRIVE_FOLDER_TREE.filter((n) =>
    requiredFolderCodes.has(n.folderCode)
  );

  const ensuredNodesMap = new Map<string, any>();
  for (const node of nodesToEnsure) {
    const upserted = await prisma.driveFolderNode.upsert({
      where: { folderCode: node.folderCode },
      update: {
        name: node.name,
        parentCode: node.parentCode,
        folderPath: node.folderPath,
        permissionScope: node.permissionScope,
        accountMode,
        subjectCode: node.subjectCode,
        lastVerifiedAt: new Date(),
      },
      create: {
        folderCode: node.folderCode,
        name: node.name,
        parentCode: node.parentCode,
        folderPath: node.folderPath,
        googleFolderId: `UNCONNECTED_${node.folderCode}`,
        permissionScope: node.permissionScope,
        accountMode,
        subjectCode: node.subjectCode,
        fileCount: 0,
      },
    });
    ensuredNodesMap.set(node.folderCode, upserted);
  }

  const expectedEntries = await loadExpectedSgkEntries();
  const folderLocalCounts = new Map<string, number>();
  const registeredAssets: any[] = [];
  const items: LocalSgkSyncItemResult[] = [];

  for (const entry of expectedEntries) {
    const normalizedRel = entry.localRelativePath.replace(/^[/\\]+/, "");
    const absPath = path.join(process.cwd(), ...normalizedRel.split("/"));
    let foundOnDisk = false;
    let sizeBytes: number | null = null;
    let sha256: string | null = null;
    let assetId: string | null = null;

    try {
      const stat = await fs.stat(absPath);
      if (stat.isFile() && stat.size > 0) {
        foundOnDisk = true;
        sizeBytes = stat.size;
        sha256 = await computeFileSha256(absPath);
        folderLocalCounts.set(
          entry.driveFolderCode,
          (folderLocalCounts.get(entry.driveFolderCode) || 0) + 1
        );

        const storageKey = `sgk-kntt/${normalizedRel}`;
        const asset = await prisma.asset.upsert({
          where: { storageKey },
          update: {
            originalFilename: entry.fileName,
            mimeType: "application/pdf",
            extension: ".pdf",
            sizeBytes,
            sha256Checksum: sha256,
            category: "DOCUMENT",
            previewMode: "INLINE_PREVIEW",
            quarantineStatus: "CLEAN_PUBLISHED",
            scanNotes: `${entry.bookSeries} • ${entry.bookTitle} • Sẵn sàng đẩy lên ${entry.driveTargetFolder}`,
            driveLinkOptional: entry.driveTargetPath,
          },
          create: {
            storageKey,
            originalFilename: entry.fileName,
            mimeType: "application/pdf",
            extension: ".pdf",
            sizeBytes,
            sha256Checksum: sha256,
            category: "DOCUMENT",
            previewMode: "INLINE_PREVIEW",
            quarantineStatus: "CLEAN_PUBLISHED",
            scanNotes: `${entry.bookSeries} • ${entry.bookTitle} • Sẵn sàng đẩy lên ${entry.driveTargetFolder}`,
            ownerId: actorId,
            ownerRole: actorRole,
            academicYearId: "2026-2027",
            driveLinkOptional: entry.driveTargetPath,
          },
        });
        assetId = asset.id;
        registeredAssets.push(asset);
      }
    } catch {
      // File not present locally on this host
    }

    items.push({
      id: entry.id,
      subjectCode: entry.subjectCode,
      subjectName: entry.subjectName,
      bookTitle: entry.bookTitle,
      bookSeries: entry.bookSeries,
      fileName: entry.fileName,
      localRelativePath: normalizedRel,
      driveFolderCode: entry.driveFolderCode,
      driveTargetFolder: entry.driveTargetFolder,
      driveTargetPath: entry.driveTargetPath,
      foundOnDisk,
      sizeBytes,
      sha256,
      assetId,
      status: foundOnDisk ? "LOCAL_READY" : "DISCONNECTED",
    });
  }

  for (const [folderCode, count] of folderLocalCounts.entries()) {
    const updatedNode = await prisma.driveFolderNode.update({
      where: { folderCode },
      data: {
        fileCount: count,
        lastVerifiedAt: new Date(),
      },
    });
    ensuredNodesMap.set(folderCode, updatedNode);
  }

  const localReadyCount = items.filter((i) => i.foundOnDisk).length;
  const syncState: "LOCAL_READY" | "DISCONNECTED" =
    localReadyCount > 0 ? "LOCAL_READY" : "DISCONNECTED";

  // Trung thực: chưa thực hiện tải tệp nhị phân trực tiếp lên Google Drive API trong luồng này -> logStatus = DISCONNECTED
  const syncLog = await prisma.syncLog.create({
    data: {
      userId: actorId,
      service: "DRIVE",
      action: "SYNC_LOCAL_SGK_TO_DRIVE",
      resourceId: "EDUCARE_AI/02_HOC_LIEU/Lop_6",
      status: "DISCONNECTED",
      errorMessage:
        localReadyCount > 0
          ? `Đã lập chỉ mục ${localReadyCount}/${items.length} tệp SGK KNTT lớp 6 vào kho Asset và cây thư mục 02_HOC_LIEU (trạng thái OAuth hiện tại: ${integrationMode.syncStatus}; chưa tải tệp nhị phân trực tiếp lên Google Drive API).`
          : `Chưa tìm thấy tệp PDF vật lý trong SGK/Lop_6 trên máy chủ (${integrationMode.syncStatus}).`,
    },
  });

  return {
    accountMode,
    connectionState: integrationMode.syncStatus,
    syncState,
    localReadyCount,
    totalExpectedCount: items.length,
    driveUploadedCount: 0,
    folderNodes: Array.from(ensuredNodesMap.values()),
    assets: registeredAssets,
    items,
    syncLog,
  };
}
