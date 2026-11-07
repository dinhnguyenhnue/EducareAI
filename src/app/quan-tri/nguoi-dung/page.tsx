import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
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
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Quản lý Người dùng & Nhập file Excel</h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              RBAC & User Directory
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Quản trị viên có thể thêm người dùng, phân quyền vai trò (Học sinh, Giáo viên, Phụ huynh, Quản trị) và nhập hàng loạt từ file Excel.
          </p>
        </div>

        <UserManagementTable initialUsers={users} />
      </div>
    </AppShell>
  );
}

