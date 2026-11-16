"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileText,
  FolderSync,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { GRADE6_DEMO, type DemoChapter } from "@/lib/grade6-demo";
import { createDemoGame } from "@/lib/demo-game-html";
import {
  buildReviewPrompt,
  REVIEW_KINDS,
  type ReviewKind,
} from "@/lib/review-prompts";
import { MultiFileAssetUploader } from "@/components/assets/MultiFileAssetUploader";

const Game = dynamic(() => import("@/components/game/SandboxedHtmlGamePlayer"), {
  ssr: false,
});

const field =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 text-sm";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50";
const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-ocean-200 bg-ocean-50 hover:bg-ocean-100 px-4 py-2.5 text-sm font-semibold text-ocean-800 transition-colors disabled:opacity-50";

function download(name: string, content: string, mime = "text/plain") {
  const url = URL.createObjectURL(
    new Blob([content], { type: `${mime};charset=utf-8` })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatChapterPreset(ch: DemoChapter) {
  return `${ch.summarySource}\n\nYêu cầu cần đạt:\n${ch.objectives}\n\nCác bài học trong mục lục:\n- ${ch.lessons.join("\n- ")}`;
}

export default function ReviewStudio({
  student = false,
}: {
  student?: boolean;
}) {
  const [subjectId, setSubjectId] = useState("toan");
  const [chapterCode, setChapterCode] = useState("");
  const [kind, setKind] = useState<ReviewKind>("lesson");
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");
  const [driveSyncStatus, setDriveSyncStatus] = useState<string>("");
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [syncBusy, setSyncBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gameIndex, setGameIndex] = useState<number | null>(null);

  const subject = GRADE6_DEMO.find((s) => s.id === subjectId) || GRADE6_DEMO[0];
  const activeChapter = subject.chapters.find((c) => c.code === chapterCode) || null;

  const isPresetSource =
    !sourceText.trim() ||
    GRADE6_DEMO.some((s) =>
      s.chapters.some((ch) => formatChapterPreset(ch) === sourceText)
    );

  const effectiveTopic =
    topic ||
    (activeChapter
      ? `${activeChapter.title} (Trang in ${activeChapter.printPages} • PDF ${activeChapter.pdfPages})`
      : subject.topics.join(" | "));

  const prompt = buildReviewPrompt({
    subject: subject.name,
    kind,
    topic: effectiveTopic,
    sourceText,
    bookSeries: `${subject.bookSeries} (${subject.publisher})`,
    bookTitle: `${subject.bookTitle} (ISBN ${subject.isbn})`,
    isbn: subject.isbn,
    pageOffset: subject.pageOffset,
  });

  function handleSubjectChange(nextId: string) {
    setSubjectId(nextId);
    setChapterCode("");
    setGameIndex(null);
    setTopic("");
    setResult("");
    setSourceText("");
    setFile(null);
    setMessage("");
  }

  function handleChapterSelect(nextCode: string) {
    setChapterCode(nextCode);
    if (!nextCode) {
      setTopic("");
      if (isPresetSource) setSourceText("");
      return;
    }
    const ch = subject.chapters.find((c) => c.code === nextCode);
    if (!ch) return;
    setTopic(
      `${ch.title} — Trang sách in ${ch.printPages} (PDF trang ${ch.pdfPages})`
    );
    if (isPresetSource) {
      setSourceText(formatChapterPreset(ch));
    }
  }

  async function syncLocalSgkToDriveHandler() {
    setSyncBusy(true);
    setDriveSyncStatus("");
    try {
      const response = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_LOCAL_SGK_TO_DRIVE",
          payload: { accountMode: "PERSONAL_GMAIL_HYBRID" },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không đồng bộ được thư mục SGK.");
      }
      setDriveSyncStatus(data.message || "Đã kiểm tra thư mục SGK.");
      setDriveItems(Array.isArray(data.data?.items) ? data.data.items : []);
    } catch (error) {
      setDriveSyncStatus(
        error instanceof Error
          ? error.message
          : "Không kết nối được API Google Workspace."
      );
    } finally {
      setSyncBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setMessage("");
    setResult("");
    try {
      const form = new FormData();
      form.set("subject", subject.name);
      form.set("kind", kind);
      form.set("topic", effectiveTopic);
      form.set("sourceText", sourceText);
      if (file) form.set("file", file);
      const response = await fetch("/api/review/generate", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không sinh được nội dung.");
      }
      setResult(data.text);
      setMessage(
        "Đã sinh bản nháp từ nguồn KNTT. Giáo viên kiểm tra nguồn, đáp án và thang điểm trước khi giao."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không kết nối được dịch vụ."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="rounded-2xl border border-ocean-200 bg-gradient-to-br from-ocean-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ocean-700">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-100 px-3 py-1">
            <BookOpen className="w-3.5 h-3.5" />
            HỌC LIỆU LỚP 6 • HỌC KÌ I
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Bộ sách: {subject.bookSeries}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">
          Ôn tập, Kiểm tra thử & Trò chơi theo SGK Kết nối tri thức
        </h1>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">
          Sách tham chiếu: <strong>{subject.bookTitle}</strong> (ISBN{" "}
          <code>{subject.isbn}</code>) • Quy chuẩn đối chiếu trang:{" "}
          <code>Trang PDF = Trang sách in + {subject.pageOffset}</code>.
        </p>
        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="rounded-xl bg-white/90 border border-slate-200 px-3.5 py-2">
            <span className="font-semibold text-slate-800">Thư mục máy (đã phân lớp):</span>{" "}
            <code className="break-all text-ocean-700">{subject.localRelativePath}</code>
          </div>
          <div className="rounded-xl bg-white/90 border border-slate-200 px-3.5 py-2">
            <span className="font-semibold text-slate-800">Thư mục Drive chuẩn 02_HOC_LIEU:</span>{" "}
            <code className="break-all text-ocean-700">{subject.driveTargetPath}</code>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Học liệu và đề kiểm tra thử đã đối chiếu Mục lục bộ{" "}
        <strong>SGK Kết nối tri thức với cuộc sống (Tập 1)</strong>. Kết quả luyện
        tập và trò chơi không ghi vào điểm chính thức; bản nháp do AI sinh cần giáo
        viên kiểm duyệt đáp án và thang điểm trước khi phát hành.
      </div>

      <div className="grid md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block space-y-1.5 text-sm font-medium text-slate-800">
          <span>Chọn môn học (Lớp 6 — KNTT Tập 1)</span>
          <select
            className={field}
            value={subjectId}
            disabled={busy}
            onChange={(e) => handleSubjectChange(e.target.value)}
          >
            <option value="toan">Toán 6 — Tập 1 (Kết nối tri thức)</option>
            <option value="ngu-van">Ngữ văn 6 — Tập 1 (Kết nối tri thức)</option>
          </select>
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-slate-800">
          <span>Chọn nhanh Chương / Bài học trong SGK KNTT Tập 1</span>
          <select
            className={field}
            value={chapterCode}
            disabled={busy}
            onChange={(e) => handleChapterSelect(e.target.value)}
          >
            <option value="">Toàn bộ Học kì I ({subject.bookTitle})</option>
            {subject.chapters.map((ch) => (
              <option key={ch.code} value={ch.code}>
                {ch.title} (tr. {ch.printPages} / PDF {ch.pdfPages})
              </option>
            ))}
          </select>
        </label>

        {activeChapter && (
          <div className="md:col-span-2 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-slate-900">{activeChapter.title}</h2>
              <span className="text-xs font-semibold text-ocean-700 bg-white border border-ocean-200 rounded-full px-2.5 py-0.5">
                Trang in: {activeChapter.printPages} • PDF: {activeChapter.pdfPages}
              </span>
            </div>
            <p className="text-slate-700">{activeChapter.objectives}</p>
            <ul className="grid sm:grid-cols-2 gap-1 text-xs text-slate-600 list-disc pl-4">
              {activeChapter.lessons.map((ls) => (
                <li key={ls}>{ls}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          ["Học liệu trọng tâm KNTT", subject.lesson],
          ["Bài tập theo bài / chương", subject.exercise],
          ["Đề cương ôn tập Học kì 1", subject.semester],
          ["Đề kiểm tra thử Học kì 1", subject.exam],
          ["Đáp án & hướng dẫn chấm", subject.answers],
        ].map(([title, content]) => (
          <details
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:md:col-span-2"
          >
            <summary className="cursor-pointer font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-ocean-600 shrink-0" />
              <span>{title}</span>
            </summary>
            <p className="whitespace-pre-wrap leading-7 mt-4 text-sm text-slate-800">
              {content}
            </p>
            <button
              className={`${buttonPrimary} mt-4`}
              onClick={() => download(`${subject.id}-${title}.txt`, content)}
            >
              <Download className="w-4 h-4" />
              Tải bản văn bản
            </button>
          </details>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-ocean-600" />
              <span>2 Trò chơi ôn tập {subject.name} 6 (KNTT Tập 1)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mỗi trò chơi gồm 8 câu hỏi trắc nghiệm bám sát chương/bài KNTT, tự chấm
              trong sandbox an toàn.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {subject.games.map((g, i) => (
            <button
              className={gameIndex === i ? buttonPrimary : buttonSecondary}
              key={g.title}
              onClick={() => setGameIndex(i)}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{g.title}</span>
            </button>
          ))}
        </div>
        {gameIndex !== null && (
          <div className="space-y-3 pt-2">
            <Game
              key={`${subjectId}-${gameIndex}`}
              title={subject.games[gameIndex].title}
              htmlSourceCode={createDemoGame(
                subject.games[gameIndex].title,
                subject.games[gameIndex].questions
              )}
              className={`Lớp 6 — ${subject.bookSeries}`}
            />
            <button
              className={buttonSecondary}
              onClick={() =>
                download(
                  `${subject.id}-kntt-game-${gameIndex + 1}.html`,
                  createDemoGame(
                    subject.games[gameIndex].title,
                    subject.games[gameIndex].questions
                  ),
                  "text/html"
                )
              }
            >
              <Download className="w-4 h-4" />
              Tải tệp trò chơi HTML tự chứa
            </button>
          </div>
        )}
      </section>

      {!student && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  <FolderSync className="w-5 h-5 text-ocean-600" />
                  <span>Đồng bộ Thư mục SGK Lớp 6 lên Google Drive (02_HOC_LIEU)</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Quét thư mục đã phân lớp <code>SGK/Lop_6/Toan/Tap_1</code> và{" "}
                  <code>SGK/Lop_6/Ngu_van/Tap_1</code>, lập chỉ mục kho Asset và tạo
                  cây thư mục chuẩn <code>EDUCARE_AI/02_HOC_LIEU/...</code> trên Supabase.
                </p>
              </div>
              <button
                className={buttonPrimary}
                disabled={syncBusy}
                onClick={syncLocalSgkToDriveHandler}
              >
                <FolderSync className="w-4 h-4" />
                <span>
                  {syncBusy
                    ? "Đang đồng bộ chỉ mục SGK..."
                    : "Đồng bộ thư mục SGK lên Google Drive (02_HOC_LIEU)"}
                </span>
              </button>
            </div>
            {driveSyncStatus && (
              <div className="rounded-xl bg-sky-50 border border-ocean-200 p-3.5 text-sm text-ocean-900">
                {driveSyncStatus}
              </div>
            )}
            {driveItems.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                {driveItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {item.bookTitle} ({item.bookSeries})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${item.foundOnDisk
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                          }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-slate-600 break-all">
                      Máy: <code>{item.localRelativePath}</code>
                    </div>
                    <div className="text-slate-600 break-all">
                      Drive: <code>{item.driveTargetPath}</code>
                    </div>
                    {item.sha256 && (
                      <div className="text-slate-500 font-mono">
                        SHA-256: {String(item.sha256).slice(0, 20)}... (
                        {(Number(item.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>Tạo Prompt, Đề ôn tập HK1, Đề thử & Trò chơi từ SGK</span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Chọn chương/bài KNTT ở trên hoặc tải lên trích đoạn PDF tối đa 3 MB
                (những trang bài học muốn biên soạn). Khi bấm sinh, nguồn được gửi tới
                Gemini để tạo bản nháp. Sách đầy đủ có thể lưu ở kho tệp bên dưới.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                <span>Loại sản phẩm ôn tập / đánh giá</span>
                <select
                  className={field}
                  value={kind}
                  disabled={busy}
                  onChange={(e) => setKind(e.target.value as ReviewKind)}
                >
                  {Object.entries(REVIEW_KINDS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                <span>Bài / chương và phạm vi trang (KNTT Tập 1)</span>
                <input
                  className={field}
                  value={topic}
                  disabled={busy}
                  maxLength={500}
                  placeholder="Ví dụ: Chương II - ƯCLN và BCNN, trang in 44–53 (PDF 45–54)"
                  onChange={(e) => setTopic(e.target.value)}
                />
              </label>
            </div>

            <label className="block space-y-1.5 text-sm font-medium text-slate-800">
              <span>Trích đoạn PDF nguồn (tối đa 3 MB)</span>
              <input
                key={subjectId}
                className={field}
                type="file"
                accept="application/pdf,.pdf"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size > 3 * 1024 * 1024) {
                    setMessage(
                      "Chọn trích đoạn PDF không quá 3 MB; sách đầy đủ lưu ở kho tệp."
                    );
                    e.target.value = "";
                    setFile(null);
                  } else {
                    setFile(f || null);
                    setMessage("");
                  }
                }}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-800">
              <span>Nội dung nguồn hoặc trích yếu bài học KNTT</span>
              <textarea
                className={field}
                rows={6}
                value={sourceText}
                disabled={busy}
                maxLength={30000}
                placeholder="Dán nội dung trích đoạn SGK hoặc chọn một Chương/Bài ở phía trên để tự điền khung YCCĐ KNTT..."
                onChange={(e) => setSourceText(e.target.value)}
              />
            </label>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <summary className="cursor-pointer font-semibold text-sm text-slate-800">
                Xem trước Prompt chuẩn KNTT (sẵn sàng sao chép sang Gemini / NotebookLM)
              </summary>
              <pre className="whitespace-pre-wrap text-xs mt-3 text-slate-700 leading-relaxed">
                {prompt}
              </pre>
            </details>

            <div className="flex flex-wrap gap-3">
              <button
                className={buttonSecondary}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(prompt);
                    setMessage(
                      "Đã sao chép prompt chuẩn KNTT. Đính kèm PDF SGK khi dùng ở công cụ AI khác."
                    );
                  } catch {
                    setMessage(
                      "Không truy cập được clipboard. Mở mục Xem trước Prompt để sao chép thủ công."
                    );
                  }
                }}
              >
                <ClipboardCopy className="w-4 h-4" />
                Sao chép Prompt chuẩn
              </button>
              <button
                className={buttonPrimary}
                disabled={busy || (!file && !sourceText.trim())}
                onClick={generate}
              >
                <Sparkles className="w-4 h-4" />
                {busy ? "Đang đọc nguồn và biên soạn…" : "Sinh bản nháp từ nguồn"}
              </button>
            </div>

            {message && (
              <p
                role="status"
                className="rounded-xl bg-ocean-50 border border-ocean-200 px-3.5 py-2.5 text-sm text-ocean-900"
              >
                {message}
              </p>
            )}

            {result && (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 leading-relaxed">
                  {result}
                </pre>
                <button
                  className={buttonPrimary}
                  onClick={() => download(`${subject.id}-${kind}-nhap.txt`, result)}
                >
                  <Download className="w-4 h-4" />
                  Tải bản nháp
                </button>
                <p className="text-xs text-slate-600">
                  Với mã trò chơi HTML: tải xuống hoặc sao chép sang Xưởng Trò chơi để
                  chạy thử trong sandbox và kiểm duyệt trước khi công bố.
                </p>
              </div>
            )}

            <MultiFileAssetUploader
              label={`Lưu tài liệu SGK / đề cương ${subject.name} 6 KNTT vào kho tệp (không tự đồng bộ Drive)`}
            />
          </section>
        </>
      )}
    </div>
  );
}
