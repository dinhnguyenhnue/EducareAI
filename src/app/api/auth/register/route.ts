import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      role,
      fullName,
      email,
      password,
      // Role specific fields
      studentCode,
      classId,
      className,
      gradeLevel,
      parentConsent,
      specialization,
      teacherInviteCode,
      childStudentCode,
      relationship,
      phoneNumber,
    } = body;

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. Basic validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Họ và tên không hợp lệ." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email không đúng định dạng." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải chứa ít nhất 8 ký tự." }, { status: 400 });
    }

    // 2. Anti-Privilege Escalation: Strictly forbid registering as Admins
    if (role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "ADMIN") {
      await prisma.auditLog.create({
        data: {
          actorEmail: email.trim().toLowerCase(),
          actorRole: "UNAUTHENTICATED",
          action: "ADMIN_REGISTRATION_ATTEMPT_BLOCKED",
          resource: "AUTH",
          status: "DENIED",
          ipAddress: clientIp,
          details: JSON.stringify({ attemptedRole: role }),
        },
      });
      return NextResponse.json(
        { error: "Không được phép tự đăng ký tài khoản Quản trị viên." },
        { status: 403 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // 4. Role-specific creation logic
    if (role === "STUDENT") {
      if (!parentConsent) {
        return NextResponse.json(
          { error: "Học sinh dưới 16 tuổi cần xác nhận có sự đồng ý của Phụ huynh theo Nghị định 13/2023/NĐ-CP." },
          { status: 400 }
        );
      }

      // Find or verify class
      let targetClass = null;
      if (classId) {
        targetClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
      } else if (className) {
        targetClass = await prisma.schoolClass.findFirst({ where: { name: className } });
      }

      const generatedCode = studentCode?.trim() || `HS2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: "STUDENT",
          accountStatus: "ACTIVE",
          isVerified: true,
          isActive: true,
          studentProfile: {
            create: {
              studentCode: generatedCode,
              gradeLevel: gradeLevel ? Number(gradeLevel) : targetClass?.gradeLevel || 7,
              classId: targetClass?.id || null,
              learningGoals: "Nắm vững chương trình GDPT 2018 và tích cực học tập số.",
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: newUser.id,
          actorEmail: newUser.email,
          actorRole: "STUDENT",
          action: "REGISTER_STUDENT_SUCCESS",
          resource: "USER",
          resourceId: newUser.id,
          status: "SUCCESS",
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đăng ký tài khoản học sinh thành công! Bạn có thể đăng nhập ngay.",
        role: "STUDENT",
      });
    }

    if (role === "TEACHER") {
      // Teachers start as PENDING_APPROVAL unless verified with school invite code
      const isOfficialSchoolEmail = normalizedEmail.endsWith("@unigo.edu.vn");
      const hasValidInviteCode = teacherInviteCode && teacherInviteCode.trim() === "UNIGO-TEACHER-2026";
      const initialStatus = (isOfficialSchoolEmail || hasValidInviteCode) ? "ACTIVE" : "PENDING_APPROVAL";

      const newUser = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: "TEACHER",
          accountStatus: initialStatus,
          isVerified: initialStatus === "ACTIVE",
          isActive: true,
          teacherProfile: {
            create: {
              teacherCode: `GV-${Math.floor(100 + Math.random() * 900)}`,
              specialization: specialization || "Tin học & Công nghệ số",
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: newUser.id,
          actorEmail: newUser.email,
          actorRole: "TEACHER",
          action: "REGISTER_TEACHER_SUBMITTED",
          resource: "USER",
          resourceId: newUser.id,
          status: "SUCCESS",
          ipAddress: clientIp,
          details: JSON.stringify({ accountStatus: initialStatus }),
        },
      });

      const message =
        initialStatus === "ACTIVE"
          ? "Đăng ký tài khoản Giáo viên thành công! Bạn có thể đăng nhập ngay."
          : "Đăng ký thành công! Hồ sơ giáo viên đang chờ Quản trị viên nhà trường phê duyệt chuyên môn.";

      return NextResponse.json({
        success: true,
        message,
        accountStatus: initialStatus,
        role: "TEACHER",
      });
    }

    if (role === "PARENT") {
      // Find child profile if provided
      let linkedStudentProfile = null;
      if (childStudentCode) {
        linkedStudentProfile = await prisma.studentProfile.findFirst({
          where: { studentCode: childStudentCode.trim().toUpperCase() },
        });
      }

      const newUser = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: "PARENT",
          accountStatus: "ACTIVE",
          isVerified: true,
          isActive: true,
          parentProfile: {
            create: {
              phone: phoneNumber || null,
            },
          },
        },
        include: { parentProfile: true },
      });

      // Link parent to student if student code matches
      if (newUser.parentProfile && linkedStudentProfile) {
        await prisma.parentStudent.create({
          data: {
            parentId: newUser.parentProfile.id,
            studentId: linkedStudentProfile.id,
            relationship: relationship || "PHU_HUYNH",
            isVerified: false, // Requires homeroom teacher confirmation
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: newUser.id,
          actorEmail: newUser.email,
          actorRole: "PARENT",
          action: "REGISTER_PARENT_SUCCESS",
          resource: "USER",
          resourceId: newUser.id,
          status: "SUCCESS",
          ipAddress: clientIp,
          details: JSON.stringify({ linkedStudentFound: Boolean(linkedStudentProfile) }),
        },
      });

      return NextResponse.json({
        success: true,
        message: linkedStudentProfile
          ? "Đăng ký tài khoản Phụ huynh thành công! Liên kết học sinh sẽ được GVCN xác nhận."
          : "Đăng ký tài khoản Phụ huynh thành công! Bạn có thể liên kết mã học sinh của con sau khi đăng nhập.",
        role: "PARENT",
      });
    }

    // Default: COMMUNITY_USER
    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "COMMUNITY_USER",
        accountStatus: "ACTIVE",
        isVerified: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: newUser.id,
        actorEmail: newUser.email,
        actorRole: "COMMUNITY_USER",
        action: "REGISTER_COMMUNITY_SUCCESS",
        resource: "USER",
        resourceId: newUser.id,
        status: "SUCCESS",
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản Cộng đồng thành công! Bạn có thể đăng nhập ngay.",
      role: "COMMUNITY_USER",
    });
  } catch (err: any) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
