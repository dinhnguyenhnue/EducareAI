import { NextResponse } from "next/server";
import { getServerSession, switchSuperAdminView, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import {
  SESSION_COOKIE_NAME,
  getDefaultHomePathForRole,
  type ViewRole,
} from "@/lib/session-token";

const VALID_VIEW_ROLES: ViewRole[] = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập trước." },
        { status: 401 }
      );
    }

    if (
      session.role !== "SUPER_ADMIN" ||
      session.user.email.toLowerCase() !== SUPER_ADMIN_EMAIL
    ) {
      return NextResponse.json(
        {
          error:
            "FORBIDDEN: Chỉ tài khoản Super Admin (dinhnguyenhnue@gmail.com) mới có quyền chuyển đổi góc nhìn 4 vai trò.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const targetViewRole = body.viewRole as ViewRole;

    if (!VALID_VIEW_ROLES.includes(targetViewRole)) {
      return NextResponse.json(
        { error: "Góc nhìn vai trò không hợp lệ." },
        { status: 400 }
      );
    }

    const { updated, signedCookieValue } = await switchSuperAdminView(
      session.sessionId,
      targetViewRole
    );

    const redirectUrl = getDefaultHomePathForRole("SUPER_ADMIN", targetViewRole);

    const response = NextResponse.json({
      success: true,
      activeViewRole: targetViewRole,
      redirectUrl,
    });

    response.cookies.set(SESSION_COOKIE_NAME, signedCookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(updated.expiresAt),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes("FORBIDDEN") ? 403 : 500 }
    );
  }
}

