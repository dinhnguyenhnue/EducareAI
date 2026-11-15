import crypto from "crypto";

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

/**
 * Hashes a plaintext password using Node.js crypto.scrypt with a unique random salt.
 * Format: scrypt$<saltHex>$<hashHex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, expectedHashHex] = parts;
  const expectedKey = Buffer.from(expectedHashHex, "hex");

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, expectedKey.length, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const matches = crypto.timingSafeEqual(expectedKey, derivedKey);
        resolve(matches);
      } catch {
        resolve(false);
      }
    });
  });
}

const TEMP_PASSWORD_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Generates a cryptographically random temporary password for student accounts.
 * Uses unambiguous characters (excludes 0/O, 1/l/I) so students can type it accurately on first login.
 * Never persisted in plaintext.
 */
export function generateTemporaryStudentPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let body = "";
  for (let i = 0; i < length; i++) {
    body += TEMP_PASSWORD_CHARSET[bytes[i] % TEMP_PASSWORD_CHARSET.length];
  }
  return `Hs-${body.slice(0, 4)}-${body.slice(4)}`;
}

/**
 * Checks if a user account is flagged to require a mandatory password change on login.
 */
export function isMustChangePassword(user?: {
  accountStatus?: string | null;
  resetTokenHash?: string | null;
} | null): boolean {
  if (!user) return false;
  return (
    user.accountStatus === "MUST_CHANGE_PASSWORD" ||
    user.resetTokenHash === "FORCE_CHANGE_ON_FIRST_LOGIN"
  );
}

/**
 * Checks whether the stored User.email field holds an internal student code (no real email address).
 */
export function isInternalStudentCodeIdentifier(emailOrIdentifier?: string | null): boolean {
  if (!emailOrIdentifier) return true;
  const trimmed = emailOrIdentifier.trim();
  if (!trimmed.includes("@")) return true;
  if (trimmed.toLowerCase().endsWith("@no-email.internal.unigo")) return true;
  return false;
}

/**
 * Normalizes a student code used as a login username.
 */
export function normalizeStudentCodeUsername(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

