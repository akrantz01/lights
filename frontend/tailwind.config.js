module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      gridTemplateRows: {
        30: 'repeat(30, minmax(0, 1fr))',
        60: 'repeat(60, minmax(0, 1fr))',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
