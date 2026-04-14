/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 600: '#0D9488', 700: '#0F766E', 50: '#F0FDFA' },
        navy: { 800: '#1E3A5F', 900: '#0F2233' },
      }
    },
  },
  plugins: [],
}
