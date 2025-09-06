import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'instrument': ['Instrument Sans', 'sans-serif'],
      },
      colors: {
        primary: '#62567E',
        accent: '#B6A5DE',
      }
    },
  },
  plugins: [],
} satisfies Config
