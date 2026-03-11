/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#22c55e",
        accent: "#ec4899",
        dark: "#0f172a",
        "text-main": "#334155",
        "text-muted": "#64748b",
        "bg-light": "#f8fafc",
      },
      fontFamily: {
        main: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

