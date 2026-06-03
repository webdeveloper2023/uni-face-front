import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Windows da 5173 ko'pincha Hyper-V/WSL tomonidan band qilinadi (EACCES).
  // Shu sabab default ni reservation'dan tashqari portga o'rnatib qo'ydik.
  server: {
    host: "127.0.0.1",
    port: 5400,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5400,
  },
})
