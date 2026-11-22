/**
 * Client Environment & Connection URL Normalizer
 * Automatically sanitizes and cross-derives API and WebSocket URLs
 * to prevent deployment configuration mistakes and CORS/connection failures.
 */

function sanitizeUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

const DEFAULT_PROD_BACKEND = 'https://syncplay-ggbb.onrender.com';

function resolveUrls(): { apiBase: string; socketUrl: string } {
  const envApiUrl = sanitizeUrl(import.meta.env.VITE_API_URL);
  const envSocketUrl = sanitizeUrl(import.meta.env.VITE_SOCKET_URL);

  let finalSocketUrl = '';
  let finalApiBase = '';

  if (envSocketUrl) {
    finalSocketUrl = envSocketUrl;
  } else if (envApiUrl) {
    // Derive Socket URL from API URL by stripping trailing /api
    finalSocketUrl = envApiUrl.replace(/\/api$/, '');
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Zero-config production fallback pointing directly to the deployed Render backend
    finalSocketUrl = DEFAULT_PROD_BACKEND;
  } else {
    finalSocketUrl = 'http://localhost:5000';
  }

  if (envApiUrl) {
    // Ensure API URL ends with /api
    finalApiBase = envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`;
  } else if (envSocketUrl) {
    finalApiBase = `${envSocketUrl}/api`;
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Zero-config production fallback pointing directly to the deployed Render backend
    finalApiBase = `${DEFAULT_PROD_BACKEND}/api`;
  } else {
    finalApiBase = 'http://localhost:5000/api';
  }

  return {
    apiBase: finalApiBase,
    socketUrl: finalSocketUrl,
  };
}

const { apiBase, socketUrl } = resolveUrls();

export const API_BASE = apiBase;
export const SOCKET_URL = socketUrl;
