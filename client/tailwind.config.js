/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0B0B12',
          secondary: '#13131D',
          card: '#191925',
          elevated: '#212130',
          hover: '#28283a',
        },
        accent: {
          primary: '#8B5CF6',
          secondary: '#A78BFA',
          glow: 'rgba(139, 92, 246, 0.25)',
          muted: '#6D28D9',
        },
        surface: {
          border: '#2A2A3C',
          glass: 'rgba(25, 25, 37, 0.75)',
          glassBorder: 'rgba(255, 255, 255, 0.08)',
        },
        text: {
          main: '#FFFFFF',
          muted: '#A1A1AA',
          dim: '#71717A',
        },
        status: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
