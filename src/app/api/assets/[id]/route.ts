import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTeacherClassScope } from "@/lib/submission-guard";
import { STRICT_GAME_CSP, wrapHtmlWithStrictCsp } from "@/lib/html-game-sandbox";
import { sanitizeDisplayFileName } from "@/lib/asset-validation";
import fs from "fs/promises";
import path from "path";

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), ".local-storage");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED: Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset || asset.quarantineStatus !== "CLEAN_PUBLISHED") {
    return NextResponse.json(
      { error: "Không tìm thấy tệp học liệu hợp lệ." },
      { status: 404 }
    );
  }

  // Enforce Teacher class scope
  if (session.role === "TEACHER" && asset.classId) {
    const scopeCheck = await verifyTeacherClassScope(
      session.user.id,
      session.role,
      asset.classId
    );
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: scopeCheck.message || scopeCheck.reason, code: scopeCheck.code },
        { status: scopeCheck.status || 403 }
      );
    }
  }

  // Enforce Student class/submission ownership scope
  if (session.role === "STUDENT") {
    if (asset.submissionId && asset.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN: Học sinh không được tải tệp bài nộp của học sinh khác." },
        { status: 403 }
      );
    }
    if (asset.classId) {
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
      if (allowedKeys.size > 0 && !allowedKeys.has(asset.classId)) {
        return NextResponse.json(
          { error: "FORBIDDEN_CLASS_SCOPE: Học sinh không được truy cập tệp của lớp khác." },
          { status: 403 }
        );
      }
    }
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";

  const filePath = path.join(LOCAL_STORAGE_ROOT, ...asset.storageKey.split("/"));
  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json(
      { error: "Tệp vật lý không tồn tại trên kho lưu trữ cục bộ." },
      { status: 404 }
    );
  }

  if (asset.previewMode === "SANDBOX_HTML" && !download) {
    const safeHtml = wrapHtmlWithStrictCsp(fileBuffer.toString("utf8"));
    return new NextResponse(safeHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": `${STRICT_GAME_CSP} frame-ancestors 'self';`,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  }

  const safeName = sanitizeDisplayFileName(asset.originalFilename);
  const forceDownload = download || asset.previewMode === "DOWNLOAD_ONLY";
  const disposition = forceDownload
    ? `attachment; filename="${encodeURIComponent(safeName)}"`
    : `inline; filename="${encodeURIComponent(safeName)}"`;

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
