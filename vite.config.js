import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  // Allow large JSON data files (CCTNS dataset is ~11MB)
  build: {
    chunkSizeWarningLimit: 15000,
  },
  json: {
    // Stringify large JSON to avoid memory issues
    stringify: false
  }
});
