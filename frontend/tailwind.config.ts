import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        "bg-primary": "#0A0A0F",
        "bg-secondary": "#111118",
        "bg-elevated": "#1A1A24",
        "accent-primary": "#6366F1",
        "accent-secondary": "#22D3EE",
        "accent-success": "#10B981",
        "accent-danger": "#EF4444",
        "accent-warning": "#F59E0B",
      },
    },
  },
  plugins: [],
};

export default config;
