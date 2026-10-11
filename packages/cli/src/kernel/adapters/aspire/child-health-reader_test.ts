import { assertEquals } from '@std/assert';
import { readChildHealth } from './child-health-reader.ts';

const ready = {
  state: 'ready',
  registryReady: true,
  dependencyReady: true,
  restartCount: 0,
  lastFatalError: null,
};
Deno.test('child health reader honors red states and redacts incident details', async () => {
  const health = {
    ...ready,
    state: 'crash-looping' as const,
    restartCount: 3,
    lastFatalError: { message: 'secret raw failure', timestamp: 1 },
  };
  const result = await readChildHealth(
    'http://localhost:10000',
    () => Promise.resolve(Response.json(health, { status: 503 })),
  );
  assertEquals(result, {
    ...health,
    lastFatalError: { message: 'Background child failed (details redacted).', timestamp: 1 },
  });
});
Deno.test('child health reader rejects status mismatch malformed oversized and unreachable endpoints', async () => {
  for (
    const response of [
      Response.json(ready, { status: 503 }),
      Response.json({ ...ready, state: 'invented' }),
      Response.json({ ...ready, restartCount: -1 }),
      new Response('x'.repeat(4097)),
      new Response('invalid'),
    ]
  ) {
    assertEquals(
      await readChildHealth('http://localhost:10000', () => Promise.resolve(response)),
      undefined,
    );
  }
  assertEquals(
    await readChildHealth('http://localhost:10000', () => Promise.reject(new Error('offline'))),
    undefined,
  );
});
