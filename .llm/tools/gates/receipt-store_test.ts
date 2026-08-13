import { assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import { join } from '@std/path';

import type { GateReceipt } from './contract.ts';
import { AtomicFileReceiptStore, LifecycleMemoryStore } from './receipt-store.ts';

function receipt(outcome: GateReceipt['outcome']): GateReceipt {
  return {
    schemaVersion: 1,
    gateId: 'check',
    invocationId: 'gate-1',
    argv: ['deno', 'task', 'check'],
    cwd: '/repo',
    gitHead: 'abc',
    actualGitHead: 'abc',
    timeoutMs: 1_000,
    runnerIdentity: 'test',
    attempt: 1,
    requestHash: 'hash',
    lifecycleId: 'test:gate-1:1',
    outcome,
    claimedAt: '2026-08-13T00:00:00.000Z',
  };
}

Deno.test('atomic receipt store leaves a complete newline-terminated JSON file', async () => {
  const root = await Deno.makeTempDir();
  try {
    const path = join(root, 'nested', 'receipt.json');
    const store = new AtomicFileReceiptStore(path);
    await store.write(receipt('CLAIMED'));
    await store.write(receipt('PASS'));
    const text = await Deno.readTextFile(path);
    assertEquals(text.endsWith('\n'), true);
    assertEquals(JSON.parse(text).outcome, 'PASS');
    assertEquals([...Deno.readDirSync(join(root, 'nested'))].map((entry) => entry.name), [
      'receipt.json',
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('lifecycle memory executes concurrent same-id same-hash work once', async () => {
  const store = new LifecycleMemoryStore<number>();
  let calls = 0;
  const operation = async () => {
    calls++;
    await Promise.resolve();
    return 42;
  };
  const first = store.run('id', 'hash', operation);
  const second = store.run('id', 'hash', operation);
  assertStrictEquals(first, second);
  assertEquals(await Promise.all([first, second]), [42, 42]);
  assertEquals(calls, 1);
});

Deno.test('lifecycle memory rejects hash mismatch and capacity exhaustion', async () => {
  const store = new LifecycleMemoryStore<number>(1);
  await store.run('id', 'hash', () => Promise.resolve(1));
  await assertRejects(
    async () => await store.run('id', 'other', () => Promise.resolve(2)),
    Error,
    'different request hash',
  );
  await assertRejects(
    async () => await store.run('next', 'hash', () => Promise.resolve(3)),
    Error,
    'capacity',
  );
});
