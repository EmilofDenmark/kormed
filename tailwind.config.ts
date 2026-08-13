import type { Config } from 'tailwindcss'

// Colour values are also mirrored in app/globals.css as CSS variables so
// non-Tailwind contexts (e.g. inline map controls) can read the same palette.
// To re-theme the whole app, change these two places only.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F8F6',
        surface: '#FFFFFF',
        'brand-dark': '#17324D',
        'brand-green': '#2F7D6D',
        'brand-neutral': '#EDE9E0',
        ink: {
          900: '#17324D',
          700: '#33465A',
          500: '#5B6B7A',
          300: '#94A2AD',
        },
        danger: '#B3261E',
        warning: '#8A6116',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        pill: '999px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(23, 50, 77, 0.06)',
        card: '0 1px 3px rgba(23, 50, 77, 0.08)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
}

export default config
