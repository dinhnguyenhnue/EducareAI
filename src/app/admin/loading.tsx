import { AppShell } from "@/components/layout/AppShell";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}

