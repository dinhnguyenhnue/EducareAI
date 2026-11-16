import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { GRADE6_DEMO } from "@/lib/grade6-demo";
import { buildReviewPrompt, REVIEW_KINDS, type ReviewKind } from "@/lib/review-prompts";
import { readReviewResponse } from "@/lib/review-response";
export const runtime = "nodejs";
export const maxDuration = 120;
const MAX_BODY = 3 * 1024 * 1024 + 150000;
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) return NextResponse.json({ error: "Chỉ giáo viên và quản trị được sinh đề." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_BODY) return NextResponse.json({ error: "Tài liệu quá lớn. Dùng trích đoạn PDF tối đa 3 MB." }, { status: 413 });
  try {
    // Bound streamed bodies too, rather than trusting Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); return NextResponse.json({ error: "Tài liệu quá lớn." }, { status: 413 }); }
      chunks.push(chunk.value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const subject = form.get("subject"); const kind = form.get("kind");
    const topic = form.get("topic"); const sourceText = form.get("sourceText"); const file = form.get("file");
    if ((subject !== "Toán" && subject !== "Ngữ văn") || typeof kind !== "string" || !Object.hasOwn(REVIEW_KINDS, kind) || typeof topic !== "string" || !topic.trim() || topic.length > 500 || typeof sourceText !== "string" || sourceText.length > 30000) {
      return NextResponse.json({ error: "Môn, loại ôn tập hoặc phạm vi không hợp lệ." }, { status: 400 });
    }
    const input: ({ type: "text"; text: string } | { type: "document"; data: string; mime_type: string })[] = [];
    if (file && typeof file !== "string") {
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!bytes.length || bytes.length > 3 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf") || bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "Cần tệp PDF hợp lệ, tối đa 3 MB." }, { status: 400 });
      input.push({ type: "document", mime_type: "application/pdf", data: bytes.toString("base64") });
    } else if (!sourceText.trim()) return NextResponse.json({ error: "Cần PDF hoặc nội dung nguồn để sinh đề." }, { status: 400 });
    const key = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_REVIEW_MODEL?.trim();
    if (!key || !model) return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY và GEMINI_REVIEW_MODEL. Thầy/cô vẫn có thể sao chép prompt và dùng bộ demo." }, { status: 503 });
    const subjectMeta = GRADE6_DEMO.find((s) => s.name === subject);
    input.push({
      type: "text",
      text: buildReviewPrompt({
        subject,
        kind: kind as ReviewKind,
        topic,
        sourceText,
        bookSeries: subjectMeta?.bookSeries,
        bookTitle: `${subjectMeta?.bookTitle || subject} (ISBN ${subjectMeta?.isbn || ""})`,
        isbn: subjectMeta?.isbn,
        pageOffset: subjectMeta?.pageOffset,
      }),
    });
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key, "Api-Revision": "2026-05-20" },
      body: JSON.stringify({ model, input, store: false }), signal: AbortSignal.timeout(100000),
    });
    if (!response.ok) return NextResponse.json({ error: `Dịch vụ AI không hoàn tất yêu cầu (HTTP ${response.status}). Kiểm tra cấu hình model và hạn mức.` }, { status: 502 });
    const data = await response.json();
    const text = readReviewResponse(data);
    if (!text.trim()) return NextResponse.json({ error: "AI không trả nội dung. Thử trích đoạn rõ hơn hoặc phạm vi ngắn hơn." }, { status: 502 });
    return NextResponse.json({ text, status: "DRAFT", model });
  } catch {
    return NextResponse.json({ error: "Không đọc được nguồn hoặc yêu cầu đã quá thời gian. Vui lòng thử lại với trích đoạn nhỏ hơn." }, { status: 400 });
  }
}
