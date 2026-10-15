/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090D14",
        graphite: "#101722",
        card: "#141D2B",
        muted: "#A1ACBD",
        accent: {
          DEFAULT: "#3B82F6",
          dim: "#60A5FA",
          deep: "#1D4ED8",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "DM Sans", "sans-serif"],
        sans: ["DM Sans", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 24px rgb(37 131 255 / 20%)",
        panel: "0 16px 40px rgb(0 0 0 / 28%)",
      },
    },
  },
  plugins: [],
};
