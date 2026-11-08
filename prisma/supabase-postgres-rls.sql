-- ============================================================================
-- EDUCARE AI - SUPABASE (POSTGRESQL + PGVECTOR + RLS) UNIFIED ARCHITECTURE SQL
-- ============================================================================
-- Tier 1: Supabase PostgreSQL (Source of Truth for Users, Classes, RBAC, Grades,
--         Submissions, Question Bank, AI Usage Logs, and Google Drive/Sheets IDs)
-- Tier 2: Google Sheets (Automated Class Tracking & KPI Reporting Mirror)
-- Tier 3: Google Drive (6-Folder Learning Resource & Encrypted Backup Storage)
-- ============================================================================

-- 1. Enable required PostgreSQL extensions on Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. RAG Knowledge Chunk table with pgvector (1536-dim / 768-dim Gemini embeddings)
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectCode" TEXT NOT NULL DEFAULT 'TIN7',
  "gradeLevel" INTEGER NOT NULL DEFAULT 7,
  "topicName" TEXT NOT NULL,
  "lessonTitle" TEXT NOT NULL,
  "sourceBook" TEXT NOT NULL,
  "sourcePage" TEXT,
  "driveFileId" TEXT,
  "contentText" TEXT NOT NULL,
  "embedding" vector(768),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_knowledge_chunk_subject_grade"
  ON "KnowledgeChunk" ("subjectCode", "gradeLevel");

-- 3. Row-Level Security (RLS) Policies for Multi-Role Isolation (SRS Section 10.2)
-- Students only read their own grades/submissions;
-- Parents only read their linked child's records (and NEVER read AI Tutor private chat logs);
-- Teachers only access classes assigned to them;
-- Super Admin (dinhnguyenhnue@gmail.com) has full audit-logged access.

ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemBackupRecord" ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only view their own Grades
CREATE POLICY "student_read_own_grades" ON "Grade"
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT "userId" FROM "StudentProfile" WHERE "id" = "Grade"."studentId"
    )
  );

-- Policy: Parents can only view Grades of their verified linked children
CREATE POLICY "parent_read_linked_child_grades" ON "Grade"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ParentStudent" ps
      JOIN "ParentProfile" pp ON pp."id" = ps."parentId"
      WHERE ps."studentId" = "Grade"."studentId"
        AND ps."isVerified" = true
        AND pp."userId" = auth.uid()::text
    )
  );

-- Policy: Only SUPER_ADMIN and SCHOOL_ADMIN can access SystemBackupRecord
CREATE POLICY "admin_only_system_backups" ON "SystemBackupRecord"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."id" = auth.uid()::text
        AND u."role" IN ('SUPER_ADMIN', 'SCHOOL_ADMIN')
    )
  );

