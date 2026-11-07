import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { TeacherGradingWorkspace } from "./TeacherGradingWorkspace";

export default async function TeacherGradingPage() {
  const submissions = await prisma.submission.findMany({
    include: {
      student: { include: { user: true, schoolClass: true } },
      assignment: { include: { subject: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Trung tâm Chấm bài & Đánh giá Rubric</h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              LMS Assessment Engine
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Chấm điểm minh bạch theo 4 tiêu chí rubric, tích hợp AI đề xuất nhận xét sư phạm (Giáo viên là người phê duyệt cuối cùng).
          </p>
        </div>

        <TeacherGradingWorkspace initialSubmissions={submissions} />
      </div>
    </AppShell>
  );
}

