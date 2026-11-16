import fs from "node:fs/promises";
import path from "node:path";
import { GRADE6_DEMO } from "../src/lib/grade6-demo";
import { createDemoGame } from "../src/lib/demo-game-html";
import {
  buildReviewPrompt,
  REVIEW_KINDS,
  type ReviewKind,
} from "../src/lib/review-prompts";

async function main() {
  for (const subject of GRADE6_DEMO) {
    const folder = subject.id === "toan" ? "Toan" : "Ngu_van";
    const sgkRoot = path.join(process.cwd(), "SGK", "Lop_6", folder, "Tap_1");
    await fs.mkdir(sgkRoot, { recursive: true });

    const output = path.join(process.cwd(), "output", "grade6-demo", folder);
    await fs.mkdir(output, { recursive: true });

    const tocMarkdown = subject.chapters
      .map(
        (ch) =>
          `### ${ch.title} (Trang in ${ch.printPages} | Trang PDF ${ch.pdfPages})\n- Yêu cầu cần đạt: ${ch.objectives}\n- Bài học:\n${ch.lessons.map((l) => `  - ${l}`).join("\n")}`
      )
      .join("\n\n");

    await fs.writeFile(
      path.join(output, "Hoc_lieu_va_on_tap.md"),
      `# ${subject.bookTitle} — ${subject.bookSeries}\n\n` +
        `- **Nhà xuất bản**: ${subject.publisher}\n` +
        `- **ISBN**: ${subject.isbn}\n` +
        `- **Thư mục máy**: \`${subject.localRelativePath}\`\n` +
        `- **Thư mục đích Google Drive**: \`${subject.driveTargetPath}\`\n` +
        `- **Quy tắc trang**: \`Trang PDF = Trang sách in + ${subject.pageOffset}\`\n\n` +
        `## Mục lục tham chiếu\n${tocMarkdown}\n\n` +
        `## Học liệu trọng tâm\n${subject.lesson}\n\n` +
        `## Bài tập củng cố\n${subject.exercise}\n\n` +
        `## Ôn tập Học kì I\n${subject.semester}\n\n` +
        `## Đề kiểm tra thử Học kì I\n${subject.exam}\n\n` +
        `## Đáp án & Hướng dẫn chấm\n${subject.answers}\n`
    );

    for (const [index, game] of subject.games.entries()) {
      await fs.writeFile(
        path.join(output, `Tro_choi_${index + 1}.html`),
        createDemoGame(game.title, game.questions)
      );
    }

    const sampleChapter = subject.chapters[0];
    const prompts = Object.keys(REVIEW_KINDS).map((kind) =>
      buildReviewPrompt({
        subject: subject.name,
        kind: kind as ReviewKind,
        topic: `${sampleChapter.title} (Trang in ${sampleChapter.printPages} / PDF ${sampleChapter.pdfPages})`,
        sourceText: sampleChapter.summarySource,
        bookSeries: `${subject.bookSeries} (${subject.publisher})`,
        bookTitle: `${subject.bookTitle} (ISBN ${subject.isbn})`,
        isbn: subject.isbn,
        pageOffset: subject.pageOffset,
      })
    );

    await fs.writeFile(
      path.join(output, "Prompt_on_tap.txt"),
      prompts.join("\n\n--------------------\n\n")
    );
    console.log(
      `Exported ${folder} (${subject.bookSeries}): materials, ${subject.games.length} games, ${prompts.length} prompts`
    );
  }
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exitCode = 1;
});
