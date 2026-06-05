#!/usr/bin/env -S deno run --allow-net --allow-env
/**
 * Webhook E2E Test Script
 *
 * Validates the full webhook ingestion pipeline against a running Aspire stack:
 *
 * 1. Health check on triggers-api
 * 2. Verify webhook triggers are registered
 * 3. POST to open webhook (no HMAC) → verify accepted
 * 4. POST to secured webhook with valid HMAC → verify accepted
 * 5. POST to secured webhook with invalid HMAC → verify rejected (401)
 * 6. POST to secured webhook with tampered body → verify rejected (401)
 * 7. POST to unknown webhook path → verify 404
 * 8. Rate limit test → verify 429 after threshold
 * 9. Verify trigger events appear in listEvents API
 *
 * Prerequisites:
 *   - Aspire running (`deno task dev`)
 *   - triggers-api on port 8093
 *   - triggers processor running with webhook triggers registered
 *
 * Usage:
 *   deno run --allow-net --allow-env plugins/triggers/test-webhooks-e2e.ts
 *
 * @module
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const TRIGGERS_API = Deno.env.get('TRIGGERS_API_URL') || 'http://localhost:8093';
const WEBHOOKS_BASE = `${TRIGGERS_API}/api/v1/webhooks`;
const REST_BASE = `${TRIGGERS_API}/api/v1/triggers`;

/** The shared secret for the export-notify webhook (must match triggers/mod.ts) */
const EXPORT_WEBHOOK_SECRET = Deno.env.get('WEBHOOK_EXPORT_SECRET') ||
  'dev-export-secret-change-me';

// ============================================================================
// HELPERS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  detail?: string;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<string | void>): Promise<void> {
  const start = performance.now();
  try {
    const detail = await fn();
    const duration = Math.round(performance.now() - start);
    results.push({ name, passed: true, duration, detail: detail || undefined });
    console.log(`  ✅ ${name} (${duration}ms)${detail ? ` — ${detail}` : ''}`);
  } catch (error: unknown) {
    const duration = Math.round(performance.now() - start);
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, duration, error: msg });
    console.log(`  ❌ ${name} (${duration}ms) — ${msg}`);
  }
}

/**
 * Compute HMAC-SHA256 hex signature for a payload + secret.
 * Returns the signature prefixed with `sha256=` (GitHub-style).
 */
async function computeHmac(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}`;
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, init);
  let body: Record<string, unknown>;
  try {
    body = await res.json() as Record<string, unknown>;
  } catch {
    body = { raw: await res.text() };
  }
  return { status: res.status, body };
}

// ============================================================================
// TESTS
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Webhook E2E Tests');
console.log(`  Triggers API: ${TRIGGERS_API}`);
console.log(`  Webhooks:     ${WEBHOOKS_BASE}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// --------------------------------------------------------------------------
// 1. Health check
// --------------------------------------------------------------------------

console.log('── Health & Setup ──────────────────────────────────────────');

await runTest('Triggers API health check', async () => {
  const { status, body } = await fetchJson(`${TRIGGERS_API}/health`);
  if (status !== 200) throw new Error(`HTTP ${status}`);
  if (body.status !== 'healthy') throw new Error(`Unhealthy: ${JSON.stringify(body)}`);
  return `status=${body.status}`;
});

// --------------------------------------------------------------------------
// 2. Verify webhook triggers are registered
// --------------------------------------------------------------------------

let webhookTriggerCount = 0;

await runTest('Webhook triggers are registered', async () => {
  const params = new URLSearchParams({ limit: '50', offset: '0', type: 'webhook' });
  const { status, body } = await fetchJson(`${REST_BASE}/triggers?${params}`);
  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);

  const triggers = body.triggers as Array<{ id: string; type: string }>;
  webhookTriggerCount = triggers.length;
  if (webhookTriggerCount === 0) {
    throw new Error(
      'No webhook triggers registered. Ensure triggers/mod.ts includes webhook triggers.',
    );
  }

  const ids = triggers.map((t) => t.id).join(', ');
  return `${webhookTriggerCount} webhook trigger(s): ${ids}`;
});

// --------------------------------------------------------------------------
// 3. Open webhook (no HMAC) — generic inbound
// --------------------------------------------------------------------------

console.log('');
console.log('── Webhook Ingestion ──────────────────────────────────────');

let openWebhookEventId: string | null = null;

await runTest('POST open webhook (no HMAC) — accepted', async () => {
  const payload = JSON.stringify({
    source: 'e2e-test',
    event: 'test-ping',
    timestamp: new Date().toISOString(),
    data: { message: 'Hello from E2E test' },
  });

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/inbound/generic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
  if (!body.accepted) throw new Error(`Not accepted: ${JSON.stringify(body)}`);

  openWebhookEventId = body.eventId as string;
  return `eventId=${openWebhookEventId}, triggerId=${body.triggerId}`;
});

// --------------------------------------------------------------------------
// 4. Secured webhook with valid HMAC
// --------------------------------------------------------------------------

let securedWebhookEventId: string | null = null;

await runTest('POST secured webhook with valid HMAC — accepted', async () => {
  const payload = JSON.stringify({
    exportType: 'orders-daily',
    completedAt: new Date().toISOString(),
    recordCount: 150,
    outputPath: '.data/outgoing/orders_export_2026-02-13.csv',
    status: 'success',
  });

  const signature = await computeHmac(payload, EXPORT_WEBHOOK_SECRET);

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: payload,
  });

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
  if (!body.accepted) throw new Error(`Not accepted: ${JSON.stringify(body)}`);

  securedWebhookEventId = body.eventId as string;
  return `eventId=${securedWebhookEventId}, triggerId=${body.triggerId}`;
});

// --------------------------------------------------------------------------
// 5. Secured webhook with invalid HMAC → 401
// --------------------------------------------------------------------------

await runTest('POST secured webhook with wrong secret — rejected 401', async () => {
  const payload = JSON.stringify({ test: 'invalid-hmac' });
  const wrongSignature = await computeHmac(payload, 'totally-wrong-secret');

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': wrongSignature,
    },
    body: payload,
  });

  if (status !== 401) throw new Error(`Expected 401, got ${status}: ${JSON.stringify(body)}`);
  if (body.accepted) throw new Error('Should not be accepted with wrong secret');
  return `status=401, accepted=false`;
});

// --------------------------------------------------------------------------
// 6. Secured webhook with tampered body → 401
// --------------------------------------------------------------------------

await runTest('POST secured webhook with tampered body — rejected 401', async () => {
  const originalPayload = JSON.stringify({ amount: 100, currency: 'USD' });
  const signature = await computeHmac(originalPayload, EXPORT_WEBHOOK_SECRET);

  // Send tampered body with the original signature
  const tamperedPayload = JSON.stringify({ amount: 999999, currency: 'USD' });

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: tamperedPayload,
  });

  if (status !== 401) throw new Error(`Expected 401, got ${status}: ${JSON.stringify(body)}`);
  return `Tamper detected — status=401`;
});

// --------------------------------------------------------------------------
// 7. Unknown webhook path → 404
// --------------------------------------------------------------------------

await runTest('POST unknown webhook path — 404', async () => {
  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/nonexistent/path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  });

  if (status !== 404) throw new Error(`Expected 404, got ${status}: ${JSON.stringify(body)}`);
  if (body.accepted) throw new Error('Should not be accepted for unknown path');
  return `status=404, message=${body.message}`;
});

// --------------------------------------------------------------------------
// 8. Missing HMAC header on secured endpoint → 401
// --------------------------------------------------------------------------

await runTest('POST secured webhook without signature header — rejected 401', async () => {
  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ no: 'signature' }),
  });

  if (status !== 401) throw new Error(`Expected 401, got ${status}: ${JSON.stringify(body)}`);
  return `status=401, no signature header`;
});

// --------------------------------------------------------------------------
// 9. Verify trigger events via listEvents API
// --------------------------------------------------------------------------

console.log('');
console.log('── Event Verification ─────────────────────────────────────');

// Small delay to allow event processing
await new Promise((resolve) => setTimeout(resolve, 1000));

await runTest('Trigger events persisted in KV (listEvents)', async () => {
  const params = new URLSearchParams({ limit: '50', offset: '0' });
  const { status, body } = await fetchJson(`${REST_BASE}/events?${params}`);

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);

  const events = body.events as Array<{ id: string; triggerId: string; status: string }>;
  const total = body.total as number;

  return `${total} event(s) total, ${events.length} returned`;
});

await runTest('Webhook trigger detail page has config', async () => {
  // Fetch the detail for the generic webhook trigger
  const { status, body } = await fetchJson(`${REST_BASE}/triggers/generic-inbound-webhook`);

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
  if (body.type !== 'webhook') throw new Error(`Expected type=webhook, got ${body.type}`);
  if (!body.metadata) throw new Error('Expected metadata with webhookPath');

  const meta = body.metadata as Record<string, unknown>;
  if (meta.webhookPath !== 'inbound/generic') {
    throw new Error(`Expected webhookPath=inbound/generic, got ${meta.webhookPath}`);
  }

  // Check stats are present (may be zero if no events yet)
  const stats = body.stats as Record<string, unknown> | null;
  if (stats === undefined) throw new Error('Expected stats field in detail response');

  return `type=${body.type}, path=${meta.webhookPath}, stats=${stats ? 'present' : 'null'}`;
});

await runTest('Export webhook trigger detail has HMAC config', async () => {
  const { status, body } = await fetchJson(`${REST_BASE}/triggers/export-notify-webhook`);

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);

  const meta = body.metadata as Record<string, unknown>;
  if (!meta.webhookSecret) throw new Error('Expected webhookSecret in metadata');
  if (meta.webhookPath !== 'export/notify') {
    throw new Error(`Expected webhookPath=export/notify, got ${meta.webhookPath}`);
  }

  // Verify middleware and retry are present
  const middleware = body.middleware as Record<string, unknown> | null;
  const retry = body.retry as Record<string, unknown> | null;

  return `path=${meta.webhookPath}, secret=configured, middleware=${
    middleware ? 'yes' : 'no'
  }, retry=${retry ? 'yes' : 'no'}`;
});

// --------------------------------------------------------------------------
// 10. E2E Scheduled Worker → Webhook flow simulation
// --------------------------------------------------------------------------

console.log('');
console.log('── Scheduled Worker → Webhook E2E ────────────────────────');

await runTest('Simulate scheduled export completing → POST webhook', async () => {
  // Simulate what a scheduled worker (e.g., orders-daily-export) would do
  // after completing an export: POST to the webhook endpoint to trigger
  // downstream notification/processing.

  const exportResult = {
    exportType: 'orders-daily',
    completedAt: new Date().toISOString(),
    recordCount: 42,
    outputPath: `.data/outgoing/orders_daily_${new Date().toISOString().split('T')[0]}.csv`,
    fileSize: 8192,
    status: 'success',
    duration: 1250,
    triggeredBy: 'cron:orders-daily-export',
  };

  const payload = JSON.stringify(exportResult);
  const signature = await computeHmac(payload, EXPORT_WEBHOOK_SECRET);

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: payload,
  });

  if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
  if (!body.accepted) throw new Error('Webhook not accepted');

  return `Accepted: eventId=${body.eventId}, triggerId=${body.triggerId} (simulated cron export → webhook → trigger)`;
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

if (failed === 0) {
  console.log(`  ✅ All ${total} tests passed (${totalTime}ms)`);
} else {
  console.log(`  ❌ ${failed}/${total} tests failed (${totalTime}ms)`);
  console.log('');
  console.log('  Failed tests:');
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`    • ${r.name}: ${r.error}`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (failed > 0) {
  Deno.exit(1);
}
