import { assert, assertEquals, assertExists } from '@std/assert';
import {
  assertAccepted,
  computeHmac,
  EXPORT_WEBHOOK_SECRET,
  fetchJson,
  REST_BASE,
  webhookE2eTest,
  WEBHOOKS_BASE,
} from './webhooks_helpers.ts';

webhookE2eTest('open webhook accepts unsigned payloads', async () => {
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

  assertEquals(status, 200);
  assertAccepted(body);
});

webhookE2eTest('secured webhook accepts valid hmac payloads', async () => {
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

  assertEquals(status, 200);
  assertAccepted(body);
});

webhookE2eTest('trigger events are persisted and listed', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const params = new URLSearchParams({ limit: '50', offset: '0' });
  const { status, body } = await fetchJson(`${REST_BASE}/events?${params}`);

  assertEquals(status, 200);
  const events = body.events as
    | Array<{ id: string; triggerId: string; status: string }>
    | undefined;
  assert(Array.isArray(events));
  assertExists(body.total);
});

webhookE2eTest('webhook trigger detail exposes configuration', async () => {
  const { status, body } = await fetchJson(`${REST_BASE}/triggers/generic-inbound-webhook`);

  assertEquals(status, 200);
  assertEquals(body.type, 'webhook');
  const metadata = body.metadata as Record<string, unknown> | undefined;
  assertExists(metadata);
  assertEquals(metadata.webhookPath, 'inbound/generic');
  assert('stats' in body);
});

webhookE2eTest('scheduled export can post to secured webhook', async () => {
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

  assertEquals(status, 200);
  assertAccepted(body);
});
