import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import {
  generateTemporaryStudentPassword,
  hashPassword,
  normalizeStudentCodeUsername,
} from "@/lib/password";
import { detectGradeLevel } from "@/lib/excel-parser";

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
    const {
      action,
      userId,
      fullName,
      email,
      role,
      isActive,
      studentCode,
      className,
      gradeLevel,
      dateOfBirth,
      gender,
    } = body;

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
              : isActive === true && targetUser.accountStatus === "SUSPENDED"
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

    if (action === "RESET_USER_PASSWORD") {
      if (!userId) {
        return NextResponse.json(
          { error: "Thiếu mã định danh người dùng cần đặt lại mật khẩu." },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: { include: { schoolClass: true } },
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
      }

      if (
        targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL &&
        session.role !== "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          { error: "FORBIDDEN: Không được phép đặt lại mật khẩu của Super Admin." },
          { status: 403 }
        );
      }

      const temporaryPassword = generateTemporaryStudentPassword();
      const passwordHash = await hashPassword(temporaryPassword);

      // Nếu tài khoản học sinh cũ còn lưu đuôi giả @no-email.internal.unigo thì chuẩn hóa về đúng studentCode
      const cleanEmailIdentifier =
        targetUser.studentProfile?.studentCode &&
          targetUser.email.endsWith("@no-email.internal.unigo")
          ? targetUser.studentProfile.studentCode
          : targetUser.email;

      const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          email: cleanEmailIdentifier,
          passwordHash,
          accountStatus: "MUST_CHANGE_PASSWORD",
          resetTokenHash: "FORCE_CHANGE_ON_FIRST_LOGIN",
          resetTokenExpiry: null,
          isActive: true,
        },
        include: {
          studentProfile: { include: { schoolClass: true } },
          teacherProfile: true,
          parentProfile: true,
        },
      });

      // Thu hồi toàn bộ phiên đăng nhập cũ của người dùng này
      await prisma.authSession.updateMany({
        where: { userId: targetUser.id },
        data: { isRevoked: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "ADMIN_USER_PASSWORD_RESET",
          resource: "USER",
          resourceId: updated.id,
          status: "SUCCESS",
          details: JSON.stringify({
            studentCode: updated.studentProfile?.studentCode || null,
            mustChangePassword: true,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        user: updated,
        issuedCredential: {
          studentCode: updated.studentProfile?.studentCode || updated.email,
          fullName: updated.fullName,
          className: updated.studentProfile?.schoolClass?.name || "—",
          temporaryPassword,
        },
      });
    }

    if (action === "CREATE_USER") {
      if (!fullName || !role) {
        return NextResponse.json(
          { error: "Vui lòng nhập đầy đủ Họ tên và Vai trò." },
          { status: 400 }
        );
      }

      // Luồng tạo tài khoản HỌC SINH không cần email (đăng nhập bằng Mã học sinh)
      if (role === "STUDENT") {
        const normalizedCode = normalizeStudentCodeUsername(studentCode || "");
        const normalizedClass = (className || "").trim().toUpperCase();

        if (!normalizedCode || normalizedCode.length < 3) {
          return NextResponse.json(
            { error: "Vui lòng nhập Mã học sinh hợp lệ (tối thiểu 3 ký tự, ví dụ: HS2026-0701)." },
            { status: 400 }
          );
        }

        if (!normalizedClass) {
          return NextResponse.json(
            { error: "Vui lòng nhập Lớp học cho học sinh (ví dụ: 6A1, 7A1, 8A1)." },
            { status: 400 }
          );
        }

        const optionalEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
        // Không tạo email giả (@unigo.edu.vn hay @no-email.internal.unigo). Dùng trực tiếp mã học sinh làm định danh đăng nhập nếu không có email.
        const loginIdentifier = optionalEmail || normalizedCode;

        const existingByCode = await prisma.studentProfile.findUnique({
          where: { studentCode: normalizedCode },
        });
        if (existingByCode) {
          return NextResponse.json(
            { error: `Mã học sinh "${normalizedCode}" đã tồn tại trong hệ thống.` },
            { status: 409 }
          );
        }

        const existingByIdentifier = await prisma.user.findUnique({
          where: { email: loginIdentifier },
        });
        if (existingByIdentifier) {
          return NextResponse.json(
            { error: `Tên đăng nhập / Mã học sinh "${loginIdentifier}" đã được sử dụng.` },
            { status: 409 }
          );
        }

        const resolvedGrade =
          detectGradeLevel(
            normalizedClass,
            normalizedClass,
            String(gradeLevel || "")
          ) ?? 7;

        const academicYear = await prisma.academicYear.upsert({
          where: { name: "2026-2027" },
          update: { isCurrent: true },
          create: {
            name: "2026-2027",
            startYear: 2026,
            endYear: 2027,
            isCurrent: true,
          },
        });

        const schoolClass = await prisma.schoolClass.upsert({
          where: {
            name_academicYearId: {
              name: normalizedClass,
              academicYearId: academicYear.id,
            },
          },
          update: { gradeLevel: resolvedGrade },
          create: {
            name: normalizedClass,
            gradeLevel: resolvedGrade,
            academicYearId: academicYear.id,
          },
        });

        const temporaryPassword = generateTemporaryStudentPassword();
        const passwordHash = await hashPassword(temporaryPassword);

        const created = await prisma.user.create({
          data: {
            email: loginIdentifier,
            fullName: fullName.trim(),
            role: "STUDENT",
            passwordHash,
            isActive: true,
            accountStatus: "MUST_CHANGE_PASSWORD",
            resetTokenHash: "FORCE_CHANGE_ON_FIRST_LOGIN",
            emailVerified: Boolean(optionalEmail),
            studentProfile: {
              create: {
                studentCode: normalizedCode,
                gradeLevel: resolvedGrade,
                classId: schoolClass.id,
                dateOfBirth: dateOfBirth ? String(dateOfBirth).trim() : null,
                gender: gender ? String(gender).trim() : null,
              },
            },
          },
          include: {
            studentProfile: { include: { schoolClass: true } },
            teacherProfile: true,
            parentProfile: true,
          },
        });

        if (created.studentProfile) {
          await prisma.enrollment.upsert({
            where: {
              studentId_classId_academicYearId: {
                studentId: created.studentProfile.id,
                classId: schoolClass.id,
                academicYearId: academicYear.id,
              },
            },
            update: { status: "ACTIVE" },
            create: {
              studentId: created.studentProfile.id,
              classId: schoolClass.id,
              academicYearId: academicYear.id,
              status: "ACTIVE",
            },
          });
        }

        const studentRole = await prisma.roleDefinition.findUnique({
          where: { code: "STUDENT" },
        });
        if (studentRole) {
          await prisma.userRoleAssignment.upsert({
            where: {
              userId_roleId: {
                userId: created.id,
                roleId: studentRole.id,
              },
            },
            update: {},
            create: {
              userId: created.id,
              roleId: studentRole.id,
              assignedBy: session.user.email,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            actorRole: session.role,
            action: "ADMIN_STUDENT_CREATED_WITHOUT_EMAIL",
            resource: "USER",
            resourceId: created.id,
            status: "SUCCESS",
            details: JSON.stringify({
              studentCode: normalizedCode,
              className: normalizedClass,
              hasEmail: Boolean(optionalEmail),
              mustChangePassword: true,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          user: created,
          issuedCredential: {
            studentCode: normalizedCode,
            fullName: created.fullName,
            className: normalizedClass,
            temporaryPassword,
          },
        });
      }

      if (!email) {
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

      const temporaryPassword = generateTemporaryStudentPassword();
      const passwordHash = await hashPassword(temporaryPassword);

      const created = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          role,
          passwordHash,
          accountStatus: "MUST_CHANGE_PASSWORD",
          resetTokenHash: "FORCE_CHANGE_ON_FIRST_LOGIN",
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

      return NextResponse.json({
        success: true,
        user: created,
        issuedCredential: {
          studentCode: created.email,
          fullName: created.fullName,
          className: role,
          temporaryPassword,
        },
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

