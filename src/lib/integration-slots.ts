import { prisma } from "@/lib/prisma";

export type IntegrationSlotCode =
  | "LESSON_HINT"
  | "ASSIGNMENT_EXPLAIN"
  | "GAME_CREATOR"
  | "TEACHER_ASSISTANT"
  | "ANALYTICS_INSIGHT"
  | "GEM_TIN7"
  | "GEM_TOAN7"
  | "GEM_VAN7"
  | "GEM_TIN6";

export type IntegrationSlotProvider =
  | "GEMINI_API"
  | "EXTERNAL_GEM_LINK"
  | "MANUAL_PROMPT";

export type IntegrationSlotStatus = "DISCONNECTED" | "CONFIGURED" | "DISABLED";

export interface IntegrationSlotRecord {
  slotCode: IntegrationSlotCode;
  title: string;
  description: string;
  subject: string;
  grade: number | null;
  providerType: IntegrationSlotProvider;
  status: IntegrationSlotStatus;
  externalUrl: string | null;
  fallbackPrompt: string;
  lastVerifiedAt: string | null;
}

const GENERIC_PLACEHOLDER_URLS = new Set([
  "https://gemini.google.com",
  "https://gemini.google.com/",
  "https://gemini.google.com/app",
  "https://gemini.google.com/gems",
  "https://gemini.google.com/gems/",
  "https://gemini.google.com/gem/tin-hoc-sang-tao-unigo",
]);

/**
 * Checks whether an external Gem URL is a real, non-generic URL configured by an administrator.
 * Generic homepage URLs (`https://gemini.google.com/gems`) or unverified demo placeholders return false.
 */
export function isVerifiedExternalGemUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (GENERIC_PLACEHOLDER_URLS.has(trimmed.toLowerCase())) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    if (
      parsed.hostname === "gemini.google.com" &&
      (parsed.pathname === "/" ||
        parsed.pathname === "/app" ||
        parsed.pathname === "/gems" ||
        parsed.pathname === "/gems/")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_INTEGRATION_SLOTS: IntegrationSlotRecord[] = [
  {
    slotCode: "LESSON_HINT",
    title: "Gợi ý bài học Socratic",
    description:
      "Đặt câu hỏi gợi mở theo từng mục bài giảng mà không giải hộ đáp án trực tiếp.",
    subject: "Đa môn",
    grade: 7,
    providerType: "MANUAL_PROMPT",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Bạn là Gia sư Socratic trường THCS UNIGO. Em đang đọc bài học [TÊN_BÀI_HỌC], phần [MỤC_KIẾN_THỨC]. Hãy đặt 2 câu hỏi gợi mở gắn với ví dụ thực tế để em tự rút ra quy tắc chính, tuyệt đối không chép nguyên văn lời giải.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "ASSIGNMENT_EXPLAIN",
    title: "Giải thích yêu cầu bài tập & Rubric",
    description:
      "Phân tích đề bài, tiêu chí chấm điểm và gợi ý các bước kiểm tra trước khi nộp bài.",
    subject: "Đa môn",
    grade: 7,
    providerType: "MANUAL_PROMPT",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Em cần hoàn thành bài tập sau: [ĐỀ_BÀI]. Hãy giúp em tóm tắt 3 yêu cầu quan trọng nhất và lập danh sách tự kiểm tra (checklist) trước khi nộp bài mà không làm bài thay em.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "GAME_CREATOR",
    title: "Trợ lý Thiết kế Trò chơi HTML (Gem Tin học Sáng tạo)",
    description:
      "Hỗ trợ tạo câu hỏi trắc nghiệm và khung trò chơi HTML 1 tệp tự chứa chạy trong Sandbox cô lập.",
    subject: "Tin học",
    grade: 7,
    providerType: "MANUAL_PROMPT",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Em là học sinh lớp 7 học bài [BÀI_HỌC]. Dựa trên kiến thức SGK: [NGUỒN_KIẾN_THỨC], hãy giúp em thiết kế 1 tệp HTML duy nhất (inline CSS/JS, không dùng thư viện ngoài, không gọi mạng) gồm 5 câu hỏi ôn tập có giải thích vì sao đúng/sai.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "TEACHER_ASSISTANT",
    title: "Trợ lý Soạn câu hỏi & Nhận xét Sư phạm (Giáo viên)",
    description:
      "Hỗ trợ giáo viên sinh câu hỏi nháp theo mức độ nhận thức và gợi ý nhận xét bài nộp.",
    subject: "Đa môn",
    grade: null,
    providerType: "MANUAL_PROMPT",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Tôi là giáo viên THCS môn [MÔN_HỌC] khối [KHỐI]. Hãy soạn 5 câu hỏi trắc nghiệm 4 lựa chọn cho bài [TÊN_BÀI] phân bổ theo mức độ Nhận biết - Thông hiểu - Vận dụng, kèm đáp án đúng và giải thích ngắn gọn.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "ANALYTICS_INSIGHT",
    title: "Phân tích Tiến độ & Gợi ý Ôn tập",
    description:
      "Tổng hợp điểm mạnh và chủ đề cần ôn lại từ các lượt làm bài đã xác thực.",
    subject: "Đa môn",
    grade: null,
    providerType: "MANUAL_PROMPT",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Dựa trên kết quả các lượt làm bài của học sinh ở chủ đề [CHỦ_ĐỀ] với các câu sai thuộc mục [MỤC_TIÊU], hãy gợi ý 3 hành động ôn tập ngắn gọn trong 15 phút.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "GEM_TIN7",
    title: "Gem Tin học 7 — UNIGO Assistant",
    description:
      "Trợ lý chuyên sâu về bảng tính điện tử, thuật toán tìm kiếm/sắp xếp và an toàn thông tin số.",
    subject: "Tin học",
    grade: 7,
    providerType: "EXTERNAL_GEM_LINK",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Bạn là trợ lý học tập môn Tin học 7 trường UNIGO. Hãy hướng dẫn em từng bước tìm hiểu chủ đề [TÊN_BÀI_TIN_7] bằng câu hỏi gợi mở, kiểm tra công thức bảng tính hoặc từng bước chạy thuật toán mà không đưa lời giải chép sẵn.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "GEM_TOAN7",
    title: "Gem Toán 7 — Logic & Tỉ lệ thức",
    description:
      "Hỗ trợ phân tích bài toán thực tế, kiểm tra cách giải từng bước mà không đưa đáp án ngay.",
    subject: "Toán học",
    grade: 7,
    providerType: "EXTERNAL_GEM_LINK",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Bạn là gia sư Toán 7 trường UNIGO. Em đang giải bài toán về [CHỦ_ĐỀ_TOÁN_7]: [ĐỀ_BÀI]. Hãy hỏi em giả thiết đề bài cho gì, kết luận cần tìm gì và gợi ý định lý/tính chất áp dụng cho bước đầu tiên.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "GEM_VAN7",
    title: "Gem Ngữ văn 7 — Phản biện & Nghị luận",
    description:
      "Gợi ý cấu trúc dàn ý, cách mở rộng góc nhìn và kiểm tra dẫn chứng văn bản.",
    subject: "Ngữ văn",
    grade: 7,
    providerType: "EXTERNAL_GEM_LINK",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Bạn là cố vấn môn Ngữ văn 7 trường UNIGO. Em đang lập dàn ý cho đề bài: [ĐỀ_VĂN_7]. Hãy gợi ý cho em cấu trúc Mở bài - Thân bài - Kết bài và đặt 2 câu hỏi để em tự tìm dẫn chứng phù hợp.",
    lastVerifiedAt: null,
  },
  {
    slotCode: "GEM_TIN6",
    title: "Gem Tin học 6 — Khởi đầu Kỷ nguyên số",
    description:
      "Giải thích khái niệm thông tin, dữ liệu, mạng máy tính và an toàn số bằng ngôn ngữ trực quan.",
    subject: "Tin học",
    grade: 6,
    providerType: "EXTERNAL_GEM_LINK",
    status: "DISCONNECTED",
    externalUrl: null,
    fallbackPrompt:
      "Bạn là trợ lý môn Tin học 6 trường UNIGO. Hãy giải thích khái niệm [KHÁI_NIỆM_TIN_6] bằng một ví dụ gần gũi trong lớp học và đặt 1 câu hỏi kiểm tra mức độ hiểu bài của em.",
    lastVerifiedAt: null,
  },
];

export async function getResolvedIntegrationSlots(
  classScope?: string | null
): Promise<IntegrationSlotRecord[]> {
  const hasGeminiApiKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );

  let dbSlots: Array<{
    code: string;
    name: string;
    kind: string;
    provider: string;
    status: string;
    externalUrl: string | null;
    fallbackPrompt: string;
    configJson: string;
    lastCheckedAt: Date | null;
  }> = [];

  try {
    dbSlots = await prisma.integrationSlot.findMany({
      where: classScope
        ? { OR: [{ classScope }, { classScope: null }] }
        : {},
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    dbSlots = [];
  }

  const dbByCode = new Map(dbSlots.map((s) => [s.code, s]));

  return DEFAULT_INTEGRATION_SLOTS.map((def) => {
    const override = dbByCode.get(def.slotCode);
    if (!override) {
      if (hasGeminiApiKey && def.providerType !== "EXTERNAL_GEM_LINK") {
        return {
          ...def,
          providerType: "GEMINI_API",
          status: "CONFIGURED",
        };
      }
      return def;
    }

    const validExternalUrl = isVerifiedExternalGemUrl(override.externalUrl)
      ? override.externalUrl!.trim()
      : null;

    let resolvedStatus: IntegrationSlotStatus = "DISCONNECTED";
    if (override.status === "DISABLED") {
      resolvedStatus = "DISABLED";
    } else if (
      (override.kind === "GEM_LINK" || override.provider === "EXTERNAL_GEM_LINK") &&
      validExternalUrl &&
      (override.status === "CONFIGURED" || override.status === "HEALTHY")
    ) {
      resolvedStatus = "CONFIGURED";
    } else if (
      (override.kind === "AGENT_API" || override.provider === "GEMINI_API") &&
      hasGeminiApiKey &&
      (override.status === "CONFIGURED" || override.status === "HEALTHY")
    ) {
      resolvedStatus = "CONFIGURED";
    }

    let description = def.description;
    try {
      const cfg = JSON.parse(override.configJson || "{}");
      if (typeof cfg.description === "string" && cfg.description.trim()) {
        description = cfg.description.trim();
      }
    } catch {
      // ignore invalid json
    }

    return {
      slotCode: def.slotCode,
      title: override.name || def.title,
      description,
      subject: def.subject,
      grade: def.grade,
      providerType:
        override.kind === "AGENT_API"
          ? "GEMINI_API"
          : override.kind === "GEM_LINK"
          ? "EXTERNAL_GEM_LINK"
          : def.providerType,
      status: resolvedStatus,
      externalUrl: resolvedStatus === "CONFIGURED" ? validExternalUrl : null,
      fallbackPrompt: override.fallbackPrompt || def.fallbackPrompt,
      lastVerifiedAt: override.lastCheckedAt
        ? override.lastCheckedAt.toISOString()
        : null,
    };
  });
}
