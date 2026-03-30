/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep navy + gold
        navy: {
          50:  '#f0f4fa',
          100: '#dce6f5',
          200: '#b8ccea',
          300: '#85a8d8',
          400: '#4d7cc0',
          500: '#2f5ea8',
          600: '#1f4a8f',
          700: '#163874',
          800: '#0f2653',
          900: '#0a1a3a',
          950: '#060f22',
        },
        gold: {
          50:  '#fdfaed',
          100: '#faf0c4',
          200: '#f5dd85',
          300: '#efc347',
          400: '#e8ac1e',
          500: '#c9920f',
          600: '#a8720b',
          700: '#86540c',
          800: '#6e4310',
          900: '#5c3811',
          950: '#361e05',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
