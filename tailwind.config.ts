import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fdvp: {
          bg: "var(--fdvp-bg)",
          card: "var(--fdvp-card)",
          primary: "var(--fdvp-primary)",
          accent: "var(--fdvp-accent)",
          text: "var(--fdvp-text)",
          light: "var(--fdvp-text-light)",
        },
      },
    },
  },
  plugins: [],
};
export default config;