import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (!token || typeof token !== "string" || token.length < 32) {
      return NextResponse.json(
        { error: "Mã xác thực khôi phục mật khẩu không hợp lệ." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải chứa ít nhất 8 ký tự." },
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
