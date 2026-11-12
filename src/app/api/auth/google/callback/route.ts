import { NextResponse } from "next/server";
import { getGoogleOAuthConfig, getSafeBaseUrl } from "@/lib/google-workspace";
import {
  validateGoogleIdTokenClaims,
  authenticateVerifiedGoogleUser,
  createAuthenticatedSession,
} from "@/lib/auth";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getDefaultHomePathForRole,
} from "@/lib/session-token";
import { prisma } from "@/lib/prisma";

function decodeJwtPayload(jwt: string): Record<string, any> | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state") || "";

  let stateData: { purpose?: string; callbackUrl?: string; baseUrl?: string } = {};
  try {
    if (stateParam) {
      const decoded = Buffer.from(stateParam, "base64url").toString("utf-8");
      stateData = JSON.parse(decoded);
    }
  } catch {}

  const currentBaseUrl = stateData.baseUrl || getSafeBaseUrl(req.url);

  if (error) {
    return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_denied`);
  }

  const config = getGoogleOAuthConfig(currentBaseUrl);

  if (!config.isConfigured || !code) {
    return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_not_configured`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[GOOGLE_TOKEN_EXCHANGE_FAILED]", await tokenRes.text());
      return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_missing_token`);
    }

    // Verify ID Token with Google's tokeninfo endpoint + local claim verifier
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    const rawClaims = tokenInfoRes.ok
      ? await tokenInfoRes.json()
      : decodeJwtPayload(idToken);

    const validation = validateGoogleIdTokenClaims(rawClaims || {}, config.clientId);

    if (!validation.valid || !validation.normalized) {
      console.error("[GOOGLE_ID_TOKEN_INVALID]", validation.error);
      return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_invalid_token`);
    }

    const user = await authenticateVerifiedGoogleUser(validation.normalized);

    // If incremental workspace scopes were granted, store GoogleConnection
    const grantedScopes: string[] = tokenData.scope
      ? tokenData.scope.split(" ")
      : ["openid", "email", "profile"];

    if (tokenData.access_token) {
      await prisma.googleConnection.upsert({
        where: { userId: user.id },
        update: {
          googleEmail: validation.normalized.email,
          scopesGranted: JSON.stringify(grantedScopes),
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
        create: {
          userId: user.id,
          googleEmail: validation.normalized.email,
          scopesGranted: JSON.stringify(grantedScopes),
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
      });
    }

    // Create session and set HttpOnly cookie
    const sessionData = await createAuthenticatedSession({
      userId: user.id,
      authMethod: "GOOGLE_OIDC",
    });

    const isWorkspacePurpose = stateData.purpose === "workspace";
    const callbackTarget = stateData.callbackUrl && stateData.callbackUrl.startsWith("/")
      ? stateData.callbackUrl
      : null;

    const targetPath = callbackTarget || (
      isWorkspacePurpose
        ? "/giao-vien/google-workspace"
        : getDefaultHomePathForRole(user.role, sessionData.payload.activeViewRole)
    );

    const redirectUrl = `${currentBaseUrl}${targetPath}`;
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(SESSION_COOKIE_NAME, sessionData.signedCookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(CSRF_COOKIE_NAME, sessionData.csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("[GOOGLE_CALLBACK_EXCEPTION]", err);
    return NextResponse.redirect(`${currentBaseUrl}/dang-nhap?error=google_internal_error`);
  }
}
