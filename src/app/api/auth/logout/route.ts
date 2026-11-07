import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } from "@/lib/session-token";

export async function POST() {
  try {
    const session = await getServerSession();

    if (session) {
      await prisma.authSession.update({
        where: { id: session.sessionId },
        data: { isRevoked: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "AUTH_LOGOUT_SESSION_REVOKED",
          resource: "AUTH",
          resourceId: session.sessionId,
          status: "SUCCESS",
        },
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Đã đăng xuất và thu hồi phiên đăng nhập thành công.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set(CSRF_COOKIE_NAME, "", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

