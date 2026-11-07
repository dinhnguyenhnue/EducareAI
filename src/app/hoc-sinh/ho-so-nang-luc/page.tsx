import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import {
  Award,
  LineChart,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Calendar,
  FileCheck,
  TrendingUp,
} from "lucide-react";

export default async function StudentCompetencyProfilePage() {
  const student = await prisma.user.findFirst({
    where: { email: "minhanh.nguyen@unigo.edu.vn" },
    include: {
      studentProfile: {
        include: {
          schoolClass: true,
          submissions: {
            include: { assignment: { include: { subject: true } } },
          },
        },
      },
    },
  });

  const competencies = [
    { name: "1. Biết đặt câu hỏi gợi mở", score: 88, status: "Tốt", desc: "Tích cực đặt câu hỏi tìm hiểu bản chất bài học với AI Tutor và thầy cô." },
    { name: "2. Biết làm & Thực hành sản phẩm", score: 94, status: "Xuất sắc", desc: "Hoàn thành 100% nhiệm vụ tạo infographic và lập trình Scratch." },
    { name: "3. Biết phản biện văn minh", score: 78, status: "Khá", desc: "Biết chỉ ra điểm nghi vấn trong dữ liệu, cần tự tin tranh luận hơn." },
    { name: "4. Năng lực tự nghiên cứu", score: 86, status: "Tốt", desc: "Chủ động khám phá Prompt Lab và tài liệu mở." },
    { name: "5. Năng lực tự tạo sản phẩm", score: 92, status: "Xuất sắc", desc: "Có 2 sản phẩm được duyệt xuất bản trên Cộng đồng UNIGO." },
    { name: "6. Tự đánh giá & Trách nhiệm", score: 85, status: "Tốt", desc: "Luôn có bản tự nhận xét trung thực trước khi nộp bài." },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Hồ sơ năng lực học tập số</h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Khung Đánh giá Năng lực Tổ THCS
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Không đo lường bằng một điểm số duy nhất — hồ sơ phản ánh toàn diện quá trình rèn luyện, khả năng ứng dụng và sản phẩm thực tế của học sinh.
          </p>
        </div>

        {/* 6 Core Competencies Progress */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-teal" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
                6 Tiêu chí Năng lực & Phẩm chất THCS UNIGO
              </h2>
            </div>
            <span className="text-xs text-ink-muted">Học kỳ 1 • Năm học 2026-2027</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competencies.map((comp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-panel bg-canvas border border-border/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">{comp.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-brand-teal bg-brand-teal-soft px-1.5 py-0.2 rounded">
                      {comp.status}
                    </span>
                    <span className="font-mono font-bold text-ink">{comp.score}%</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full bg-brand-teal rounded-full"
                    style={{ width: `${comp.score}%` }}
                  />
                </div>

                <p className="text-[11px] text-ink-muted leading-relaxed">{comp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning History & Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Graded Works (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-teal" />
              <span>Minh chứng bài tập và sản phẩm đã hoàn thành</span>
            </h3>

            <div className="space-y-3">
              {student?.studentProfile?.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-button bg-canvas border border-border/70 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{sub.assignment.title}</span>
                    <span className="font-mono font-bold text-status-success text-sm">
                      {sub.score}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted line-clamp-2">
                    Nhận xét của GV: "{sub.teacherComment}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-ink-muted/80 pt-1 border-t border-border/50">
                    <span>Môn: {sub.assignment.subject.name}</span>
                    <span>Ngày chấm: {new Date(sub.gradedAt || sub.submittedAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Comprehensive Recommendation (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/20 shadow-card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-teal font-bold text-xs uppercase tracking-wider pb-2 border-b border-brand-teal/20">
                <Sparkles className="w-4 h-4" />
                <span>Nhận định tổng hợp từ AI Engine</span>
              </div>

              <div className="text-xs text-ink leading-relaxed space-y-2">
                <p>
                  <strong className="text-brand-teal font-semibold">Minh chứng:</strong> Học sinh Nguyễn Minh Anh thể hiện năng lực sáng tạo vượt trội ở nhóm môn Công nghệ số và Tin học. Em có thói quen tự đánh giá bài làm rất tốt.
                </p>
                <p>
                  <strong className="text-brand-teal font-semibold">Khuyến nghị phát triển:</strong> Trong các bài tập thảo luận nhóm sắp tới, em nên chủ động đặt các câu hỏi phản biện đối chứng để rèn luyện tư duy logic phản biện đa chiều.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-brand-teal/20 text-[11px] text-ink-muted">
              Được phân tích dựa trên 12 lượt học, 2 sản phẩm số và lịch sử trao đổi với AI Tutor.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

