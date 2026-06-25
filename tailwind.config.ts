import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        novara: {
          bg: "#08090d",
          panel: "#101218",
          panel2: "#161920",
          line: "#2a2e38",
          gold: "#c6a15b",
          gold2: "#e0c48a",
          mist: "#9aa3b2",
        },
      },
      boxShadow: {
        panel: "0 12px 40px rgba(0, 0, 0, 0.28)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
