import { CorsOptions } from 'cors';

/**
 * Parses and normalizes configured origins from environment variables.
 * Handles:
 * - Comma-separated or space-separated origins
 * - Trailing slashes removal (e.g. https://domain.com/ -> https://domain.com)
 * - Wildcard '*' support
 * - Local development hostnames
 */
function getNormalizedOrigins(): { explicitOrigins: Set<string>; allowAll: boolean } {
  const allowAll =
    process.env.CORS_ORIGIN === '*' ||
    process.env.ALLOW_ALL_ORIGINS === 'true' ||
    process.env.NODE_ENV !== 'production';

  const rawOrigins: string[] = [];

  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    rawOrigins.push(...process.env.CORS_ORIGIN.split(/[\s,]+/));
  }

  if (process.env.CLIENT_URL && process.env.CLIENT_URL !== '*') {
    rawOrigins.push(...process.env.CLIENT_URL.split(/[\s,]+/));
  }

  // Always allow standard local development hosts
  rawOrigins.push(
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  );

  const explicitOrigins = new Set<string>();
  for (const raw of rawOrigins) {
    const cleaned = raw.trim().replace(/\/+$/, '');
    if (cleaned) {
      explicitOrigins.add(cleaned);
    }
  }

  return { explicitOrigins, allowAll };
}

/**
 * Checks if the request origin matches allowed patterns.
 * Supports:
 * - Direct domain matching
 * - Vercel preview domains (*.vercel.app)
 * - Netlify preview domains (*.netlify.app)
 * - Cloudflare Pages domains (*.pages.dev)
 * - Render domains (*.onrender.com)
 * - Railway domains (*.railway.app)
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, postman)
  if (!origin) {
    return true;
  }

  const { explicitOrigins, allowAll } = getNormalizedOrigins();

  // If wildcard enabled or in non-production, allow all
  if (allowAll) {
    return true;
  }

  // Normalize request origin (remove trailing slash)
  const normalizedOrigin = origin.trim().replace(/\/+$/, '');

  // Check explicit whitelist
  if (explicitOrigins.has(normalizedOrigin)) {
    return true;
  }

  // Check common deployment hosting patterns (Vercel, Netlify, Render, Railway, Cloudflare Pages)
  try {
    const parsed = new URL(normalizedOrigin);
    const hostname = parsed.hostname;

    if (
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.pages.dev') ||
      hostname.endsWith('.onrender.com') ||
      hostname.endsWith('.railway.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    // If invalid URL, reject
    return false;
  }

  // If CORS_ORIGIN is not explicitly configured in production, default to allowing
  // the requesting origin rather than breaking the application with a CORS error.
  if (!process.env.CORS_ORIGIN && !process.env.CLIENT_URL) {
    return true;
  }

  return false;
}

/**
 * Express CORS Configuration
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      // Return true to reflect the request origin
      callback(null, true);
    } else {
      // Safely decline without throwing an unhandled Error that breaks Express
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Range',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Content-Length',
    'ETag',
    'Date',
  ],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 200,
};
