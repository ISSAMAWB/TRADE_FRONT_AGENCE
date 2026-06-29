/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FFF4E6",
          100: "#FFE3BF",
          200: "#FFCB85",
          300: "#FFB155",
          400: "#FF9A2E",
          500: "#E8722A",
          600: "#D55F1A",
          700: "#B84D13",
          800: "#8A3A0E",
          900: "#5A2609"
        },
        ink: {
          900: "#1f2937",
          700: "#374151",
          500: "#6b7280",
          300: "#d1d5db",
          100: "#f3f4f6",
          50:  "#f9fafb"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};
