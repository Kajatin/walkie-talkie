/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "retro-green": "#aceab9",
        "retro-pink": "#e261a5",
        "retro-yellow": "#f5d78b",
      },
    },
  },
  plugins: [],
};
