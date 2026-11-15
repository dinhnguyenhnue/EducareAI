import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { TeacherLessonsClient } from "./TeacherLessonsClient";

export const dynamic = "force-dynamic";

export default async function TeacherLessonsPage() {
  let lessons: any[] = [];
  let topics: any[] = [];
  try {
    [lessons, topics] = await Promise.all([
      prisma.lesson.findMany({
        include: {
          topic: { include: { subject: true } },
          teacher: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.topic.findMany({
        include: { subject: true },
        orderBy: { orderIndex: "asc" },
      }),
    ]);
  } catch (err) {
    console.warn("Could not load lessons/topics:", err);
  }

  return (
    <AppShell>
      <TeacherLessonsClient initialLessons={lessons} topics={topics} />
    </AppShell>
  );
}

