import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        leather: 'rgb(var(--color-leather) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(53, 39, 26, 0.04), 0 10px 30px rgba(53, 39, 26, 0.07)',
        lift: '0 2px 6px rgba(53, 39, 26, 0.05), 0 22px 52px rgba(53, 39, 26, 0.13)',
      },
    },
  },
  plugins: [],
} satisfies Config
