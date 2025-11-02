import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        primary: '#62567E',
        secondary: '#48317C',
        accent: '#B6A5DE',
        error: '#EF4444',
      }
    },
  },
  plugins: [],
} satisfies Config
