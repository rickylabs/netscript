import { assert, assertEquals } from '@std/assert';
import { fetchJson, REST_BASE, TRIGGERS_API, webhookE2eTest } from './webhooks_helpers.ts';

webhookE2eTest('triggers api health endpoint is healthy', async () => {
  const { status, body } = await fetchJson(`${TRIGGERS_API}/health`);

  assertEquals(status, 200);
  assertEquals(body.status, 'healthy');
});

webhookE2eTest('webhook triggers are registered', async () => {
  const params = new URLSearchParams({ limit: '50', offset: '0', type: 'webhook' });
  const { status, body } = await fetchJson(`${REST_BASE}/triggers?${params}`);

  assertEquals(status, 200);
  const triggers = body.triggers as Array<{ id: string; type: string }> | undefined;
  assert(Array.isArray(triggers));
  assert(triggers.length > 0, 'expected at least one webhook trigger');
});
