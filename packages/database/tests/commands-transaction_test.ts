import { assertEquals } from '@std/assert';
import { withTransaction } from '../mod.ts';
import type { TransactionClientPort } from '../commands.ts';

Deno.test('transaction helper preserves the true callback handle and one invocation', async () => {
  const callback = { project: { update: () => Promise.resolve(1) } };
  let calls = 0;
  const root: TransactionClientPort<typeof callback> = {
    async $transaction(work, options) {
      calls++;
      assertEquals(options, { timeout: 1000 });
      return await work(callback);
    },
  };
  const result = await withTransaction(root, async (tx) => {
    assertEquals(tx, callback);
    return await tx.project.update();
  }, { timeout: 1000 });
  assertEquals(result, 1);
  assertEquals(calls, 1);
});

Deno.test('transaction helper publishes type negatives for root and nested operations', async () => {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'check',
      '--unstable-kv',
      'packages/database/tests/type-fixtures/command-transaction_type.ts',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
});
