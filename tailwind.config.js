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
        unsil: {
          green: {
            50: '#f0fbf5',
            100: '#d7f8e6',
            200: '#b3f2d0',
            300: '#6fe3a7',
            400: '#22d47b',
            500: '#009b4c', // Hijau Resmi Logo UNSIL (Perisai Luar)
            600: '#008a44', // Hijau UNSIL Medium
            700: '#08784c', // Hijau Resmi Logo UNSIL (Perisai Dalam)
            800: '#085d37', // Hijau UNSIL Deep Forest
            900: '#064428', // Hijau UNSIL Dark Corporate
            950: '#042e1b', // Hijau Gelap Latar Sidebar UNSIL
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          navy: {
            800: '#111827',
            900: '#0b1120',
            950: '#070b14',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'Tinos', 'serif'],
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(6, 78, 59, 0.15)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

