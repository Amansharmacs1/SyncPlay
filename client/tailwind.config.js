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
          primary: '#F8FAFC',   // Crisp modern off-white background
          secondary: '#F1F5F9', // Clean soft slate secondary
          card: '#FFFFFF',      // Pure white cards
          elevated: '#F8FAFC',  // Subtle elevated elements
          hover: '#F1F5F9',     // Soft hover state
        },
        accent: {
          primary: '#6366F1',   // Sleek modern Indigo
          secondary: '#4F46E5', // Deep rich Indigo
          light: '#EEF2FF',     // Soft Indigo tint
          glow: 'rgba(99, 102, 241, 0.20)',
          muted: '#818CF8',
        },
        surface: {
          border: '#E2E8F0',    // Crisp slate-200 border
          glass: 'rgba(255, 255, 255, 0.85)',
          glassBorder: 'rgba(226, 232, 240, 0.8)',
        },
        text: {
          main: '#0F172A',      // Slate-900: sharp, elegant, rich charcoal
          muted: '#64748B',     // Slate-500: balanced secondary text
          dim: '#94A3B8',       // Slate-400: subtle tertiary text
        },
        status: {
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 4px 20px -2px rgba(99, 102, 241, 0.35)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'modal': '0 20px 40px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        'sm-subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
