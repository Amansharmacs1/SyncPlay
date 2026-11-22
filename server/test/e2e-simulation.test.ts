import assert from 'assert';
import http from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import { createApp } from '../src/app.js';
import { setupSocketIO } from '../src/socket/index.js';
import { RoomService } from '../src/services/roomService.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { RoomData, PlaybackState, ChatMessage } from '../src/types/index.js';

async function runE2ESimulation() {
  console.log('====================================================');
  console.log('   SYNCPLAY FULL E2E MULTI-CLIENT SIMULATION TEST   ');
  console.log('====================================================');

  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });
  setupSocketIO(io);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as any).port;
  const serverUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on ${serverUrl}`);

  // Step 1: User A creates a room
  console.log('\n--- Step 1: User A creates a room ---');
  const { room, hostId } = await RoomService.createRoom({
    displayName: 'Alice (Host)',
    roomName: "Alice's Friday Movie Night",
    visibility: 'public',
  });
  const roomId = room.roomId;
  assert.ok(roomId);
  console.log(`✓ Room created with ID: ${roomId}, hostId: ${hostId}`);

  // Helper to create client
  const createClientSocket = (): Socket => {
    return Client(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
  };

  const clientA = createClientSocket();
  const clientB = createClientSocket();
  const clientC = createClientSocket();

  try {
    // Connect User A (Host)
    console.log('\n--- Step 2: User A connects to room ---');
    await new Promise<void>((resolve) => {
      clientA.emit('room:join', {
        roomId,
        participantId: hostId,
        name: 'Alice (Host)',
      });
      clientA.once('room:state', (state: RoomData) => {
        assert.strictEqual(state.roomId, roomId);
        assert.strictEqual(state.hostId, hostId);
        console.log(`✓ Alice joined room ${roomId}`);
        resolve();
      });
    });

    // Step 3: User B joins using invitation
    console.log('\n--- Step 3: User B joins the room ---');
    const userBId = 'user_b_456';
    await new Promise<void>((resolve) => {
      clientB.emit('room:join', {
        roomId,
        participantId: userBId,
        name: 'Bob (Friend)',
      });
      clientB.once('room:state', (state: RoomData) => {
        assert.strictEqual(state.roomId, roomId);
        assert.strictEqual(state.participants.length, 2);
        console.log(`✓ Bob joined room ${roomId}. Total participants: ${state.participants.length}`);
        resolve();
      });
    });

    // Step 4: User A loads a new video
    console.log('\n--- Step 4: User A changes the video ---');
    const newMedia = {
      type: 'youtube' as const,
      url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
      title: '4K Cinematic Nature',
    };

    const mediaPromise = new Promise<void>((resolve) => {
      clientB.once('media:updated', (updated) => {
        assert.strictEqual(updated.url, newMedia.url);
        assert.strictEqual(updated.title, newMedia.title);
        console.log(`✓ Bob received updated media: ${updated.title}`);
        resolve();
      });
    });
    clientA.emit('media:change', { media: newMedia });
    await mediaPromise;

    // Step 5: User A plays the video
    console.log('\n--- Step 5: User A plays the video ---');
    const playPromise = new Promise<void>((resolve) => {
      clientB.once('playback:state', (playback: PlaybackState) => {
        assert.strictEqual(playback.status, 'playing');
        assert.strictEqual(playback.currentTime, 15);
        console.log(`✓ Bob received synchronized play event at position: ${playback.currentTime}s`);
        resolve();
      });
    });
    clientA.emit('playback:play', { currentTime: 15 });
    await playPromise;

    // Step 6: Wait 500ms and check User A pauses
    console.log('\n--- Step 6: User A pauses the video ---');
    await new Promise((res) => setTimeout(res, 300));
    const pausePromise = new Promise<void>((resolve) => {
      clientB.once('playback:state', (playback: PlaybackState) => {
        assert.strictEqual(playback.status, 'paused');
        assert(playback.currentTime >= 15);
        console.log(`✓ Bob received synchronized pause event at position: ${playback.currentTime.toFixed(2)}s`);
        resolve();
      });
    });
    clientA.emit('playback:pause', { currentTime: 15.3 });
    await pausePromise;

    // Step 7: User A seeks
    console.log('\n--- Step 7: User A seeks to 45s ---');
    const seekPromise = new Promise<void>((resolve) => {
      clientB.once('playback:sync', (playback: PlaybackState) => {
        assert.strictEqual(playback.currentTime, 45);
        console.log(`✓ Bob received synchronized seek to: ${playback.currentTime}s`);
        resolve();
      });
    });
    clientA.emit('playback:seek', { currentTime: 45 });
    await seekPromise;

    // Step 8: Both users exchange chat messages
    console.log('\n--- Step 8: Chat messaging exchange ---');
    const chatPromiseAlice = new Promise<void>((resolve) => {
      const handler = (msg: ChatMessage) => {
        if (msg.senderName === 'Bob (Friend)') {
          assert.strictEqual(msg.message, 'Hey Alice! Video looks crystal clear.');
          console.log(`✓ Alice received chat message from Bob: "${msg.message}"`);
          clientA.off('chat:message', handler);
          resolve();
        }
      };
      clientA.on('chat:message', handler);
    });
    clientB.emit('chat:send', { message: 'Hey Alice! Video looks crystal clear.' });
    await chatPromiseAlice;

    const chatPromiseBob = new Promise<void>((resolve) => {
      const handler = (msg: ChatMessage) => {
        if (msg.senderName === 'Alice (Host)') {
          assert.strictEqual(msg.message, 'Awesome, popcorn is ready! 🍿');
          console.log(`✓ Bob received chat message from Alice: "${msg.message}"`);
          clientB.off('chat:message', handler);
          resolve();
        }
      };
      clientB.on('chat:message', handler);
    });
    clientA.emit('chat:send', { message: 'Awesome, popcorn is ready! 🍿' });
    await chatPromiseBob;

    // Step 9: User C (late joiner) joins and receives current state
    console.log('\n--- Step 9: Late-joiner User C connects ---');
    const userCId = 'user_c_789';
    await new Promise<void>((resolve) => {
      clientC.emit('room:join', {
        roomId,
        participantId: userCId,
        name: 'Charlie (Late Joiner)',
      });
      clientC.once('room:state', (state: RoomData) => {
        assert.strictEqual(state.roomId, roomId);
        assert.strictEqual(state.media.url, newMedia.url);
        assert.strictEqual(state.playbackState.currentTime, 45);
        assert.strictEqual(state.participants.length, 3);
        console.log(`✓ Late joiner Charlie received full synchronized state at ${state.playbackState.currentTime}s`);
        resolve();
      });
    });

    // Step 10: Non-host unauthorized playback attempt prevention
    console.log('\n--- Step 10: Testing non-host control restriction ---');
    const unauthorizedSyncPromise = new Promise<void>((resolve) => {
      clientC.once('playback:sync', (state: PlaybackState) => {
        assert.strictEqual(state.currentTime, 45);
        console.log(`✓ Unauthorized playback control rejected; authoritative state returned`);
        resolve();
      });
    });
    // Charlie tries to pause or play (non-host)
    clientC.emit('playback:play', { currentTime: 0 });
    await unauthorizedSyncPromise;

    console.log('\n====================================================');
    console.log('   ALL E2E REAL-TIME SCENARIOS PASSED WITH SUCCESS!  ');
    console.log('====================================================\n');
  } finally {
    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
    await new Promise<void>((res) => httpServer.close(() => res()));
    await disconnectDatabase();
  }
}

runE2ESimulation().catch((err) => {
  console.error('E2E simulation error:', err);
  process.exit(1);
});
