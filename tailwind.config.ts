import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // [NEW] Defined the custom color palette used in components
      colors: {
        midnight: "#0F172A",
        charcoal: "#171717",
        violet: "#2E1065",
        "neon-cyan": "#06B6D4",
        "neon-amber": "#F59E0B",
        "neon-red": "#EF4444",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // [UPDATED] Comprehensive Animation Registry
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'zoom-in': 'zoomIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'flash-fade': 'flashFade 1.5s ease-out forwards',
      },
      // [UPDATED] Keyframes for the above animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Used for the Sudoku Grid "Line Completion" flash
        flashFade: {
          '0%': { 
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.2)'
          },
          '50%': { 
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            boxShadow: 'inset 0 0 5px rgba(6, 182, 212, 0.1)'
          },
          '100%': { 
            backgroundColor: 'transparent',
            boxShadow: 'none'
          },
        }
      },
    },
  },
  plugins: [],
};

export default config;