"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { PageTransition } from "../ui/PageTransition";

const FloatingAIAssistant = dynamic(
  () => import("../ai/FloatingAIAssistant").then((m) => m.FloatingAIAssistant),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
      <AppHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <div className="flex-1 flex min-w-0">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}
