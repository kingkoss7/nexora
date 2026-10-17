/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0C",
        graphite: "#121213",
        card: "#171718",
        muted: "#AAA49A",
        accent: {
          DEFAULT: "#C9A96E",
          dim: "#E0C28B",
          deep: "#8C744B",
        },
      },
      fontFamily: {
        display: ["Manrope", "Space Grotesk", "sans-serif"],
        sans: ["DM Sans", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 28px rgb(201 169 110 / 16%)",
        panel: "0 16px 40px rgb(0 0 0 / 28%)",
      },
    },
  },
  plugins: [],
};
