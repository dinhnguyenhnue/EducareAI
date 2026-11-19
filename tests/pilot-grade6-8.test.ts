import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processRawSheetsToStudents } from "../src/lib/excel-parser";
import { hashPassword, verifyPassword } from "../src/lib/password";
import {
  PILOT_CURRICULUM,
  GRADE6_GEMINI_GEMS,
  STUDENT_GUIDE_PROMPTS,
} from "../src/lib/pilot-curriculum";

describe("Pilot Grade 6-8 Accounts, Curriculum & Games", () => {
  it("filters out Grade 1-5 sheets, generates consistent codes for UNIGO Excel format, and ignores parent GMAIL column", () => {
    const mockSheets = [
      {
        sheetName: "1a1",
        rows: [
          ["DANH SÁCH LỚP 1A1 NĂM HỌC 2026 - 2027"],
          ["STT", "Mã số định danh cá nhân", "Họ tên hs", "NS", "Tên PH", "ĐTLH", "GMAIL"],
          ["1.0", "", "Học Sinh Lớp 1", "29/11/2020", "Phụ Huynh A", "0900000001", "ph1@gmail.com"],
        ],
      },
      {
        sheetName: "5C1",
        rows: [
          ["DANH SÁCH LỚP 5C1 NĂM HỌC 2026 - 2027"],
          ["STT", "Họ tên hs", "NS", "GT", "Tên PH", "ĐTLH", "GMAIL"],
          ["1.0", "Học Sinh Lớp 5", "18/7/2016", "Nữ", "Phụ Huynh B", "0900000002", "ph5@gmail.com"],
        ],
      },
      {
        sheetName: "6A1",
        rows: [
          ["DANH SÁCH LỚP 6A1 NĂM HỌC 2026 - 2027"],
          ["STT", "Mã số định danh cá nhân", "Họ tên hs", "NS", "Tên PH", "ĐTLH", "GMAIL"],
          ["1.0", "", "Nguyễn Văn A", "2015-03-07 00:00:00", "Phụ Huynh 6", "0900000006", "ph6@gmail.com"],
        ],
      },
      {
        sheetName: "7A1",
        rows: [
          ["DANH SÁCH LỚP 7A1 NĂM HỌC 2026 - 2027"],
          ["Stt", "Họ tên hs", "NS", "GT", "Tên PH", "ĐTLH", "GMAIL"],
          ["1.0", "Trần Thị B", "13/09/2014", "Nữ", "Phụ Huynh 7", "0900000007", "ph7@gmail.com"],
        ],
      },
      {
        sheetName: "8A1",
        rows: [
          ["DANH SÁCH LỚP 8A1 NĂM HỌC 2026 - 2027"],
          ["STT", "Họ tên hs", "NS", "GT", "Tên PH", "ĐTLH", "GMAIL"],
          ["1.0", "Lê Văn C", "30/03/2013", "Nam", "Phụ Huynh 8", "0900000008", "ph8@gmail.com"],
        ],
      },
    ];

    const result = processRawSheetsToStudents("UNIGO_TEST.xlsx", mockSheets);

    assert.deepEqual(result.skippedNonTargetSheets, ["1a1", "5C1"]);
    assert.equal(result.skippedNonTargetCount, 2);
    assert.equal(result.validRows.length, 3);
    assert.equal(result.gradeBreakdown.grade6, 1);
    assert.equal(result.gradeBreakdown.grade7, 1);
    assert.equal(result.gradeBreakdown.grade8, 1);
    assert.deepEqual(result.classBreakdown, { "6A1": 1, "7A1": 1, "8A1": 1 });

    const s6 = result.validRows[0];
    assert.equal(s6.studentCode, "HS26-6A1-01");
    assert.equal(s6.codeGenerated, true);
    assert.equal(s6.dateOfBirth, "07/03/2015");
    assert.equal(s6.emailFromFile, null);
  });

  it("hashes pilot initial passwords securely with scrypt without storing plaintext", async () => {
    const samplePass = "TestPilot#2026";
    const hashed = await hashPassword(samplePass);
    assert.ok(hashed.startsWith("scrypt$"));
    assert.equal(hashed.includes(samplePass), false);
    assert.equal(await verifyPassword(samplePass, hashed), true);
    assert.equal(await verifyPassword("WrongPass", hashed), false);
  });

  it("provides complete SGK-verified lessons and >=10 game questions per grade (6, 7, 8)", () => {
    for (const grade of [6, 7, 8] as const) {
      const mod = PILOT_CURRICULUM[grade];
      assert.equal(mod.grade, grade);
      assert.equal(mod.sourceVerified, true);
      assert.ok(mod.lessonTitle.length > 5);
      assert.ok(mod.startupQuestion.length > 20);
      assert.ok(mod.objectives.length >= 2);
      assert.ok(mod.knowledgeSections.length >= 2);
      assert.ok(mod.examples.length >= 2);
      assert.ok(mod.keyTakeaways.length >= 2);
      assert.ok(mod.practiceItems.length >= 2);
      assert.ok(mod.applicationTasks.length >= 2);
      assert.ok(mod.illustrationNodes.length === 4);

      assert.ok(mod.game.questions.length >= 10);
      for (const q of mod.game.questions) {
        assert.ok(q.options.length === 4);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
        assert.ok(q.explanation.trim().length > 10);
      }
    }
  });

  it("includes all 3 exact Grade 6 Gemini Gem URLs and both student guide prompts", () => {
    assert.equal(GRADE6_GEMINI_GEMS.length, 3);
    const urls = GRADE6_GEMINI_GEMS.map((g) => g.url);
    assert.ok(
      urls.includes(
        "https://gemini.google.com/gem/1PKLRoijfUfwDTaphAS3Z5Cp6myY6oHjH?usp=sharing"
      )
    );
    assert.ok(
      urls.includes(
        "https://gemini.google.com/gem/1wiR7gayxW1di8utJ6W5pemqKZTF6_TZq?usp=sharing"
      )
    );
    assert.ok(
      urls.includes(
        "https://gemini.google.com/gem/1OQWZbbNYX0Rd31rxR4GSFnaZBFp_25UT?usp=sharing"
      )
    );

    const pAsk = STUDENT_GUIDE_PROMPTS.askTutor.buildPrompt(
      6,
      "Bài 1. Thông tin và dữ liệu",
      "SGK Tin học 6"
    );
    assert.ok(pAsk.includes("Lớp 6"));
    assert.ok(pAsk.includes("KHÔNG đưa ngay đáp án"));

    const pGame = STUDENT_GUIDE_PROMPTS.createGame.buildPrompt(
      6,
      "Bài 1. Thông tin và dữ liệu",
      "SGK Tin học 6"
    );
    assert.ok(pGame.includes("tối thiểu 10 câu"));
    assert.ok(pGame.includes("không thu thập thông tin cá nhân"));
  });
});
