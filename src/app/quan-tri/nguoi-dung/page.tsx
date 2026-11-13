import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { UserManagementTable } from "./UserManagementTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      studentProfile: { include: { schoolClass: true } },
      teacherProfile: true,
      parentProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="overview"
          badge="RBAC & User Directory"
          badgeIcon={<Users className="w-3.5 h-3.5" />}
          title="Quản lý Người dùng & Nhập file Excel"
          description="Quản trị viên có thể thêm người dùng, phân quyền vai trò (Học sinh, Giáo viên, Phụ huynh, Quản trị) và nhập hàng loạt từ file Excel."
        />

        <UserManagementTable initialUsers={users} />
      </div>
    </AppShell>
  );
}

