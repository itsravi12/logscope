/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          hover: '#1E293B',
          text: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}
