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
          primary: '#F5F5F7',   // Apple signature light canvas gray
          secondary: '#E8E8ED', // Apple subtle card elevation
          card: '#FFFFFF',      // Apple crisp pure white
          elevated: '#FFFFFF',
          hover: '#F0F0F2',
        },
        accent: {
          primary: '#0071E3',   // Apple signature system blue
          secondary: '#0077ED', // Apple hover blue
          light: '#E8F2FE',     // Apple soft blue tint
          dark: '#0058B0',
          glow: 'rgba(0, 113, 227, 0.20)',
          muted: '#70A6FF',
        },
        surface: {
          border: '#D2D2D7',    // Apple subtle boundary border
          borderLight: '#E5E5E7',
          glass: 'rgba(255, 255, 255, 0.82)',
          glassBorder: 'rgba(210, 210, 215, 0.6)',
        },
        text: {
          main: '#1D1D1F',      // Apple deep graphite / near-black
          muted: '#86868B',     // Apple signature subheadline gray
          dim: '#A1A1A6',       // Apple tertiary caption gray
        },
        status: {
          success: '#34C759',   // Apple iOS green
          error: '#FF3B30',     // Apple iOS red
          warning: '#FF9500',   // Apple iOS orange
          info: '#0071E3',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-card': '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'apple-modal': '0 24px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(210, 210, 215, 0.5)',
        'apple-button': '0 2px 8px rgba(0, 113, 227, 0.25)',
        'apple-float': '0 12px 36px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
