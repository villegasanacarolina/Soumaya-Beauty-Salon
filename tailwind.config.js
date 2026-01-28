/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // CORREGIDO: NO uses "./src/**/*" que incluye node_modules
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d4a574',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        'alex-brush': ['Alex Brush', 'cursive'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}