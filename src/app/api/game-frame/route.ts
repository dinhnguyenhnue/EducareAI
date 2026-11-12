import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  STRICT_GAME_CSP,
  wrapHtmlWithStrictCsp,
} from "@/lib/html-game-sandbox";

function buildIsolatedHtmlResponse(rawHtml: string, status: number = 200) {
  const body = wrapHtmlWithStrictCsp(rawHtml);
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `${STRICT_GAME_CSP} frame-ancestors 'self';`,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const versionId = searchParams.get("versionId");

  if (slug) {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: { versions: true },
    });

    if (!project || project.status !== "APPROVED" || !project.approvedVersionId) {
      return buildIsolatedHtmlResponse(
        "<p>Trò chơi chưa được duyệt công khai hoặc đã tạm ẩn.</p>",
        404
      );
    }

    const approvedVersion = project.versions.find(
      (v) => v.id === project.approvedVersionId && v.status === "APPROVED"
    );

    if (!approvedVersion) {
      return buildIsolatedHtmlResponse(
        "<p>Không tìm thấy phiên bản đã duyệt hợp lệ.</p>",
        404
      );
    }

    return buildIsolatedHtmlResponse(approvedVersion.htmlSourceCode, 200);
  }

  if (versionId) {
    const session = await getServerSession();
    if (!session) {
      return buildIsolatedHtmlResponse("<p>Vui lòng đăng nhập.</p>", 401);
    }

    const version = await prisma.projectVersion.findUnique({
      where: { id: versionId },
      include: { project: true },
    });

    if (!version) {
      return buildIsolatedHtmlResponse("<p>Không tìm thấy phiên bản.</p>", 404);
    }

    const isTeacherOrAdmin =
      session.role === "TEACHER" ||
      session.role === "SCHOOL_ADMIN" ||
      session.role === "SUPER_ADMIN";
    const isOwner = version.project.authorId === session.user.id;
    const isPublicApproved =
      version.project.status === "APPROVED" &&
      version.project.approvedVersionId === version.id &&
      version.status === "APPROVED";

    if (!isTeacherOrAdmin && !isOwner && !isPublicApproved) {
      return buildIsolatedHtmlResponse(
        "<p>Bạn không có quyền truy cập phiên bản chưa duyệt này.</p>",
        403
      );
    }

    return buildIsolatedHtmlResponse(version.htmlSourceCode, 200);
  }

  return buildIsolatedHtmlResponse("<p>Thiếu tham số slug hoặc versionId.</p>", 400);
}

