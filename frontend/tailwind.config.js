/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F8FB',
        primary: { DEFAULT: '#5B5FEF', dark: '#4548C8', soft: '#EEEEFE' },
        ai: { DEFAULT: '#8B7CFF', soft: '#F1EEFF' },
        rose: { DEFAULT: '#E86A8A', soft: '#FDEEF2' },
        fetal: { DEFAULT: '#35B8A4', soft: '#E8F7F4' },
        healthy: { DEFAULT: '#31A56D', soft: '#EAF7F0' },
        warn: { DEFAULT: '#F2A93B', soft: '#FEF6E7' },
        crit: { DEFAULT: '#E05252', soft: '#FDECEC' },
        ink: '#172033',
        muted: '#667085',
        line: '#E6EAF0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 10px 28px -14px rgba(16,24,40,.14)',
        lift: '0 2px 4px rgba(16,24,40,.05), 0 18px 40px -18px rgba(16,24,40,.22)',
      },
      borderRadius: { xl2: '18px', xl3: '22px' },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0 50%' } },
      },
      animation: {
        fadeUp: 'fadeUp .45s cubic-bezier(.22,.8,.3,1) both',
        shimmer: 'shimmer 1.4s ease infinite',
      },
    },
  },
  plugins: [],
};