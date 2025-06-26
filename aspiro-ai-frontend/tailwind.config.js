/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' if preferred, class is more flexible
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Example dark theme palette - can be expanded
        primary: {
          DEFAULT: '#0D9488', // Teal-600
          light: '#2DD4BF',   // Teal-400
          dark: '#0F766E',    // Teal-700
        },
        background: '#111827', // Gray-900
        surface: '#1F2937',    // Gray-800
        text: {
          DEFAULT: '#F3F4F6', // Gray-100
          secondary: '#9CA3AF', // Gray-400
        },
        accent: '#EC4899', // Pink-500
      },
    },
  },
  plugins: [],
}
