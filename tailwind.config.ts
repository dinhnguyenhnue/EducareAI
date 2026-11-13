import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // EDUCARE OCEAN DESIGN SYSTEM — Primary Ocean Palette
        ocean: {
          DEFAULT: "#2563EB", // Primary Blue
          primary: "#2563EB",
          deep: "#1D4ED8", // Ocean Blue
          sky: "#38BDF8", // Sky Blue
          light: "#E0F2FE", // Light Sky
          navy: "#0F172A", // Deep Navy
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#0F172A",
          950: "#0B1120",
        },
        // Secondary Semantic Accents
        accent: {
          violet: "#8B5CF6",
          "violet-soft": "#F3E8FF",
          emerald: "#10B981",
          "emerald-soft": "#ECFDF5",
          amber: "#F59E0B",
          "amber-soft": "#FFFBEB",
          orange: "#F97316",
          "orange-soft": "#FFF7ED",
          pink: "#EC4899",
          "pink-soft": "#FDF2F8",
          cyan: "#06B6D4",
          "cyan-soft": "#ECFEFF",
          sky: "#0284C7",
          "sky-soft": "#E0F2FE",
        },
        // Neutral Palette
        canvas: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
        },
        // Accessible Semantic Status Palette (WCAG AA on light tint)
        status: {
          success: "#047857",
          "success-accent": "#10B981",
          "success-soft": "#ECFDF5",
          warning: "#B45309",
          "warning-accent": "#F59E0B",
          "warning-soft": "#FFFBEB",
          danger: "#B91C1C",
          "danger-accent": "#EF4444",
          "danger-soft": "#FEF2F2",
          info: "#1D4ED8",
          "info-accent": "#2563EB",
          "info-soft": "#EFF6FF",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
        "card-hover":
          "0 8px 24px -4px rgba(37, 99, 235, 0.10), 0 2px 6px rgba(15, 23, 42, 0.04)",
        panel:
          "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)",
        dialog:
          "0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 4px 14px rgba(15, 23, 42, 0.06)",
        ocean: "0 8px 24px -4px rgba(37, 99, 235, 0.28)",
        ai: "0 8px 24px -4px rgba(139, 92, 246, 0.28)",
      },
      borderRadius: {
        button: "10px",
        panel: "16px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
