/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#050e1a',
          mid: '#0a1f35',
          surface: '#0d2847',
          light: '#1a4a7a',
        },
        shark: {
          orange: '#f97316',
          blue: '#38bdf8',
          green: '#4ade80',
          amber: '#fbbf24',
          grey: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
