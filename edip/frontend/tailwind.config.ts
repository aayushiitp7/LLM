import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        foreground: '#fafafa', // zinc-50
        card: '#09090b',
        'card-foreground': '#fafafa',
        popover: '#18181b', // zinc-900
        'popover-foreground': '#fafafa',
        primary: {
          DEFAULT: '#fafafa',
          foreground: '#09090b',
        },
        secondary: {
          DEFAULT: '#27272a', // zinc-800
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#18181b', // zinc-900
          foreground: '#a1a1aa', // zinc-400
        },
        accent: {
          DEFAULT: '#27272a',
          foreground: '#fafafa',
        },
        destructive: {
          DEFAULT: '#ef4444', // red-500
          foreground: '#fafafa',
        },
        border: '#27272a', // zinc-800
        input: '#27272a',
        ring: '#a1a1aa', // zinc-400
        
        // Strict Semantic Colors
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        danger: '#ef4444',  // red-500
        info: '#3b82f6',    // blue-500
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: '0.5rem', // Sharper radii
        md: '0.375rem',
        sm: '0.25rem',
      },
      boxShadow: {
        // Deep, realistic layered shadows (NO GLOWS)
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'floating': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
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
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config
