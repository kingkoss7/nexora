/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        graphite: "#111111",
        card: "#161616",
        muted: "#8B8B8B",
        accent: {
          DEFAULT: "#3DCF8A",
          dim: "#1F7A54",
          deep: "#0F3D2A",
        },
      },
      fontFamily: {
        display: ["Outfit", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 12px 40px rgb(61 207 138 / 18%)",
        panel: "0 24px 60px rgb(0 0 0 / 45%)",
      },
      transitionDuration: {
        280: "280ms",
        320: "320ms",
      },
    },
  },
  plugins: [],
};
