/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        'brutal': '4px 4px 0 0 #000000',
        'brutal-lg': '8px 8px 0 0 #000000',
        'brutal-sm': '2px 2px 0 0 #000000',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Poppins"', 'ui-sans-serif', 'system-ui'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};
