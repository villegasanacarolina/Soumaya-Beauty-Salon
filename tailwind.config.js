/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // ← ¡SOLO esto!
    // NO incluyas `./src/**/*.ts` por separado
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}