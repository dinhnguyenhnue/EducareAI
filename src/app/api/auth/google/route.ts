import { NextResponse } from "next/server";
import { buildGoogleOAuthUrl, getGoogleOAuthConfig } from "@/lib/google-workspace";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const purpose = searchParams.get("purpose") || "signin"; // "signin" | "workspace"
  const scopesParam = searchParams.get("services");
  const callbackUrl = searchParams.get("callbackUrl") || "";

  // Separate basic Google Sign-In (openid, email, profile) from incremental Google Workspace APIs
  const selectedServices =
    purpose === "signin"
      ? []
      : scopesParam
        ? scopesParam.split(",")
        : ["DRIVE", "DOCS", "SHEETS", "CLASSROOM", "CALENDAR"];

  const config = getGoogleOAuthConfig();
  const statePayload = JSON.stringify({ purpose, callbackUrl });
  const encodedState = Buffer.from(statePayload).toString("base64url");
  const oauthUrl = buildGoogleOAuthUrl(selectedServices, encodedState);

  return NextResponse.json({
    isConfigured: config.isConfigured,
    clientIdPreview: config.clientId
      ? `${config.clientId.slice(0, 12)}...`
      : "Chưa cấu hình trong .env",
    redirectUri: config.redirectUri,
    purpose,
    oauthUrl: config.isConfigured ? oauthUrl : null,
    selectedServices,
    missingEnvVars: config.isConfigured
      ? []
      : [
        !config.clientId ? "GOOGLE_CLIENT_ID" : null,
        !config.clientSecret ? "GOOGLE_CLIENT_SECRET" : null,
      ].filter(Boolean),
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập trước khi cấu hình Google Workspace." },
        { status: 401 }
      );
    }

    const config = getGoogleOAuthConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          error: "OAUTH_NOT_CONFIGURED",
          message:
            "Chưa cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env. Không thể cấp token Google Workspace thực tế.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { googleEmail, scopes } = body;

    const connection = await prisma.googleConnection.upsert({
      where: { userId: session.user.id },
      update: {
        googleEmail: googleEmail || session.user.email,
        scopesGranted: JSON.stringify(scopes || ["openid", "email", "profile"]),
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
      create: {
        userId: session.user.id,
        googleEmail: googleEmail || session.user.email,
        scopesGranted: JSON.stringify(scopes || ["openid", "email", "profile"]),
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });

    await prisma.syncLog.create({
      data: {
        userId: session.user.id,
        service: "OAUTH",
        action: "AUTHORIZE_INCREMENTAL_SCOPES",
        resourceId: connection.googleEmail,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ success: true, connection });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    await prisma.googleConnection.updateMany({
      where: { userId: session.user.id },
      data: {
        status: "REVOKED",
        scopesGranted: JSON.stringify([]),
      },
    });

    await prisma.syncLog.create({
      data: {
        userId: session.user.id,
        service: "OAUTH",
        action: "REVOKE_TOKEN_ACCESS",
        resourceId: session.user.email,
        status: "SUCCESS",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.role,
        action: "GOOGLE_WORKSPACE_TOKEN_REVOKED",
        resource: "GOOGLE_WORKSPACE",
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã thu hồi quyền truy cập Google Workspace APIs và xóa token khỏi hệ thống.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
