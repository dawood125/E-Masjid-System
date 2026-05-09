/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
          DEFAULT: '#047857',
          dark: '#065f46',
          light: '#d1fae5',
        },
        // Accent Colors
        accent: {
          50: '#fffbf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#d4af37',
          light: '#fef3c7',
        },
        // Status Colors
        success: '#16a34a',
        'success-light': '#dcfce7',
        warning: '#d97706',
        'warning-light': '#fef3c7',
        error: '#dc2626',
        'error-light': '#fee2e2',
        info: '#2563eb',
        'info-light': '#dbeafe',
        // Neutrals
        white: '#ffffff',
        'off-white': '#f9fafb',
        dark: '#111827',
      },
      fontFamily: {
        primary: ["'Poppins'", 'sans-serif'],
        secondary: ["'Open Sans'", 'sans-serif'],
      },
      spacing: {
        'header': '80px',
        'sidebar': '280px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-in-up': 'fadeInUp 0.6s ease',
        'slide-in-left': 'slideInLeft 0.6s ease',
        'slide-in-right': 'slideInRight 0.6s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
