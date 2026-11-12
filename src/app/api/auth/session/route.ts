import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getServerSession,
  validateGoogleIdTokenClaims,
  authenticateVerifiedGoogleUser,
  createAuthenticatedSession,
} from "@/lib/auth";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getDefaultHomePathForRole,
  type ViewRole,
} from "@/lib/session-token";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";
import { verifyPassword } from "@/lib/password";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      sessionId: session.sessionId,
      authMethod: session.authMethod,
      csrfToken: session.csrfToken,
      role: session.role,
      activeViewRole: session.activeViewRole,
      isSuperAdmin: session.isSuperAdmin,
      permissions: session.permissions,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        avatarUrl: session.user.avatarUrl,
        accountStatus: session.user.accountStatus,
        emailVerified: session.user.emailVerified,
      },
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, email, password, rememberMe, idTokenClaims, initialViewRole } = body;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // MODE 1: Email & Password Credentials Authentication
    if (mode === "CREDENTIALS") {
      if (!email || typeof email !== "string" || !password || typeof password !== "string") {
        return NextResponse.json(
          { error: "Vui lòng nhập đầy đủ email và mật khẩu." },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || !user.passwordHash) {
        await prisma.auditLog.create({
          data: {
            actorEmail: normalizedEmail,
            actorRole: "UNAUTHENTICATED",
            action: "LOGIN_FAILED_INVALID_CREDENTIALS",
            resource: "AUTH",
            status: "FAILED",
            ipAddress: clientIp,
            details: JSON.stringify({ reason: "User not found or no password hash" }),
          },
        });
        return NextResponse.json(
          { error: "Email hoặc mật khẩu không chính xác." },
          { status: 401 }
        );
      }

      if (user.accountStatus === "PENDING_APPROVAL") {
        return NextResponse.json(
          { error: "Tài khoản của bạn đang chờ Quản trị viên nhà trường phê duyệt." },
          { status: 403 }
        );
      }

      if (user.accountStatus === "PENDING_ACTIVATION") {
        return NextResponse.json(
          { error: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email xác nhận." },
          { status: 403 }
        );
      }

      if (!user.isActive || user.accountStatus === "SUSPENDED" || user.accountStatus === "LOCKED") {
        return NextResponse.json(
          { error: "Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên." },
          { status: 403 }
        );
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "LOGIN_FAILED_PASSWORD_MISMATCH",
            resource: "AUTH",
            status: "FAILED",
            ipAddress: clientIp,
          },
        });
        return NextResponse.json(
          { error: "Email hoặc mật khẩu không chính xác." },
          { status: 401 }
        );
      }

      // Successful password authentication
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "LOGIN_SUCCESS_CREDENTIALS",
          resource: "AUTH",
          resourceId: user.id,
          status: "SUCCESS",
          ipAddress: clientIp,
        },
      });

      const sessionData = await createAuthenticatedSession({
        userId: user.id,
        authMethod: "PASSWORD",
        initialViewRole: initialViewRole as ViewRole | undefined,
      });

      const redirectUrl = getDefaultHomePathForRole(
        user.role,
        sessionData.payload.activeViewRole
      );

      const response = NextResponse.json({
        success: true,
        authMethod: "PASSWORD",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          accountStatus: user.accountStatus,
        },
        activeViewRole: sessionData.payload.activeViewRole,
        redirectUrl,
      });

      const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days vs 7 days

      response.cookies.set(SESSION_COOKIE_NAME, sessionData.signedCookieValue, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: maxAgeSeconds,
      });

      response.cookies.set(CSRF_COOKIE_NAME, sessionData.csrfToken, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: maxAgeSeconds,
      });

      return response;
    }

    // MODE 2: Real Google OAuth / OIDC ID Token Verification
    if (mode === "GOOGLE_ID_TOKEN") {
      const oauthConfig = getGoogleOAuthConfig();

      if (!oauthConfig.isConfigured) {
        return NextResponse.json(
          {
            error: "Không thể kết nối với Google. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
          },
          { status: 503 }
        );
      }

      const validation = validateGoogleIdTokenClaims(idTokenClaims || {}, oauthConfig.clientId);
      if (!validation.valid || !validation.normalized) {
        return NextResponse.json(
          { error: "Phiên xác thực Google không hợp lệ hoặc đã hết hạn." },
          { status: 401 }
        );
      }

      const verifiedUser = await authenticateVerifiedGoogleUser(
        validation.normalized,
        undefined,
        clientIp
      );

      const sessionData = await createAuthenticatedSession({
        userId: verifiedUser.id,
        authMethod: "GOOGLE_OIDC",
        initialViewRole: initialViewRole as ViewRole | undefined,
      });

      const redirectUrl = getDefaultHomePathForRole(
        verifiedUser.role,
        sessionData.payload.activeViewRole
      );

      const response = NextResponse.json({
        success: true,
        authMethod: "GOOGLE_OIDC",
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          fullName: verifiedUser.fullName,
          role: verifiedUser.role,
          accountStatus: verifiedUser.accountStatus,
        },
        activeViewRole: sessionData.payload.activeViewRole,
        redirectUrl,
      });

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
    }

    // Reject all other bypass / legacy modes
    return NextResponse.json(
      { error: "Phương thức xác thực không được hỗ trợ." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[AUTH_SESSION_ERROR]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
