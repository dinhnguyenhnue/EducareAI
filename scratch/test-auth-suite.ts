import { hashPassword, verifyPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { validateGoogleIdTokenClaims, SUPER_ADMIN_EMAIL } from "../src/lib/auth";
import crypto from "crypto";

async function runTestSuite() {
  console.log("=== BẮT ĐẦU KIỂM THỬ XÁC THỰC THỰC TẾ EDUCARE AI ===");
  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  // 1. Password Hashing & Timing-safe Verification
  const testPass = "Educare@Unigo2026";
  const hash = await hashPassword(testPass);
  assert("Hash format is scrypt$<salt>$<key>", hash.startsWith("scrypt$"));
  const correctMatch = await verifyPassword(testPass, hash);
  assert("Verify correct password matches", correctMatch === true);
  const wrongMatch = await verifyPassword("WrongPassword123", hash);
  assert("Verify wrong password rejected", wrongMatch === false);

  // 2. Real Database Super Admin Account Verification
  const superAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });
  assert("Super Admin user exists in DB", superAdmin !== null);
  assert("Super Admin email is dinhnguyenhnue@gmail.com", superAdmin?.email === "dinhnguyenhnue@gmail.com");
  assert("Super Admin role is SUPER_ADMIN", superAdmin?.role === "SUPER_ADMIN");
  assert("Super Admin accountStatus is ACTIVE", superAdmin?.accountStatus === "ACTIVE");
  assert("Super Admin password is encrypted (not plaintext)", superAdmin?.passwordHash?.startsWith("scrypt$") === true);
  const superAdminPassMatch = await verifyPassword(testPass, superAdmin?.passwordHash);
  assert("Super Admin authenticates with Educare@Unigo2026", superAdminPassMatch === true);

  // 3. Google ID Token Validator
  const fakeClientId = "1069212090652-t0cdo2f0oii3286478476mc7369i3d2c.apps.googleusercontent.com";
  const validClaims = {
    iss: "https://accounts.google.com",
    aud: fakeClientId,
    sub: "google-sub-1234567890",
    email: "dinhnguyenhnue@gmail.com",
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const valResult = validateGoogleIdTokenClaims(validClaims, fakeClientId);
  assert("Valid Google ID Token claims accepted", valResult.valid === true);

  const expiredClaims = { ...validClaims, exp: Math.floor(Date.now() / 1000) - 3600 };
  const expResult = validateGoogleIdTokenClaims(expiredClaims, fakeClientId);
  assert("Expired Google ID Token claims rejected", expResult.valid === false);

  const unverifiedEmailClaims = { ...validClaims, email_verified: false };
  const unverResult = validateGoogleIdTokenClaims(unverifiedEmailClaims, fakeClientId);
  assert("Unverified Google email claims rejected", unverResult.valid === false);

  // 4. Forgot Password & Reset Password Backend
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiry = new Date(Date.now() + 3600000);

  // Set reset token on a test student
  const testStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (testStudent) {
    await prisma.user.update({
      where: { id: testStudent.id },
      data: { resetTokenHash, resetTokenExpiry: expiry },
    });

    const foundForReset = await prisma.user.findFirst({
      where: { resetTokenHash, resetTokenExpiry: { gt: new Date() } },
    });
    assert("Find user by valid reset token hash", foundForReset?.id === testStudent.id);

    // Expired token test
    const foundExpired = await prisma.user.findFirst({
      where: { resetTokenHash, resetTokenExpiry: { gt: new Date(Date.now() + 7200000) } },
    });
    assert("Expired reset token query returns null", foundExpired === null);

    // Clean up test token
    await prisma.user.update({
      where: { id: testStudent.id },
      data: { resetTokenHash: null, resetTokenExpiry: null },
    });
  }

  console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${passed}/${total} TESTS PASSED ===`);
  process.exit(passed === total ? 0 : 1);
}

runTestSuite().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
