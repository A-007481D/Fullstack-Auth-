/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Keeping brand tokens for backward compat but indigo is now primary
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out both',
        'slide-in': 'slideIn 0.25s ease-out both',
        'spin':     'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                            '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateY(6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}

