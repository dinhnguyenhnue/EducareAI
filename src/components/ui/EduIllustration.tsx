import React from "react";
import { ShieldCheck, Sparkles, GraduationCap, BookOpen, Layers } from "lucide-react";

/**
 * Vector / 3D-layered Ocean Blue educational illustration for Auth split screens.
 * Lightweight DOM + SVG composition (zero external image downloads, crisp at all DPIs).
 */
export function EduIllustration({
  variant = "login",
}: {
  variant?: "login" | "register" | "forgot";
}) {
  return (
    <div className="relative w-full py-4 select-none" aria-hidden="true">
      {/* Soft Ocean Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-white/10 to-violet-400/20 rounded-2xl blur-xl" />

      {/* Layered Glass Workspace Card */}
      <div className="relative rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300/90" />
          </div>
          <span className="text-[10px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/20">
            {variant === "register"
              ? "Xác minh Danh tính Trường học"
              : variant === "forgot"
              ? "Bảo mật Khôi phục Token"
              : "Không gian Học tập Số"}
          </span>
        </div>

        {/* Visual EdTech Mini Cards */}
        <div className="grid grid-cols-12 gap-2.5">
          <div className="col-span-7 rounded-xl bg-white/15 border border-white/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-300/25 flex items-center justify-center text-sky-100">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">Học tập & Năng lực</div>
                <div className="text-[9px] text-white/75">Chuẩn GDPT 2018</div>
              </div>
            </div>
            {/* Decorative SVG Sparkline */}
            <svg viewBox="0 0 180 42" className="w-full h-9 overflow-visible">
              <defs>
                <linearGradient id="oceanSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M2 34 C 32 30, 48 16, 78 20 C 106 24, 128 8, 178 6 L 178 42 L 2 42 Z"
                fill="url(#oceanSparkFill)"
              />
              <path
                d="M2 34 C 32 30, 48 16, 78 20 C 106 24, 128 8, 178 6"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="178" cy="6" r="3.5" fill="#FDE68A" />
            </svg>
          </div>

          <div className="col-span-5 flex flex-col gap-2.5">
            <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-400/35 to-purple-400/35 border border-white/20 p-2.5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white truncate">AI Tutor</div>
                <div className="text-[9px] text-white/75 truncate">Gợi mở tư duy</div>
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-white/15 border border-white/20 p-2.5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white truncate">OIDC RBAC</div>
                <div className="text-[9px] text-white/75 truncate">6 vai trò chuẩn</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-white/85">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-sky-200" /> Học liệu số Sandbox
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-200" /> Google Workspace Sync
          </span>
        </div>
      </div>
    </div>
  );
}

