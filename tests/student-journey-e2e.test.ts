import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAndNormalizeDriveMaterial,
  parseLessonDriveLinksJson,
} from "../src/lib/drive-url";
import { PILOT_CURRICULUM } from "../src/lib/pilot-curriculum";
import {
  resolveTutorCatalogForClass,
  buildVerifiedSocraticSystemPrompt,
} from "../src/lib/ai-tutor-config";
import { buildClassTrackingAttemptSheets } from "../src/lib/google-workspace";
import { verifyTeacherClassScope } from "../src/lib/submission-guard";

describe("Student Journey End-to-End Verification (Sections 1 to 5)", () => {
  it("Section 2: parses and normalizes Google Drive links (file/d, open?id, resourcekey, folders, Docs/Slides, legacy assets) and blocks SSRF/non-HTTPS", () => {
    const imgRes = parseAndNormalizeDriveMaterial({
      url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?usp=sharing&resourcekey=0-xyz987",
      title: "Minh hoa den giao thong.png",
      description: "Hình 1.1: Bạn Minh quan sát đèn giao thông",
      kindHint: "AUTO",
    });
    assert.equal(imgRes.valid, true);
    assert.equal(imgRes.kind, "IMAGE");
    assert.equal(imgRes.fileId, "1AbCdEfGhIjKlMnOpQrStUvWxYz123456");
    assert.equal(imgRes.resourceKey, "0-xyz987");
    assert.ok(
      imgRes.directImageUrl?.includes(
        "https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz123456"
      )
    );
    assert.ok(imgRes.directImageUrl?.includes("resourcekey=0-xyz987"));
    assert.ok(imgRes.embedPreviewUrl?.includes("/preview?resourcekey=0-xyz987"));

    const pdfRes = parseAndNormalizeDriveMaterial({
      url: "https://drive.google.com/open?id=1PdfFileId9876543210",
      title: "Phieu_hoc_tap_Tin6.pdf",
    });
    assert.equal(pdfRes.valid, true);
    assert.equal(pdfRes.kind, "PDF");
    assert.equal(pdfRes.directImageUrl, null);
    assert.ok(
      pdfRes.embedPreviewUrl?.includes("/file/d/1PdfFileId9876543210/preview")
    );

    const folderRes = parseAndNormalizeDriveMaterial({
      url: "https://drive.google.com/drive/folders/1FolderIdAbcDefGhiJkl",
      title: "Thư mục SGK Lớp 6",
    });
    assert.equal(folderRes.valid, true);
    assert.equal(folderRes.kind, "FOLDER");
    assert.equal(folderRes.embedPreviewUrl, null);

    const slideRes = parseAndNormalizeDriveMaterial({
      url: "https://docs.google.com/presentation/d/1SlideDeckId123456789/edit",
      title: "Bài giảng Slide Bài 1",
    });
    assert.equal(slideRes.valid, true);
    assert.equal(slideRes.kind, "SLIDE");
    assert.ok(slideRes.embedPreviewUrl?.endsWith("/preview"));

    const legacyList = parseLessonDriveLinksJson(
      JSON.stringify([
        { title: "Anh_cu.jpg", url: "/api/assets/asset_demo_01" },
        {
          title: "Tai_lieu_Drive.pdf",
          url: "https://drive.google.com/file/d/1LegacyFileId123456/view",
        },
      ])
    );
    assert.equal(legacyList.length, 2);
    assert.equal(legacyList[0].kind, "IMAGE");
    assert.equal(legacyList[1].kind, "PDF");

    const httpRejected = parseAndNormalizeDriveMaterial({
      url: "http://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view",
    });
    assert.equal(httpRejected.valid, false);

    const untrustedHostRejected = parseAndNormalizeDriveMaterial({
      url: "https://evil-attacker.example.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view",
    });
    assert.equal(untrustedHostRejected.valid, false);
  });

  it("Section 4: provides 20 verified questions per grade (60 total) across 3 distinct interaction types (MCQ, MATCH, ORDER) with zero cross-grade leakage", () => {
    const allTexts = new Set<string>();
    for (const grade of [6, 7, 8] as const) {
      const questions = PILOT_CURRICULUM[grade].game.questions;
      assert.equal(
        questions.length,
        20,
        `Grade ${grade} must have 20 verified questions`
      );

      const types = new Set(questions.map((q) => q.interactionType || "MCQ"));
      assert.ok(types.has("MCQ"), `Grade ${grade} has MCQ`);
      assert.ok(types.has("MATCH"), `Grade ${grade} has MATCH`);
      assert.ok(types.has("ORDER"), `Grade ${grade} has ORDER`);

      for (const q of questions) {
        assert.equal(
          allTexts.has(q.question),
          false,
          `Duplicate question across grades: ${q.question}`
        );
        allTexts.add(q.question);
        assert.ok(q.explanation.length > 15);
        if (q.interactionType === "MATCH") {
          assert.ok((q.matchPairs?.length || 0) >= 3);
        }
        if (q.interactionType === "ORDER") {
          assert.ok((q.orderSteps?.length || 0) >= 4);
        }
      }
    }
  });

  it("Section 5: resolves class+subject tutor configs, isolates gems per class/grade, and populates the exact Vietnamese system prompt template", () => {
    const cat6A1 = resolveTutorCatalogForClass(6, "6A1");
    const cat7A1 = resolveTutorCatalogForClass(7, "7A1");

    const tin6 = cat6A1.find((c) => c.subjectCode === "TIN6")!;
    const toan6 = cat6A1.find((c) => c.subjectCode === "TOAN6")!;
    const tin7 = cat7A1.find((c) => c.subjectCode === "TIN7")!;

    assert.ok(
      tin6.externalGemUrl?.includes("1OQWZbbNYX0Rd31rxR4GSFnaZBFp_25UT")
    );
    assert.ok(
      toan6.externalGemUrl?.includes("1PKLRoijfUfwDTaphAS3Z5Cp6myY6oHjH")
    );
    assert.equal(tin7.externalGemUrl, null);

    const cat7A1Custom = resolveTutorCatalogForClass(7, "7A1", [
      {
        className: "7A1",
        subjectCode: "TIN7",
        gemUrl: "https://gemini.google.com/gem/1CustomGem7A1TestUrl",
      },
    ]);
    const cat7A2Custom = resolveTutorCatalogForClass(7, "7A2", [
      {
        className: "7A1",
        subjectCode: "TIN7",
        gemUrl: "https://gemini.google.com/gem/1CustomGem7A1TestUrl",
      },
    ]);
    assert.equal(
      cat7A1Custom.find((c) => c.subjectCode === "TIN7")?.externalGemUrl,
      "https://gemini.google.com/gem/1CustomGem7A1TestUrl"
    );
    assert.equal(
      cat7A2Custom.find((c) => c.subjectCode === "TIN7")?.externalGemUrl,
      null
    );

    const promptNormal = buildVerifiedSocraticSystemPrompt({
      subjectName: "Tin học 6",
      gradeLevel: 6,
      anonymousClassLabel: "Khối 6 (Nhóm lớp chuẩn THCS)",
      lessonTitle: "Bài 1. Thông tin và dữ liệu",
      objective: "Phân biệt thông tin, dữ liệu và vật mang tin.",
      serverModeLabel: "HỌC TẬP & TỰ LUYỆN THÔNG THƯỜNG",
      knowledgeContext: "Thông tin là hiểu biết của con người.",
    });
    assert.ok(promptNormal.includes("Bạn là gia sư môn Tin học 6, khối 6"));
    assert.ok(
      promptNormal.includes(
        "Kết thúc bằng một câu hỏi để em tự làm bước tiếp theo."
      )
    );
    assert.ok(
      promptNormal.includes(
        "Khi có bài kiểm tra đang diễn ra, chỉ hướng dẫn khái niệm chung và giữ kín lời giải, đáp án của đề."
      )
    );
  });

  it("Section 3: records 2 submitted attempts (6/10 then 8/10), deduplicates retry, preserves 0 score, ignores IN_PROGRESS draft, separates game plays, and preserves teacher notes on Sheets sync", async () => {
    const students = [
      {
        id: "prof-hs-01",
        userId: "user-hs-01",
        studentCode: "HS26-6A1-01",
        user: { fullName: "Học Sinh Thử Nghiệm 01" },
      },
    ];

    const attempts = [
      // Attempt 1: 6/10
      {
        id: "att-stable-id-01",
        studentId: "user-hs-01",
        studentName: "Học Sinh Thử Nghiệm 01",
        attemptNumber: 1,
        status: "SUBMITTED",
        submittedAt: new Date("2026-11-18T08:00:00Z"),
        totalScore: 6,
        maxScore: 10,
        isDemoData: false,
        assessment: {
          code: "EXAM-TIN6-B1",
          subjectName: "Tin học",
          mode: "EXAM",
        },
      },
      // Attempt 2: 8/10
      {
        id: "att-stable-id-02",
        studentId: "user-hs-01",
        studentName: "Học Sinh Thử Nghiệm 01",
        attemptNumber: 2,
        status: "SUBMITTED",
        submittedAt: new Date("2026-11-18T08:15:00Z"),
        totalScore: 8,
        maxScore: 10,
        isDemoData: false,
        assessment: {
          code: "EXAM-TIN6-B1",
          subjectName: "Tin học",
          mode: "EXAM",
        },
      },
      // Duplicate replay of Attempt 2 (retry / double submit must NOT create a 3rd row)
      {
        id: "att-stable-id-02",
        studentId: "user-hs-01",
        studentName: "Học Sinh Thử Nghiệm 01",
        attemptNumber: 2,
        status: "SUBMITTED",
        submittedAt: new Date("2026-11-18T08:15:00Z"),
        totalScore: 8,
        maxScore: 10,
        isDemoData: false,
        assessment: {
          code: "EXAM-TIN6-B1",
          subjectName: "Tin học",
          mode: "EXAM",
        },
      },
      // Draft IN_PROGRESS attempt (must be excluded from submitted sheets)
      {
        id: "att-draft-id-03",
        studentId: "user-hs-01",
        studentName: "Học Sinh Thử Nghiệm 01",
        attemptNumber: 3,
        status: "IN_PROGRESS",
        submittedAt: null,
        totalScore: null,
        maxScore: 10,
        isDemoData: false,
        assessment: {
          code: "EXAM-TIN6-B1",
          subjectName: "Tin học",
          mode: "EXAM",
        },
      },
      // Valid 0/10 score attempt on a practice quiz
      {
        id: "att-zero-id-01",
        studentId: "user-hs-01",
        studentName: "Học Sinh Thử Nghiệm 01",
        attemptNumber: 1,
        status: "SUBMITTED",
        submittedAt: new Date("2026-11-18T08:20:00Z"),
        totalScore: 0,
        maxScore: 10,
        isDemoData: false,
        assessment: {
          code: "QUIZ0-TIN6-B1",
          subjectName: "Tin học",
          mode: "PRACTICE",
        },
      },
    ];

    // 1 self-practice game play (must be tracked separately, keeping exam submitted_count = 2)
    const gamePlayRecords = [{ studentId: "prof-hs-01" }];

    const sync1 = buildClassTrackingAttemptSheets({
      className: "6A1",
      academicYearName: "2026-2027",
      students,
      attempts,
      gamePlayRecords,
      previousTabsJson: null,
    });

    const examDetailRows1 = sync1.tab7_ChiTietLuotNop.rows.filter(
      (r) => r[5] === "EXAM-TIN6-B1"
    );
    assert.equal(examDetailRows1.length, 2);
    assert.equal(examDetailRows1[0][0], "att-stable-id-01");
    assert.equal(examDetailRows1[0][7], "1");
    assert.equal(examDetailRows1[0][9], "6");
    assert.equal(examDetailRows1[1][0], "att-stable-id-02");
    assert.equal(examDetailRows1[1][7], "2");
    assert.equal(examDetailRows1[1][9], "8");

    // Zero score preserved as "0"
    const zeroDetailRow = sync1.tab7_ChiTietLuotNop.rows.find(
      (r) => r[5] === "QUIZ0-TIN6-B1"
    );
    assert.ok(zeroDetailRow);
    assert.equal(zeroDetailRow![9], "0");

    // Summary row: 2 attempts, latest=8, best=8, practice_game_plays=1
    const examSummary1 = sync1.tab8_TongHopKetQua.rows.find(
      (r) => r[4] === "EXAM-TIN6-B1"
    );
    assert.ok(examSummary1);
    assert.equal(examSummary1![6], "2");
    assert.equal(examSummary1![7], "8");
    assert.equal(examSummary1![8], "8");
    assert.equal(examSummary1![11], "1");

    // Simulate teacher adding a note and re-running sync -> note preserved
    sync1.tab7_ChiTietLuotNop.rows[0][12] = "Ghi chú GV: Cần đọc kỹ đề hơn";
    const sync2 = buildClassTrackingAttemptSheets({
      className: "6A1",
      academicYearName: "2026-2027",
      students,
      attempts,
      gamePlayRecords,
      previousTabsJson: JSON.stringify(sync1),
    });
    assert.equal(
      sync2.tab7_ChiTietLuotNop.rows[0][12],
      "Ghi chú GV: Cần đọc kỹ đề hơn"
    );

    // Cross-class teacher scope check
    const mockDb: any = {
      teacherProfile: {
        findUnique: async () => ({
          id: "tp-6a1",
          homeroomClasses: [{ id: "cls-6a1", name: "6A1" }],
          assignments: [],
        }),
      },
    };
    const denied = await verifyTeacherClassScope(
      "gv-6a1",
      "TEACHER",
      "7A1",
      mockDb
    );
    assert.equal(denied.allowed, false);
    assert.equal(denied.status, 403);
  });
});
