import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getResolvedIntegrationSlots } from "@/lib/integration-slots";
import { GeminiGemsClient } from "./GeminiGemsClient";

export const dynamic = "force-dynamic";

export default async function GeminiGemsCatalogPage() {
  const slots = await getResolvedIntegrationSlots();

  return (
    <AppShell>
      <GeminiGemsClient initialSlots={slots} />
    </AppShell>
  );
}
