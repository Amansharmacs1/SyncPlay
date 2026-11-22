import express, { Express } from 'express';
import cors from 'cors';
import roomRoutes from './routes/roomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile or curl requests with no origin, or matched origins
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

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
