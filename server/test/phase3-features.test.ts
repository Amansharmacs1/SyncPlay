import assert from 'assert';
import http from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import { createApp } from '../src/app.js';
import { setupSocketIO } from '../src/socket/index.js';
import { RoomService } from '../src/services/roomService.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { RoomData, QueueItem, ChatMessage } from '../src/types/index.js';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('       SYNCPLAY PHASE 3 FEATURE TEST SUITE          ');
  console.log('  Queue, Room Locks, Shared Controls & Chat Reactions');
  console.log('====================================================');

  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  setupSocketIO(io);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as any).port;
  const serverUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on ${serverUrl}`);

  const createClientSocket = (): Socket => {
    return Client(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
  };

  // Step 1: Create room
  console.log('\n--- Test 1: Room Creation & Initial State ---');
  const { room, hostId } = await RoomService.createRoom({
    displayName: 'Elena (Host)',
    roomName: "Elena's Cinema Club",
    visibility: 'public',
  });
  const roomId = room.roomId;
  assert.ok(roomId);
  assert.strictEqual(room.isLocked, false);
  assert.strictEqual(room.allowParticipantControl, false);
  assert.deepStrictEqual(room.queue, []);
  console.log(`✓ Room created with ID: ${roomId}, hostId: ${hostId}`);

  const clientHost = createClientSocket();
  const clientGuest = createClientSocket();
  const clientLatecomer = createClientSocket();

  try {
    // Connect Host
    await new Promise<void>((resolve) => {
      clientHost.emit('room:join', {
        roomId,
        participantId: hostId,
        name: 'Elena (Host)',
      });
      clientHost.once('room:state', (state: RoomData) => {
        assert.strictEqual(state.roomId, roomId);
        assert.strictEqual(state.hostId, hostId);
        resolve();
      });
    });
    console.log('✓ Host joined room successfully');

    // Connect Guest
    const guestId = 'guest_' + Math.random().toString(16).substring(2, 10);
    await new Promise<void>((resolve) => {
      clientGuest.emit('room:join', {
        roomId,
        participantId: guestId,
        name: 'Marcus',
      });
      clientGuest.once('room:state', (state: RoomData) => {
        assert.strictEqual(state.participants.length, 2);
        resolve();
      });
    });
    console.log('✓ Guest joined room successfully');

    // Test 2: Shared Watch Queue
    console.log('\n--- Test 2: Watch Queue (Add, Reorder, Remove) ---');
    let updatedQueue: QueueItem[] = [];

    // Add Item 1 (YouTube)
    await new Promise<void>((resolve) => {
      clientHost.once('queue:update', (items: QueueItem[]) => {
        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0].title, 'Cyberpunk Short Film');
        assert.strictEqual(items[0].type, 'youtube');
        updatedQueue = items;
        resolve();
      });

      clientHost.emit('queue:add', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Cyberpunk Short Film',
        type: 'youtube',
      });
    });
    console.log('✓ Added item 1 to watch queue');

    // Add Item 2 (Direct MP4)
    await new Promise<void>((resolve) => {
      const handler = (items: QueueItem[]) => {
        if (items.length === 2) {
          assert.strictEqual(items[1].title, 'Nature Documentary Clip');
          assert.strictEqual(items[1].type, 'direct');
          updatedQueue = items;
          clientGuest.off('queue:update', handler);
          resolve();
        }
      };
      clientGuest.on('queue:update', handler);

      clientGuest.emit('queue:add', {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        title: 'Nature Documentary Clip',
        type: 'direct',
      });
    });
    console.log('✓ Added item 2 to watch queue; broadcast to all participants');

    // Reorder Queue: Swap item 0 and item 1
    const reorderedIds = [updatedQueue[1].id, updatedQueue[0].id];
    await new Promise<void>((resolve) => {
      clientHost.once('queue:update', (items: QueueItem[]) => {
        assert.strictEqual(items[0].id, reorderedIds[0]);
        assert.strictEqual(items[1].id, reorderedIds[1]);
        updatedQueue = items;
        resolve();
      });

      clientHost.emit('queue:reorder', { itemIds: reorderedIds });
    });
    console.log('✓ Queue items successfully reordered by host');

    // Auto-advance via playback:ended
    console.log('\n--- Test 3: Auto-Advance Queue on Playback Ended ---');
    await new Promise<void>((resolve) => {
      let mediaChanged = false;
      let queueUpdated = false;

      const checkDone = () => {
        if (mediaChanged && queueUpdated) resolve();
      };

      clientHost.once('media:updated', (media: any) => {
        assert.strictEqual(media.title, 'Nature Documentary Clip');
        mediaChanged = true;
        checkDone();
      });

      clientHost.once('queue:update', (items: QueueItem[]) => {
        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0].title, 'Cyberpunk Short Film');
        queueUpdated = true;
        checkDone();
      });

      clientHost.emit('playback:ended');
    });
    console.log('✓ Host emitted playback:ended; room auto-advanced to next queued video and updated queue length to 1');

    // Test 4: Room Locking & Permissions
    console.log('\n--- Test 4: Room Lock & Participant Controls ---');

    // Host updates settings: lock room and enable participant control
    await new Promise<void>((resolve) => {
      clientGuest.once('room:settings-updated', (settings: any) => {
        assert.strictEqual(settings.isLocked, true);
        assert.strictEqual(settings.allowParticipantControl, true);
        assert.strictEqual(settings.roomName, 'Elena Private Cinema VIP');
        resolve();
      });

      clientHost.emit('room:update-settings', {
        roomName: 'Elena Private Cinema VIP',
        isLocked: true,
        allowParticipantControl: true,
      });
    });
    console.log('✓ Host locked the room and enabled shared participant playback controls');

    // Latecomer attempts to join locked room -> should be rejected
    const latecomerId = 'late_' + Math.random().toString(16).substring(2, 10);
    await new Promise<void>((resolve) => {
      clientLatecomer.once('room:error', (err: { message: string; code?: string }) => {
        assert.strictEqual(err.code, 'ROOM_LOCKED');
        console.log(`✓ Rejected latecomer correctly with code: ${err.code} ("${err.message}")`);
        resolve();
      });

      clientLatecomer.emit('room:join', {
        roomId,
        participantId: latecomerId,
        name: 'Late Sam',
      });
    });

    // Shared participant controls: Guest can now control playback
    await new Promise<void>((resolve) => {
      clientHost.once('playback:state', (state: any) => {
        assert.strictEqual(state.status, 'playing');
        assert.strictEqual(state.currentTime, 45.5);
        resolve();
      });

      clientGuest.emit('playback:play', { currentTime: 45.5 });
    });
    console.log('✓ Non-host participant successfully triggered playback:play with shared permissions');

    // Test 5: Chat Reactions
    console.log('\n--- Test 5: Real-Time Chat Reactions ---');
    let messageId = '';

    // Send a chat message
    await new Promise<void>((resolve) => {
      const handler = (msg: ChatMessage) => {
        if (!msg.isSystem && msg.senderId === guestId) {
          messageId = msg.id;
          clientHost.off('chat:message', handler);
          resolve();
        }
      };
      clientHost.on('chat:message', handler);

      clientGuest.emit('chat:send', {
        message: 'This documentary looks absolutely stunning in 4K!',
      });
    });
    assert.ok(messageId, 'Expected chat message ID');
    console.log(`✓ Chat message sent (id: ${messageId})`);

    // Host reacts with 🔥
    await new Promise<void>((resolve) => {
      clientGuest.once('chat:reaction-updated', (data: any) => {
        assert.strictEqual(data.messageId, messageId);
        assert.ok(data.reactions['🔥']);
        assert.ok(data.reactions['🔥'].includes(hostId));
        resolve();
      });

      clientHost.emit('chat:reaction', {
        messageId,
        emoji: '🔥',
      });
    });
    console.log('✓ Host added reaction 🔥 to message');

    // Host toggles reaction off
    await new Promise<void>((resolve) => {
      clientGuest.once('chat:reaction-updated', (data: any) => {
        assert.strictEqual(data.messageId, messageId);
        assert.ok(!data.reactions['🔥'] || !data.reactions['🔥'].includes(hostId));
        resolve();
      });

      clientHost.emit('chat:reaction', {
        messageId,
        emoji: '🔥',
      });
    });
    console.log('✓ Host toggled reaction 🔥 off; updated across room');

    // Test 6: Host Departure and Graceful Reassignment
    console.log('\n--- Test 6: Host Departure & Host Reassignment ---');
    await new Promise<void>((resolve) => {
      clientGuest.once('participants:update', (participants: any[]) => {
        assert.strictEqual(participants.length, 1);
        assert.strictEqual(participants[0].id, guestId);
        assert.strictEqual(participants[0].isHost, true);
        resolve();
      });

      clientHost.emit('room:leave');
    });
    console.log('✓ Original host departed; guest promoted to room host seamlessly');

    console.log('\n====================================================');
    console.log('     ALL PHASE 3 FEATURE TESTS PASSED (6/6)!        ');
    console.log('====================================================');
  } finally {
    clientHost.disconnect();
    clientGuest.disconnect();
    clientLatecomer.disconnect();
    await new Promise((r) => setTimeout(r, 400));
    httpServer.close();
    await disconnectDatabase();
    process.exit(0);
  }
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ Phase 3 test failed:', err);
  process.exit(1);
});
