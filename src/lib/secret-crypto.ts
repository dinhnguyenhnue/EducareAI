import crypto from "crypto";

const AAD_CONTEXT = Buffer.from("educare-ai-secret-v1", "utf-8");

function getRawEncryptionKey(): string {
  return (process.env.APP_ENCRYPTION_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/**
 * Kiểm tra xem khóa mã hóa phía máy chủ `APP_ENCRYPTION_KEY` đã được cấu hình hợp lệ hay chưa.
 * Tuyệt đối không dùng khóa mặc định cứng trong mã nguồn.
 */
export function hasServerEncryptionKey(): boolean {
  const raw = getRawEncryptionKey();
  if (!raw || raw.length < 16) return false;
  if (
    raw === "replace-with-strong-random-key" ||
    raw.startsWith("YOUR_") ||
    raw.startsWith("replace-with")
  ) {
    return false;
  }
  return true;
}

function deriveAes256Key(): Buffer {
  if (!hasServerEncryptionKey()) {
    throw new Error(
      "ENCRYPTION_KEY_MISSING: Máy chủ chưa cấu hình APP_ENCRYPTION_KEY (>= 16 ký tự) trong biến môi trường nên không thể mã hóa bí mật vào cơ sở dữ liệu."
    );
  }
  return crypto.createHash("sha256").update(getRawEncryptionKey(), "utf-8").digest();
}

/**
 * Mã hóa chuỗi bí mật bằng AEAD AES-256-GCM (12-byte IV + 16-byte Auth Tag).
 * Định dạng lưu trữ: `v1:<iv_b64url>:<tag_b64url>:<cipher_b64url>`
 */
export function encryptSecret(plaintext: string): string {
  const cleaned = String(plaintext || "").trim();
  if (!cleaned) {
    throw new Error("EMPTY_SECRET: Không thể mã hóa chuỗi rỗng.");
  }

  const key = deriveAes256Key();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD_CONTEXT);

  const encrypted = Buffer.concat([
    cipher.update(cleaned, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `v1:${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

/**
 * Giải mã chuỗi bí mật đã mã hóa bằng AEAD AES-256-GCM.
 * Trả về `null` nếu thiếu `APP_ENCRYPTION_KEY` hoặc thẻ xác thực không khớp.
 */
export function decryptSecret(encryptedPayload?: string | null): string | null {
  if (!encryptedPayload || !encryptedPayload.startsWith("v1:")) {
    return null;
  }
  if (!hasServerEncryptionKey()) {
    return null;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 4) return null;
    const [, ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, "base64url");
    const authTag = Buffer.from(tagB64, "base64url");
    const ciphertext = Buffer.from(dataB64, "base64url");

    const key = deriveAes256Key();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(AAD_CONTEXT);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf-8");
  } catch {
    return null;
  }
}

export function maskIdentifierPreview(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 12) return `${trimmed.slice(0, 4)}••••`;
  return `${trimmed.slice(0, 10)}••••${trimmed.slice(-8)}`;
}
