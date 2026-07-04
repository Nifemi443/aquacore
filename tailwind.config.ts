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
        accent: {
          DEFAULT: "#0D7A5F",
          dark: "#065F46",
          darker: "#052E22",
          light: "#ECFDF5",
          muted: "#D1FAE5",
        },
        ocean: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF6FF",
          muted: "#DBEAFE",
        },
        emerald: {
          DEFAULT: "#059669",
          light: "#ECFDF5",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#0A0A0A",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          muted: "#525252",
          subtle: "#737373",
        },
        line: "#E5E5E5",
        canvas: {
          DEFAULT: "#FFFFFF",
          soft: "#F9F9F9",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        panel:
          "0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
        float:
          "0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.02), 0 16px 48px rgba(0,0,0,0.08)",
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.85), 0 0 0 1px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.03)",
        "inner-soft": "inset 0 1px 2px rgba(0,0,0,0.04)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      maxWidth: {
        site: "1200px",
        prose: "32rem",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13,122,95,0.06), transparent 70%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(37,99,235,0.04), transparent 65%)",
      },
    },
  },
  plugins: [],
};

export default config;
