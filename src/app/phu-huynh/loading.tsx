import { AppShell } from "@/components/layout/AppShell";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function ParentLoading() {
  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}

