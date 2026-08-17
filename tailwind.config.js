/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#313338',       // Fundo principal do app
          card: '#313338',     // Fundo do card (na nova UI é quase o mesmo, ou '#2b2d31')
          input: '#1e1f22',    // Fundo dos inputs
          blurple: '#5865F2',  // A cor azul/roxa clássica dos botões
          blurpleHover: '#4752c4',
          textNormal: '#dbdee1',
          textMuted: '#b5bac1',
          header: '#f2f3f5',
          link: '#00a8fc',
          danger: '#fa777c'
        }
      },
      fontFamily: {
        sans: ['"gg sans"', '"Noto Sans"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}