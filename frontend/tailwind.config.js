/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1Red: '#E10600',
        f1Black: '#15151E',
        f1Gray: '#33333D',
        f1LightGray: '#A0A0A0',
      }
    },
  },
  plugins: [],
}