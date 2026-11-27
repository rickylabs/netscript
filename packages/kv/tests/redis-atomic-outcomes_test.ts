/** Owning Redis adapter tests; the command transport is inert before any operation. */
import { assert, assertEquals, assertRejects } from '@std/assert';
import { RedisKvAdapter } from '../redis.ts';
import type { AtomicMutation } from '../types/kv-store.ts';

type Reply = (commands: number, attempt: number) => unknown;
/** ioredis5.11.1 built/utils/index.js51–68: transaction.js passes EXEC through wrapMultiResult.
 * The pinned normalizer wraps Error as [error], and ordinary details as [null, detail].
 * This source-proven fixture models that normalization before the actual owning adapter runs.
 */
function ioredisExecReplies(values: readonly unknown[]): unknown[] {
  return values.map((item) => item instanceof Error ? [item] : [null, item]);
}
function fixture(
  reply: Reply,
  options: { cleanupFails?: boolean; publicationFails?: boolean } = {},
) {
  let attempts = 0;
  let notifications = 0;
  let unwatches = 0;
  let closed = false;
  const client = {
    watch: () => Promise.resolve('OK'),
    unwatch() {
      unwatches++;
      return options.cleanupFails
        ? Promise.reject(new Error('synthetic cleanup failure'))
        : Promise.resolve('OK');
    },
    mget: (...keys: string[]) => Promise.resolve(keys.map(() => null)),
    multi() {
      let commands = 0;
      const multi = {
        set() {
          commands++;
          return multi;
        },
        psetex() {
          commands++;
          return multi;
        },
        del() {
          commands++;
          return multi;
        },
        exec() {
          attempts++;
          return Promise.resolve().then(() => reply(commands, attempts));
        },
      };
      return multi;
    },
    pipeline() {
      let commands = 0;
      const pipeline = {
        publish() {
          notifications++;
          commands++;
          return pipeline;
        },
        exec: () =>
          options.publicationFails
            ? Promise.reject(new Error('synthetic publication failure'))
            : Promise.resolve(Array.from({ length: commands }, () => [null, 1])),
      };
      return pipeline;
    },
  };
  const kv = new RedisKvAdapter({ url: 'redis://fixture.invalid', namespace: 'atomic-outcomes' });
  Object.defineProperty(kv, 'connection', {
    value: {
      ensureClient: () => Promise.resolve(client),
      close: () => {
        closed = true;
        return Promise.resolve();
      },
    },
  });
  return {
    kv,
    attempts: () => attempts,
    notifications: () => notifications,
    unwatches: () => unwatches,
    closed: () => closed,
  };
}
const mutations: AtomicMutation[] = [
  { type: 'set', key: ['first'], value: 'synthetic value' },
  { type: 'delete', key: ['middle'] },
  { type: 'set', key: ['last'], value: 1, expireIn: 1000 },
];
const success: Reply = (count) => Array.from({ length: count }, () => [null, 'OK']);

Deno.test('pinned ioredis normalization keeps one-element Error tuples and null success details', () => {
  const failure = new Error('synthetic');
  assertEquals(ioredisExecReplies(['OK', failure, null]), [[null, 'OK'], [failure], [null, null]]);
});

Deno.test('ioredis command failure survives failed task cleanup without notification or retry', async () => {
  const f = fixture(() => ioredisExecReplies([new Error('synthetic private detail'), 'OK', 'OK']), {
    cleanupFails: true,
  });
  try {
    const error = await assertRejects(() => f.kv.atomic([], mutations));
    assert(error instanceof Error);
    assertEquals(Reflect.get(error, 'reason'), 'command_failed');
    assertEquals(Reflect.get(error, 'cause'), undefined);
    assertEquals(f.notifications(), 0);
    assertEquals(f.attempts(), 1);
  } finally {
    await f.kv.close();
  }
});

Deno.test('Redis atomic validates all successful command tuples before notifying', async () => {
  const f = fixture((count) => Array.from({ length: count }, () => [null, null]));
  try {
    assert((await f.kv.atomic([], mutations)).ok);
    assertEquals(f.attempts(), 1);
    assertEquals(f.notifications(), 3);
  } finally {
    await f.kv.close();
  }
  assert(f.closed());
});

Deno.test('Redis null EXEC retries conflict and check mismatch never executes', async () => {
  const f = fixture((count, attempt) => attempt === 1 ? null : success(count, attempt));
  try {
    assert((await f.kv.atomic([], mutations)).ok);
    assertEquals(f.attempts(), 2);
    assertEquals(f.notifications(), 3);
    assertEquals(await f.kv.atomic([{ key: ['absent'], versionstamp: 'expected' }], mutations), {
      ok: false,
    });
    assertEquals(f.attempts(), 2);
  } finally {
    await f.kv.close();
  }
});

Deno.test('Redis repeated null EXEC retains bounded conflict failure', async () => {
  const f = fixture(() => null);
  try {
    assertEquals(await f.kv.atomic([], mutations), { ok: false });
    assertEquals(f.attempts(), 5);
    assertEquals(f.notifications(), 0);
  } finally {
    await f.kv.close();
  }
});

for (const failed of [0, 1, 2]) {
  Deno.test(`Redis command failure at position ${failed} is unconfirmed without retry or notification`, async () => {
    const f = fixture((count) =>
      ioredisExecReplies(Array.from(
        { length: count },
        (_, i) => i === failed ? new Error('synthetic command payload must remain private') : 'OK',
      ))
    );
    try {
      const error = await assertRejects(() => f.kv.atomic([], mutations));
      assert(error instanceof Error);
      assertEquals(error.name, 'KvAtomicCommitUnconfirmedError');
      assertEquals(Reflect.get(error, 'reason'), 'command_failed');
      assertEquals(Reflect.get(error, 'possiblyApplied'), true);
      assertEquals(Reflect.get(error, 'cause'), undefined);
      assertEquals(error.message.includes('synthetic command payload'), false);
      assertEquals(f.attempts(), 1);
      assertEquals(f.notifications(), 0);
    } finally {
      await f.kv.close();
    }
  });
}

for (
  const [label, result] of [
    ['missing', undefined],
    ['nonarray', {}],
    ['short', [[null, 'OK']]],
    ['long', [[null, 1], [null, 1], [null, 1], [null, 1]]],
    ['malformed tuple', [[null, 1], [null], [null, 1]]],
    ['missing error slot', [[null, 1], [undefined, 'OK'], [null, 1]]],
    ['non-error singleton', [[null, 1], ['unexpected'], [null, 1]]],
    ['non-error error slot', [[null, 1], ['unexpected', null], [null, 1]]],
    ['oversized error tuple', [[null, 1], [new Error('synthetic'), null, null], [null, 1]]],
  ] as const
) {
  Deno.test(`Redis ${label} EXEC result cannot certify a complete commit`, async () => {
    const f = fixture(() => result);
    try {
      const error = await assertRejects(() => f.kv.atomic([], mutations));
      assert(error instanceof Error);
      assertEquals(error.name, 'KvAtomicCommitUnconfirmedError');
      assertEquals(Reflect.get(error, 'reason'), 'malformed_result');
      assertEquals(f.attempts(), 1);
      assertEquals(f.notifications(), 0);
    } finally {
      await f.kv.close();
    }
  });
}

Deno.test('Redis rejected EXEC stays unconfirmed when unwatch cleanup also fails', async () => {
  const f = fixture(() => {
    throw new Error('synthetic execution rejection');
  }, { cleanupFails: true });
  try {
    const error = await assertRejects(() => f.kv.atomic([], mutations));
    assert(error instanceof Error);
    assertEquals(error.name, 'KvAtomicCommitUnconfirmedError');
    assertEquals(Reflect.get(error, 'reason'), 'execution_unconfirmed');
    assertEquals(f.attempts(), 1);
    assertEquals(f.unwatches(), 1);
    assertEquals(f.notifications(), 0);
  } finally {
    await f.kv.close();
  }
  assert(f.closed());
});

Deno.test('Redis committed data is not replayed when later notification fails', async () => {
  const f = fixture(success, { publicationFails: true });
  try {
    assert((await f.kv.atomic([], mutations)).ok);
    assertEquals(f.attempts(), 1);
    assertEquals(f.notifications(), 3);
  } finally {
    await f.kv.close();
  }
});
