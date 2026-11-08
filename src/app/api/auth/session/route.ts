import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getServerSession,
  validateGoogleIdTokenClaims,
  authenticateVerifiedGoogleUser,
  createAuthenticatedSession,
  SUPER_ADMIN_EMAIL,
} from "@/lib/auth";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getDefaultHomePathForRole,
  type ViewRole,
} from "@/lib/session-token";
import { getGoogleOAuthConfig } from "@/lib/google-workspace";

export async function GET() {
  const oauthConfig = getGoogleOAuthConfig();

  // Execute session verification and Super Admin status check in parallel
  const [session, superAdminRecord] = await Promise.all([
    getServerSession(),
    prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        googleSub: true,
        mfaRecommended: true,
        lastLoginAt: true,
      },
    }),
  ]);

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        oauthConfigured: oauthConfig.isConfigured,
        superAdminStatus: superAdminRecord,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
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
      oauthConfigured: oauthConfig.isConfigured,
      superAdminStatus: superAdminRecord,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        avatarUrl: session.user.avatarUrl,
        accountStatus: session.user.accountStatus,
        emailVerified: session.user.emailVerified,
        googleSub: session.user.googleSub,
        mfaRecommended: session.user.mfaRecommended,
        studentProfile: session.user.studentProfile,
        teacherProfile: session.user.teacherProfile,
        parentProfile: session.user.parentProfile,
        googleConnection: session.user.googleConnection
          ? {
              googleEmail: session.user.googleConnection.googleEmail,
              status: session.user.googleConnection.status,
              scopesGranted: session.user.googleConnection.scopesGranted,
              lastSyncAt: session.user.googleConnection.lastSyncAt,
            }
          : null,
      },
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, idTokenClaims, email, requestedRole, initialViewRole } = body;
    const oauthConfig = getGoogleOAuthConfig();

    // MODE 1: Real Google OAuth / OIDC ID Token Verification
    if (mode === "GOOGLE_ID_TOKEN") {
      if (!oauthConfig.isConfigured && !body.expectedClientIdForVerificationTest) {
        await prisma.auditLog.create({
          data: {
            actorEmail: email || "unknown",
            actorRole: "UNAUTHENTICATED",
            action: "GOOGLE_OAUTH_BLOCKED_MISSING_ENV",
            resource: "AUTH",
            status: "FAILED",
            details: JSON.stringify({
              missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            }),
          },
        });
        return NextResponse.json(
          {
            error: "OAUTH_CREDENTIALS_MISSING",
            message:
              "Chưa cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong file .env. Hệ thống từ chối giả lập đăng nhập Google OAuth.",
            missingVariables: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
          },
          { status: 503 }
        );
      }

      const expectedAud =
        oauthConfig.clientId || body.expectedClientIdForVerificationTest;
      const validation = validateGoogleIdTokenClaims(idTokenClaims || {}, expectedAud);

      if (!validation.valid || !validation.normalized) {
        await prisma.auditLog.create({
          data: {
            actorEmail: idTokenClaims?.email || "unknown",
            actorRole: "UNAUTHENTICATED",
            action: "GOOGLE_OIDC_TOKEN_INVALID",
            resource: "AUTH",
            status: "DENIED",
            details: JSON.stringify({ error: validation.error }),
          },
        });
        return NextResponse.json(
          { error: validation.error || "ID Token không hợp lệ" },
          { status: 401 }
        );
      }

      const verifiedUser = await authenticateVerifiedGoogleUser(
        validation.normalized,
        requestedRole
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
    }

    // MODE 2: Provisioned Database Account Session (For local development & RBAC verification)
    if (mode === "LOCAL_PROVISIONED_ACCOUNT") {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { error: "Vui lòng chọn tài khoản đã được khởi tạo trong CSDL." },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          {
            error: "ACCOUNT_NOT_PROVISIONED",
            message: "Tài khoản không tồn tại trong CSDL. Không cho phép tự đăng ký quyền nội bộ.",
          },
          { status: 404 }
        );
      }

      // Block privilege escalation if someone requests SUPER_ADMIN/SCHOOL_ADMIN on a student/teacher account
      if (
        requestedRole &&
        requestedRole !== user.role &&
        (requestedRole === "SUPER_ADMIN" || requestedRole === "SCHOOL_ADMIN")
      ) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "PRIVILEGE_ESCALATION_BLOCKED",
            resource: "AUTH",
            status: "DENIED",
            details: JSON.stringify({
              actualRole: user.role,
              attemptedRole: requestedRole,
            }),
          },
        });
        return NextResponse.json(
          {
            error: "PRIVILEGE_ESCALATION_DENIED",
            message: "Không được phép tự nâng quyền lên Quản trị viên.",
          },
          { status: 403 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const sessionData = await createAuthenticatedSession({
        userId: user.id,
        authMethod: "LOCAL_DB_TEST_SESSION",
        initialViewRole: initialViewRole as ViewRole | undefined,
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "SESSION_STARTED_PROVISIONED_ACCOUNT",
          resource: "AUTH",
          resourceId: sessionData.dbSession.id,
          status: "SUCCESS",
          details: JSON.stringify({
            authMethod: "LOCAL_DB_TEST_SESSION",
            activeViewRole: sessionData.payload.activeViewRole,
          }),
        },
      });

      const redirectUrl = getDefaultHomePathForRole(
        user.role,
        sessionData.payload.activeViewRole
      );

      const response = NextResponse.json({
        success: true,
        authMethod: "LOCAL_DB_TEST_SESSION",
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
    }

    return NextResponse.json(
      { error: "Phương thức xác thực không hợp lệ." },
      { status: 400 }
    );
  } catch (err: any) {
    const status = err.message?.includes("PRIVILEGE_ESCALATION")
      ? 403
      : err.message?.includes("SUB_MISMATCH")
      ? 403
      : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

