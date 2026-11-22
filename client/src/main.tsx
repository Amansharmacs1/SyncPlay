import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SyncPlay PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SyncPlay PWA] Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
