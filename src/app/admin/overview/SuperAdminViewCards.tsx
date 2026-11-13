"use client";

import React from "react";
import { m } from "framer-motion";
import { useRole, type UserRole } from "@/context/RoleContext";
import { getModuleTheme, type ModuleToneKey } from "@/lib/theme";
import { OCEAN_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  ArrowRight,
  Eye,
} from "lucide-react";

export function SuperAdminViewCards() {
  const { role, setRole } = useRole();

  const views: Array<{
    key: UserRole;
    title: string;
    subtitle: string;
    desc: string;
    tone: ModuleToneKey;
    icon: React.ReactNode;
  }> = [
    {
      key: "ADMIN",
      title: "Admin View",
      subtitle: "Quản trị Hệ thống & Trường học",
      desc: "Quản lý người dùng, phân quyền RBAC, nhập Excel học sinh, cấu hình AI và xem Audit Log.",
      tone: "overview",
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      key: "TEACHER",
      title: "Teacher View",
      subtitle: "Bàn làm việc Giáo viên",
      desc: "Trải nghiệm quy trình soạn bài giảng gắn Google Docs/Drive, giao bài Classroom và chấm Rubric.",
      tone: "materials",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      key: "STUDENT",
      title: "Student View",
      subtitle: "Không gian Học tập Học sinh",
      desc: "Kiểm tra giao diện bài học, nộp sản phẩm kèm tự đánh giá, Prompt Lab và Cộng đồng học tập.",
      tone: "progress",
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      key: "PARENT",
      title: "Parent View",
      subtitle: "Cổng Đồng hành Phụ huynh",
      desc: "Kiểm tra báo cáo tiến độ con, điểm mạnh/cần cải thiện và gợi ý câu hỏi đồng hành từ AI.",
      tone: "aiTutor",
      icon: <HeartHandshake className="w-5 h-5" />,
    },
  ];

  return (
    <section className="p-5 sm:p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ocean-light text-ocean-600 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
            Super Admin Multi-View Switcher (Chuyển góc nhìn 4 Vai trò)
          </h2>
        </div>
        <span className="text-[11px] text-ink-muted">
          Xác thực phía Server và ghi AuditLog
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {views.map((v) => {
          const isCurrent = role === v.key;
          const theme = getModuleTheme(v.tone);
          return (
            <m.div
              key={v.key}
              whileHover={{ y: -3 }}
              transition={OCEAN_TRANSITION.hover}
              className={cn(
                "p-4 rounded-panel border flex flex-col justify-between transition-colors",
                isCurrent
                  ? cn(theme.bgSoft, theme.border, "shadow-card")
                  : cn("bg-canvas/70 border-border hover:bg-surface hover:shadow-card-hover", theme.hoverBorder)
              )}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      theme.iconBg
                    )}
                  >
                    {v.icon}
                  </div>
                  {isCurrent && (
                    <span
                      className={cn(
                        "text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full",
                        theme.solidBg
                      )}
                    >
                      Đang chọn
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                  <p className={cn("text-[11px] font-bold", theme.text)}>
                    {v.subtitle}
                  </p>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {v.desc}
                </p>
              </div>

              <button
                type="button"
                data-testid={`card-switch-${v.key}`}
                onClick={() => setRole(v.key)}
                className={cn(
                  "mt-4 w-full py-2 px-3 rounded-button border text-xs font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5",
                  isCurrent
                    ? cn(theme.solidBg, "text-white border-transparent")
                    : "bg-surface hover:bg-ocean-600 hover:text-white border-border text-ink"
                )}
              >
                <span>Chuyển sang {v.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </m.div>
          );
        })}
      </div>
    </section>
  );
}
