import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  parseXlsxRawSheets,
  processRawSheetsToStudents,
  parseCsvToStudents,
  buildUnigoWorkbookBuffer,
  type ParsedStudentRow,
} from "@/lib/excel-parser";
import { generateTemporaryStudentPassword, hashPassword } from "@/lib/password";

const WORKSPACE_EXCEL_FILENAME = "DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("download") === "template") {
    const buf = buildUnigoWorkbookBuffer();
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="UNIGO_DanhSachHocSinh_2026_2027.xlsx"`,
      },
    });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const filePath = path.join(process.cwd(), WORKSPACE_EXCEL_FILENAME);
  const existsOnDisk = fs.existsSync(filePath);

  return NextResponse.json({
    workspaceFileName: WORKSPACE_EXCEL_FILENAME,
    existsOnDisk,
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN") {
      return NextResponse.json(
        {
          error:
            "FORBIDDEN: Chỉ Super Admin và Quản trị Nhà trường mới được phép nhập dữ liệu học sinh.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      action,
      fileName,
      fileBase64,
      csvText,
      rowsToCommit,
      passwordMode,
      customInitialPassword,
      requireFirstLoginPasswordChange,
    } = body;

    // 1. Preview from workspace file (or auto-provision standard UNIGO 2026-2027 workbook if not yet on disk)
    if (action === "PREVIEW_WORKSPACE_FILE") {
      const filePath = path.join(process.cwd(), WORKSPACE_EXCEL_FILENAME);
      let buffer: Buffer;
      if (fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
      } else {
        buffer = buildUnigoWorkbookBuffer();
        fs.writeFileSync(filePath, buffer);
      }

      const rawSheets = parseXlsxRawSheets(buffer);
      const parseResult = processRawSheetsToStudents(
        WORKSPACE_EXCEL_FILENAME,
        rawSheets
      );

      // Check existing student codes in DB
      const existingProfiles = await prisma.studentProfile.findMany({
        select: { studentCode: true },
      });
      const existingCodes = new Set(existingProfiles.map((p) => p.studentCode));

      return NextResponse.json({
        success: true,
        preview: parseResult,
        existingCodesInDb: Array.from(existingCodes),
      });
    }

    // 2. Preview from uploaded .xlsx (base64) or .csv
    if (action === "PREVIEW_UPLOAD") {
      let parseResult;
      if (csvText) {
        parseResult = parseCsvToStudents(fileName || "upload.csv", csvText);
      } else if (fileBase64) {
        const buffer = Buffer.from(fileBase64, "base64");
        const rawSheets = parseXlsxRawSheets(buffer);
        parseResult = processRawSheetsToStudents(
          fileName || "upload.xlsx",
          rawSheets
        );
      } else {
        return NextResponse.json(
          { error: "Không tìm thấy nội dung file tải lên." },
          { status: 400 }
        );
      }

      const existingProfiles = await prisma.studentProfile.findMany({
        select: { studentCode: true },
      });
      const existingCodes = new Set(existingProfiles.map((p) => p.studentCode));

      return NextResponse.json({
        success: true,
        preview: parseResult,
        existingCodesInDb: Array.from(existingCodes),
      });
    }

    // 3. Commit validated rows idempotently into SQLite Database
    if (action === "COMMIT_IMPORT") {
      const rows = (rowsToCommit || []) as ParsedStudentRow[];
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Không có dòng dữ liệu hợp lệ để import." },
          { status: 400 }
        );
      }

      // Ensure Academic Year 2026-2027 exists
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

      const studentRole = await prisma.roleDefinition.findUnique({
        where: { code: "STUDENT" },
      });

      let createdCount = 0;
      let skippedDuplicateCount = 0;
      let failedCount = 0;
      const rowErrors: Array<{ studentCode: string; reason: string }> = [];
      const classesCreatedOrUpdated = new Set<string>();
      const issuedCredentials: Array<{
        studentCode: string;
        fullName: string;
        className: string;
        temporaryPassword: string;
      }> = [];

      const useCustomInitial =
        passwordMode === "CUSTOM_INITIAL" &&
        typeof customInitialPassword === "string" &&
        customInitialPassword.trim().length >= 8;

      if (passwordMode === "CUSTOM_INITIAL" && !useCustomInitial) {
        return NextResponse.json(
          { error: "Mật khẩu khởi tạo phải có tối thiểu 8 ký tự." },
          { status: 400 }
        );
      }

      const preHashedCustomPassword = useCustomInitial
        ? await hashPassword(customInitialPassword.trim())
        : null;

      for (const row of rows) {
        if (
          !row.isValid ||
          !row.studentCode ||
          !row.fullName ||
          ![6, 7, 8].includes(row.gradeLevel)
        ) {
          failedCount++;
          rowErrors.push({
            studentCode: row.studentCode || `Row ${row.rowNumber}`,
            reason: ![6, 7, 8].includes(row.gradeLevel)
              ? `Khối ${row.gradeLevel} không thuộc phạm vi thí điểm (chỉ nhận 6, 7, 8)`
              : (row.errors || ["Dữ liệu không hợp lệ"]).join("; "),
          });
          continue;
        }

        try {
          // Check if StudentProfile or User already exists (Strict non-overwrite rule)
          const existingProfile = await prisma.studentProfile.findUnique({
            where: { studentCode: row.studentCode },
          });
          const loginIdentifier = row.emailFromFile || row.studentCode;
          const existingUser = await prisma.user.findUnique({
            where: { email: loginIdentifier },
          });

          if (existingProfile || existingUser) {
            // Do NOT delete or overwrite existing accounts
            skippedDuplicateCount++;
            continue;
          }

          // Upsert SchoolClass (6A1, 7A1, 8A1...)
          const schoolClass = await prisma.schoolClass.upsert({
            where: {
              name_academicYearId: {
                name: row.className,
                academicYearId: academicYear.id,
              },
            },
            update: { gradeLevel: row.gradeLevel },
            create: {
              name: row.className,
              gradeLevel: row.gradeLevel,
              academicYearId: academicYear.id,
            },
          });
          classesCreatedOrUpdated.add(schoolClass.name);

          const temporaryPassword = useCustomInitial
            ? null
            : generateTemporaryStudentPassword();
          const passwordHash = preHashedCustomPassword
            ? preHashedCustomPassword
            : await hashPassword(temporaryPassword!);

          const mustChange = Boolean(requireFirstLoginPasswordChange);
          const newUser = await prisma.user.create({
            data: {
              email: loginIdentifier,
              fullName: row.fullName,
              role: "STUDENT",
              passwordHash,
              isActive: true,
              emailVerified: Boolean(row.emailFromFile),
              accountStatus: mustChange ? "MUST_CHANGE_PASSWORD" : "ACTIVE",
              resetTokenHash: mustChange ? "FORCE_CHANGE_ON_FIRST_LOGIN" : null,
            },
          });

          if (studentRole) {
            await prisma.userRoleAssignment.upsert({
              where: {
                userId_roleId: {
                  userId: newUser.id,
                  roleId: studentRole.id,
                },
              },
              update: {},
              create: {
                userId: newUser.id,
                roleId: studentRole.id,
                assignedBy: session.user.email,
              },
            });
          }

          const newProfile = await prisma.studentProfile.create({
            data: {
              userId: newUser.id,
              studentCode: row.studentCode,
              gradeLevel: row.gradeLevel,
              classId: schoolClass.id,
              dateOfBirth: row.dateOfBirth,
              gender: row.gender,
            },
          });

          await prisma.enrollment.create({
            data: {
              studentId: newProfile.id,
              classId: schoolClass.id,
              academicYearId: academicYear.id,
              status: "ACTIVE",
            },
          });

          issuedCredentials.push({
            studentCode: row.studentCode,
            fullName: row.fullName,
            className: row.className,
            temporaryPassword: temporaryPassword
              ? temporaryPassword
              : "(Theo mật khẩu khởi tạo đợt thí điểm)",
          });
          createdCount++;
        } catch (rowErr: any) {
          failedCount++;
          rowErrors.push({
            studentCode: row.studentCode,
            reason: rowErr.message || "Lỗi ghi CSDL",
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.role,
          action: "STUDENT_EXCEL_IMPORT_COMMITTED",
          resource: "STUDENT_PROFILE",
          status: "SUCCESS",
          details: JSON.stringify({
            academicYear: "2026-2027",
            createdCount,
            skippedDuplicateCount,
            failedCount,
            passwordMode: useCustomInitial ? "CUSTOM_INITIAL" : "RANDOM_TEMP",
            classes: Array.from(classesCreatedOrUpdated),
          }),
        },
      });

      const allUsers = await prisma.user.findMany({
        include: {
          studentProfile: { include: { schoolClass: true } },
          teacherProfile: true,
          parentProfile: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        summary: {
          academicYear: "2026-2027",
          createdCount,
          updatedIdempotentCount: skippedDuplicateCount,
          skippedDuplicateCount,
          failedCount,
          classesAffected: Array.from(classesCreatedOrUpdated),
          rowErrors,
          issuedCredentials,
        },
        users: allUsers,
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

