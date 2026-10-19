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
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/utils/__tests__/authGuards.test.js',
      'src/utils/__tests__/authLogin.test.js',
      'src/utils/__tests__/fiturPersuratanTerpadu.test.js',
      'src/utils/__tests__/formatBarSelector.test.js',
      'src/utils/__tests__/jraHierarchicalSchema.test.js',
      'src/utils/__tests__/kopSurat.test.js',
      'src/utils/__tests__/leadershipMutation.test.js',
      'src/utils/__tests__/mutasiUserKredensial.test.js',
      'src/utils/__tests__/paperSize.test.js',
      'src/utils/__tests__/processMiningAccess.test.js',
      'src/utils/__tests__/rbacSubsystem.test.js',
      'src/utils/__tests__/signatoryScoping.test.js',
      'src/utils/__tests__/sotkBidirectionalSync.test.js',
      'src/utils/__tests__/tambahUserDosen.test.js',
    ]
  }
});
