/**
 * Edge & Node compatible HMAC-SHA256 Session Token Signer & Verifier
 * Used by Next.js middleware.ts and Server/API routes to protect HttpOnly cookies.
 */

export type SystemRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "COMMUNITY_USER";

export type ViewRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface SessionTokenPayload {
  sessionId: string;
  userId: string;
  email: string;
  fullName: string;
  role: SystemRole;
  activeViewRole: ViewRole;
  csrfToken: string;
  exp: number; // Unix timestamp in seconds
}

export const SESSION_COOKIE_NAME = "educare_session";
export const CSRF_COOKIE_NAME = "educare_csrf";

function getSecretKeyString(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    "educare-ai-unigo-super-secret-key-2026-phase-2-5"
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSecretKeyString());
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSessionToken(payload: SessionTokenPayload): Promise<string> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(payload));
  const payloadB64 = base64UrlEncode(jsonBytes);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionTokenPayload | null> {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  try {
    const encoder = new TextEncoder();
    const key = await getCryptoKey();
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as SessionTokenPayload;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSec) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function mapSystemRoleToDefaultViewRole(role: string): ViewRole {
  if (role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "ADMIN") {
    return "ADMIN";
  }
  if (role === "TEACHER") return "TEACHER";
  if (role === "PARENT") return "PARENT";
  return "STUDENT";
}

export function getDefaultHomePathForRole(role: string, activeViewRole?: ViewRole): string {
  if (role === "SUPER_ADMIN" && (!activeViewRole || activeViewRole === "ADMIN")) {
    return "/admin/overview";
  }
  const effectiveView = activeViewRole || mapSystemRoleToDefaultViewRole(role);
  switch (effectiveView) {
    case "ADMIN":
      return role === "SUPER_ADMIN" ? "/admin/overview" : "/quan-tri/tong-quan";
    case "TEACHER":
      return "/giao-vien/tong-quan";
    case "PARENT":
      return "/phu-huynh/tong-quan";
    case "STUDENT":
    default:
      return "/hoc-sinh/tong-quan";
  }
}

