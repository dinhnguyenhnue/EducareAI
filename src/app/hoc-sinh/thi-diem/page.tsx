import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PilotLearningHub } from "./PilotLearningHub";

export default async function StudentPilotPage() {
  const session = await getServerSession();

  let initialGrade: 6 | 7 | 8 = 6;
  let studentClassName: string | null = null;

  if (session?.user?.id) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { schoolClass: true },
    });

    if (profile) {
      if (
        profile.gradeLevel === 6 ||
        profile.gradeLevel === 7 ||
        profile.gradeLevel === 8
      ) {
        initialGrade = profile.gradeLevel;
      }
      studentClassName = profile.schoolClass?.name ?? null;
    }
  }

  return (
    <AppShell>
      <PilotLearningHub
        initialGrade={initialGrade}
        studentClassName={studentClassName}
      />
    </AppShell>
  );
}
