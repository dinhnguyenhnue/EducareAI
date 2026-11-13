import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Award } from "lucide-react";
import { TeacherGradingWorkspace } from "./TeacherGradingWorkspace";

export const dynamic = "force-dynamic";

export default async function TeacherGradingPage() {
  let submissions: any[] = [];
  try {
    submissions = await prisma.submission.findMany({
      include: {
        student: { include: { user: true, schoolClass: true } },
        assignment: { include: { subject: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not load submissions (database might still be migrating):", err);
    submissions = [];
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="assignments"
          badge="LMS Assessment Engine"
          badgeIcon={<Award className="w-3.5 h-3.5" />}
          title="Trung tâm Chấm bài & Đánh giá Rubric"
          description="Chấm điểm minh bạch theo 4 tiêu chí rubric, tích hợp AI đề xuất nhận xét sư phạm (Giáo viên là người phê duyệt cuối cùng)."
        />

        <TeacherGradingWorkspace initialSubmissions={submissions} />
      </div>
    </AppShell>
  );
}

