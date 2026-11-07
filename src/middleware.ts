import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  getDefaultHomePathForRole,
} from "./lib/session-token";

const PROTECTED_PREFIXES = [
  "/admin",
  "/quan-tri",
  "/giao-vien",
  "/hoc-sinh",
  "/phu-huynh",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isRouteAllowedForRole(role: string, pathname: string): boolean {
  if (role === "SUPER_ADMIN") return true;

  if (pathname.startsWith("/admin")) {
    return false;
  }
  if (pathname.startsWith("/quan-tri")) {
    return role === "SCHOOL_ADMIN";
  }
  if (pathname.startsWith("/giao-vien")) {
    return role === "TEACHER" || role === "SCHOOL_ADMIN";
  }
  if (pathname.startsWith("/hoc-sinh")) {
    return role === "STUDENT";
  }
  if (pathname.startsWith("/phu-huynh")) {
    return role === "PARENT";
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Support /login alias -> /dang-nhap
  if (pathname === "/login") {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.search = search;
    return NextResponse.redirect(loginUrl);
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(rawToken);

  if (!session) {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!isRouteAllowedForRole(session.role, pathname)) {
    const forbiddenUrl = new URL("/khong-co-quyen", request.url);
    forbiddenUrl.searchParams.set("from", pathname);
    forbiddenUrl.searchParams.set(
      "home",
      getDefaultHomePathForRole(session.role, session.activeViewRole)
    );
    return NextResponse.redirect(forbiddenUrl);
  }

  const response = NextResponse.next();
  // Prevent browser back-button cache after logout
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/quan-tri/:path*",
    "/giao-vien/:path*",
    "/hoc-sinh/:path*",
    "/phu-huynh/:path*",
  ],
};

