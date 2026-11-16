import type { Config } from 'tailwindcss';

// CSS-variable colors that still support opacity modifiers (bg-primary/10).
// Tailwind v3 can't add alpha to a bare var(), so mix it with transparent.
const c = (name: string) =>
  `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: 'class',
  // Astryx ships its own reset (in @layer reset). Tailwind's preflight is
  // unlayered and would override Astryx component styles, so it stays off.
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        primary: {
          DEFAULT: c('primary'),
          hover: c('primary-hover'),
          foreground: c('primary-foreground'),
        },
        secondary: {
          DEFAULT: c('secondary'),
          foreground: c('secondary-foreground'),
        },
        destructive: {
          DEFAULT: c('destructive'),
          foreground: c('destructive-foreground'),
        },
        muted: {
          DEFAULT: c('muted'),
          foreground: c('muted-foreground'),
        },
        accent: {
          DEFAULT: c('accent'),
          foreground: c('accent-foreground'),
        },
        popover: {
          DEFAULT: c('popover'),
          foreground: c('popover-foreground'),
        },
        card: {
          DEFAULT: c('card'),
          foreground: c('card-foreground'),
        },
        surface: c('surface'),
        'surface-hover': c('surface-hover'),
        'text-secondary': c('muted-foreground'),
        blossom: { DEFAULT: c('blossom'), soft: c('blossom-soft') },
        leaf: { DEFAULT: c('leaf'), soft: c('leaf-soft') },
        coral: c('coral'),
        sun: c('sun'),
      },
      fontFamily: {
        sans: ['var(--font-family-body)', 'sans-serif'],
        display: ['var(--font-family-heading)', 'sans-serif'],
        body: ['var(--font-family-body)', 'sans-serif'],
        serif: ['var(--font-family-heading)', 'sans-serif'],
        heading: ['var(--font-family-heading)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(1rem)' },
          to: { transform: 'translateY(0)' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)' },
          to: { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease both',
        'slide-up': 'slide-in-from-bottom 300ms ease both',
        'zoom-in': 'zoom-in 300ms ease both',
      },
    },
  },
  plugins: [],
};

export default config;
