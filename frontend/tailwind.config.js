/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a0f',
          card: 'rgba(18, 18, 29, 0.65)',
          border: 'rgba(255, 255, 255, 0.06)',
          accent: '#e50914', // Netflix Red
          accentHover: '#ff212c',
          gold: '#f5c518', // IMDb Gold
          muted: '#808090'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
