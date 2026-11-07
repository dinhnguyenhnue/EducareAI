import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  mapSystemRoleToDefaultViewRole,
  type SystemRole,
  type ViewRole,
  type SessionTokenPayload,
} from "./session-token";

export const SUPER_ADMIN_EMAIL = "dinhnguyenhnue@gmail.com";

export interface GoogleIdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean | string;
  name?: string;
  picture?: string;
  exp: number;
  iat?: number;
}

/**
 * Verifies Google OpenID Connect ID Token claims strictly per Section III:
 * - issuer: https://accounts.google.com or accounts.google.com
 * - audience: matches expected GOOGLE_CLIENT_ID
 * - expiry: exp > current unix timestamp
 * - email_verified: must be true
 * - sub: non-empty stable Google subject identifier
 */
export function validateGoogleIdTokenClaims(
  claims: Partial<GoogleIdTokenClaims>,
  expectedClientId: string
): { valid: boolean; error?: string; normalized?: GoogleIdTokenClaims } {
  if (!expectedClientId || expectedClientId === "UNCONFIGURED_CLIENT_ID") {
    return {
      valid: false,
      error: "MISSING_OAUTH_CLIENT_ID: GOOGLE_CLIENT_ID chưa được cấu hình trong .env",
    };
  }

  const validIssuers = ["https://accounts.google.com", "accounts.google.com"];
  if (!claims.iss || !validIssuers.includes(claims.iss)) {
    return { valid: false, error: `INVALID_ISSUER: Issuer không hợp lệ (${claims.iss})` };
  }

  if (!claims.aud || claims.aud !== expectedClientId) {
    return { valid: false, error: "INVALID_AUDIENCE: Audience không khớp với GOOGLE_CLIENT_ID" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!claims.exp || typeof claims.exp !== "number" || claims.exp <= nowSec) {
    return { valid: false, error: "TOKEN_EXPIRED: Google ID Token đã hết hạn" };
  }

  const isEmailVerified =
    claims.email_verified === true || claims.email_verified === "true";
  if (!isEmailVerified) {
    return {
      valid: false,
      error: "EMAIL_NOT_VERIFIED: Tài khoản Google chưa xác minh email (email_verified=false)",
    };
  }

  if (!claims.sub || typeof claims.sub !== "string" || claims.sub.trim().length < 3) {
    return { valid: false, error: "INVALID_SUB: Thiếu định danh Google sub ổn định" };
  }

  if (!claims.email || typeof claims.email !== "string") {
    return { valid: false, error: "INVALID_EMAIL: Thiếu email trong Google ID Token" };
  }

  return {
    valid: true,
    normalized: {
      iss: claims.iss,
      aud: claims.aud,
      sub: claims.sub.trim(),
      email: claims.email.trim().toLowerCase(),
      email_verified: true,
      name: claims.name,
      picture: claims.picture,
      exp: claims.exp,
      iat: claims.iat,
    },
  };
}

/**
 * Authenticates or links a verified Google OIDC user in the database.
 * Enforces anti-privilege escalation and Super Admin protection for dinhnguyenhnue@gmail.com.
 */
export async function authenticateVerifiedGoogleUser(
  claims: GoogleIdTokenClaims,
  requestedRoleHint?: string,
  ipAddress?: string
) {
  const normalizedEmail = claims.email.toLowerCase();

  // Check if someone is trying to escalate privileges via requestedRoleHint
  if (
    requestedRoleHint &&
    (requestedRoleHint === "SUPER_ADMIN" || requestedRoleHint === "SCHOOL_ADMIN") &&
    normalizedEmail !== SUPER_ADMIN_EMAIL &&
    normalizedEmail !== "admin@unigo.edu.vn"
  ) {
    await prisma.auditLog.create({
      data: {
        actorEmail: normalizedEmail,
        actorRole: "UNAUTHENTICATED",
        action: "PRIVILEGE_ESCALATION_BLOCKED",
        resource: "AUTH",
        status: "DENIED",
        ipAddress: ipAddress || "127.0.0.1",
        details: JSON.stringify({
          attemptedRole: requestedRoleHint,
          googleSub: claims.sub,
          reason: "Không cho phép tự đăng ký hoặc yêu cầu quyền quản trị trái phép.",
        }),
      },
    });
    throw new Error("PRIVILEGE_ESCALATION_DENIED: Không được phép tự yêu cầu quyền quản trị.");
  }

  // 1. Find user by stable googleSub or by email
  const userBySub = await prisma.user.findUnique({
    where: { googleSub: claims.sub },
  });
  const userByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Prevent account takeover if email matches a user whose googleSub is already bound to a DIFFERENT sub
  if (userByEmail && userByEmail.googleSub && userByEmail.googleSub !== claims.sub) {
    await prisma.auditLog.create({
      data: {
        actorId: userByEmail.id,
        actorEmail: normalizedEmail,
        actorRole: userByEmail.role,
        action: "ACCOUNT_TAKEOVER_BLOCKED",
        resource: "AUTH",
        status: "DENIED",
        ipAddress: ipAddress || "127.0.0.1",
        details: JSON.stringify({
          expectedSub: userByEmail.googleSub,
          receivedSub: claims.sub,
        }),
      },
    });
    throw new Error("SUB_MISMATCH: Định danh Google sub không khớp với tài khoản đã liên kết.");
  }

  let user = userBySub || userByEmail;

  // 2. If user is dinhnguyenhnue@gmail.com, ensure SUPER_ADMIN activation on verified Google OIDC
  if (normalizedEmail === SUPER_ADMIN_EMAIL) {
    const superRole = await prisma.roleDefinition.findUnique({
      where: { code: "SUPER_ADMIN" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL,
          googleSub: claims.sub,
          fullName: claims.name || "Đinh Nguyên (Super Admin UNIGO)",
          avatarUrl: claims.picture || undefined,
          role: "SUPER_ADMIN",
          emailVerified: true,
          accountStatus: "ACTIVE",
          isVerified: true,
          isActive: true,
          mfaRecommended: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleSub: claims.sub,
          role: "SUPER_ADMIN",
          emailVerified: true,
          accountStatus: "ACTIVE",
          lastLoginAt: new Date(),
          avatarUrl: claims.picture || user.avatarUrl,
        },
      });
    }

    if (superRole) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleId: { userId: user.id, roleId: superRole.id } },
        update: {},
        create: {
          userId: user.id,
          roleId: superRole.id,
          assignedBy: "GOOGLE_OIDC_VERIFIED",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: "SUPER_ADMIN",
        action: "SUPER_ADMIN_OIDC_LOGIN_VERIFIED",
        resource: "AUTH",
        resourceId: user.id,
        status: "SUCCESS",
        ipAddress: ipAddress || "127.0.0.1",
        details: JSON.stringify({ googleSub: claims.sub, accountStatus: "ACTIVE" }),
      },
    });

    return user;
  }

  // 3. Existing school user (Teacher, Student, Parent, School Admin)
  if (user) {
    if (!user.isActive || user.accountStatus === "SUSPENDED" || user.accountStatus === "LOCKED") {
      throw new Error("ACCOUNT_SUSPENDED: Tài khoản đã bị tạm khóa.");
    }

    // Never allow a non-super-admin email to hold SUPER_ADMIN role
    const safeRole = user.role === "SUPER_ADMIN" ? "COMMUNITY_USER" : user.role;

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleSub: claims.sub,
        role: safeRole,
        emailVerified: true,
        accountStatus: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "USER_OIDC_LOGIN_SUCCESS",
        resource: "AUTH",
        resourceId: user.id,
        status: "SUCCESS",
        ipAddress: ipAddress || "127.0.0.1",
      },
    });

    return user;
  }

  // 4. New unknown Google user -> strictly assign COMMUNITY_USER (never ADMIN/TEACHER/STUDENT without school provisioning)
  const communityRole = await prisma.roleDefinition.findUnique({
    where: { code: "COMMUNITY_USER" },
  });

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      googleSub: claims.sub,
      fullName: claims.name || normalizedEmail.split("@")[0],
      avatarUrl: claims.picture || null,
      role: "COMMUNITY_USER",
      emailVerified: true,
      accountStatus: "ACTIVE",
      isVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  if (communityRole) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: newUser.id,
        roleId: communityRole.id,
        assignedBy: "SELF_GOOGLE_OIDC",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: "COMMUNITY_USER",
      action: "COMMUNITY_USER_REGISTERED_OIDC",
      resource: "AUTH",
      resourceId: newUser.id,
      status: "SUCCESS",
      ipAddress: ipAddress || "127.0.0.1",
    },
  });

  return newUser;
}

/**
 * Creates a persistent database session and returns signed HttpOnly cookie token + CSRF token.
 */
export async function createAuthenticatedSession(params: {
  userId: string;
  authMethod: "GOOGLE_OIDC" | "LOCAL_DB_TEST_SESSION";
  ipAddress?: string;
  userAgent?: string;
  initialViewRole?: ViewRole;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user || !user.isActive) {
    throw new Error("Không tìm thấy người dùng hợp lệ để khởi tạo phiên.");
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const csrfToken = crypto.randomBytes(24).toString("hex");
  const ttlSeconds = user.role === "SUPER_ADMIN" ? 12 * 3600 : 24 * 3600; // 12h for Super Admin, 24h for others
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const expUnix = Math.floor(expiresAt.getTime() / 1000);

  const defaultViewRole =
    params.initialViewRole && user.role === "SUPER_ADMIN"
      ? params.initialViewRole
      : mapSystemRoleToDefaultViewRole(user.role);

  const dbSession = await prisma.authSession.create({
    data: {
      sessionToken,
      csrfToken,
      userId: user.id,
      activeViewRole: defaultViewRole,
      authMethod: params.authMethod,
      ipAddress: params.ipAddress || "127.0.0.1",
      userAgent: params.userAgent || "Next.js Client",
      expiresAt,
    },
  });

  const payload: SessionTokenPayload = {
    sessionId: dbSession.id,
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as SystemRole,
    activeViewRole: defaultViewRole,
    csrfToken,
    exp: expUnix,
  };

  const signedCookieValue = await signSessionToken(payload);

  return {
    dbSession,
    payload,
    signedCookieValue,
    csrfToken,
    expiresAt,
  };
}

/**
 * Reads and verifies the current session from cookies + SQLite database.
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    const tokenPayload = await verifySessionToken(rawCookie);
    if (!tokenPayload) return null;

    const dbSession = await prisma.authSession.findUnique({
      where: { id: tokenPayload.sessionId },
      include: {
        user: {
          include: {
            studentProfile: { include: { schoolClass: true } },
            teacherProfile: { include: { homeroomClasses: true } },
            parentProfile: {
              include: {
                children: {
                  include: {
                    student: { include: { user: true, schoolClass: true } },
                  },
                },
              },
            },
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
            googleConnection: true,
          },
        },
      },
    });

    if (!dbSession || dbSession.isRevoked) return null;
    if (new Date(dbSession.expiresAt) <= new Date()) return null;
    if (!dbSession.user.isActive) return null;

    const permissions = new Set<string>();
    for (const ur of dbSession.user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    const activeViewRole = (dbSession.activeViewRole ||
      tokenPayload.activeViewRole ||
      mapSystemRoleToDefaultViewRole(dbSession.user.role)) as ViewRole;

    return {
      sessionId: dbSession.id,
      csrfToken: dbSession.csrfToken,
      authMethod: dbSession.authMethod,
      user: dbSession.user,
      role: dbSession.user.role as SystemRole,
      activeViewRole,
      isSuperAdmin:
        dbSession.user.role === "SUPER_ADMIN" &&
        dbSession.user.email.toLowerCase() === SUPER_ADMIN_EMAIL,
      permissions: Array.from(permissions),
    };
  } catch {
    return null;
  }
}

/**
 * Switches the activeViewRole for SUPER_ADMIN (dinhnguyenhnue@gmail.com) only.
 * Enforces strict RBAC and logs the switch to AuditLog.
 */
export async function switchSuperAdminView(
  sessionId: string,
  targetViewRole: ViewRole,
  ipAddress?: string
) {
  const dbSession = await prisma.authSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!dbSession || dbSession.isRevoked) {
    throw new Error("SESSION_INVALID: Phiên đăng nhập không hợp lệ hoặc đã thu hồi.");
  }

  if (
    dbSession.user.role !== "SUPER_ADMIN" ||
    dbSession.user.email.toLowerCase() !== SUPER_ADMIN_EMAIL
  ) {
    await prisma.auditLog.create({
      data: {
        actorId: dbSession.user.id,
        actorEmail: dbSession.user.email,
        actorRole: dbSession.user.role,
        action: "UNAUTHORIZED_VIEW_SWITCH_ATTEMPT",
        resource: "SYSTEM_VIEW_SWITCHER",
        status: "DENIED",
        ipAddress: ipAddress || "127.0.0.1",
        details: JSON.stringify({ targetViewRole }),
      },
    });
    throw new Error("FORBIDDEN: Chỉ Super Admin (dinhnguyenhnue@gmail.com) mới được chuyển đổi góc nhìn hệ thống.");
  }

  const updated = await prisma.authSession.update({
    where: { id: sessionId },
    data: {
      activeViewRole: targetViewRole,
      lastActiveAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: dbSession.user.id,
      actorEmail: dbSession.user.email,
      actorRole: "SUPER_ADMIN",
      action: "SUPER_ADMIN_VIEW_SWITCH",
      resource: "SYSTEM_VIEW_SWITCHER",
      resourceId: sessionId,
      status: "SUCCESS",
      ipAddress: ipAddress || "127.0.0.1",
      details: JSON.stringify({
        previousView: dbSession.activeViewRole,
        newView: targetViewRole,
        note: "Chế độ kiểm tra giao diện & điều hành (Không giả danh danh tính người dùng khác).",
      }),
    },
  });

  const payload: SessionTokenPayload = {
    sessionId: updated.id,
    userId: dbSession.user.id,
    email: dbSession.user.email,
    fullName: dbSession.user.fullName,
    role: "SUPER_ADMIN",
    activeViewRole: targetViewRole,
    csrfToken: updated.csrfToken,
    exp: Math.floor(new Date(updated.expiresAt).getTime() / 1000),
  };

  const signedCookieValue = await signSessionToken(payload);
  return { updated, signedCookieValue, payload };
}

/**
 * Checks whether a user with `role` (and `activeViewRole`) can access a given route prefix or API resource.
 */
export function canAccessRoute(
  role: SystemRole,
  pathname: string
): boolean {
  // SUPER_ADMIN can access all internal routes for administration & multi-view testing
  if (role === "SUPER_ADMIN") return true;

  if (pathname.startsWith("/admin")) {
    return false; // Only SUPER_ADMIN can access /admin/*
  }

  if (pathname.startsWith("/quan-tri")) {
    return role === "SCHOOL_ADMIN";
  }

  if (pathname.startsWith("/giao-vien")) {
    return role === "TEACHER" || role === "SCHOOL_ADMIN";
  }

  if (pathname.startsWith("/hoc-sinh")) {
    return role === "STUDENT";
  }

  if (pathname.startsWith("/phu-huynh")) {
    return role === "PARENT";
  }

  return true;
}

