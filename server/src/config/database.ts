import mongoose from 'mongoose';

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[DB] Connected successfully to MongoDB.');
      return conn;
    } catch (err: any) {
      console.warn(`[DB] Could not connect to primary MONGODB_URI (${err.message}).`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production database connection failed: ${err.message}`);
      }
    }
  }

  // Development Fallback: In-Memory MongoDB Server
  console.log('[DB] Starting in-memory MongoDB instance for development/testing...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    console.log(`[DB] In-memory MongoDB started at: ${memoryUri}`);
    const conn = await mongoose.connect(memoryUri);
    console.log('[DB] Connected successfully to In-Memory MongoDB.');
    return conn;
  } catch (memErr: any) {
    console.error('[DB] Failed to start In-Memory MongoDB:', memErr.message);
    throw memErr;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
