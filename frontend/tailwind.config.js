// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
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