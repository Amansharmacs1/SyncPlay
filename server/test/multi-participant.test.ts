import assert from 'assert';
import http from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { setupSocketIO } from '../src/socket/index.js';
import { connectDatabase } from '../src/config/database.js';
import { RoomService } from '../src/services/roomService.js';
import { ClientToServerEvents, ServerToClientEvents } from '../src/types/index.js';

async function runMultiParticipantTest() {
  console.log('--- STARTING MULTI-PARTICIPANT PRESENCE & SHARED CONTROL TEST ---');

  await connectDatabase();
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  setupSocketIO(io);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 5000;
  const socketUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Create a room
    const { room, hostId } = await RoomService.createRoom({
      displayName: 'Host User',
      roomName: 'Presence & Shared Controls Test Room',
    });
    const roomId = room.roomId;
    console.log(`Created Room ${roomId} with Host ${hostId}`);

    // 2. Client A (Host) connects
    const clientA = ioClient(socketUrl, { transports: ['websocket'] });
    const clientB = ioClient(socketUrl, { transports: ['websocket'] });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Client A connect timeout')), 5000);
      clientA.on('connect', () => {
        clearTimeout(timeout);
        clientA.emit('room:join', { roomId, participantId: hostId, name: 'Host User' });
        resolve();
      });
    });

    // 3. Client B (Guest) connects with unique participant ID
    const guestId = 'user_guest_' + Date.now();
    let clientAReceived2Participants = false;
    let clientBReceived2Participants = false;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Participant sync timeout')), 5000);

      clientA.on('participants:update', (list) => {
        console.log(`Client A sees ${list.length} participants:`, list.map((p) => p.name));
        if (list.length === 2) {
          clientAReceived2Participants = true;
          if (clientAReceived2Participants && clientBReceived2Participants) {
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      clientB.on('connect', () => {
        clientB.emit('room:join', { roomId, participantId: guestId, name: 'Guest User' });
      });

      clientB.on('participants:update', (list) => {
        console.log(`Client B sees ${list.length} participants:`, list.map((p) => p.name));
        if (list.length === 2) {
          clientBReceived2Participants = true;
          if (clientAReceived2Participants && clientBReceived2Participants) {
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    });

    assert.ok(clientAReceived2Participants, 'Client A must see 2 participants');
    assert.ok(clientBReceived2Participants, 'Client B must see 2 participants');
    console.log('✓ Multi-participant presence verified: Both Host and Guest see each other in real-time');

    // 4. Test Video Control: Guest emits playback:play
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Guest playback:play timeout')), 5000);
      clientA.once('playback:state', (state) => {
        console.log('Client A received playback:state from Guest play action:', state.status);
        assert.strictEqual(state.status, 'playing');
        clearTimeout(timeout);
        resolve();
      });
      clientB.emit('playback:play', { currentTime: 15 });
    });
    console.log('✓ Guest play control verified');

    // 5. Test Video Control: Guest emits playback:seek
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Guest playback:seek timeout')), 5000);
      clientA.once('playback:sync', (state) => {
        console.log('Client A received playback:sync from Guest seek action:', state.currentTime);
        assert.strictEqual(state.currentTime, 75);
        clearTimeout(timeout);
        resolve();
      });
      clientB.emit('playback:seek', { currentTime: 75 });
    });
    console.log('✓ Guest seek control verified');

    // 6. Test Video Control: Guest emits media:change
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Guest media:change timeout')), 5000);
      clientA.once('media:updated', (media) => {
        console.log('Client A received media:updated from Guest action:', media.title);
        assert.strictEqual(media.title, 'Guest Selected Movie');
        clearTimeout(timeout);
        resolve();
      });
      clientB.emit('media:change', {
        media: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Guest Selected Movie',
          duration: 212,
        },
      });
    });
    console.log('✓ Guest media change control verified');

    clientA.disconnect();
    clientB.disconnect();
    console.log('\n🎉 ALL MULTI-PARTICIPANT PRESENCE & SHARED VIDEO CONTROLS TESTS PASSED!');
  } finally {
    httpServer.close();
  }
}

runMultiParticipantTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
