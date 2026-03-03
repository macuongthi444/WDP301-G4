import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ← thêm dòng này

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ← thêm dòng này
  ],
})