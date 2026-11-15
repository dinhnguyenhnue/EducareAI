import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateTemporaryStudentPassword,
  hashPassword,
  verifyPassword,
  isMustChangePassword,
  isInternalStudentCodeIdentifier,
  normalizeStudentCodeUsername,
} from "../src/lib/password";
import { parseCsvToStudents } from "../src/lib/excel-parser";
import {
  GOOGLE_SCOPES,
  buildGoogleOAuthUrl,
  getGeminiServerConfig,
  redactStudentPiiForExternalAi,
} from "../src/lib/google-workspace";

describe("Student Account Without Email, First-Login Password Change & Google/Gemini Readiness", () => {
  it("normalizes student code as login username without fabricating fake emails (@unigo.edu.vn or @no-email.internal.unigo)", () => {
    const code = normalizeStudentCodeUsername("  hs2026-0701 ");
    assert.equal(code, "HS2026-0701");
    assert.equal(isInternalStudentCodeIdentifier(code), true);
    assert.equal(code.includes("@"), false);
    assert.equal(
      isInternalStudentCodeIdentifier("thay.tuan@gmail.com"),
      false
    );
  });

  it("generates random temporary password, stores only scrypt hash, and enforces first-login password change", async () => {
    const tempPass1 = generateTemporaryStudentPassword();
    const tempPass2 = generateTemporaryStudentPassword();
    assert.notEqual(tempPass1, tempPass2);
    assert.ok(tempPass1.length >= 10);

    const hashedTemp = await hashPassword(tempPass1);
    assert.ok(hashedTemp.startsWith("scrypt$"));
    assert.equal(hashedTemp.includes(tempPass1), false);

    // Simulate newly created student user record
    const studentUser = {
      id: "student-1",
      email: "HS2026-0701", // Direct studentCode, no fake email domain
      accountStatus: "MUST_CHANGE_PASSWORD",
      resetTokenHash: "FORCE_CHANGE_ON_FIRST_LOGIN",
      passwordHash: hashedTemp,
    };

    assert.equal(isMustChangePassword(studentUser), true);
    assert.equal(
      await verifyPassword(tempPass1, studentUser.passwordHash),
      true
    );
    assert.equal(
      await verifyPassword("WrongPassword123", studentUser.passwordHash),
      false
    );

    // Simulate student changing password on first login
    const newStudentPassword = "MatKhauMoiAnToan#2026";
    const newHashed = await hashPassword(newStudentPassword);
    studentUser.passwordHash = newHashed;
    studentUser.accountStatus = "ACTIVE";
    studentUser.resetTokenHash = "";

    assert.equal(isMustChangePassword(studentUser), false);
    assert.equal(
      await verifyPassword(tempPass1, studentUser.passwordHash),
      false
    );
    assert.equal(
      await verifyPassword(newStudentPassword, studentUser.passwordHash),
      true
    );

    // Simulate admin resetting forgotten student password
    const resetTempPass = generateTemporaryStudentPassword();
    studentUser.passwordHash = await hashPassword(resetTempPass);
    studentUser.accountStatus = "MUST_CHANGE_PASSWORD";
    studentUser.resetTokenHash = "FORCE_CHANGE_ON_FIRST_LOGIN";

    assert.equal(isMustChangePassword(studentUser), true);
    assert.equal(
      await verifyPassword(resetTempPass, studentUser.passwordHash),
      true
    );
  });

  it("validates CSV/Excel student import: keeps emailFromFile null, catches duplicate codes and missing codes/classes", () => {
    const csv = [
      "Mã HS,Họ và Tên,Lớp,Khối,Ngày sinh,Giới tính",
      "HS2026-0701,Nguyễn Minh Anh,7A1,7,12/05/2014,Nữ",
      "HS2026-0701,Trần Trùng Mã,7A1,7,20/06/2014,Nam",
      ",Học Sinh Thiếu Mã,7A2,7,11/11/2014,Nữ",
      "HS2026-0702,Lê Hoàng Nam,,7,03/02/2014,Nam",
    ].join("\n");

    const parsed = parseCsvToStudents("test_students.csv", csv);
    assert.equal(parsed.validRows.length, 1);
    assert.equal(parsed.invalidRows.length, 3);

    const validStudent = parsed.validRows[0];
    assert.equal(validStudent.studentCode, "HS2026-0701");
    assert.equal(validStudent.className, "7A1");
    assert.equal(validStudent.emailFromFile, null);

    const duplicateRow = parsed.invalidRows[0];
    assert.ok(
      duplicateRow.errors.some((e) => e.includes("Trùng mã học sinh"))
    );

    const missingCodeRow = parsed.invalidRows[1];
    assert.ok(
      missingCodeRow.errors.some((e) => e.includes("Thiếu Mã học sinh hợp lệ"))
    );

    const missingClassRow = parsed.invalidRows[2];
    assert.ok(
      missingClassRow.errors.some((e) => e.includes("Thiếu tên Lớp học"))
    );
  });

  it("requests only least-privilege OAuth scopes and redacts student PII before external AI calls", () => {
    assert.deepEqual(GOOGLE_SCOPES.DRIVE, [
      "https://www.googleapis.com/auth/drive.file",
    ]);
    assert.ok(
      GOOGLE_SCOPES.CLASSROOM.includes(
        "https://www.googleapis.com/auth/classroom.courses.readonly"
      )
    );
    assert.equal(
      GOOGLE_SCOPES.CLASSROOM.includes(
        "https://www.googleapis.com/auth/classroom.courses"
      ),
      false
    );

    // Basic login OAuth URL only requests openid, email, profile by default
    const basicOAuthUrl = buildGoogleOAuthUrl([]);
    assert.ok(basicOAuthUrl.includes("scope=openid+email+profile"));
    assert.equal(basicOAuthUrl.includes("drive"), false);

    // Redact student PII (studentCode, email, phone) before external AI call
    const rawPrompt =
      "Em là HS2026-0701 (email minhanh@gmail.com, SĐT 0912345678), thầy giúp em bài thuật toán sắp xếp.";
    const redacted = redactStudentPiiForExternalAi(rawPrompt);
    assert.equal(redacted.includes("HS2026-0701"), false);
    assert.equal(redacted.includes("minhanh@gmail.com"), false);
    assert.equal(redacted.includes("0912345678"), false);
    assert.ok(redacted.includes("[MA_HS_DA_AN]"));
    assert.ok(redacted.includes("[EMAIL_DA_AN]"));
    assert.ok(redacted.includes("[SDT_DA_AN]"));

    const geminiCfg = getGeminiServerConfig();
    assert.equal(typeof geminiCfg.isConfigured, "boolean");
    assert.ok(geminiCfg.modelName.length > 0);
  });

  it("4. AEAD AES-256-GCM secret encryption round-trip, tamper detection & missing key rejection", async () => {
    const {
      hasServerEncryptionKey,
      encryptSecret,
      decryptSecret,
      maskIdentifierPreview,
    } = await import("../src/lib/secret-crypto");

    const prevKey = process.env.APP_ENCRYPTION_KEY;
    try {
      delete process.env.APP_ENCRYPTION_KEY;
      assert.equal(hasServerEncryptionKey(), false);
      assert.throws(() => encryptSecret("GOCSPX-secret-value"), /ENCRYPTION_KEY_MISSING/);

      process.env.APP_ENCRYPTION_KEY = "test-strong-encryption-key-for-unit-tests-2026";
      assert.equal(hasServerEncryptionKey(), true);

      const plaintext = "AIzaSyTestKey1234567890Secret";
      const cipher = encryptSecret(plaintext);
      assert.ok(cipher.startsWith("v1:"));
      assert.equal(cipher.includes(plaintext), false);
      assert.equal(decryptSecret(cipher), plaintext);

      // Tamper ciphertext -> must return null instead of corrupted secret
      const parts = cipher.split(":");
      assert.equal(parts.length, 4);
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3].slice(0, -2)}AA`;
      assert.equal(decryptSecret(tampered), null);

      assert.equal(
        maskIdentifierPreview("123456789012-abc.apps.googleusercontent.com"),
        "1234567890••••tent.com"
      );
    } finally {
      if (prevKey === undefined) {
        delete process.env.APP_ENCRYPTION_KEY;
      } else {
        process.env.APP_ENCRYPTION_KEY = prevKey;
      }
    }
  });

  it("5. HTML Game Play normalization clamps scores, scales to 10 & sanitizes wrongTopics", async () => {
    const { normalizeHtmlGamePlayPayload } = await import("../src/lib/game-play-recorder");

    const normalized = normalizeHtmlGamePlayPayload({
      score: 15,
      maxScore: 20,
      timeSpentSeconds: 94.6,
      wrongTopics: ["  Vòng lặp for  ", "", "   ", "Hàm đệ quy"],
      eventType: "EDUCARE_PRACTICE_EVENT",
      idempotencyKey: "gp_demo_123",
    });

    assert.equal(normalized.score10, 7.5);
    assert.equal(normalized.accuracyRate, 75);
    assert.equal(normalized.timeSpentSeconds, 95);
    assert.deepEqual(normalized.wrongTopics, ["Vòng lặp for", "Hàm đệ quy"]);
    assert.equal(normalized.idempotencyKey, "gp_demo_123");

    const clamped = normalizeHtmlGamePlayPayload({
      score: 999,
      maxScore: 10,
      timeSpentSeconds: -5,
    });
    assert.equal(clamped.score10, 10);
    assert.equal(clamped.timeSpentSeconds, 0);
  });
});
