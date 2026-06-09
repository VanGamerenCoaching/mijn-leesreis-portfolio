import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#fffdf8",
        chalk: "#f7f1e4",
        leaf: "#4f7f52",
        sky: "#3d7fa8",
        berry: "#9a4f6b",
        marigold: "#d28b36"
      },
      boxShadow: {
        soft: "0 16px 36px rgba(49, 60, 73, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
