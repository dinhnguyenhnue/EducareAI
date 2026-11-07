"use client";

import React, { useState } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { FloatingAIAssistant } from "../ai/FloatingAIAssistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
      <AppHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <div className="flex-1 flex">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}
