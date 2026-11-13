import { AppShell } from "@/components/layout/AppShell";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function StudentLoading() {
  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}

