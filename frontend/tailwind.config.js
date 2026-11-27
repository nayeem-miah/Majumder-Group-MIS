/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1677ff',
          dark: '#0d5fce',
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#1677ff',
          700: '#0d5fce',
        },
        navy: '#102a43',
        ink: '#243b53',
        muted: '#627d98',
        line: '#d9e2ec',
        surface: '#f5f7fa',
        danger: '#c53030',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,42,67,0.04), 0 12px 32px -20px rgba(16,42,67,0.35)',
      },
    },
  },
  plugins: [],
};
