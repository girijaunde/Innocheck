/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f1117",
        foreground: "#ffffff",
        card: "#1a1d27",
        primary: {
          DEFAULT: "#4f46e5", // Indigo-600
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#10b981", // Emerald-500
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
