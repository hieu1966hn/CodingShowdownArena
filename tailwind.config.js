/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./config/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./types/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0f172a', // slate-900 as base
          light: '#1e293b', // slate-800
          accent: '#06b6d4', // cyan-500
          neon: '#f43f5e', // rose-500
          primary: '#06b6d4', // cyan-500 (Alias for existing code)
          secondary: '#8b5cf6', // violet-500 (Alias for existing code)
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
