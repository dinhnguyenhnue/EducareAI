"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "PARENT";
export type SystemRoleCode =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "COMMUNITY_USER";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  systemRole: SystemRoleCode;
  avatar: string;
  badge: string;
  subTitle?: string;
  accountStatus?: string;
  emailVerified?: boolean;
  googleSub?: string | null;
  mfaRecommended?: boolean;
  isSuperAdmin?: boolean;
  authMethod?: string;
  googleConnected?: boolean;
}

export const USERS: Record<UserRole, CurrentUser> = {
  ADMIN: {
    id: "super-admin-1",
    name: "Đinh Nguyên (Super Admin)",
    email: "dinhnguyenhnue@gmail.com",
    role: "ADMIN",
    systemRole: "SUPER_ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    badge: "Super Admin (UNIGO)",
    subTitle: "Quản trị tối cao • dinhnguyenhnue@gmail.com",
    isSuperAdmin: true,
    mfaRecommended: true,
  },
  TEACHER: {
    id: "teacher-1",
    name: "Thầy Trần Minh Tuấn",
    email: "thay.tuan@unigo.edu.vn",
    role: "TEACHER",
    systemRole: "TEACHER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    badge: "Tổ trưởng Tin học",
    subTitle: "Chủ nhiệm lớp 7A1 • Khối THCS",
  },
  STUDENT: {
    id: "student-1",
    name: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@unigo.edu.vn",
    role: "STUDENT",
    systemRole: "STUDENT",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    badge: "Học sinh 7A1",
    subTitle: "Mã HS: HS2026-0701 • THCS UNIGO",
  },
  PARENT: {
    id: "parent-1",
    name: "Nguyễn Quang Huy",
    email: "ph.minhanh@gmail.com",
    role: "PARENT",
    systemRole: "PARENT",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    badge: "Phụ huynh",
    subTitle: "Phụ huynh em Nguyễn Minh Anh (7A1)",
  },
};

interface RoleContextType {
  role: UserRole;
  user: CurrentUser;
  authenticated: boolean;
  isSuperAdmin: boolean;
  oauthConfigured: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRole: (role: UserRole) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRoleState] = useState<UserRole>("ADMIN");
  const [user, setUser] = useState<CurrentUser>(USERS.ADMIN);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("educare_sidebar_collapsed");
    if (savedCollapsed === "true") {
      setSidebarCollapsedState(true);
    }
  }, []);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("educare_sidebar_collapsed", String(collapsed));
  };

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setOauthConfigured(Boolean(data.oauthConfigured));

      if (data.authenticated && data.user) {
        const viewRole: UserRole = (data.activeViewRole as UserRole) || "STUDENT";
        setRoleState(viewRole);
        setAuthenticated(true);
        setIsSuperAdmin(Boolean(data.isSuperAdmin));

        const sysRole = data.user.role as SystemRoleCode;
        let badge = "Thành viên UNIGO";
        let subTitle = data.user.email;

        if (sysRole === "SUPER_ADMIN") {
          badge =
            viewRole === "ADMIN"
              ? "Super Admin"
              : `Super Admin (Đang xem: ${
                  viewRole === "TEACHER"
                    ? "Giáo viên"
                    : viewRole === "STUDENT"
                    ? "Học sinh"
                    : "Phụ huynh"
                })`;
          subTitle = "dinhnguyenhnue@gmail.com";
        } else if (sysRole === "SCHOOL_ADMIN") {
          badge = "Quản trị Nhà trường";
        } else if (sysRole === "TEACHER") {
          badge = data.user.teacherProfile?.specialization || "Giáo viên";
        } else if (sysRole === "STUDENT") {
          badge = `Học sinh ${data.user.studentProfile?.schoolClass?.name || "7A1"}`;
          subTitle = `Mã HS: ${data.user.studentProfile?.studentCode || "HS2026"}`;
        } else if (sysRole === "PARENT") {
          badge = "Phụ huynh học sinh";
        }

        setUser({
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          role: viewRole,
          systemRole: sysRole,
          avatar:
            data.user.avatarUrl ||
            USERS[viewRole]?.avatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          badge,
          subTitle,
          accountStatus: data.user.accountStatus,
          emailVerified: data.user.emailVerified,
          googleSub: data.user.googleSub,
          mfaRecommended: data.user.mfaRecommended,
          isSuperAdmin: Boolean(data.isSuperAdmin),
          authMethod: data.authMethod,
          googleConnected: data.user.googleConnection?.status === "CONNECTED",
        });
      } else {
        setAuthenticated(false);
        setIsSuperAdmin(false);
      }
    } catch {
      // Ignore network error during initial hydration
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setRole = async (newRole: UserRole) => {
    // If logged in as SUPER_ADMIN, call backend /api/auth/view-switch
    if (authenticated && isSuperAdmin) {
      const res = await fetch("/api/auth/view-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewRole: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoleState(newRole);
        await refreshSession();
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
          router.refresh();
        }
      }
      return;
    }

    setRoleState(newRole);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setIsSuperAdmin(false);
    router.push("/dang-nhap");
    router.refresh();
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        authenticated,
        isSuperAdmin,
        oauthConfigured,
        sidebarCollapsed,
        setSidebarCollapsed,
        setRole,
        refreshSession,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
