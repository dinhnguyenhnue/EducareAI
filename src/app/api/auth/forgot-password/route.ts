import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSafeBaseUrl } from "@/lib/google-workspace";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email hợp lệ." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-User-Enumeration: Always respond with the same message whether user exists or not
    if (user && user.isActive) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash,
          resetTokenExpiry,
        },
      });

      const baseUrl = getSafeBaseUrl(req.url);
      const resetUrl = `${baseUrl}/dat-lai-mat-khau?token=${resetToken}`;

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "PASSWORD_RESET_TOKEN_GENERATED",
          resource: "AUTH",
          resourceId: user.id,
          status: "SUCCESS",
          ipAddress: clientIp,
          details: JSON.stringify({
            expiry: resetTokenExpiry.toISOString(),
            resetUrlSample: `${baseUrl}/dat-lai-mat-khau?token=••••••••`,
          }),
        },
      });

      // Log server-side for development/audit testing without leaking to client
      console.log(`[PASSWORD_RESET_DISPATCH] Reset link generated for ${user.email}: ${resetUrl}`);
    } else {
      await prisma.auditLog.create({
        data: {
          actorEmail: normalizedEmail,
          actorRole: "UNAUTHENTICATED",
          action: "PASSWORD_RESET_NONEXISTENT_USER",
          resource: "AUTH",
          status: "FAILED",
          ipAddress: clientIp,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Nếu tài khoản tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.",
    });
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
