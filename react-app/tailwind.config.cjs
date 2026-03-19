/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  safelist: [
    {
      pattern: /bg-(blue|green|red|purple)-50/
    },
    {
      pattern: /text-(blue|green|red|purple)-600/
    },
    {
      pattern: /bg-(purple|blue|green|pink|indigo|orange)-500/
    }
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
