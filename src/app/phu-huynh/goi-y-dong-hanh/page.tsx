import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  MessageCircleHeart,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentCompanionGuidePage() {
  const session = await getServerSession();
  const isParentSession = session?.user.role === "PARENT" && !session.isSuperAdmin;

  const parentUser = await prisma.user.findFirst({
    where: isParentSession
      ? { id: session.user.id }
      : { email: "ph.minhanh@gmail.com" },
    include: {
      parentProfile: {
        include: {
          children: {
            where: { isVerified: true },
            include: {
              student: {
                include: {
                  user: true,
                  schoolClass: {
                    include: { homeroomTeacher: { include: { user: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const child = parentUser?.parentProfile?.children[0]?.student;
  const studentUser = child?.user;

  const companionTips = [
    {
      day: "Thứ Hai & Thứ Tư (15 phút buổi tối)",
      title: "Trò chuyện gợi mở về sản phẩm con tự làm",
      action:
        "Phụ huynh không cần biết lập trình hay giải Toán nâng cao; chỉ cần nhờ con mở 'Xưởng Trò Chơi' và giảng lại cho bố/mẹ nghe luật chơi hoặc 1 câu hỏi mà con tâm đắc nhất. Khi con giải thích lại bằng lời của mình, con sẽ nhớ kiến thức sâu gấp đôi.",
      subjectTag: "Tin học & Tư duy trình bày",
    },
    {
      day: "Thứ Ba & Thứ Năm (20 phút trước khi làm bài)",
      title: "Kiểm tra thói quen đọc kỹ đề và tự rà soát",
      action:
        "Trước khi con bấm 'Nộp bài kiểm tra', nhắc con dành 3 phút cuối kiểm tra lại các câu mức độ Vận dụng (ví dụ: chọn loại biểu đồ phần trăm hoặc phân tích biện pháp tu từ trong Ngữ văn).",
      subjectTag: "Toán học & Ngữ văn 7",
    },
    {
      day: "Cuối tuần (10 phút tổng kết)",
      title: "Ghi nhận nỗ lực thay vì chỉ nhìn vào điểm số",
      action:
        "Khen ngợi việc con hoàn thành bài tập đúng hạn và chủ động khai báo trung thực cách sử dụng AI hỗ trợ. Điều này giúp con hình thành phẩm chất trung thực học thuật.",
      subjectTag: "Phát triển phẩm chất & Năng lực số",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-teal uppercase">
            <HeartHandshake className="w-4 h-4" />
            <span>AI Parent Assistant • Trợ lý Đồng hành cùng Phụ huynh (SRS §4.4 & §4.5)</span>
          </div>
          <h1 className="text-2xl font-bold text-ink mt-1">
            Gợi ý Đồng hành cùng {studentUser?.fullName || "Nguyễn Minh Anh"} tại nhà
          </h1>
          <p className="text-xs text-ink-muted mt-1 max-w-3xl">
            Các gợi ý dưới đây được thiết kế ngắn gọn, dễ áp dụng trong 10–15 phút mỗi tối mà không đòi hỏi phụ huynh phải giảng lại kiến thức chuyên sâu của chương trình THCS.
          </p>
        </div>

        {/* Weekly Actionable Companion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {companionTips.map((tip, idx) => (
            <div
              key={idx}
              className="p-5 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-brand-teal-soft text-brand-teal font-bold">
                    {tip.day}
                  </span>
                </div>
                <h2 className="text-base font-bold text-ink">{tip.title}</h2>
                <p className="text-xs text-ink-muted leading-relaxed">{tip.action}</p>
              </div>
              <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-semibold text-brand-teal">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>{tip.subjectTag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Conversation Starters */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircleHeart className="w-4 h-4 text-brand-teal" />
            <h2 className="text-base font-bold text-ink">
              3 Câu hỏi Gợi mở Tích cực Phụ huynh có thể hỏi con tối nay
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-canvas border border-border">
              &ldquo;Hôm nay ở trường có câu hỏi hay trò chơi học tập nào làm con thấy thú vị nhất không? Con bật cho bố/mẹ chơi thử với nhé!&rdquo;
            </div>
            <div className="p-3.5 rounded-lg bg-canvas border border-border">
              &ldquo;Khi làm bài tập có chỗ nào khó, con đã đặt câu hỏi cho trợ lý AI gợi ý từng bước như thế nào?&rdquo;
            </div>
            <div className="p-3.5 rounded-lg bg-canvas border border-border">
              &ldquo;Tuần này con muốn bố/mẹ nhắc lịch ôn tập vào khung giờ nào để con thoải mái nhất?&rdquo;
            </div>
          </div>
        </div>

        {/* SRS Section 4.5 Mandatory Psychological Privacy Guarantee */}
        <div className="p-5 rounded-panel bg-slate-900 text-white flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-teal-300">
              Cam kết Bảo vệ Không gian Tâm lý & Quyền Riêng tư của Học sinh (SRS Mục 4.5)
            </p>
            <p className="text-slate-300 leading-relaxed">
              Để học sinh luôn tự tin đặt câu hỏi khi chưa hiểu bài, hệ thống <strong>không hiển thị lịch sử hội thoại riêng tư từng câu chữ</strong> giữa học sinh và AI Tutor cho phụ huynh. Phụ huynh chỉ nhận bản tổng hợp xu hướng học tập, điểm mạnh, lỗ hổng kiến thức và khuyến nghị đồng hành đã qua giáo viên kiểm duyệt.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
