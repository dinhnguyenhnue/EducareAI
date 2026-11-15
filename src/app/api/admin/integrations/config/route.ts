import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveGeminiServerConfig,
  getEffectiveGoogleOAuthConfig,
  getSafeBaseUrl,
  SYSTEM_GEMINI_API_SLOT_CODE,
  SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE,
} from "@/lib/google-workspace";
import {
  encryptSecret,
  hasServerEncryptionKey,
  maskIdentifierPreview,
} from "@/lib/secret-crypto";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);

async function requireAdminSession() {
  const session = await getServerSession();
  if (!session) {
    return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }), session: null };
  }
  if (!ADMIN_ROLES.has(session.role)) {
    return {
      error: NextResponse.json(
        { error: "FORBIDDEN: Chỉ quản trị viên mới được cấu hình tích hợp hệ thống." },
        { status: 403 }
      ),
      session: null,
    };
  }
  return { error: null, session };
}

function safeParseJson(raw?: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const { error, session } = await requireAdminSession();
  if (error || !session) return error!;

  const baseUrl = getSafeBaseUrl(req.url);
  const [oauth, gemini, userConn, wsSlot, geminiSlot] = await Promise.all([
    getEffectiveGoogleOAuthConfig(baseUrl),
    getEffectiveGeminiServerConfig(),
    prisma.googleConnection.findUnique({
      where: { userId: session.user.id },
      select: { googleEmail: true, status: true, scopesGranted: true, lastSyncAt: true },
    }),
    prisma.integrationSlot.findUnique({ where: { code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE } }),
    prisma.integrationSlot.findUnique({ where: { code: SYSTEM_GEMINI_API_SLOT_CODE } }),
  ]);

  const wsJson = safeParseJson(wsSlot?.configJson);
  const geminiJson = safeParseJson(geminiSlot?.configJson);

  return NextResponse.json({
    hasEncryptionKey: hasServerEncryptionKey(),
    googleWorkspace: {
      isConfigured: oauth.isConfigured,
      source: oauth.source,
      accountMode: oauth.accountMode,
      clientId: typeof wsJson.clientId === "string" ? wsJson.clientId : "",
      clientIdPreview: maskIdentifierPreview(oauth.clientId),
      hasClientSecret: Boolean(oauth.clientSecret),
      hasDbEncryptedSecret: Boolean(wsJson.clientSecretEncrypted),
      redirectUri: oauth.redirectUri,
      oauthStatus: userConn?.status || "NOT_CONNECTED",
      connectedGoogleEmail: userConn?.googleEmail || null,
      lastSyncAt: userConn?.lastSyncAt || null,
    },
    geminiServer: {
      isConfigured: gemini.isConfigured,
      source: gemini.source,
      modelName: gemini.modelName,
      hasApiKey: Boolean(gemini.apiKey),
      hasDbEncryptedApiKey: Boolean(geminiJson.apiKeyEncrypted),
    },
  });
}

export async function POST(req: Request) {
  const { error, session } = await requireAdminSession();
  if (error || !session) return error!;

  try {
    const body = await req.json();
    const target = String(body?.target || "").toUpperCase();

    if (target === "GOOGLE_WORKSPACE") {
      const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
      const clientSecret = typeof body.clientSecret === "string" ? body.clientSecret.trim() : "";
      const accountMode =
        body.accountMode === "WORKSPACE_DOMAIN" ? "WORKSPACE_DOMAIN" : "PERSONAL_GMAIL_HYBRID";

      if (clientSecret && !hasServerEncryptionKey()) {
        return NextResponse.json(
          {
            errorCode: "ENCRYPTION_KEY_MISSING",
            error:
              "Chưa cấu hình APP_ENCRYPTION_KEY trên server. Không thể lưu Client Secret dạng mã hóa an toàn.",
          },
          { status: 400 }
        );
      }

      const existing = await prisma.integrationSlot.findUnique({
        where: { code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE },
      });
      const prevJson = safeParseJson(existing?.configJson);

      const nextJson: Record<string, any> = {
        ...prevJson,
        accountMode,
        clientId: clientId || prevJson.clientId || "",
        updatedBy: session.user.email,
      };

      if (clientSecret) {
        nextJson.clientSecretEncrypted = encryptSecret(clientSecret);
        nextJson.secretUpdatedAt = new Date().toISOString();
      }

      const hasReadyConfig = Boolean(nextJson.clientId && nextJson.clientSecretEncrypted);

      await prisma.integrationSlot.upsert({
        where: { code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE },
        update: {
          configJson: JSON.stringify(nextJson),
          secretRef: nextJson.clientSecretEncrypted ? "AES_256_GCM_ENCRYPTED" : null,
          status: hasReadyConfig ? "CONFIGURED" : "PENDING_SECRET",
        },
        create: {
          code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE,
          name: "Google Workspace OAuth System Config",
          kind: "WORKSPACE_OAUTH",
          contextKey: "SYSTEM_ADMIN",
          provider: "GOOGLE_WORKSPACE",
          fallbackPrompt: "",
          configJson: JSON.stringify(nextJson),
          secretRef: nextJson.clientSecretEncrypted ? "AES_256_GCM_ENCRYPTED" : null,
          status: hasReadyConfig ? "CONFIGURED" : "PENDING_SECRET",
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "UPDATE_GOOGLE_WORKSPACE_CONFIG",
          resource: "INTEGRATION_SLOT:SYSTEM_GOOGLE_WORKSPACE",
          status: "SUCCESS",
          details: JSON.stringify({
            accountMode,
            hasClientId: Boolean(nextJson.clientId),
            updatedClientSecret: Boolean(clientSecret),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã lưu cấu hình Google Workspace OAuth an toàn.",
      });
    }

    if (target === "GEMINI_API") {
      const modelName =
        typeof body.modelName === "string" && body.modelName.trim()
          ? body.modelName.trim()
          : "gemini-2.5-flash";
      const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

      if (apiKey && !hasServerEncryptionKey()) {
        return NextResponse.json(
          {
            errorCode: "ENCRYPTION_KEY_MISSING",
            error:
              "Chưa cấu hình APP_ENCRYPTION_KEY trên server. Không thể lưu Gemini API Key dạng mã hóa an toàn.",
          },
          { status: 400 }
        );
      }

      if (apiKey && apiKey.length < 16) {
        return NextResponse.json(
          { error: "Gemini API Key không hợp lệ (quá ngắn)." },
          { status: 400 }
        );
      }

      const existing = await prisma.integrationSlot.findUnique({
        where: { code: SYSTEM_GEMINI_API_SLOT_CODE },
      });
      const prevJson = safeParseJson(existing?.configJson);

      const nextJson: Record<string, any> = {
        ...prevJson,
        modelName,
        updatedBy: session.user.email,
      };
      if (apiKey) {
        nextJson.apiKeyEncrypted = encryptSecret(apiKey);
        nextJson.secretUpdatedAt = new Date().toISOString();
      }

      await prisma.integrationSlot.upsert({
        where: { code: SYSTEM_GEMINI_API_SLOT_CODE },
        update: {
          configJson: JSON.stringify(nextJson),
          secretRef: nextJson.apiKeyEncrypted ? "AES_256_GCM_ENCRYPTED" : null,
          status: nextJson.apiKeyEncrypted ? "CONFIGURED" : "PENDING_SECRET",
        },
        create: {
          code: SYSTEM_GEMINI_API_SLOT_CODE,
          name: "Gemini Server API Config",
          kind: "GEMINI_API",
          contextKey: "SYSTEM_ADMIN",
          provider: "GEMINI",
          fallbackPrompt: "",
          configJson: JSON.stringify(nextJson),
          secretRef: nextJson.apiKeyEncrypted ? "AES_256_GCM_ENCRYPTED" : null,
          status: nextJson.apiKeyEncrypted ? "CONFIGURED" : "PENDING_SECRET",
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "UPDATE_GEMINI_SERVER_CONFIG",
          resource: "INTEGRATION_SLOT:SYSTEM_GEMINI_API",
          status: "SUCCESS",
          details: JSON.stringify({
            modelName,
            updatedApiKey: Boolean(apiKey),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã lưu cấu hình Gemini Server API an toàn.",
      });
    }

    return NextResponse.json({ error: "target không hợp lệ." }, { status: 400 });
  } catch (err: any) {
    console.error("[ADMIN_INTEGRATION_CONFIG_POST_ERROR]", err?.message || err);
    return NextResponse.json(
      { error: "Không thể lưu cấu hình tích hợp. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { error, session } = await requireAdminSession();
  if (error || !session) return error!;

  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("target") || "").toUpperCase();

  if (target === "GOOGLE_WORKSPACE") {
    await prisma.integrationSlot.deleteMany({
      where: { code: SYSTEM_GOOGLE_WORKSPACE_SLOT_CODE },
    });
  } else if (target === "GEMINI_API") {
    await prisma.integrationSlot.deleteMany({
      where: { code: SYSTEM_GEMINI_API_SLOT_CODE },
    });
  } else if (target === "GOOGLE_OAUTH_CONNECTION") {
    await prisma.googleConnection.deleteMany({
      where: { userId: session.user.id },
    });
  } else {
    return NextResponse.json({ error: "target không hợp lệ." }, { status: 400 });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.role,
      action: `DELETE_INTEGRATION_CONFIG_${target}`,
      resource: "INTEGRATION_CONFIG",
      status: "SUCCESS",
    },
  });

  return NextResponse.json({ success: true, message: `Đã xóa cấu hình ${target}.` });
}
