import { DenoKvAdapter, MemoryKvAdapter, type WatchableKv } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import type { SagaEventFeedItem, SagaSSEEvent } from '../../src/adapters/mod.ts';

export const backends: readonly string[] = [
  'memory',
  'deno-kv',
  ...(Deno.env.get('NETSCRIPT_TEST_REDIS_URL') ? ['redis'] : []),
  ...(Deno.env.get('NETSCRIPT_TEST_GARNET_URL') ? ['garnet'] : []),
];

export async function storage(backend: string): Promise<WatchableKv> {
  if (backend === 'memory') return new MemoryKvAdapter();
  if (backend === 'deno-kv') return new DenoKvAdapter(await Deno.openKv(':memory:'));
  const url = Deno.env.get(
    backend === 'redis' ? 'NETSCRIPT_TEST_REDIS_URL' : 'NETSCRIPT_TEST_GARNET_URL',
  );
  if (!url) throw new Error(`Missing real ${backend} service`);
  return new RedisKvAdapter({ url, namespace: `saga-feed-${crypto.randomUUID()}` });
}

export function event(ordinal: number, payload = ''): SagaSSEEvent {
  return { type: 'saga:message_received', timestamp: 'now', data: { ordinal, payload } };
}

export async function next(iterator: AsyncIterator<SagaEventFeedItem>): Promise<SagaEventFeedItem> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('journal reader stalled')), 5_000);
      }),
    ]);
    if (result.done) throw new Error('journal ended before expected item');
    return result.value;
  } finally {
    clearTimeout(timer);
  }
}

export function cursor(epoch: string, sequence: number): string {
  return `${epoch}:${sequence}`;
}
