/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"], // Habilita dark mode por clase (como en shadcn/ui)
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#111827", // Fondo oscuro principal
        backgroundtwo: "#030712", // Fondo casi negro utilizado para excepciones
        foreground: "#fafafa", // Texto claro
        primary: "#1a76ff", // Azul principal btn
        secondary: "#1f2937", // Gris oscuro secundario
        muted: "#e0e4eb", // Gris medio para texto secundario
        border: "#4b5563", // Borde gris oscuro
        input: "#111827", // Fondo para inputs
        error: "#FF3B30", // Rojo para errores
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Usa Arial como fallback (puedes usar Inter si lo prefieres)
      },
    },
  },
  plugins: [],
};
