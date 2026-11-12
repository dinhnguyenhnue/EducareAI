import { NextResponse } from "next/server";
import crypto from "crypto";
import { buildGoogleOAuthUrl, getGoogleOAuthConfig, getSafeBaseUrl } from "@/lib/google-workspace";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const purpose = searchParams.get("purpose") || "signin"; // "signin" | "workspace"
  const scopesParam = searchParams.get("services");
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const selectedServices =
    purpose === "signin"
      ? []
      : scopesParam
        ? scopesParam.split(",")
        : ["DRIVE", "DOCS", "SHEETS", "CLASSROOM", "CALENDAR"];

  const reqBaseUrl = getSafeBaseUrl(req.url);
  const config = getGoogleOAuthConfig(reqBaseUrl);
  const stateNonce = crypto.randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ purpose, callbackUrl, baseUrl: reqBaseUrl, nonce: stateNonce });
  const encodedState = Buffer.from(statePayload).toString("base64url");
  const oauthUrl = config.isConfigured
    ? buildGoogleOAuthUrl(selectedServices, encodedState, reqBaseUrl)
    : null;

  return NextResponse.json({
    isConfigured: config.isConfigured,
    oauthUrl,
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập trước khi cấu hình dịch vụ." },
        { status: 401 }
      );
    }

    const config = getGoogleOAuthConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          error: "Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
        },
        { status: 503 }
      );
    }

    const { action, services } = await req.json();

    if (action === "DISCONNECT") {
      await prisma.googleConnection.deleteMany({
        where: { userId: session.user.id },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.user.role,
          action: "GOOGLE_WORKSPACE_DISCONNECTED",
          resource: "GOOGLE_INTEGRATION",
          status: "SUCCESS",
        },
      });

      return NextResponse.json({ success: true, message: "Đã hủy liên kết Google Workspace." });
    }

    const reqBaseUrl = getSafeBaseUrl(req.url);
    const statePayload = JSON.stringify({
      purpose: "workspace",
      userId: session.user.id,
      services: services || [],
      baseUrl: reqBaseUrl,
    });
    const encodedState = Buffer.from(statePayload).toString("base64url");
    const incrementalOAuthUrl = buildGoogleOAuthUrl(services || [], encodedState, reqBaseUrl);

    return NextResponse.json({
      success: true,
      oauthUrl: incrementalOAuthUrl,
    });
  } catch (err: any) {
    console.error("[GOOGLE_WORKSPACE_CONFIG_ERROR]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu kết nối Google." },
      { status: 500 }
    );
  }
}
