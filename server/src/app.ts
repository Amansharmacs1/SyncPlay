import express, { Express } from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import roomRoutes from './routes/roomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Trust proxy for reverse proxies (Render, Vercel, Railway, Cloudflare, etc.)
  app.set('trust proxy', 1);

  // Enable CORS with preflight support across all routes
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/health', healthRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/webrtc', webrtcRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
