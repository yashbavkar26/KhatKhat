/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1", // Indigo 500
          dark: "#4f46e5", // Indigo 600
          light: "#818cf8", // Indigo 400
        },
        secondary: {
          DEFAULT: "#f3f4f6", // Gray 100
          dark: "#e5e7eb", // Gray 200
        },
        accent: {
          success: "#22c55e", // Green 500
          danger: "#ef4444", // Red 500
          warning: "#f59e0b", // Amber 500
        },
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
