/**
 * EDUCARE OCEAN DESIGN SYSTEM — Semantic Module Color Registry (Section IV)
 * Consistent color identity shared across Sidebar, Topbar, StatCard, FeatureCard, ChartCard & EmptyState.
 */

export type ModuleToneKey =
  | "overview"
  | "materials"
  | "aiTutor"
  | "promptLab"
  | "assignments"
  | "assessments"
  | "achievements"
  | "progress"
  | "workspace"
  | "community"
  | "games"
  | "notifications"
  | "error"
  | "success"
  | "security";

export interface ModuleToneToken {
  key: ModuleToneKey;
  label: string;
  text: string;
  bgSoft: string;
  border: string;
  hoverBorder: string;
  solidBg: string;
  iconBg: string;
  barFill: string;
  hex: string;
}

export const MODULE_THEMES: Record<ModuleToneKey, ModuleToneToken> = {
  overview: {
    key: "overview",
    label: "Tổng quan",
    text: "text-ocean-600",
    bgSoft: "bg-ocean-light/80",
    border: "border-ocean-200",
    hoverBorder: "hover:border-ocean-500/50",
    solidBg: "bg-ocean-600",
    iconBg: "bg-ocean-light text-ocean-600",
    barFill: "bg-ocean-600",
    hex: "#2563EB",
  },
  materials: {
    key: "materials",
    label: "Học liệu",
    text: "text-sky-700",
    bgSoft: "bg-sky-50",
    border: "border-sky-200",
    hoverBorder: "hover:border-sky-400/70",
    solidBg: "bg-sky-500",
    iconBg: "bg-sky-100 text-sky-700",
    barFill: "bg-sky-500",
    hex: "#0284C7",
  },
  aiTutor: {
    key: "aiTutor",
    label: "AI Tutor",
    text: "text-violet-700",
    bgSoft: "bg-violet-50",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-400/70",
    solidBg: "bg-violet-600",
    iconBg: "bg-violet-100 text-violet-700",
    barFill: "bg-violet-600",
    hex: "#8B5CF6",
  },
  promptLab: {
    key: "promptLab",
    label: "Prompt Lab",
    text: "text-fuchsia-700",
    bgSoft: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    hoverBorder: "hover:border-fuchsia-400/70",
    solidBg: "bg-fuchsia-600",
    iconBg: "bg-fuchsia-100 text-fuchsia-700",
    barFill: "bg-gradient-creative",
    hex: "#A855F7",
  },
  assignments: {
    key: "assignments",
    label: "Bài tập",
    text: "text-orange-700",
    bgSoft: "bg-orange-50",
    border: "border-orange-200",
    hoverBorder: "hover:border-orange-400/70",
    solidBg: "bg-orange-500",
    iconBg: "bg-orange-100 text-orange-700",
    barFill: "bg-orange-500",
    hex: "#F97316",
  },
  assessments: {
    key: "assessments",
    label: "Bài kiểm tra",
    text: "text-amber-700",
    bgSoft: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400/70",
    solidBg: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    barFill: "bg-amber-500",
    hex: "#F59E0B",
  },
  achievements: {
    key: "achievements",
    label: "Thành tích",
    text: "text-amber-700",
    bgSoft: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400/70",
    solidBg: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    barFill: "bg-gradient-achievement",
    hex: "#F59E0B",
  },
  progress: {
    key: "progress",
    label: "Tiến độ học tập",
    text: "text-emerald-700",
    bgSoft: "bg-emerald-50",
    border: "border-emerald-200",
    hoverBorder: "hover:border-emerald-400/70",
    solidBg: "bg-emerald-600",
    iconBg: "bg-emerald-100 text-emerald-700",
    barFill: "bg-emerald-500",
    hex: "#10B981",
  },
  workspace: {
    key: "workspace",
    label: "Google Workspace",
    text: "text-cyan-700",
    bgSoft: "bg-cyan-50",
    border: "border-cyan-200",
    hoverBorder: "hover:border-cyan-400/70",
    solidBg: "bg-cyan-600",
    iconBg: "bg-cyan-100 text-cyan-700",
    barFill: "bg-cyan-500",
    hex: "#06B6D4",
  },
  community: {
    key: "community",
    label: "Cộng đồng",
    text: "text-pink-700",
    bgSoft: "bg-pink-50",
    border: "border-pink-200",
    hoverBorder: "hover:border-pink-400/70",
    solidBg: "bg-pink-600",
    iconBg: "bg-pink-100 text-pink-700",
    barFill: "bg-pink-500",
    hex: "#EC4899",
  },
  games: {
    key: "games",
    label: "Xưởng Trò chơi",
    text: "text-indigo-700",
    bgSoft: "bg-indigo-50",
    border: "border-indigo-200",
    hoverBorder: "hover:border-indigo-400/70",
    solidBg: "bg-indigo-600",
    iconBg: "bg-indigo-100 text-indigo-700",
    barFill: "bg-indigo-500",
    hex: "#6366F1",
  },
  notifications: {
    key: "notifications",
    label: "Thông báo",
    text: "text-blue-700",
    bgSoft: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400/70",
    solidBg: "bg-blue-600",
    iconBg: "bg-blue-100 text-blue-700",
    barFill: "bg-blue-600",
    hex: "#2563EB",
  },
  error: {
    key: "error",
    label: "Cảnh báo",
    text: "text-red-700",
    bgSoft: "bg-red-50",
    border: "border-red-200",
    hoverBorder: "hover:border-red-400/70",
    solidBg: "bg-red-600",
    iconBg: "bg-red-100 text-red-700",
    barFill: "bg-red-500",
    hex: "#DC2626",
  },
  success: {
    key: "success",
    label: "Thành công",
    text: "text-emerald-700",
    bgSoft: "bg-emerald-50",
    border: "border-emerald-200",
    hoverBorder: "hover:border-emerald-400/70",
    solidBg: "bg-emerald-600",
    iconBg: "bg-emerald-100 text-emerald-700",
    barFill: "bg-emerald-500",
    hex: "#10B981",
  },
  security: {
    key: "security",
    label: "Bảo mật & Điều hành",
    text: "text-ocean-700",
    bgSoft: "bg-ocean-50",
    border: "border-ocean-200",
    hoverBorder: "hover:border-ocean-500/50",
    solidBg: "bg-ocean-700",
    iconBg: "bg-ocean-100 text-ocean-700",
    barFill: "bg-ocean-700",
    hex: "#1D4ED8",
  },
};

export function getModuleTheme(tone: ModuleToneKey = "overview"): ModuleToneToken {
  return MODULE_THEMES[tone] ?? MODULE_THEMES.overview;
}

