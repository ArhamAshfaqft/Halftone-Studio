/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        studio: {
          bg: '#0B0D11',
          panel: '#13161E',
          card: '#1A1E29',
          border: '#252B38',
          hover: '#202634',
          active: '#2A3245',
          text: '#F1F5F9',
          muted: '#8E9AA8',
          accent: '#2563EB',
          'accent-hover': '#1D4ED8'
        }
      }
    },
  },
  plugins: [],
}
