"use client";

import React from "react";
import { useRole, type UserRole } from "@/context/RoleContext";
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
    icon: React.ReactNode;
  }> = [
    {
      key: "ADMIN",
      title: "Admin View",
      subtitle: "Quản trị Hệ thống & Trường học",
      desc: "Quản lý người dùng, phân quyền RBAC, nhập Excel học sinh, cấu hình AI và xem Audit Log.",
      icon: <ShieldCheck className="w-5 h-5 text-brand-teal" />,
    },
    {
      key: "TEACHER",
      title: "Teacher View",
      subtitle: "Bàn làm việc Giáo viên",
      desc: "Trải nghiệm quy trình soạn bài giảng gắn Google Docs/Drive, giao bài Classroom và chấm Rubric.",
      icon: <Briefcase className="w-5 h-5 text-brand-teal" />,
    },
    {
      key: "STUDENT",
      title: "Student View",
      subtitle: "Không gian Học tập Học sinh",
      desc: "Kiểm tra giao diện bài học, nộp sản phẩm kèm tự đánh giá, Prompt Lab và Cộng đồng học tập.",
      icon: <GraduationCap className="w-5 h-5 text-brand-teal" />,
    },
    {
      key: "PARENT",
      title: "Parent View",
      subtitle: "Cổng Đồng hành Phụ huynh",
      desc: "Kiểm tra báo cáo tiến độ con, điểm mạnh/cần cải thiện và gợi ý câu hỏi đồng hành từ AI.",
      icon: <HeartHandshake className="w-5 h-5 text-brand-teal" />,
    },
  ];

  return (
    <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
            Super Admin Multi-View Switcher (Chuyển đổi Góc nhìn 4 Vai trò)
          </h2>
        </div>
        <span className="text-[11px] text-ink-muted">
          Mọi thao tác chuyển góc nhìn đều được xác thực phía Server và ghi vào AuditLog
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {views.map((v) => {
          const isCurrent = role === v.key;
          return (
            <div
              key={v.key}
              className={`p-4 rounded-panel border flex flex-col justify-between transition-all ${
                isCurrent
                  ? "bg-brand-teal-soft/40 border-brand-teal"
                  : "bg-canvas border-border hover:border-brand-teal/40"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-button bg-surface border border-border flex items-center justify-center">
                    {v.icon}
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-brand-teal text-white px-2 py-0.5 rounded">
                      Đang chọn
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                  <p className="text-[11px] font-semibold text-brand-teal">
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
                className="mt-4 w-full py-2 px-3 rounded-button bg-surface hover:bg-brand-teal hover:text-white border border-border text-ink text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Chuyển sang {v.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

