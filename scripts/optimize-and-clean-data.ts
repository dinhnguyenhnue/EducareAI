import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const sizeBefore = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

  console.log("=================================================================");
  console.log("BẮT ĐẦU DỌN DẸP DỮ LIỆU DƯ THỪA & TỐI ƯU HÓA TỐC ĐỘ HỆ THỐNG");
  console.log("=================================================================");
  console.log(`Kích thước prisma/dev.db trước khi tối ưu: ${(sizeBefore / 1024).toFixed(1)} KB`);

  // 1. Delete expired or revoked AuthSession records
  const deletedSessions = await prisma.authSession.deleteMany({
    where: {
      OR: [{ isRevoked: true }, { expiresAt: { lte: new Date() } }],
    },
  });
  console.log(`1. Đã xóa phiên đăng nhập hết hạn/thu hồi (AuthSession): ${deletedSessions.count} bản ghi`);

  // 2. Deduplicate AuditLog records (keep the latest entry per unique action + actorEmail + status)
  const allAuditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
  });
  const seenAuditKeys = new Set<string>();
  const duplicateAuditIds: string[] = [];
  for (const log of allAuditLogs) {
    const key = `${log.action}|${log.actorEmail || ""}|${log.status}`;
    if (seenAuditKeys.has(key)) {
      duplicateAuditIds.push(log.id);
    } else {
      seenAuditKeys.add(key);
    }
  }
  if (duplicateAuditIds.length > 0) {
    await prisma.auditLog.deleteMany({
      where: { id: { in: duplicateAuditIds } },
    });
  }
  console.log(`2. Đã xóa bản ghi AuditLog trùng lặp từ các lần chạy test: ${duplicateAuditIds.length} bản ghi`);

  // 3. Deduplicate ModerationLog records (keep latest per targetType + targetId + action)
  const allModLogs = await prisma.moderationLog.findMany({
    orderBy: { createdAt: "desc" },
  });
  const seenModKeys = new Set<string>();
  const duplicateModIds: string[] = [];
  for (const m of allModLogs) {
    const key = `${m.targetType}|${m.targetId}|${m.action}`;
    if (seenModKeys.has(key)) {
      duplicateModIds.push(m.id);
    } else {
      seenModKeys.add(key);
    }
  }
  if (duplicateModIds.length > 0) {
    await prisma.moderationLog.deleteMany({
      where: { id: { in: duplicateModIds } },
    });
  }
  console.log(`3. Đã xóa bản ghi ModerationLog trùng lặp: ${duplicateModIds.length} bản ghi`);

  // 4. Clean up any finished test Attempts created during automated verification
  const deletedTestAttempts = await prisma.attempt.deleteMany({
    where: { idempotencyKey: { startsWith: "TEST-IDEMPOTENT-KEY-" } },
  });
  console.log(`4. Đã dọn lượt làm bài test tự động (Attempt): ${deletedTestAttempts.count} bản ghi`);

  // 5. Deduplicate Grades (ensure 1 grade per submissionId)
  const allGrades = await prisma.grade.findMany({
    orderBy: { recordedAt: "desc" },
  });
  const seenSubIds = new Set<string>();
  const duplicateGradeIds: string[] = [];
  for (const g of allGrades) {
    if (g.submissionId) {
      if (seenSubIds.has(g.submissionId)) {
        duplicateGradeIds.push(g.id);
      } else {
        seenSubIds.add(g.submissionId);
      }
    }
  }
  if (duplicateGradeIds.length > 0) {
    await prisma.grade.deleteMany({
      where: { id: { in: duplicateGradeIds } },
    });
  }
  console.log(`5. Đã xóa bản ghi Điểm (Grade) trùng lặp: ${duplicateGradeIds.length} bản ghi`);

  // 6. Run SQLite WAL mode, VACUUM & ANALYZE to compact database pages and optimize query planner
  await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
  await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
  await prisma.$executeRawUnsafe(`VACUUM;`);
  await prisma.$executeRawUnsafe(`ANALYZE;`);
  await prisma.$queryRawUnsafe(`PRAGMA optimize;`);

  // 7. Remove stale TypeScript incremental build cache (tsconfig.tsbuildinfo - 141 KB)
  const tsBuildInfoPath = path.join(process.cwd(), "tsconfig.tsbuildinfo");
  if (fs.existsSync(tsBuildInfoPath)) {
    fs.unlinkSync(tsBuildInfoPath);
    console.log("6. Đã xóa file cache biên dịch dư thừa tsconfig.tsbuildinfo (~141 KB)");
  }

  const sizeAfter = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
  console.log(`Kích thước prisma/dev.db sau khi VACUUM & tối ưu: ${(sizeAfter / 1024).toFixed(1)} KB`);
  console.log("=================================================================");
  console.log("HOÀN TẤT DỌN DẸP & TỐI ƯU HÓA TỐC ĐỘ!");
  console.log("=================================================================");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
