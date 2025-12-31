/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // FORCED CLASS MODE
  theme: {
    extend: {
      colors: {
        "primary": "#13ec5b",
        "background-light": "#f6f8f6",
        "background-dark": "#102216",
        "surface-dark": "#193322",
        "surface-light": "#ffffff",
        "surface-highlight": "#23482f",
        "surface-border": "#23482f",
        "input-border": "#326744",
        "input-dark": "#23482f",
        "border-dark": "#23482f",
        "border-light": "#e2e8f0",
        "text-secondary": "#92c9a4",
        "text-muted": "#92c9a4",
        "text-muted-dark": "#92c9a4",
        "text-muted-light": "#64748b",
        "kanban-bg": "#0B0B0B",
        "primary-dark": "#0ea842",
        "surface": "#1A1A1A",
      },
      fontFamily: {
        "display": ["Spline Sans", "sans-serif"], // Updated to match user HTML
        "body": ["Noto Sans", "sans-serif"], // Updated to match user HTML
        "inter": ["Inter", "sans-serif"],
        "montserrat": ["Montserrat", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "1rem", // Updated to match user HTML
        "lg": "2rem", // Updated to match user HTML
        "xl": "3rem", // Updated to match user HTML
        "2xl": "1rem",
        "full": "9999px"
      },
      boxShadow: {
        'glow': '0 0 15px rgba(19, 236, 91, 0.15)',
      }
    },
  },
  plugins: [],
}
