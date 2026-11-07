import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, SUPER_ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN: Bạn không có quyền quản lý người dùng." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, userId, fullName, email, role, isActive } = body;

    if (action === "UPDATE_USER") {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
      }

      // Protect Super Admin account from being downgraded or deactivated
      if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
        if (role && role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { error: "PROTECTED: Không thể hạ quyền tài khoản Super Admin cao nhất." },
            { status: 403 }
          );
        }
        if (isActive === false) {
          return NextResponse.json(
            { error: "PROTECTED: Không thể vô hiệu hóa tài khoản Super Admin." },
            { status: 403 }
          );
        }
      }

      // Block granting SUPER_ADMIN to anyone other than dinhnguyenhnue@gmail.com
      if (
        role === "SUPER_ADMIN" &&
        targetUser.email.toLowerCase() !== SUPER_ADMIN_EMAIL
      ) {
        return NextResponse.json(
          {
            error:
              "FORBIDDEN: Quyền SUPER_ADMIN chỉ được cấp duy nhất cho dinhnguyenhnue@gmail.com.",
          },
          { status: 403 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: fullName ?? targetUser.fullName,
          role: role ?? targetUser.role,
          isActive: isActive ?? targetUser.isActive,
          accountStatus:
            isActive === false
              ? "SUSPENDED"
              : isActive === true
              ? "ACTIVE"
              : targetUser.accountStatus,
        },
        include: {
          studentProfile: { include: { schoolClass: true } },
          teacherProfile: true,
          parentProfile: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "ADMIN_USER_UPDATED",
          resource: "USER",
          resourceId: updated.id,
          status: "SUCCESS",
          details: JSON.stringify({ role: updated.role, isActive: updated.isActive }),
        },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    if (action === "CREATE_USER") {
      if (!email || !fullName || !role) {
        return NextResponse.json(
          { error: "Vui lòng nhập đầy đủ Họ tên, Email và Vai trò." },
          { status: 400 }
        );
      }

      if (
        role === "SUPER_ADMIN" &&
        email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL
      ) {
        return NextResponse.json(
          { error: "Không được phép tạo tài khoản SUPER_ADMIN thứ hai." },
          { status: 403 }
        );
      }

      const created = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          role,
          accountStatus: "PENDING_ACTIVATION",
          emailVerified: false,
        },
        include: {
          studentProfile: { include: { schoolClass: true } },
          teacherProfile: true,
          parentProfile: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "ADMIN_USER_CREATED",
          resource: "USER",
          resourceId: created.id,
          status: "SUCCESS",
          details: JSON.stringify({ email: created.email, role: created.role }),
        },
      });

      return NextResponse.json({ success: true, user: created });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

