/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          "surface-container-highest": "#e0e3e5",
          "on-primary": "#ffffff",
          "tertiary-fixed": "#ffdbcc",
          "on-surface": "#191c1e",
          "on-tertiary": "#ffffff",
          "background": "#f7f9fb",
          "surface-dim": "#d8dadc",
          "on-tertiary-container": "#ffd2be",
          "primary-fixed-dim": "#c3c0ff",
          "error": "#ba1a1a",
          "secondary-container": "#d0e1fb",
          "secondary": "#505f76",
          "on-secondary": "#ffffff",
          "on-primary-fixed": "#0f0069",
          "surface-bright": "#f7f9fb",
          "primary": "#3525cd",
          "on-secondary-fixed-variant": "#38485d",
          "outline": "#777587",
          "primary-container": "#4f46e5",
          "on-primary-container": "#dad7ff",
          "surface-container-lowest": "#ffffff",
          "surface": "#f7f9fb",
          "on-secondary-fixed": "#0b1c30",
          "primary-fixed": "#e2dfff",
          "outline-variant": "#c7c4d8",
          "surface-container-low": "#f2f4f6",
          "on-background": "#191c1e",
          "error-container": "#ffdad6",
          "secondary-fixed": "#d3e4fe",
          "surface-tint": "#4d44e3",
          "surface-container": "#eceef0",
          "surface-variant": "#e0e3e5",
          "inverse-primary": "#c3c0ff",
          "tertiary-container": "#a44100",
          "surface-container-high": "#e6e8ea",
          "secondary-fixed-dim": "#b7c8e1",
          "tertiary-fixed-dim": "#ffb695",
          "on-tertiary-fixed": "#351000",
          "on-surface-variant": "#464555",
          "inverse-on-surface": "#eff1f3",
          "tertiary": "#7e3000",
          "on-secondary-container": "#54647a",
          "on-tertiary-fixed-variant": "#7b2f00",
          "on-primary-fixed-variant": "#3323cc",
          "on-error-container": "#93000a",
          "inverse-surface": "#2d3133",
          "on-error": "#ffffff"
        },
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },

      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],

        // 🔥 Optional (recommended)
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};