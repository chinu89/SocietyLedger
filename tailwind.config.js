/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ← ADD THIS LINE - This enables class-based dark mode
  theme: {
    extend: {
      // Add some custom colors that work with CSS variables
      colors: {
        // Use CSS custom properties for theming
        'theme-bg-primary': 'var(--color-bg-primary, #ffffff)',
        'theme-bg-secondary': 'var(--color-bg-secondary, #f8fafc)',
        'theme-text-primary': 'var(--color-text-primary, #1e293b)',
        'theme-text-secondary': 'var(--color-text-secondary, #475569)',
      },
      // Add smooth transitions for theme switching
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      transitionDuration: {
        '200': '200ms',
      }
    },
  },
  plugins: [],
}