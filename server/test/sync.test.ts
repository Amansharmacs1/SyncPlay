import assert from 'assert';
import { SyncEngine } from '../src/socket/syncEngine.js';
import { ParticipantManager } from '../src/socket/participantManager.js';
import { ChatHandler } from '../src/socket/chatHandler.js';
import { generateRoomId } from '../src/utils/idGenerator.js';

async function runTests() {
  console.log('--- STARTING SYNCPLAY CORE UNIT & SYNC ENGINE TESTS ---');

  // Test 1: Room ID generator
  console.log('Testing Room ID Generation...');
  const roomId1 = generateRoomId();
  const roomId2 = generateRoomId();
  assert.strictEqual(roomId1.length, 6);
  assert.strictEqual(roomId2.length, 6);
  assert.notStrictEqual(roomId1, roomId2);
  console.log('✓ Room ID generation passed:', roomId1, roomId2);

  // Test 2: Sync Engine Authoritative Playback & Time Calculation
  console.log('Testing Sync Engine Play/Pause/Seek...');
  const testRoom = 'TEST_ROOM_1';
  await SyncEngine.resetMediaState(testRoom, 300);

  // Initial state is paused at 0
  let state = await SyncEngine.getAuthoritativeState(testRoom);
  assert.strictEqual(state.status, 'paused');
  assert.strictEqual(state.currentTime, 0);

  // Host plays at 10 seconds
  state = await SyncEngine.handlePlay(testRoom, 10);
  assert.strictEqual(state.status, 'playing');
  assert.strictEqual(state.currentTime, 10);

  // Wait 200ms and verify authoritative time advanced
  await new Promise((res) => setTimeout(res, 200));
  const advancedState = await SyncEngine.getAuthoritativeState(testRoom);
  assert.strictEqual(advancedState.status, 'playing');
  assert(
    advancedState.currentTime >= 10.15 && advancedState.currentTime <= 10.4,
    `Current time ${advancedState.currentTime} was expected between 10.15 and 10.4`
  );
  console.log('✓ Authoritative play & time advancement passed:', advancedState.currentTime);

  // Host seeks to 120s
  state = await SyncEngine.handleSeek(testRoom, 120);
  assert.strictEqual(state.currentTime, 120);
  console.log('✓ Authoritative seek passed:', state.currentTime);

  // Host pauses
  state = await SyncEngine.handlePause(testRoom, 120.5);
  assert.strictEqual(state.status, 'paused');
  assert.strictEqual(state.currentTime, 120.5);
  console.log('✓ Authoritative pause passed:', state.currentTime);

  // Test 3: Participant Presence & Duplicate Avoidance on Reconnect
  console.log('Testing Participant Presence & Reconnection...');
  const testUser = {
    id: 'user_123',
    socketId: 'socket_alpha',
    name: 'Alice',
    isHost: true,
  };

  let participants = ParticipantManager.addParticipant('ROOM_A', testUser);
  assert.strictEqual(participants.length, 1);
  assert.strictEqual(participants[0].socketId, 'socket_alpha');

  // User reloads page (new socketId, same participantId)
  participants = ParticipantManager.addParticipant('ROOM_A', {
    ...testUser,
    socketId: 'socket_beta',
  });
  // Must NOT create a second participant
  assert.strictEqual(participants.length, 1);
  assert.strictEqual(participants[0].socketId, 'socket_beta');
  console.log('✓ Duplicate participant prevention passed (seamless reconnect)');

  // Test 4: Chat Sanitization & History
  console.log('Testing Chat Handler & Sanitization...');
  const rawHtml = '<script>alert("xss")</script> & <b>Hello</b>';
  const clean = ChatHandler.sanitize(rawHtml);
  assert(!clean.includes('<script>'));
  assert(clean.includes('&lt;script&gt;'));
  assert(clean.includes('&amp;'));
  console.log('✓ Chat sanitization passed:', clean);

  const sysMsg = ChatHandler.createSystemMessage('ROOM_A', 'Test system message');
  assert.strictEqual(sysMsg.isSystem, true);
  assert.strictEqual(sysMsg.senderName, 'SyncPlay');
  console.log('✓ System chat message passed');

  console.log('\n ALL BACKEND CORE TESTS PASSED SUCCESSFULLY! \n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
