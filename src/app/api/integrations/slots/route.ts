import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTEGRATION_SLOTS,
  getResolvedIntegrationSlots,
  isVerifiedExternalGemUrl,
} from "@/lib/integration-slots";

export async function GET() {
  const slots = await getResolvedIntegrationSlots();
  return NextResponse.json({ slots });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const isAdminOrTeacher =
    session.role === "SUPER_ADMIN" ||
    session.role === "SCHOOL_ADMIN" ||
    session.role === "TEACHER";

  if (!isAdminOrTeacher) {
    return NextResponse.json(
      { error: "FORBIDDEN: Chỉ Quản trị viên hoặc Giáo viên được cấu hình cổng tích hợp AI/Gem." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const slotCode = String(body.slotCode || "").trim();
  const defaultSlot = DEFAULT_INTEGRATION_SLOTS.find((s) => s.slotCode === slotCode);
  if (!defaultSlot) {
    return NextResponse.json(
      { error: `Slot tích hợp không hợp lệ: ${slotCode}` },
      { status: 400 }
    );
  }

  const providerType = String(body.providerType || defaultSlot.providerType);
  const requestedStatus = String(body.status || "DISCONNECTED");
  const rawExternalUrl = body.externalUrl ? String(body.externalUrl).trim() : null;
  const fallbackPrompt = body.fallbackPrompt
    ? String(body.fallbackPrompt).trim()
    : defaultSlot.fallbackPrompt;

  if (
    providerType === "EXTERNAL_GEM_LINK" &&
    requestedStatus === "CONFIGURED" &&
    !isVerifiedExternalGemUrl(rawExternalUrl)
  ) {
    return NextResponse.json(
      {
        error:
          "INVALID_GEM_URL: Liên kết Gem không hợp lệ hoặc chỉ trỏ về trang chủ chung (https://gemini.google.com/gems). Vui lòng nhập URL Gem cụ thể đã được tạo và kiểm duyệt.",
      },
      { status: 400 }
    );
  }

  const resolvedStatus =
    requestedStatus === "DISABLED"
      ? "DISABLED"
      : providerType === "EXTERNAL_GEM_LINK" && isVerifiedExternalGemUrl(rawExternalUrl)
      ? "CONFIGURED"
      : providerType === "GEMINI_API" && Boolean(process.env.GEMINI_API_KEY)
      ? "CONFIGURED"
      : "DISCONNECTED";

  const kind = providerType === "GEMINI_API" ? "AGENT_API" : "GEM_LINK";
  const configJson = JSON.stringify({
    description: body.description
      ? String(body.description).trim()
      : defaultSlot.description,
    verifiedById: resolvedStatus === "CONFIGURED" ? session.user.id : null,
  });

  const saved = await prisma.integrationSlot.upsert({
    where: { code: slotCode },
    update: {
      name: body.title ? String(body.title).trim() : defaultSlot.title,
      kind,
      provider: providerType,
      status: resolvedStatus,
      externalUrl: isVerifiedExternalGemUrl(rawExternalUrl)
        ? rawExternalUrl
        : null,
      fallbackPrompt,
      configJson,
      lastCheckedAt: resolvedStatus === "CONFIGURED" ? new Date() : null,
    },
    create: {
      code: slotCode,
      name: body.title ? String(body.title).trim() : defaultSlot.title,
      kind,
      contextKey: slotCode,
      subjectCode: defaultSlot.subject,
      gradeLevel: defaultSlot.grade,
      provider: providerType,
      status: resolvedStatus,
      externalUrl: isVerifiedExternalGemUrl(rawExternalUrl)
        ? rawExternalUrl
        : null,
      fallbackPrompt,
      configJson,
      lastCheckedAt: resolvedStatus === "CONFIGURED" ? new Date() : null,
    },
  });

  const slots = await getResolvedIntegrationSlots();
  return NextResponse.json({ saved, slots });
}
