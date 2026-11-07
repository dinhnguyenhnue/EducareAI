import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { TeacherAssignmentsClient } from "./TeacherAssignmentsClient";

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentsPage() {
  const [assignments, classes, subjects] = await Promise.all([
    prisma.assignment.findMany({
      include: {
        subject: true,
        schoolClass: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.schoolClass.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell>
      <TeacherAssignmentsClient
        initialAssignments={assignments}
        classes={classes}
        subjects={subjects}
      />
    </AppShell>
  );
}
