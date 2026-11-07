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
        canvas: "#F6F7F8",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F0F2F4",
        },
        ink: {
          DEFAULT: "#202428",
          muted: "#68717A",
        },
        border: {
          DEFAULT: "#E1E5E8",
        },
        brand: {
          teal: "#197C78",
          "teal-soft": "#E7F2F1",
          "teal-hover": "#146562",
        },
        status: {
          success: "#287A55",
          "success-soft": "#EBF5F0",
          warning: "#A96B18",
          "warning-soft": "#FDF6EA",
          danger: "#B54747",
          "danger-soft": "#FDF0F0",
          info: "#526B7A",
          "info-soft": "#EEF3F6",
        },
      },
      fontFamily: {
        sans: ["Geist", "DM Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(32, 36, 40, 0.05)",
        panel: "0 4px 12px rgba(32, 36, 40, 0.04)",
        dialog: "0 8px 30px rgba(32, 36, 40, 0.12)",
      },
      borderRadius: {
        button: "10px",
        panel: "14px",
      },
    },
  },
  plugins: [],
};

export default config;

