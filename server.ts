/**
 * AI Trust Architecture - Full-Stack Express & Vite Server Entry Point.
 * Serves backend API routes at /api and Vite frontend middlewares on Port 3000.
 */

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApiRouter } from './src/server/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = '0.0.0.0';

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Mount backend API routes
  app.use('/api', createApiRouter());

  // In development, hook Vite middleware; in production serve dist
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build dist not found. Run "npm run build" first.');
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`[AI Trust Architecture] Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
