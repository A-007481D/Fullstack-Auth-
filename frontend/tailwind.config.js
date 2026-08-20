/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom design tokens — consistent across the app
        brand: {
          50:  '#f0f4ff',
          100: '#dde7ff',
          200: '#c2d0ff',
          300: '#9db1ff',
          400: '#7089ff',
          500: '#4f62fa',
          600: '#3b44ef',
          700: '#3133d4',
          800: '#2a2bab',
          900: '#282a87',
          950: '#1a1a52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-in':   'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },             '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
