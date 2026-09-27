/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8ed',
          100: '#f5edd3',
          200: '#ebdaa6',
          300: '#dec072',
          400: '#d4a843',
          500: '#c5932a',
          600: '#ab7621',
          700: '#89561d',
          800: '#71451e',
          900: '#60391d',
          DEFAULT: '#D4AF37',
        },
        meyhane: {
          bg: '#0c0e12',
          surface: '#14181f',
          card: '#1a202a',
          border: '#2a3240',
          red: '#8B1E1E',
          ruby: '#9B1D20',
          amber: '#F59E0B',
          cream: '#F4EDE4',
          muted: '#8E9AA8',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
