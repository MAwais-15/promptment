/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8196fa',
          500: '#6271f4',
          600: '#4f52e8',
          700: '#4140cc',
          800: '#3537a4',
          900: '#303382',
          950: '#1d1e4c',
        },
        accent: {
          cyan:   '#22d3ee',
          violet: '#a855f7',
          amber:  '#f59e0b',
          rose:   '#f43f5e',
          emerald:'#10b981',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fc',
          100: '#f1f3f9',
          200: '#e4e8f2',
          800: '#1a1c2e',
          850: '#141627',
          900: '#0e0f1e',
          950: '#080913',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.12) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.08) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,0.10) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(269,100%,77%,0.12) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(24px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(98,113,244,0.3)' },
          to:   { boxShadow: '0 0 40px rgba(98,113,244,0.7), 0 0 80px rgba(98,113,244,0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-dark': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'brand': '0 8px 32px rgba(98,113,244,0.35)',
        'brand-lg': '0 16px 48px rgba(98,113,244,0.45)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
