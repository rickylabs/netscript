import { assertEquals, assertExists } from '@std/assert';
import {
  assertRejected,
  computeHmac,
  EXPORT_WEBHOOK_SECRET,
  fetchJson,
  REST_BASE,
  webhookE2eTest,
  WEBHOOKS_BASE,
} from './webhooks_helpers.ts';

webhookE2eTest('secured webhook rejects payloads signed with the wrong secret', async () => {
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

  assertRejected(status, body, 401);
});

webhookE2eTest('secured webhook rejects tampered payload bodies', async () => {
  const originalPayload = JSON.stringify({ amount: 100, currency: 'USD' });
  const signature = await computeHmac(originalPayload, EXPORT_WEBHOOK_SECRET);
  const tamperedPayload = JSON.stringify({ amount: 999999, currency: 'USD' });

  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: tamperedPayload,
  });

  assertRejected(status, body, 401);
});

webhookE2eTest('unknown webhook paths return not found', async () => {
  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/nonexistent/path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  });

  assertRejected(status, body, 404);
});

webhookE2eTest('secured webhook rejects missing signatures', async () => {
  const { status, body } = await fetchJson(`${WEBHOOKS_BASE}/export/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ no: 'signature' }),
  });

  assertRejected(status, body, 401);
});

webhookE2eTest('export webhook detail exposes hmac configuration', async () => {
  const { status, body } = await fetchJson(`${REST_BASE}/triggers/export-notify-webhook`);

  assertEquals(status, 200);
  const metadata = body.metadata as Record<string, unknown> | undefined;
  assertExists(metadata);
  assertExists(metadata.webhookSecret);
  assertEquals(metadata.webhookPath, 'export/notify');
});
