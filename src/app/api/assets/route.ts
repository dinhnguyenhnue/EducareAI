import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sanitizeDisplayFileName,
  validateUploadedAsset,
} from "@/lib/asset-validation";
import { verifyTeacherClassScope } from "@/lib/submission-guard";
import fs from "fs/promises";
import path from "path";

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), ".local-storage");

async function persistAssetBuffer(storageKey: string, buffer: Buffer): Promise<void> {
  const targetPath = path.join(LOCAL_STORAGE_ROOT, ...storageKey.split("/"));
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const lessonId = searchParams.get("lessonId");
  const assignmentId = searchParams.get("assignmentId");
  const submissionId = searchParams.get("submissionId");

  if (session.role === "TEACHER" && classId) {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      classId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason, code: scopeCheck.code },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  if (session.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        schoolClass: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: { schoolClass: true },
        },
      },
    });
    const allowedClassIds = new Set<string>();
    if (profile?.classId) allowedClassIds.add(profile.classId);
    if (profile?.schoolClass?.name) allowedClassIds.add(profile.schoolClass.name);
    for (const enr of profile?.enrollments ?? []) {
      allowedClassIds.add(enr.classId);
      if (enr.schoolClass?.name) allowedClassIds.add(enr.schoolClass.name);
    }

    if (classId && allowedClassIds.size > 0 && !allowedClassIds.has(classId)) {
      return NextResponse.json(
        { error: "FORBIDDEN_CLASS_SCOPE: Học sinh không được xem học liệu của lớp khác." },
        { status: 403 }
      );
    }

    if (submissionId) {
      const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (!sub || sub.studentId !== profile?.id) {
        return NextResponse.json(
          { error: "FORBIDDEN: Học sinh không được xem tệp bài nộp của học sinh khác." },
          { status: 403 }
        );
      }
    }
  }

  const assets = await prisma.asset.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...(lessonId ? { lessonId } : {}),
      ...(assignmentId ? { assignmentId } : {}),
      ...(submissionId ? { submissionId } : {}),
      ...(session.role === "STUDENT" && !submissionId && !lessonId && !assignmentId
        ? { ownerId: session.user.id }
        : {}),
      quarantineStatus: "CLEAN_PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const normalizedAssets = assets.map((a) => ({
    ...a,
    safeFileName: sanitizeDisplayFileName(a.originalFilename),
    sha256: a.sha256Checksum,
  }));

  return NextResponse.json({ assets: normalizedAssets });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  if (session.role === "PARENT") {
    return NextResponse.json(
      { error: "FORBIDDEN: Tài khoản phụ huynh chỉ có quyền xem, không được tải tệp lên." },
      { status: 403 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  let fileName = "";
  let mimeType = "application/octet-stream";
  let buffer: Buffer | null = null;
  let classId: string | null = null;
  let academicYearId: string | null = null;
  let lessonId: string | null = null;
  let assignmentId: string | null = null;
  let submissionId: string | null = null;
  let externalDriveUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp để tải lên." },
        { status: 400 }
      );
    }
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    classId = formData.get("classId") ? String(formData.get("classId")) : null;
    academicYearId = formData.get("academicYearId")
      ? String(formData.get("academicYearId"))
      : null;
    lessonId = formData.get("lessonId") ? String(formData.get("lessonId")) : null;
    assignmentId = formData.get("assignmentId")
      ? String(formData.get("assignmentId"))
      : null;
    submissionId = formData.get("submissionId")
      ? String(formData.get("submissionId"))
      : null;
    externalDriveUrl = formData.get("externalDriveUrl")
      ? String(formData.get("externalDriveUrl"))
      : null;
  } else {
    const body = await request.json();
    fileName = String(body.fileName || "");
    mimeType = String(body.mimeType || "application/octet-stream");
    const base64Data = String(body.base64Data || "");
    buffer = Buffer.from(base64Data, "base64");
    classId = body.classId ? String(body.classId) : null;
    academicYearId = body.academicYearId ? String(body.academicYearId) : null;
    lessonId = body.lessonId ? String(body.lessonId) : null;
    assignmentId = body.assignmentId ? String(body.assignmentId) : null;
    submissionId = body.submissionId ? String(body.submissionId) : null;
    externalDriveUrl = body.externalDriveUrl ? String(body.externalDriveUrl) : null;
  }

  // Enforce Teacher class scope if uploading to a class
  if (session.role === "TEACHER" && classId) {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      classId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason, code: scopeCheck.code },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  // Enforce Student class scope if uploading a submission attachment
  if (session.role === "STUDENT") {
    if (lessonId) {
      return NextResponse.json(
        { error: "FORBIDDEN: Học sinh không được tải tệp học liệu vào bài giảng của giáo viên." },
        { status: 403 }
      );
    }
    if (classId) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          schoolClass: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { schoolClass: true },
          },
        },
      });
      const allowedKeys = new Set<string>();
      if (profile?.classId) allowedKeys.add(profile.classId);
      if (profile?.schoolClass?.name) allowedKeys.add(profile.schoolClass.name);
      for (const enr of profile?.enrollments ?? []) {
        allowedKeys.add(enr.classId);
        if (enr.schoolClass?.name) allowedKeys.add(enr.schoolClass.name);
      }
      if (allowedKeys.size > 0 && !allowedKeys.has(classId)) {
        return NextResponse.json(
          { error: "FORBIDDEN_CLASS_SCOPE: Học sinh không được tải tệp vào lớp khác." },
          { status: 403 }
        );
      }
    }
  }

  const validation = validateUploadedAsset({
    fileName,
    mimeType,
    buffer: buffer || Buffer.alloc(0),
  });

  if (!validation.ok || !validation.metadata) {
    return NextResponse.json(
      {
        error: validation.message,
        code: validation.code,
      },
      { status: 400 }
    );
  }

  const meta = validation.metadata;
  await persistAssetBuffer(meta.storageKey, buffer!);

  const created = await prisma.asset.create({
    data: {
      storageKey: meta.storageKey,
      originalFilename: meta.safeFileName,
      mimeType: meta.mimeType,
      extension: meta.extension,
      category: meta.category,
      sizeBytes: meta.sizeBytes,
      sha256Checksum: meta.sha256,
      quarantineStatus: meta.status,
      previewMode: meta.previewMode,
      driveLinkOptional: externalDriveUrl || null,
      ownerId: session.user.id,
      ownerRole: session.role,
      classId,
      academicYearId,
      lessonId,
      assignmentId,
      submissionId,
    },
  });

  return NextResponse.json(
    {
      asset: {
        ...created,
        safeFileName: meta.safeFileName,
        sha256: meta.sha256,
      },
      zipSummary: meta.zipSummary || null,
    },
    { status: 201 }
  );
}
