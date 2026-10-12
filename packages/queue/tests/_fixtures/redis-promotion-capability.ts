import { stub } from '@std/testing/mock';
import type { Redis } from 'ioredis';

/** Model a server without EVAL, while keeping all queue operations on real Redis. */
export function forceTransactionPromotion(
  client: Redis,
): Disposable & { readonly calls: readonly unknown[] } {
  return stub(client, 'eval', async () => {
    await client.ping();
    throw new Error('ERR unknown command EVAL');
  });
}
