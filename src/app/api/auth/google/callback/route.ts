import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";
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

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dang-nhap?error=${encodeURIComponent(error)}`
    );
  }

  const config = getGoogleOAuthConfig();

  // Do NOT fake Google OAuth callback if credentials or code are missing
  if (!config.isConfigured || !code) {
    return NextResponse.redirect(
      `${baseUrl}/dang-nhap?error=OAUTH_NOT_CONFIGURED`
    );
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
      return NextResponse.redirect(
        `${baseUrl}/dang-nhap?error=TOKEN_EXCHANGE_FAILED`
      );
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.redirect(`${baseUrl}/dang-nhap?error=MISSING_ID_TOKEN`);
    }

    // Verify ID Token with Google's tokeninfo endpoint + local claim verifier
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    const rawClaims = tokenInfoRes.ok
      ? await tokenInfoRes.json()
      : decodeJwtPayload(idToken);

    const validation = validateGoogleIdTokenClaims(
      rawClaims || {},
      config.clientId
    );

    if (!validation.valid || !validation.normalized) {
      return NextResponse.redirect(
        `${baseUrl}/dang-nhap?error=${encodeURIComponent(
          validation.error || "INVALID_ID_TOKEN"
        )}`
      );
    }

    const user = await authenticateVerifiedGoogleUser(validation.normalized);

    // If incremental workspace scopes were granted, store GoogleConnection
    const grantedScopes: string[] = tokenData.scope
      ? tokenData.scope.split(" ")
      : ["openid", "email", "profile"];

    if (grantedScopes.length > 3) {
      await prisma.googleConnection.upsert({
        where: { userId: user.id },
        update: {
          googleEmail: user.email,
          googleSub: validation.normalized.sub,
          scopesGranted: JSON.stringify(grantedScopes),
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
        create: {
          userId: user.id,
          googleEmail: user.email,
          googleSub: validation.normalized.sub,
          scopesGranted: JSON.stringify(grantedScopes),
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
      });
    }

    const sessionData = await createAuthenticatedSession({
      userId: user.id,
      authMethod: "GOOGLE_OIDC",
    });

    let customCallback = "";
    try {
      const parsedState = JSON.parse(
        Buffer.from(stateParam, "base64url").toString("utf-8")
      );
      if (parsedState.callbackUrl && parsedState.callbackUrl.startsWith("/")) {
        customCallback = parsedState.callbackUrl;
      }
    } catch {}

    const targetPath =
      customCallback ||
      getDefaultHomePathForRole(user.role, sessionData.payload.activeViewRole);

    const response = NextResponse.redirect(`${baseUrl}${targetPath}`);

    response.cookies.set(SESSION_COOKIE_NAME, sessionData.signedCookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: sessionData.expiresAt,
    });

    response.cookies.set(CSRF_COOKIE_NAME, sessionData.csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: sessionData.expiresAt,
    });

    return response;
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/dang-nhap?error=OAUTH_EXCHANGE_FAILED`
    );
  }
}
