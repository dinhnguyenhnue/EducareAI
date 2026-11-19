import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { UserManagementTable } from "./UserManagementTable";

export default async function AdminUsersPage() {
  let users: any[] = [];
  let schoolClasses: Array<{ id: string; name: string; gradeLevel: number }> = [];
  try {
    const [loadedUsers, loadedClasses] = await Promise.all([
      prisma.user.findMany({
        include: {
          studentProfile: { include: { schoolClass: true } },
          teacherProfile: true,
          parentProfile: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.schoolClass.findMany({
        select: { id: true, name: true, gradeLevel: true },
        orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      }),
    ]);
    users = loadedUsers;
    schoolClasses = loadedClasses;
  } catch (err) {
    console.warn("Could not load users:", err);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          variant="card"
          tone="overview"
          badge="RBAC & User Directory"
          badgeIcon={<Users className="w-3.5 h-3.5" />}
          title="Quản lý Người dùng & Nhập file Excel"
          description="Quản trị viên có thể thêm người dùng, gán hoặc chuyển lớp cho học sinh theo mã HS, phân quyền vai trò và nhập hàng loạt từ file Excel."
        />

        <UserManagementTable initialUsers={users} schoolClasses={schoolClasses} />
      </div>
    </AppShell>
  );
}

