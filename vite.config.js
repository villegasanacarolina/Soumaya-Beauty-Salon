import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [], // Asegúrate que no esté vacío o mal configurado
    },
  },
  optimizeDeps: {
    exclude: [], // Vacío para que Vite maneje las dependencias
  },
});