const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        'border-white': 'var(--border-white)',
        'border-secondary': 'var(--border-secondary)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        purple: 'var(--purple)',
        green: 'var(--green)',
        'button-label': 'var(--button-label)',
        'button-label-secondary': 'var(--button-label-secondary)',
        disabled: 'var(--disabled)',
        'disabled-foreground': 'var(--disabled-foreground)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'background-secondary': 'var(--background-secondary)',
        success: 'var(--success)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      fontFamily: {
        'arial': ['ArialCE', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
        'primary': ['ArialCE', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
        // Add more custom fonts as needed
        // 'bebas': ['Bebas-Neue', 'system-ui', '-apple-system', 'sans-serif'],
        // 'oswald': ['Oswald-Bold', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '3xl': ['2rem', { lineHeight: '2.25rem' }],
        'xl': ['1.25rem', { lineHeight: '1.5rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
      },
      fontWeight: {
        'hairline': '100',
        'thin': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
