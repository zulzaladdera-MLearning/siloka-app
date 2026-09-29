import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import silokaApp from './server/app.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'siloka-backend-api-dev',
      configureServer(server) {
        // Mount backend express app ke middleware Connect milik Vite dev server
        server.middlewares.use(silokaApp);
        console.log('[VITE-DEV] SILOKA Backend API middleware terpasang di dev server');
      },
    },
  ],
  server: {
    port: 3000,
    open: false,
  },
});
