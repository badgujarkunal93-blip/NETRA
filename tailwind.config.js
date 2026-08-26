/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050D1A',
          900: '#0B1E3D', // Core Deep Navy
          850: '#0F2547',
          800: '#132B52',
          700: '#1A3A6D',
          600: '#234C8D',
          100: '#E4ECF7',
          50: '#F0F5FC',
        },
        gold: {
          600: '#99730E',
          500: '#D4A017', // Core Accent Gold/Amber
          400: '#E5AC1E',
          300: '#F3C556',
          100: '#FBF3D5',
          50: '#FEFDF8',
        },
        alert: {
          700: '#9E281C',
          600: '#C0392B', // Core Muted Red
          500: '#D64541',
          100: '#FCEBEB',
          50: '#FEF6F6',
        },
        surface: {
          DEFAULT: '#F5F6F8', // Core Section Light Grey
          card: '#FFFFFF',
          muted: '#EAEFF5',
          border: '#DCE3EC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(11, 30, 61, 0.06), 0 1px 2px -1px rgba(11, 30, 61, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(11, 30, 61, 0.1), 0 2px 4px -2px rgba(11, 30, 61, 0.06)',
        'modal': '0 20px 25px -5px rgba(11, 30, 61, 0.2), 0 8px 10px -6px rgba(11, 30, 61, 0.1)',
      }
    },
  },
  plugins: [],
}
