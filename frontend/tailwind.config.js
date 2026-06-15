/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        /* Secondary — pure white surfaces & on-primary text */
        secondary: {
          DEFAULT: "#FFFFFF",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8F9FA",
          section: "#F8F9FA",
        },
        ink: {
          DEFAULT: "#111827",
          body: "#4B5563",
          muted: "#6B7280",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        /* Primary brand — #3B767C */
        accent: {
          DEFAULT: "#3B767C",
          glow: "#3F7A80",
          hover: "#2E6569",
          light: "#E9F3F4",
        },
        /* CTA — unified with primary brand #3B767C */
        cta: {
          DEFAULT: "#3B767C",
          hover: "#2E6569",
          light: "#E9F3F4",
          ring: "rgb(59 118 124 / 0.35)",
        },
        brand: {
          primary: "#3B767C",
          "primary-dark": "#2E6569",
          "primary-light": "#E9F3F4",
          secondary: "#FFFFFF",
          gray: "#6B7280",
          charcoal: "#111827",
        },
      },
      fontFamily: {
        sans: ["Cairo", "system-ui", "sans-serif"],
        arabic: ["Cairo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(17 24 39 / 0.03), 0 8px 30px rgb(0 0 0 / 0.03)",
        "card-md": "0 2px 4px rgb(17 24 39 / 0.04), 0 12px 40px rgb(0 0 0 / 0.06)",
        soft: "0 8px 30px rgb(0 0 0 / 0.04)",
        "soft-lg": "0 4px 10px rgb(17 24 39 / 0.04), 0 18px 50px rgb(0 0 0 / 0.08)",
        accent: "0 4px 14px rgb(59 118 124 / 0.22)",
        "accent-lg": "0 10px 28px rgb(59 118 124 / 0.30)",
        cta: "0 8px 24px rgb(59 118 124 / 0.28)",
      },
      backgroundImage: {
        "tech-grid":
          "linear-gradient(rgb(59 118 124 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(59 118 124 / 0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "tech-grid": "32px 32px",
      },
    },
  },
  plugins: [],
};
