/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        dancing: ['Dancing Script', 'cursive'],
        playfair: ['Playfair Display', 'serif'],
      },
      colors: {
        cream: {
          50: '#fefbf6',
          100: '#fdf6eb',
          200: '#f9ecd9',
          300: '#f2dcb8',
        },
        honey: {
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
        },
        tomato: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        sage: {
          400: '#86efac',
          500: '#4ade80',
          600: '#22c55e',
        },
      },
      boxShadow: {
        'warm': '0 4px 14px -2px rgba(217, 119, 6, 0.12), 0 6px 20px -4px rgba(251, 146, 60, 0.08)',
        'warm-lg': '0 10px 40px -10px rgba(217, 119, 6, 0.2), 0 4px 20px -4px rgba(251, 146, 60, 0.1)',
        'inner-warm': 'inset 0 2px 4px 0 rgba(251, 146, 60, 0.06)',
      },
      borderRadius: {
        'pill': '9999px',
        'card': '1rem',
        'card-lg': '1.25rem',
      },
    },
  },
  plugins: [],
}
