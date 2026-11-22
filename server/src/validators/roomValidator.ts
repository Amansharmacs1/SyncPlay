import { z } from 'zod';

export const createRoomSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(30, 'Display name cannot exceed 30 characters'),
  roomName: z
    .string()
    .trim()
    .max(50, 'Room name cannot exceed 50 characters')
    .optional(),
  password: z
    .string()
    .max(32, 'Password cannot exceed 32 characters')
    .optional(),
  visibility: z.enum(['public', 'private']).default('public'),
});

export const joinRoomSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(30, 'Display name cannot exceed 30 characters'),
  password: z.string().optional(),
});

export const mediaUpdateSchema = z.object({
  type: z.enum(['youtube', 'direct']),
  url: z.string().url('Invalid media URL'),
  title: z.string().default('Untitled Media'),
  duration: z.number().optional(),
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),
});
