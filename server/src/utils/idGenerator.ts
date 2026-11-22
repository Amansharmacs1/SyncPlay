import crypto from 'crypto';

/**
 * Generates a clean, cryptographically secure room code.
 * Format: 6 alphanumeric characters in uppercase (e.g. AB12CD).
 */
export function generateRoomId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omits easily confused characters like O, 0, I, 1
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generates a random session ID for participant identity
 */
export function generateParticipantId(): string {
  return 'user_' + crypto.randomBytes(8).toString('hex');
}

/**
 * Generates a unique message ID
 */
export function generateMessageId(): string {
  return 'msg_' + crypto.randomBytes(8).toString('hex');
}
