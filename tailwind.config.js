/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9FB',
        ink: '#1A202C',
        muted: '#64748B',
        outline: '#E2E8F0',
        brand: {
          50: '#EAF7F1',
          100: '#D3F0E2',
          200: '#94D4B0',
          300: '#50DEA9',
          400: '#12B886',
          500: '#006C4D',
          600: '#004B30',
          700: '#00321F',
        },
        teal: {
          50: '#EAF7F1',
          100: '#D3F0E2',
          500: '#12B886',
          600: '#006C4D',
          700: '#004B30',
        },
        amber: {
          50: '#FEF3E2',
          100: '#FCE1B3',
          500: '#F59E0B',
          600: '#D6890F',
          700: '#A8690B',
        },
        rose: {
          50: '#FFDAD6',
          100: '#FFC2BC',
          500: '#BA1A1A',
          600: '#93000A',
          700: '#730009',
        },
      },
      fontFamily: {
        display: ['var(--font-inter)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(4%, -6%) scale(1.05)' },
          '66%': { transform: 'translate(-3%, 4%) scale(0.97)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        drift: 'drift 18s ease-in-out infinite',
      },
      boxShadow: {
        glass: '0px 10px 30px rgba(0, 75, 48, 0.08)',
      },
    },
  },
  plugins: [],
};
