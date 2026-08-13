import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { KvConnectionError } from '../application/errors.ts';
import { RedisKvAdapter } from '../redis.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name: 'CI requires the real Redis regression service',
  ignore: !Deno.env.get('CI'),
  fn() {
    assert(redisUrl, 'NETSCRIPT_TEST_REDIS_URL is required in CI');
  },
});

Deno.test('RedisKvAdapter fails a dead endpoint loudly within a bounded interval', async () => {
  const kv = new RedisKvAdapter({
    url: 'redis://127.0.0.1:1',
    options: { connectTimeout: 100 },
  });
  const startedAt = performance.now();

  try {
    const error = await assertRejects(
      () => withTimeout(collect(kv.list({ prefix: ['registry'] })), 5_000),
      KvConnectionError,
    );
    assertStringIncludes(error.message, 'could not connect');
    assertStringIncludes(error.message, 'after 3 attempts');
    assert(performance.now() - startedAt < 5_000);
  } finally {
    await kv.close();
  }
});

Deno.test({
  name: 'RedisKvAdapter lists real Redis entries and admits one atomic CAS winner',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const kv = new RedisKvAdapter({ url: redisUrl, namespace: `test-${crypto.randomUUID()}` });

    try {
      await kv.set(['registry', 'orders'], { id: 'orders' });
      const entries = await withTimeout(collect(kv.list({ prefix: ['registry'] })), 5_000);
      assertEquals(entries.map((entry) => entry.value), [{ id: 'orders' }]);

      await kv.set(['sagas', 'orders'], { writer: 0 });
      const current = await kv.get(['sagas', 'orders']);
      assert(current);
      const outcomes = await withTimeout(
        Promise.all(
          Array.from({ length: 16 }, (_, writer) =>
            kv.atomic(
              [{ key: ['sagas', 'orders'], versionstamp: current.versionstamp }],
              [{ type: 'set', key: ['sagas', 'orders'], value: { writer: writer + 1 } }],
            )),
        ),
        5_000,
      );
      assertEquals(outcomes.filter((outcome) => outcome.ok).length, 1);
    } finally {
      await kv.close();
    }
  },
});

Deno.test({
  name: 'RedisKvAdapter fails during a Redis restart and recovers on the same instance',
  ignore: !Deno.env.get('NETSCRIPT_TEST_REDIS_URL') ||
    !Deno.env.get('NETSCRIPT_TEST_REDIS_CONTAINER'),
  async fn() {
    const url = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
    const container = Deno.env.get('NETSCRIPT_TEST_REDIS_CONTAINER');
    assert(url);
    assert(container);
    const kv = new RedisKvAdapter({ url, namespace: `restart-${crypto.randomUUID()}` });

    try {
      await kv.set(['health'], 'before');
      await docker('stop', container);

      await assertRejects(
        () => withTimeout(kv.get(['health']), 2_000),
        Error,
      );

      await docker('start', container);
      await eventually(async () => {
        await kv.set(['health'], 'after');
        assertEquals((await kv.get(['health']))?.value, 'after');
      }, 10_000);
    } finally {
      await docker('start', container, true);
      await kv.close();
    }
  },
});

async function collect<T>(entries: AsyncIterable<T>): Promise<T[]> {
  const collected: T[] = [];
  for await (const entry of entries) collected.push(entry);
  return collected;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`operation exceeded ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

async function docker(action: 'start' | 'stop', container: string, tolerateFailure = false) {
  const output = await new Deno.Command('docker', {
    args: [action, container],
    stdout: 'null',
    stderr: 'piped',
  }).output();
  if (!output.success && !tolerateFailure) {
    throw new Error(new TextDecoder().decode(output.stderr));
  }
}

async function eventually(operation: () => Promise<void>, timeoutMs: number): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  let lastError: unknown;
  while (performance.now() < deadline) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw lastError;
}
