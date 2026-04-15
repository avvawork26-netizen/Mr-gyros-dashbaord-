/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#080808',
        sidebar: '#0d0d0d',
        card:    '#111111',
        line:    '#1e1e1e',
        accent:  '#4A9EFF',
        dim:     '#0c1d33',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: {
        DEFAULT: '0px', none: '0px', sm: '0px', md: '0px',
        lg: '0px', xl: '0px', '2xl': '0px', full: '9999px',
      },
    },
  },
  plugins: [],
};
