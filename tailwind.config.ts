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
        spotify: {
          black: "#000000",
          dark: "#121212",
          elevated: "#181818",
          hover: "#282828",
          active: "#333333",
          green: "#1ed760",
          "green-hover": "#3be477",
          sub: "#b3b3b3",
          muted: "#a7a7a7",
          burgundy: "#4a1219",
          "burgundy-light": "#6b1a25",
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "CircularSp",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
