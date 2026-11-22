import assert from 'assert';
import http from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import { ParticipantManager } from '../src/socket/participantManager.js';
import { createApp } from '../src/app.js';
import { setupSocketIO } from '../src/socket/index.js';
import { RoomService } from '../src/services/roomService.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getIceServers } from '../src/config/iceServers.js';

async function runWebRtcSignalingTest() {
  console.log('========================================================');
  console.log('    SYNCPLAY PHASE 2 WEBRTC SIGNALING TEST SUITE        ');
  console.log('========================================================');

  // Test 1: ICE servers configuration
  console.log('Testing ICE servers configuration...');
  const iceServers = getIceServers();
  assert(Array.isArray(iceServers));
  assert(iceServers.length > 0);
  assert(iceServers[0].urls.toString().includes('stun:stun.l.google.com:19302'));
  console.log('✓ ICE servers configured with Google STUN pool');

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

  // Create watch room
  const { room, hostId } = await RoomService.createRoom({
    displayName: 'Alice (Host)',
    roomName: 'WebRTC Test Room',
  });
  const roomId = room.roomId;

  const createClientSocket = (): Socket => {
    return Client(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
  };

  const clientA = createClientSocket();
  const clientB = createClientSocket();

  try {
    // Connect User A and User B to watch room
    console.log('\n--- Step 1: Users join watch room ---');
    await new Promise<void>((res) => {
      clientA.emit('room:join', { roomId, participantId: hostId, name: 'Alice' });
      clientA.once('room:state', () => res());
    });

    const userBId = 'user_b_peer_123';
    await new Promise<void>((res) => {
      clientB.emit('room:join', { roomId, participantId: userBId, name: 'Bob' });
      clientB.once('room:state', () => res());
    });
    console.log('✓ Alice and Bob joined room');

    // Step 2: Alice joins WebRTC call
    console.log('\n--- Step 2: Alice joins video call ---');
    await new Promise<void>((res) => {
      clientA.emit('webrtc:join', { cameraEnabled: true, microphoneEnabled: true });
      clientA.once('webrtc:call-participants', (payload) => {
        assert.strictEqual(payload.participants.length, 0); // Alice is first
        console.log('✓ Alice joined call (initial peer count: 0)');
        res();
      });
    });

    // Step 3: Bob joins WebRTC call
    console.log('\n--- Step 3: Bob joins video call ---');
    const bobJoinPromiseForAlice = new Promise<void>((res) => {
      clientA.once('webrtc:participant-joined', (payload) => {
        assert.strictEqual(payload.participantId, userBId);
        assert.strictEqual(payload.cameraEnabled, true);
        assert.strictEqual(payload.microphoneEnabled, true);
        console.log('✓ Alice received webrtc:participant-joined for Bob');
        res();
      });
    });

    const bobReceivesExistingPeers = new Promise<void>((res) => {
      clientB.once('webrtc:call-participants', (payload) => {
        assert.strictEqual(payload.participants.length, 1);
        assert.strictEqual(payload.participants[0].participantId, hostId);
        console.log('✓ Bob received existing peer Alice in call-participants list');
        res();
      });
    });

    clientB.emit('webrtc:join', { cameraEnabled: true, microphoneEnabled: true });
    await Promise.all([bobJoinPromiseForAlice, bobReceivesExistingPeers]);

    // Step 4: WebRTC Offer / Answer exchange
    console.log('\n--- Step 4: Offer and Answer Relay ---');
    const mockOfferSdp = 'v=0\r\no=alice 1234 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n';
    const mockAnswerSdp = 'v=0\r\no=bob 5678 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n';

    const bobReceivesOffer = new Promise<void>((res) => {
      clientB.once('webrtc:offer', (payload) => {
        assert.strictEqual(payload.fromParticipantId, hostId);
        assert.strictEqual(payload.offer.sdp, mockOfferSdp);
        console.log('✓ Bob received WebRTC Offer from Alice');
        res();
      });
    });

    clientA.emit('webrtc:offer', {
      targetParticipantId: userBId,
      offer: { type: 'offer', sdp: mockOfferSdp },
    });
    await bobReceivesOffer;

    const aliceReceivesAnswer = new Promise<void>((res) => {
      clientA.once('webrtc:answer', (payload) => {
        assert.strictEqual(payload.fromParticipantId, userBId);
        assert.strictEqual(payload.answer.sdp, mockAnswerSdp);
        console.log('✓ Alice received WebRTC Answer from Bob');
        res();
      });
    });

    clientB.emit('webrtc:answer', {
      targetParticipantId: hostId,
      answer: { type: 'answer', sdp: mockAnswerSdp },
    });
    await aliceReceivesAnswer;

    // Step 5: ICE candidate relay
    console.log('\n--- Step 5: ICE Candidate Relay ---');
    const bobReceivesCandidate = new Promise<void>((res) => {
      clientB.once('webrtc:ice-candidate', (payload) => {
        assert.strictEqual(payload.fromParticipantId, hostId);
        assert.strictEqual(payload.candidate.candidate, 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host');
        console.log('✓ Bob received ICE Candidate from Alice');
        res();
      });
    });

    clientA.emit('webrtc:ice-candidate', {
      targetParticipantId: userBId,
      candidate: {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      },
    });
    await bobReceivesCandidate;

    // Step 6: Media Status Updates (Mic, Camera, Screen share)
    console.log('\n--- Step 6: Media Status Toggles ---');
    const micStatusPromise = new Promise<void>((res) => {
      clientB.once('media:participant-status', (payload) => {
        if (payload.participantId === hostId) {
          assert.strictEqual(payload.microphoneEnabled, false);
          console.log('✓ Bob received Alice microphone muted update');
          res();
        }
      });
    });
    clientA.emit('media:microphone-status', { enabled: false });
    await micStatusPromise;

    const screenShareStatusPromise = new Promise<void>((res) => {
      clientB.once('media:participant-status', (payload) => {
        if (payload.participantId === hostId && payload.screenSharing === true) {
          console.log('✓ Bob received Alice screen share active update');
          res();
        }
      });
    });
    clientA.emit('media:screen-share-status', { sharing: true });
    await screenShareStatusPromise;

    // Step 7: Alice leaves call (keeps watch room active!)
    console.log('\n--- Step 7: Alice leaves video call ---');
    const bobReceivesAliceLeftCall = new Promise<void>((res) => {
      clientB.once('webrtc:participant-left', (payload) => {
        assert.strictEqual(payload.participantId, hostId);
        console.log('✓ Bob received webrtc:participant-left for Alice');
        res();
      });
    });
    clientA.emit('webrtc:leave');
    await bobReceivesAliceLeftCall;

    console.log('\n========================================================');
    console.log('    ALL WEBRTC SIGNALING TESTS PASSED SUCCESSFULLY!     ');
    console.log('========================================================\n');
  } finally {
    ParticipantManager.clearAllTimers();
    clientA.disconnect();
    clientB.disconnect();
    await new Promise<void>((res) => httpServer.close(() => res()));
    await disconnectDatabase();
    process.exit(0);
  }
}

runWebRtcSignalingTest().catch((err) => {
  console.error('WebRTC test failed:', err);
  process.exit(1);
});
