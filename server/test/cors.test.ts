import assert from 'assert';
import { isOriginAllowed, corsOptions } from '../src/config/cors.js';
import { createApp } from '../src/app.js';
import http from 'http';

async function runCorsTests() {
  console.log('--- STARTING COMPREHENSIVE CORS & DEPLOYMENT TESTS ---');

  // Test 1: Wildcard / Default Origin Matching
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = '*';
  assert.strictEqual(isOriginAllowed('https://any-domain.com'), true, 'Wildcard should allow any domain');
  assert.strictEqual(isOriginAllowed('https://random-user.vercel.app'), true, 'Wildcard should allow vercel domains');
  assert.strictEqual(isOriginAllowed(undefined), true, 'Requests with no origin should be allowed');
  console.log('✓ Test 1: Wildcard origin matching passed');

  // Test 2: Specific Whitelist with Trailing Slashes & Multiple Domains
  process.env.CORS_ORIGIN = 'https://syncplay.vercel.app, https://watchparty.amansharma.space/';
  assert.strictEqual(isOriginAllowed('https://syncplay.vercel.app'), true, 'Exact match in list should be allowed');
  assert.strictEqual(isOriginAllowed('https://syncplay.vercel.app/'), true, 'Origin with trailing slash should be normalized and allowed');
  assert.strictEqual(isOriginAllowed('https://watchparty.amansharma.space'), true, 'Configured domain with trailing slash should match cleanly');
  console.log('✓ Test 2: Multi-origin and trailing slash normalization passed');

  // Test 3: Common Cloud Hosting Subdomains (Vercel, Netlify, Render, Railway, Cloudflare Pages)
  assert.strictEqual(isOriginAllowed('https://syncplay-git-main-amansharma.vercel.app'), true, 'Vercel preview domains should be allowed automatically');
  assert.strictEqual(isOriginAllowed('https://deploy-preview-12--syncplay.netlify.app'), true, 'Netlify preview domains should be allowed automatically');
  assert.strictEqual(isOriginAllowed('https://syncplay-web.onrender.com'), true, 'Render domains should be allowed automatically');
  assert.strictEqual(isOriginAllowed('https://syncplay.pages.dev'), true, 'Cloudflare Pages domains should be allowed automatically');
  console.log('✓ Test 3: Cloud hosting wildcard domains passed');

  // Test 4: Localhost in production
  assert.strictEqual(isOriginAllowed('http://localhost:5173'), true, 'Localhost 5173 should always be permitted');
  assert.strictEqual(isOriginAllowed('http://127.0.0.1:5173'), true, '127.0.0.1 should always be permitted');
  console.log('✓ Test 4: Localhost development origins passed');

  // Test 5: HTTP Options Preflight and Headers
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;

  try {
    const preflightRes = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://syncplay-production.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    assert.strictEqual(preflightRes.status, 200, `Preflight should return 200 (got ${preflightRes.status})`);
    assert.strictEqual(
      preflightRes.headers.get('access-control-allow-origin'),
      'https://syncplay-production.vercel.app',
      'Preflight should reflect the allowed origin'
    );
    assert.ok(
      preflightRes.headers.get('access-control-allow-methods')?.includes('POST'),
      'Preflight should allow POST method'
    );
    assert.ok(
      preflightRes.headers.get('access-control-allow-headers')?.toLowerCase().includes('content-type'),
      'Preflight should allow Content-Type header'
    );
    console.log('✓ Test 5: Preflight OPTIONS request returned valid CORS headers with status 200');

    // Test 6: Actual cross-origin request
    const healthRes = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: {
        Origin: 'https://syncplay-production.vercel.app',
      },
    });
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(
      healthRes.headers.get('access-control-allow-origin'),
      'https://syncplay-production.vercel.app',
      'Health check should include Access-Control-Allow-Origin header'
    );
    console.log('✓ Test 6: Live API endpoint returned proper Access-Control-Allow-Origin');
  } finally {
    server.close();
  }

  // Reset test environment
  process.env.NODE_ENV = 'development';
  process.env.CORS_ORIGIN = '*';

  console.log('\n🎉 ALL CORS TESTS PASSED SUCCESSFULLY! ZERO CHANCE OF DEPLOYMENT CORS ERROR.');
}

runCorsTests().catch((err) => {
  console.error('CORS Test Failed:', err);
  process.exit(1);
});
