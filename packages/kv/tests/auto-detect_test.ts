import { assertEquals } from '@std/assert';
import {
  autoDetectProvider,
  getDenoKvConnectionFromEnv,
  getRedisConnectionFromEnv,
  maskRedisUrl,
} from '../application/auto-detect.ts';

async function withEnv(
  values: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, Deno.env.get(key));
    if (value === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }

  try {
    await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
  }
}

Deno.test('Redis connection discovery handles direct URLs and Aspire connection strings', async () => {
  await withEnv(
    {
      CACHE_PROVIDER: undefined,
      ConnectionStrings__redis: undefined,
      GARNET_URI: undefined,
      REDIS_URI: 'redis://:secret@example:6379',
    },
    () => {
      assertEquals(getRedisConnectionFromEnv(), 'redis://:secret@example:6379');
      assertEquals(maskRedisUrl('redis://:secret@example:6379'), 'redis://:***@example:6379');
    },
  );

  await withEnv(
    {
      REDIS_URI: undefined,
      ConnectionStrings__redis: 'example:6379,ssl=False,password=secret',
    },
    () => {
      assertEquals(getRedisConnectionFromEnv(), 'redis://:secret@example:6379');
    },
  );

  await withEnv(
    {
      ConnectionStrings__redis: undefined,
      GARNET_TCP: 'tcp://localhost:6379',
    },
    () => {
      assertEquals(getRedisConnectionFromEnv(), 'redis://localhost:6379');
    },
  );
});

Deno.test('autoDetectProvider prefers explicit cache provider and falls back to Deno KV', async () => {
  await withEnv(
    {
      CACHE_PROVIDER: 'redis',
      REDIS_URI: 'redis://localhost:6379',
      services__kv__http__0: 'file:///tmp/kv.sqlite3',
    },
    () => {
      assertEquals(autoDetectProvider(), {
        provider: 'redis',
        url: 'redis://localhost:6379',
      });
    },
  );

  await withEnv(
    {
      CACHE_PROVIDER: 'deno-kv',
      REDIS_URI: undefined,
      services__kv__http__0: 'file:///tmp/kv.sqlite3',
    },
    () => {
      assertEquals(getDenoKvConnectionFromEnv(), 'file:///tmp/kv.sqlite3');
      assertEquals(autoDetectProvider(), {
        provider: 'deno-kv',
        url: 'file:///tmp/kv.sqlite3',
      });
    },
  );
});
