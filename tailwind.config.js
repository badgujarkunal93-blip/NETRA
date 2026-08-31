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
          950: '#071A33', // Deepest Navy
          900: '#0B2341', // Core Navy Blue (Structure, Authority)
          850: '#0E2A4D',
          800: '#133560',
          700: '#1C457A',
          600: '#255899',
          200: '#CBDDF2',
          100: '#E6EEF8',
          50: '#F4F7FB',
        },
        amber: {
          600: '#D97706',
          500: '#F5B800', // Core Amber / CTI Accent
          400: '#FFB000',
          300: '#FCD34D',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        gold: {
          600: '#D97706',
          500: '#F5B800',
          400: '#FFB000',
          300: '#FCD34D',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        alert: {
          700: '#991B1B',
          600: '#DC2626', // Critical / High Alert Red Only
          500: '#EF4444',
          100: '#FEE2E2',
          50: '#FEF2F2',
        },
        surface: {
          DEFAULT: '#FFFFFF', // Pure White
          card: '#FFFFFF',
          muted: '#F8FAFC',
          border: 'rgba(11, 35, 65, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(7, 26, 51, 0.06), 0 1px 2px -1px rgba(7, 26, 51, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(7, 26, 51, 0.09), 0 2px 4px -2px rgba(7, 26, 51, 0.05)',
        'modal': '0 20px 25px -5px rgba(7, 26, 51, 0.18), 0 8px 10px -6px rgba(7, 26, 51, 0.1)',
      }
    },
  },
  plugins: [],
}
