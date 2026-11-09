/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // pet-herbs-lab과 동일한 세이지 그린(내복) + 앰버(외용) 톤
        herb: '#4F7942',
        'herb-light': '#EAF1E6',
        'herb-dark': '#33502B',
        topical: '#A9721C',
        'topical-light': '#F3E7CC',
        'topical-dark': '#7A5314',
        danger: '#DC2626',
        'danger-light': '#FEE2E2',
        warning: '#F59E0B',
        'warning-light': '#FEF3C7',
        ink: '#2B2B2B',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
