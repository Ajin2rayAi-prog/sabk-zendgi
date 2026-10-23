import type { Config } from "tailwindcss";

/** رنگ برند از CSS Variable خوانده می‌شود تا با تغییر config کل سایت ری‌اسکین شود */
const withVar = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withVar("--c-primary"),
          deep: withVar("--c-primary-deep"),
          soft: withVar("--c-primary-soft"),
          fg: withVar("--c-primary-fg"),
        },
        accent: withVar("--c-accent"),
        bg: withVar("--c-bg"),
        elev: withVar("--c-elev"),
        fg: withVar("--c-fg"),
        muted: withVar("--c-muted"),
        line: withVar("--c-border"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Vazirmatn", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -4px rgba(0,0,0,0.10)",
        card: "0 12px 40px -18px rgba(0,0,0,0.22)",
        lux: "0 30px 70px -25px rgba(0,0,0,0.35)",
        brand: "0 14px 40px -12px rgb(var(--c-primary) / 0.45)",
      },
      backgroundImage: {
        "brand-grad":
          "linear-gradient(135deg, rgb(var(--c-primary)) 0%, rgb(var(--c-primary-deep)) 100%)",
        "brand-soft":
          "linear-gradient(135deg, rgb(var(--c-primary) / 0.14) 0%, rgb(var(--c-primary) / 0.02) 100%)",
      },
      borderRadius: {
        "2xl": "1.1rem",
        "3xl": "1.6rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 2.2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
