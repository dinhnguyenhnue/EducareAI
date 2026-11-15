"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "../ui/PageTransition";

const FloatingAIAssistant = dynamic(
  () => import("../ai/FloatingAIAssistant").then((m) => m.FloatingAIAssistant),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-button focus:bg-ocean-600 focus:text-white focus:font-bold focus:text-xs focus:shadow-dialog"
      >
        Chuyển đến nội dung chính
      </a>
      <AppHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <div className="flex-1 flex min-w-0">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1440px] w-full mx-auto overflow-x-hidden focus:outline-none"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <FloatingAIAssistant />
      <BottomNav />
    </div>
  );
}
