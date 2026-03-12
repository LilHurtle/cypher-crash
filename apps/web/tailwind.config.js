/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        correct: '#538d4e',
        present: '#b59f3b',
        absent: '#3a3a3c',
        'correct-cb': '#f5793a',
        'present-cb': '#85c0f9',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        bounce_once: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-12px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        flip: 'flip 0.5s ease forwards',
        bounce_once: 'bounce_once 0.5s ease',
        shake: 'shake 0.4s ease',
        pop: 'pop 0.1s ease',
      },
    },
  },
  plugins: [],
};
