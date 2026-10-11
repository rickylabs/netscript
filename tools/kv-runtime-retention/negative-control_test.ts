import { assertEquals } from 'jsr:@std/assert@^1';
const root = Deno.env.get('NETSCRIPT_RETENTION_PROBE_ROOT') ??
  new URL('../../', import.meta.url).href.replace(/\/$/, '');
const { DenoKvAdapter } = await import(`${root}/packages/kv/mod.ts`);
const { SagaKvRetention } = await import(
  `${root}/packages/plugin-sagas-core/src/stores/saga-kv-retention.ts`
);
Deno.test('legacy terminal saga keys are retired by retention migration', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  await kv.set(['sagas', 'state', 'old'], {
    state: {},
    metadata: {
      instanceId: 'old',
      sagaId: 'legacy',
      status: 'completed',
      durability: 't3',
      version: 1,
      createdAt: new Date('2000-01-01'),
      updatedAt: new Date('2000-01-01'),
    },
  });
  await kv.set(['sagas', 'transition', 'old', 1], { version: 1 });
  await kv.set(['sagas', 'correlation', 'legacy', 'old'], 'old');
  const retention = new SagaKvRetention(kv, ['sagas'], () => new Date());
  for (let pass = 0; pass < 15; pass++) {
    if (typeof retention.backfill === 'function') await retention.backfill(7);
    else await retention.cleanup(10);
  }
  assertEquals(await kv.get(['sagas', 'transition', 'old', 1]), null);
  assertEquals(await kv.get(['sagas', 'correlation', 'legacy', 'old']), null);
  assertEquals(await kv.get(['sagas', 'state', 'old']), null);
});
Deno.test('legacy terminal trigger families are retired by retention migration', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  await kv.set(['triggers', 'events', 'old'], {
    id: 'old',
    triggerId: 'legacy',
    status: 'completed',
    updatedAt: '2000-01-01',
  });
  await kv.set(['triggers', 'by-trigger', 'legacy', 'old'], 'old');
  await kv.set(['triggers', 'dlq', 'entries', 'old'], {
    id: 'old',
    triggerId: 'legacy',
    failedAt: '2000-01-01',
  });
  await kv.set(['triggers', 'dlq', 'by-trigger', 'legacy', 'old'], 'old');
  const helper = await import(
    `${root}/packages/plugin-triggers-core/src/stores/trigger-kv-retention.ts`
  ).catch(() => undefined);
  if (helper) {
    for (let pass = 0; pass < 12; pass++) {
      await helper.backfillTriggerRetention({ kv });
    }
  }
  assertEquals(await kv.get(['triggers', 'events', 'old']), null);
  assertEquals(await kv.get(['triggers', 'by-trigger', 'legacy', 'old']), null);
  assertEquals(await kv.get(['triggers', 'dlq', 'entries', 'old']), null);
  assertEquals(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', 'old']), null);
});
