/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/index.astro',
    './src/bodies/index.body.html',
    './src/pages/pricing.astro',
    './src/bodies/pricing.body.html',
    './src/pages/mcp.astro',
    './src/bodies/mcp.body.html',
    './src/bodies/mcp.head.html',
    './src/pages/aeo.astro',
    './src/bodies/aeo.body.html',
    './src/bodies/aeo.head.html',
    './src/pages/for-ai.astro',
    './src/bodies/for-ai.body.html',
    './src/bodies/for-ai.head.html',
    './src/pages/for-seo.astro',
    './src/bodies/for-seo.body.html',
    './src/bodies/for-seo.head.html',
    './src/pages/for-intel.astro',
    './src/bodies/for-intel.body.html',
    './src/bodies/for-intel.head.html',
    './src/pages/for-aeo-agencies.astro'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E11D48',
          hover: '#BE123C',
          dark: '#9F1239',
          light: '#FFE4E6'
        },
        ink: {
          950: '#090D16',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        terminal: {
          bg: '#0D1117',
          border: '#30363D',
          green: '#3FB950',
          cyan: '#58A6FF',
          amber: '#D29922',
          purple: '#BC8CFF',
          red: '#FF7B72'
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      letterSpacing: {
        technical: '-0.02em',
        tighter: '-0.035em'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        softGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.06)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'soft-glow': 'softGlow 8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
