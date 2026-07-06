import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          50:  "#fdf2f2",
          100: "#fce4e5",
          200: "#f9c9cb",
          300: "#f4a0a3",
          400: "#ec6a6e",
          500: "#e03e43",
          600: "#CC2229",
          700: "#a81b21",
          800: "#8c191e",
          900: "#751a1e",
          950: "#40080b",
        },
        charcoal: {
          50:  "#f5f5f5",
          100: "#ebebeb",
          200: "#d1d1d1",
          300: "#a8a8a8",
          400: "#737373",
          500: "#525252",
          600: "#3a3a3a",
          700: "#2a2a2a",
          800: "#1a1a1a",
          900: "#111111",
          950: "#080808",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
