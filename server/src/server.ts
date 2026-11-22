import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { setupSocketIO } from './socket/index.js';
import { ClientToServerEvents, ServerToClientEvents } from './types/index.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const app = createApp();
const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

setupSocketIO(io);

async function startServer() {
  try {
    await connectDatabase();
    httpServer.listen(PORT, () => {
      console.log(`🚀 SyncPlay Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server initialized`);
    });
  } catch (err: any) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Handle unexpected termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server gracefully.');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

startServer();
