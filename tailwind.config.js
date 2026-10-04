/** @type {import('tailwindcss').Config} */
// Tailwind maps onto the design tokens in src/assets/tokens.css (colors, radius, shadows, fonts),
// so utilities like `bg-surface`, `text-secondary`, `border-line` follow the light/dark theme.
//
// Breakpoints (mobile-first, use these for all layout; no raw @media in components):
//   sm 640px  large phone / small tablet   md 768px  tablet   lg 1024px  laptop   xl 1280px  desktop
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      borderColor: {
        DEFAULT: 'var(--color-border)',
        line: 'var(--color-border)',
        'line-hover': 'var(--color-border-hover)',
        progressive: 'var(--color-progressive)',
        'progressive-hover': 'var(--color-progressive-hover)',
        destructive: 'var(--color-destructive)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      colors: {
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        line: 'var(--color-border)',
        'line-hover': 'var(--color-border-hover)',
        base: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        progressive: 'var(--color-progressive)',
        'progressive-hover': 'var(--color-progressive-hover)',
        'progressive-subtle': 'var(--color-progressive-subtle)',
        'interactive-subtle': 'var(--color-interactive-subtle)',
        success: 'var(--color-success)',
        'success-subtle': 'var(--color-success-subtle)',
        destructive: 'var(--color-destructive)',
        'destructive-subtle': 'var(--color-destructive-subtle)',
        warning: 'var(--color-warning)',
        'warning-subtle': 'var(--color-warning-subtle)',
        'warning-text': 'var(--color-warning-text)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius)',
        xl: 'var(--radius)',
        '2xl': 'var(--radius)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        sm: 'var(--shadow)',
        md: 'var(--shadow-hover)',
        lg: 'var(--shadow-hover)',
      },
    },
  },
  plugins: [],
}
