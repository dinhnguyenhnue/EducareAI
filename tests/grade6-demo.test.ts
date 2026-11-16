import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { GRADE6_DEMO } from "../src/lib/grade6-demo";
import { createDemoGame } from "../src/lib/demo-game-html";
import { wrapHtmlWithStrictCsp } from "../src/lib/html-game-sandbox";
import { buildReviewPrompt, REVIEW_KINDS } from "../src/lib/review-prompts";
import { readReviewResponse } from "../src/lib/review-response";
import { EDUCARE_DRIVE_FOLDER_TREE } from "../src/lib/google-workspace";

test("AI response accepts completed model text and rejects incomplete/thought output", () => {
  const steps = [
    { type: "thought", content: [{ type: "text", text: "hidden" }] },
    { type: "model_output", content: [{ type: "text", text: "Đề ôn tập" }] },
  ];
  assert.equal(readReviewResponse({ status: "completed", steps }), "Đề ôn tập");
  assert.equal(readReviewResponse({ status: "incomplete", steps }), "");
  assert.equal(readReviewResponse(null), "");
});

test("GRADE6_DEMO subjects follow KNTT Tap 1 metadata, chapter maps and 2x8 games", () => {
  assert.equal(GRADE6_DEMO.length, 2);
  for (const subject of GRADE6_DEMO) {
    assert.equal(subject.bookSeries, "Kết nối tri thức với cuộc sống");
    assert.equal(subject.pageOffset, 1);
    assert.ok(subject.isbn.startsWith("978-604-0-"));
    assert.ok(subject.localRelativePath.startsWith("SGK/Lop_6/"));
    assert.ok(subject.driveTargetPath.startsWith("EDUCARE_AI/02_HOC_LIEU/"));
    assert.ok(subject.chapters.length >= 5);
    assert.equal(subject.games.length, 2);
    for (const game of subject.games) {
      assert.equal(game.questions.length, 8);
    }
  }
});

test("all four KNTT games score only first answers, finish and reset", () => {
  for (const subject of GRADE6_DEMO)
    for (const game of subject.games) {
      const elements = new Map<string, any>();
      const element = () => ({
        textContent: "",
        disabled: false,
        value: 0,
        max: 0,
        children: [] as any[],
        onclick: () => {},
        replaceChildren() {
          this.children = [];
        },
        append(child: any) {
          this.children.push(child);
        },
      });
      const document = {
        getElementById(id: string) {
          if (!elements.has(id)) elements.set(id, element());
          return elements.get(id);
        },
        createElement: element,
      };
      const html = createDemoGame(game.title, game.questions);
      const script = html.match(/<script>([\s\S]*)<\/script>/)![1];
      vm.runInNewContext(script, { document });
      const next = document.getElementById("next");
      next.onclick();
      game.questions.forEach((q) => {
        assert.equal(new Set(q.options).size, 4);
        assert.ok(q.answer >= 0 && q.answer < 4);
        const options = document.getElementById("options").children;
        options[q.answer].onclick();
        options[q.answer].onclick();
        assert.match(document.getElementById("feedback").textContent, /Đúng/);
        next.onclick();
      });
      assert.equal(
        document.getElementById("question").textContent,
        `Hoàn thành: ${game.questions.length}/${game.questions.length} điểm`
      );
      next.onclick();
      const wrong = (game.questions[0].answer + 1) % 4;
      document.getElementById("options").children[wrong].onclick();
      assert.match(document.getElementById("feedback").textContent, /Chưa đúng/);
      assert.equal(document.getElementById("progress").value, 0);
      assert.match(wrapHtmlWithStrictCsp(html), /Content-Security-Policy/);
    }
});

test("game data cannot terminate the script tag", () => {
  const html = createDemoGame("</script><script>alert(1)</script>", []);
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.ok(html.includes("\\u003c/script>"));
});

test("prompt preserves source, specifies KNTT and demands honest citations", () => {
  const prompt = buildReviewPrompt({
    subject: "Toán",
    topic: "ƯCLN",
    kind: "exam",
    sourceText: "Nguồn kiểm thử",
  });
  assert.match(prompt, /Nguồn kiểm thử/);
  assert.match(prompt, /Kết nối tri thức với cuộc sống/);
  assert.match(prompt, /trang PDF/);
  assert.match(prompt, /10 điểm/);
  assert.match(prompt, /không sinh câu hỏi ngoài nguồn/);
  assert.equal(Object.keys(REVIEW_KINDS).length, 5);
});

test("EDUCARE_DRIVE_FOLDER_TREE and sgk-kntt-manifest align for Grade 6 Tap 1", async () => {
  const folderPaths = new Set(EDUCARE_DRIVE_FOLDER_TREE.map((f) => f.folderPath));
  assert.ok(folderPaths.has("EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6/Tap_1"));
  assert.ok(folderPaths.has("EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6/Tap_1"));

  const rawManifest = await fs.readFile(
    path.join(process.cwd(), "SGK", "sgk-kntt-manifest.json"),
    "utf-8"
  );
  const manifest = JSON.parse(rawManifest);
  assert.equal(manifest.bookSeries, "Kết nối tri thức với cuộc sống");
  assert.equal(manifest.items.length, 2);
  for (const subject of GRADE6_DEMO) {
    const found = manifest.items.find(
      (i: any) => i.subjectCode === subject.subjectCode
    );
    assert.ok(found, `Missing manifest entry for ${subject.subjectCode}`);
    assert.equal(found.isbn, subject.isbn);
    assert.equal(found.localRelativePath, subject.localRelativePath);
    assert.equal(found.driveTargetPath, subject.driveTargetPath);
  }
});
