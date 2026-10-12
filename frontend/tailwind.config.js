/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        graphite: "#111720",
        card: "#151C26",
        muted: "#9AA8BA",
        accent: {
          DEFAULT: "#2583FF",
          dim: "#4697FF",
          deep: "#173B70",
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
      transitionDuration: {
        280: "280ms",
        320: "320ms",
      },
    },
  },
  plugins: [],
};
