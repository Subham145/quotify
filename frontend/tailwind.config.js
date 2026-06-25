/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#d8ebff',
          500: '#2374e1',
          600: '#1c61be',
          700: '#164f9b',
        },
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};
