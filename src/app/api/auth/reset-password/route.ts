import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getServerSession } from "@/lib/auth";
import { getDefaultHomePathForRole } from "@/lib/session-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, token, currentPassword, newPassword } = body;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải chứa ít nhất 8 ký tự." },
        { status: 400 }
      );
    }

    // Luồng 1: Học sinh / người dùng đổi mật khẩu tạm ở lần đăng nhập đầu tiên (hoặc tự đổi mật khẩu khi đang đăng nhập)
    if (mode === "FIRST_LOGIN_CHANGE" || (!token && currentPassword)) {
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại bằng mã học sinh và mật khẩu tạm." },
          { status: 401 }
        );
      }

      if (!currentPassword || typeof currentPassword !== "string") {
        return NextResponse.json(
          { error: "Vui lòng nhập mật khẩu tạm hiện tại." },
          { status: 400 }
        );
      }

      if (newPassword === currentPassword) {
        return NextResponse.json(
          { error: "Mật khẩu mới phải khác mật khẩu tạm ban đầu." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "Không tìm thấy thông tin xác thực của tài khoản." },
          { status: 404 }
        );
      }

      const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "FIRST_LOGIN_PASSWORD_CHANGE_INVALID_CURRENT",
            resource: "AUTH",
            resourceId: user.id,
            status: "FAILED",
            ipAddress: clientIp,
          },
        });
        return NextResponse.json(
          { error: "Mật khẩu tạm hiện tại không chính xác." },
          { status: 401 }
        );
      }

      const newPasswordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          accountStatus: "ACTIVE",
          resetTokenHash: null,
          resetTokenExpiry: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "FIRST_LOGIN_PASSWORD_CHANGED",
          resource: "AUTH",
          resourceId: user.id,
          status: "SUCCESS",
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        mustChangePassword: false,
        redirectUrl: getDefaultHomePathForRole(user.role),
        message: "Đổi mật khẩu lần đầu thành công! Tài khoản của bạn đã sẵn sàng sử dụng.",
      });
    }

    // Luồng 2: Đặt lại mật khẩu qua token email
    if (!token || typeof token !== "string" || token.length < 32) {
      return NextResponse.json(
        { error: "Mã xác thực khôi phục mật khẩu không hợp lệ." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          actorEmail: "unknown",
          actorRole: "UNAUTHENTICATED",
          action: "PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED",
          resource: "AUTH",
          status: "FAILED",
          ipAddress: clientIp,
        },
      });
      return NextResponse.json(
        { error: "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới." },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    // Update user password and clear reset tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        accountStatus: user.accountStatus === "MUST_CHANGE_PASSWORD" ? "ACTIVE" : user.accountStatus,
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    // Revoke all existing sessions for this user (Security best practice on password change)
    await prisma.authSession.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "PASSWORD_RESET_COMPLETED",
        resource: "AUTH",
        resourceId: user.id,
        status: "SUCCESS",
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch (err: any) {
    console.error("[RESET_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
