import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED: Vui lòng đăng nhập để sử dụng Trợ lý AI." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, subjectCode = "TIN7", roleContext, featureModule } = body;
    const apiKey = process.env.GEMINI_API_KEY || "";
    const activeRole = roleContext || session.activeViewRole || session.role;

    const resolvedModule =
      featureModule ||
      (activeRole === "TEACHER"
        ? "AI_TEACHER_ASSISTANT"
        : activeRole === "PARENT"
        ? "AI_PARENT_COMPANION"
        : "AI_TUTOR");

    // Socratic System Instruction per UNIGO THCS pedagogical standard
    const systemPrompt =
      "Bạn là Trợ lý Sư phạm Socratic của hệ sinh thái EDUCARE AI - Trường THCS UNIGO. Nguyên tắc bắt buộc: Không giải bài hộ học sinh, không viết sẵn toàn bộ bài làm để học sinh chép. Hãy đặt câu hỏi gợi mở từng bước, khuyến khích học sinh tự nghiên cứu, tự tạo sản phẩm và tự đánh giá.";

    let reply = "";
    let isLiveGeminiApi = false;

    if (apiKey) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: message || "" }] }],
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        reply =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Em hãy thử phân tích dữ liệu đề bài đã cho trước nhé.";
        isLiveGeminiApi = true;
      }
    }

    if (!reply) {
      if (activeRole === "TEACHER") {
        reply = `[Chế độ Sư phạm Socratic — Chưa cấu hình GEMINI_API_KEY trực tuyến]: Với yêu cầu "${message}", thầy/cô có thể thiết kế câu hỏi phân hóa 3 mức độ (Nhận biết - Thông hiểu - Vận dụng thực tiễn) gắn với Rubric 4 tiêu chí của Tổ THCS UNIGO.`;
      } else if (activeRole === "PARENT") {
        reply = `[Trợ lý Đồng hành Phụ huynh]: Dựa trên bảng điểm và nhận xét chính thức của giáo viên bộ môn, gia đình có thể đặt câu hỏi khích lệ con chia sẻ lại quy trình làm sản phẩm thay vì chỉ hỏi điểm số.`;
      } else {
        reply = `[Gia sư Socratic UNIGO (${
          subjectCode || "THCS"
        })]: Thầy không đưa đáp án chép sẵn để tránh học vẹt. Để giải quyết vấn đề "${message}", theo em bước 1 chúng ta cần xác định dữ kiện nào đã biết và tiêu chí nào trong Rubric cần đạt?`;
      }
    }

    const promptTokens = Math.max(45, Math.ceil(String(message || "").length / 3) + 60);
    const completionTokens = Math.max(60, Math.ceil(reply.length / 3));
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = Number((totalTokens * 0.0000003).toFixed(6));

    await prisma.aIUsageLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: activeRole,
        className: "7A1",
        subjectCode: String(subjectCode || "TIN7"),
        featureModule: resolvedModule,
        modelName: isLiveGeminiApi ? "gemini-2.0-flash" : "socratic-pedagogical-engine",
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        latencyMs: Date.now() - startedAt,
        status: "SUCCESS",
        summaryNote:
          activeRole === "STUDENT"
            ? "Phiên gợi mở Socratic (Bảo mật nội dung hội thoại riêng tư theo SRS §4.5)"
            : `Hỗ trợ nghiệp vụ ${resolvedModule} (${subjectCode})`,
      },
    });

    return NextResponse.json({
      success: true,
      isLiveGeminiApi,
      missingEnvVar: apiKey ? null : "GEMINI_API_KEY",
      usage: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
      reply,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
