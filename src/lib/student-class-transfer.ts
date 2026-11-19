import { prisma } from "./prisma";
import { verifyTeacherClassScope } from "./submission-guard";
import { autoSyncClassTrackingSheetNonBlocking } from "./google-workspace";
import { normalizeStudentCodeUsername } from "./password";

export interface UpdateStudentClassInput {
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  studentCode: string;
  targetClassIdOrName: string;
  academicYearId?: string;
  db?: typeof prisma;
  autoSyncSheets?: boolean;
  fetchImpl?: typeof fetch;
  accessTokenOverride?: string | null;
}

export interface UpdateStudentClassResult {
  ok: boolean;
  statusCode: number;
  errorCode?: string;
  error?: string;
  transfer?: {
    studentProfileId: string;
    studentUserId: string;
    studentCode: string;
    fullName: string;
    fromClassId: string | null;
    fromClassName: string | null;
    toClassId: string;
    toClassName: string;
    academicYearId: string;
    unchanged: boolean;
  };
  user?: unknown;
  sheetSync?: {
    targetClassSync: string;
    sourceClassSync: string | null;
  };
}

/**
 * Gán lớp cho học sinh chưa có lớp hoặc chuyển học sinh sang lớp mới theo mã học sinh (studentCode).
 * - Kiểm tra quyền theo vai trò (ADMIN/SCHOOL_ADMIN/SUPER_ADMIN/TEACHER).
 * - Với TEACHER: bắt buộc kiểm tra phân công đối với CẢ lớp nguồn (nếu có) và lớp đích.
 * - Cập nhật nhất quán StudentProfile (classId, gradeLevel) và Enrollment (TRANSFERRED lớp cũ -> ACTIVE lớp mới) trong 1 transaction.
 * - Giữ nguyên thông tin đăng nhập (User.email, passwordHash), bài đã nộp (Submission/Attempt) và điểm cũ (Grade).
 */
export async function updateStudentClassTransactional(
  input: UpdateStudentClassInput
): Promise<UpdateStudentClassResult> {
  const db = input.db || prisma;
  const role = input.actorRole;

  if (
    role !== "SUPER_ADMIN" &&
    role !== "SCHOOL_ADMIN" &&
    role !== "ADMIN" &&
    role !== "TEACHER"
  ) {
    await db.auditLog.create({
      data: {
        actorId: input.actorUserId,
        actorEmail: input.actorEmail,
        actorRole: role,
        action: "UNAUTHORIZED_STUDENT_CLASS_TRANSFER",
        resource: "STUDENT_CLASS",
        status: "DENIED",
        details: JSON.stringify({
          studentCode: input.studentCode,
          targetClass: input.targetClassIdOrName,
        }),
      },
    });
    return {
      ok: false,
      statusCode: 403,
      errorCode: "FORBIDDEN_ROLE",
      error: "FORBIDDEN: Bạn không có quyền gán hoặc chuyển lớp cho học sinh.",
    };
  }

  const rawCode = String(input.studentCode || "").trim();
  const normalizedCode = normalizeStudentCodeUsername(rawCode);
  if (!rawCode || !normalizedCode) {
    return {
      ok: false,
      statusCode: 400,
      errorCode: "MISSING_STUDENT_CODE",
      error: "Vui lòng nhập mã học sinh cần gán hoặc chuyển lớp.",
    };
  }

  const rawTarget = String(input.targetClassIdOrName || "").trim();
  if (!rawTarget) {
    return {
      ok: false,
      statusCode: 400,
      errorCode: "MISSING_TARGET_CLASS",
      error: "Vui lòng chọn hoặc nhập lớp đích cần chuyển tới.",
    };
  }

  // 1. Tìm hồ sơ học sinh theo mã học sinh (ưu tiên khớp chuẩn hóa, hỗ trợ khớp chính xác)
  const studentProfile = await db.studentProfile.findFirst({
    where: {
      OR: [
        { studentCode: normalizedCode },
        { studentCode: rawCode },
        { studentCode: rawCode.toUpperCase() },
      ],
    },
    include: {
      user: true,
      schoolClass: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { schoolClass: true },
      },
    },
  });

  if (!studentProfile) {
    return {
      ok: false,
      statusCode: 404,
      errorCode: "STUDENT_NOT_FOUND",
      error: `Không tìm thấy tài khoản học sinh với mã "${rawCode}". Vui lòng kiểm tra lại mã học sinh.`,
    };
  }

  // 2. Xác định năm học và lớp đích (KHÔNG tự ý tạo lớp mới nếu tên lớp sai/không tồn tại)
  const academicYear = input.academicYearId
    ? await db.academicYear.findFirst({
        where: {
          OR: [{ id: input.academicYearId }, { name: input.academicYearId }],
        },
      })
    : await db.academicYear.findFirst({ where: { isCurrent: true } });

  const targetClassCandidates = await db.schoolClass.findMany({
    where: {
      OR: [
        { id: rawTarget },
        {
          name: rawTarget,
          ...(academicYear ? { academicYearId: academicYear.id } : {}),
        },
        {
          name: rawTarget.toUpperCase(),
          ...(academicYear ? { academicYearId: academicYear.id } : {}),
        },
      ],
    },
    include: { academicYear: true },
  });

  if (targetClassCandidates.length === 0) {
    return {
      ok: false,
      statusCode: 404,
      errorCode: "TARGET_CLASS_NOT_FOUND",
      error: `Không xác định được lớp đích "${rawTarget}". Vui lòng kiểm tra lại tên hoặc mã lớp trong năm học hiện tại.`,
    };
  }

  if (targetClassCandidates.length > 1 && !academicYear) {
    return {
      ok: false,
      statusCode: 400,
      errorCode: "AMBIGUOUS_TARGET_CLASS",
      error: `Lớp đích "${rawTarget}" trùng tên ở nhiều năm học. Vui lòng chọn rõ mã lớp hoặc năm học.`,
    };
  }

  const targetClass = targetClassCandidates[0];
  const sourceClassId = studentProfile.classId || null;
  const sourceClassName = studentProfile.schoolClass?.name || null;

  // 3. Kiểm tra quyền đối với CẢ lớp nguồn (nếu HS đã có lớp) VÀ lớp đích khi actor là TEACHER
  if (role === "TEACHER") {
    const targetScope = await verifyTeacherClassScope(
      input.actorUserId,
      role,
      targetClass.id,
      db
    );
    if (!targetScope.allowed) {
      await db.auditLog.create({
        data: {
          actorId: input.actorUserId,
          actorEmail: input.actorEmail,
          actorRole: role,
          action: "CROSS_CLASS_TRANSFER_BLOCKED",
          resource: "STUDENT_CLASS",
          resourceId: studentProfile.id,
          status: "DENIED",
          details: JSON.stringify({
            studentCode: studentProfile.studentCode,
            fromClassId: sourceClassId,
            toClassId: targetClass.id,
            reason: "TARGET_CLASS_FORBIDDEN",
          }),
        },
      });
      return {
        ok: false,
        statusCode: 403,
        errorCode: "FORBIDDEN_TARGET_CLASS_SCOPE",
        error: `FORBIDDEN_CLASS_SCOPE: Bạn không được phân công phụ trách lớp đích ${targetClass.name}.`,
      };
    }

    if (sourceClassId && sourceClassId !== targetClass.id) {
      const sourceScope = await verifyTeacherClassScope(
        input.actorUserId,
        role,
        sourceClassId,
        db
      );
      if (!sourceScope.allowed) {
        await db.auditLog.create({
          data: {
            actorId: input.actorUserId,
            actorEmail: input.actorEmail,
            actorRole: role,
            action: "CROSS_CLASS_TRANSFER_BLOCKED",
            resource: "STUDENT_CLASS",
            resourceId: studentProfile.id,
            status: "DENIED",
            details: JSON.stringify({
              studentCode: studentProfile.studentCode,
              fromClassId: sourceClassId,
              toClassId: targetClass.id,
              reason: "SOURCE_CLASS_FORBIDDEN",
            }),
          },
        });
        return {
          ok: false,
          statusCode: 403,
          errorCode: "FORBIDDEN_SOURCE_CLASS_SCOPE",
          error: `FORBIDDEN_CLASS_SCOPE: Bạn không được phân công phụ trách lớp nguồn ${sourceClassName || sourceClassId}.`,
        };
      }
    }
  }

  const isUnchanged = sourceClassId === targetClass.id;

  // 4. Cập nhật nhất quán StudentProfile + Enrollment trong 1 transaction
  const updatedUser = await db.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { id: studentProfile.id },
      data: {
        classId: targetClass.id,
        gradeLevel: targetClass.gradeLevel,
      },
    });

    // Đánh dấu các bản ghi danh ACTIVE của lớp cũ trong cùng năm học sang TRANSFERRED
    await tx.enrollment.updateMany({
      where: {
        studentId: studentProfile.id,
        academicYearId: targetClass.academicYearId,
        status: "ACTIVE",
        NOT: { classId: targetClass.id },
      },
      data: { status: "TRANSFERRED" },
    });

    // Kích hoạt bản ghi danh ở lớp đích
    await tx.enrollment.upsert({
      where: {
        studentId_classId_academicYearId: {
          studentId: studentProfile.id,
          classId: targetClass.id,
          academicYearId: targetClass.academicYearId,
        },
      },
      update: { status: "ACTIVE" },
      create: {
        studentId: studentProfile.id,
        classId: targetClass.id,
        academicYearId: targetClass.academicYearId,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorUserId,
        actorEmail: input.actorEmail,
        actorRole: role,
        action: "STUDENT_CLASS_UPDATED",
        resource: "STUDENT_CLASS",
        resourceId: studentProfile.id,
        status: "SUCCESS",
        details: JSON.stringify({
          studentCode: studentProfile.studentCode,
          fromClassId: sourceClassId,
          fromClassName: sourceClassName,
          toClassId: targetClass.id,
          toClassName: targetClass.name,
          academicYearId: targetClass.academicYearId,
        }),
      },
    });

    return tx.user.findUnique({
      where: { id: studentProfile.userId },
      include: {
        studentProfile: { include: { schoolClass: true } },
        teacherProfile: true,
        parentProfile: true,
      },
    });
  });

  // 5. Tự động cập nhật danh sách lớp trên Google Sheets (non-blocking)
  let targetClassSync = "SKIPPED";
  let sourceClassSync: string | null = null;
  if (input.autoSyncSheets !== false) {
    const targetSyncRes = await autoSyncClassTrackingSheetNonBlocking(
      input.actorUserId,
      targetClass.id,
      {
        academicYearId: targetClass.academicYearId,
        db,
        fetchImpl: input.fetchImpl,
        accessTokenOverride: input.accessTokenOverride,
      }
    );
    targetClassSync = targetSyncRes.syncStatus;

    if (sourceClassId && sourceClassId !== targetClass.id) {
      const sourceSyncRes = await autoSyncClassTrackingSheetNonBlocking(
        input.actorUserId,
        sourceClassId,
        {
          academicYearId: targetClass.academicYearId,
          db,
          fetchImpl: input.fetchImpl,
          accessTokenOverride: input.accessTokenOverride,
        }
      );
      sourceClassSync = sourceSyncRes.syncStatus;
    }
  }

  return {
    ok: true,
    statusCode: 200,
    transfer: {
      studentProfileId: studentProfile.id,
      studentUserId: studentProfile.userId,
      studentCode: studentProfile.studentCode,
      fullName: studentProfile.user.fullName,
      fromClassId: sourceClassId,
      fromClassName: sourceClassName,
      toClassId: targetClass.id,
      toClassName: targetClass.name,
      academicYearId: targetClass.academicYearId,
      unchanged: isUnchanged,
    },
    user: updatedUser,
    sheetSync: {
      targetClassSync,
      sourceClassSync,
    },
  };
}
