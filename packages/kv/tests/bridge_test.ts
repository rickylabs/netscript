/**
 * Tests for the kvdex bridge layer.
 *
 * Covers {@linkcode WatchableKvBridge} (get, getMany, set, delete, list,
 * atomic, watch, close, enqueue/listenQueue stubs) and
 * {@linkcode createNetscriptDb} factory with the in-memory backend.
 *
 * Direct bridge tests use the MemoryKvAdapter which only supports string/number
 * key parts. Indexed collection tests go through `createNetscriptDb` with
 * `{ provider: 'memory' }` which uses kvdex's built-in `MapKv` (handles
 * `Uint8Array` key parts that kvdex uses for encoded index values).
 *
 * @module
 */

import { assert, assertEquals, assertThrows } from '@std/assert';
import { MemoryKvAdapter } from '../adapters/memory.adapter.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';
import { createNetscriptDb } from '../adapters/kvdex.ts';
import { collection, model } from '@olli/kvdex';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBridge(): {
  bridge: WatchableKvBridge;
  adapter: MemoryKvAdapter;
} {
  const adapter = new MemoryKvAdapter();
  const bridge = new WatchableKvBridge(adapter);
  return { bridge, adapter };
}

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.get — returns entry for existing key',
  async () => {
    const { bridge, adapter } = createBridge();
    try {
      await adapter.set(['users', '1'], { name: 'Alice' });

      const entry = await bridge.get(['users', '1']);

      assertEquals(entry.value, { name: 'Alice' });
      assertEquals(entry.key, ['users', '1']);
      assertEquals(typeof entry.versionstamp, 'string');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.get — returns null-valued entry for missing key',
  async () => {
    const { bridge } = createBridge();
    try {
      const entry = await bridge.get(['nonexistent']);

      assertEquals(entry.key, ['nonexistent']);
      assertEquals(entry.value, null);
      assertEquals(entry.versionstamp, null);
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// getMany
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.getMany — returns entries in order',
  async () => {
    const { bridge, adapter } = createBridge();
    try {
      await adapter.set(['a'], 1);
      await adapter.set(['c'], 3);

      const entries = await bridge.getMany([['a'], ['b'], ['c']]);

      assertEquals(entries.length, 3);
      assertEquals(entries[0].value, 1);
      assertEquals(entries[1].value, null); // missing
      assertEquals(entries[1].versionstamp, null);
      assertEquals(entries[2].value, 3);
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// set
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.set — writes value and returns commit result',
  async () => {
    const { bridge } = createBridge();
    try {
      const result = await bridge.set(['key'], 'value');

      assertEquals(result.ok, true);
      assertEquals(typeof result.versionstamp, 'string');

      const entry = await bridge.get(['key']);
      assertEquals(entry.value, 'value');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.set — supports expireIn option',
  async () => {
    const { bridge } = createBridge();
    try {
      // Should not throw; expireIn is forwarded to the adapter
      const result = await bridge.set(['ttl-key'], 'temp', { expireIn: 100 });
      assertEquals(result.ok, true);
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

Deno.test('WatchableKvBridge.delete — removes existing key', async () => {
  const { bridge } = createBridge();
  try {
    await bridge.set(['del-me'], 42);
    assertEquals((await bridge.get(['del-me'])).value, 42);

    await bridge.delete(['del-me']);
    assertEquals((await bridge.get(['del-me'])).value, null);
  } finally {
    await bridge.close();
  }
});

// ---------------------------------------------------------------------------
// list — forward
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.list — iterates entries with prefix',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['items', '1'], 'a');
      await bridge.set(['items', '2'], 'b');
      await bridge.set(['items', '3'], 'c');
      await bridge.set(['other', '1'], 'x');

      const entries = [];
      for await (const entry of bridge.list({ prefix: ['items'] })) {
        entries.push(entry);
      }

      assertEquals(entries.length, 3);
      assertEquals(
        entries.map((e) => e.value),
        ['a', 'b', 'c'],
      );
    } finally {
      await bridge.close();
    }
  },
);

Deno.test('WatchableKvBridge.list — respects limit', async () => {
  const { bridge } = createBridge();
  try {
    await bridge.set(['n', '1'], 1);
    await bridge.set(['n', '2'], 2);
    await bridge.set(['n', '3'], 3);

    const entries = [];
    for await (const entry of bridge.list({ prefix: ['n'] }, { limit: 2 })) {
      entries.push(entry);
    }

    assertEquals(entries.length, 2);
  } finally {
    await bridge.close();
  }
});

Deno.test(
  'WatchableKvBridge.list — cursor property updates during iteration',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['c', '1'], 'first');
      await bridge.set(['c', '2'], 'second');

      const iter = bridge.list({ prefix: ['c'] });
      assertEquals(iter.cursor, '');

      await iter.next();
      const cursorAfterFirst = iter.cursor;
      assertEquals(typeof cursorAfterFirst, 'string');
      assert(cursorAfterFirst.length > 0, 'cursor should be non-empty');

      await iter.next();
      const cursorAfterSecond = iter.cursor;
      assert(
        cursorAfterSecond !== cursorAfterFirst,
        'cursor should advance after second entry',
      );
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.list — entries always have non-null versionstamp',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['v', '1'], 'val');

      for await (const entry of bridge.list({ prefix: ['v'] })) {
        assertEquals(typeof entry.versionstamp, 'string');
        assert(entry.versionstamp!.length > 0);
      }
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// list — reverse
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.list — reverse yields entries in descending key order',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['r', 'a'], 1);
      await bridge.set(['r', 'b'], 2);
      await bridge.set(['r', 'c'], 3);

      const entries = [];
      for await (
        const entry of bridge.list({ prefix: ['r'] }, { reverse: true })
      ) {
        entries.push(entry);
      }

      assertEquals(entries.length, 3);
      // Keys should be in reverse lexicographic order
      assertEquals(entries[0].key, ['r', 'c']);
      assertEquals(entries[1].key, ['r', 'b']);
      assertEquals(entries[2].key, ['r', 'a']);
    } finally {
      await bridge.close();
    }
  },
);

Deno.test('WatchableKvBridge.list — reverse with limit', async () => {
  const { bridge } = createBridge();
  try {
    await bridge.set(['rl', 'a'], 1);
    await bridge.set(['rl', 'b'], 2);
    await bridge.set(['rl', 'c'], 3);

    const entries = [];
    for await (
      const entry of bridge.list(
        { prefix: ['rl'] },
        { reverse: true, limit: 2 },
      )
    ) {
      entries.push(entry);
    }

    assertEquals(entries.length, 2);
    assertEquals(entries[0].key, ['rl', 'c']);
    assertEquals(entries[1].key, ['rl', 'b']);
  } finally {
    await bridge.close();
  }
});

// ---------------------------------------------------------------------------
// list — empty results
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.list — empty prefix returns no entries',
  async () => {
    const { bridge } = createBridge();
    try {
      const entries = [];
      for await (const entry of bridge.list({ prefix: ['empty'] })) {
        entries.push(entry);
      }

      assertEquals(entries.length, 0);
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// atomic — basic operations
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.atomic — set and delete via commit',
  async () => {
    const { bridge } = createBridge();
    try {
      const result = await bridge
        .atomic()
        .set(['atomic', '1'], 'hello')
        .set(['atomic', '2'], 'world')
        .commit();

      assertEquals(result.ok, true);

      const e1 = await bridge.get(['atomic', '1']);
      assertEquals(e1.value, 'hello');

      const e2 = await bridge.get(['atomic', '2']);
      assertEquals(e2.value, 'world');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test('WatchableKvBridge.atomic — delete in atomic', async () => {
  const { bridge } = createBridge();
  try {
    await bridge.set(['to-delete'], 'value');

    const result = await bridge.atomic().delete(['to-delete']).commit();

    assertEquals(result.ok, true);
    assertEquals((await bridge.get(['to-delete'])).value, null);
  } finally {
    await bridge.close();
  }
});

Deno.test(
  'WatchableKvBridge.atomic — check with matching versionstamp succeeds',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['checked'], 'v1');

      const entry = await bridge.get(['checked']);
      const result = await bridge
        .atomic()
        .check({ key: ['checked'], versionstamp: entry.versionstamp })
        .set(['checked'], 'v2')
        .commit();

      assertEquals(result.ok, true);
      assertEquals((await bridge.get(['checked'])).value, 'v2');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.atomic — check with wrong versionstamp fails',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['cas'], 'original');

      const result = await bridge
        .atomic()
        .check({ key: ['cas'], versionstamp: 'wrong-stamp' })
        .set(['cas'], 'updated')
        .commit();

      assertEquals(result.ok, false);
      assertEquals((await bridge.get(['cas'])).value, 'original');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.atomic — check null versionstamp ensures key does not exist',
  async () => {
    const { bridge } = createBridge();
    try {
      // Key does not exist — null check should pass
      const result = await bridge
        .atomic()
        .check({ key: ['new-key'], versionstamp: null })
        .set(['new-key'], 'created')
        .commit();

      assertEquals(result.ok, true);
      assertEquals((await bridge.get(['new-key'])).value, 'created');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.atomic — check null versionstamp fails when key exists',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.set(['exists'], 'value');

      const result = await bridge
        .atomic()
        .check({ key: ['exists'], versionstamp: null })
        .set(['exists'], 'should-not-be-set')
        .commit();

      assertEquals(result.ok, false);
      assertEquals((await bridge.get(['exists'])).value, 'value');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.atomic — commit result has versionstamp on success',
  async () => {
    const { bridge } = createBridge();
    try {
      const result = await bridge.atomic().set(['vs-test'], 'data').commit();

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(typeof result.versionstamp, 'string');
        assert(result.versionstamp.length > 0);
      }
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.atomic — sum/min/max fall back to set without throwing',
  async () => {
    const { bridge } = createBridge();
    try {
      // These should not throw — they fall back to set semantics
      const result = await bridge
        .atomic()
        .sum(['counter'], 10n)
        .min(['min-val'], 5n)
        .max(['max-val'], 100n)
        .commit();

      assertEquals(result.ok, true);
    } finally {
      await bridge.close();
    }
  },
);

Deno.test('WatchableKvBridge.atomic — enqueue is a no-op', async () => {
  const { bridge } = createBridge();
  try {
    // Enqueue is a no-op — should not throw
    const result = await bridge
      .atomic()
      .enqueue('msg')
      .set(['after-enqueue'], 'ok')
      .commit();

    assertEquals(result.ok, true);
  } finally {
    await bridge.close();
  }
});

Deno.test(
  'WatchableKvBridge.atomic — chaining returns same instance',
  async () => {
    const { bridge } = createBridge();
    try {
      const op = bridge.atomic();
      const chained = op
        .set(['a'], 1)
        .delete(['b'])
        .check({ key: ['c'], versionstamp: null })
        .sum(['d'], 1n)
        .min(['e'], 1n)
        .max(['f'], 1n)
        .enqueue('msg');

      // All methods return the same atomic operation instance
      assertEquals(chained, op);
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// watch
// ---------------------------------------------------------------------------

Deno.test(
  {
    name: 'WatchableKvBridge.watch — returns a ReadableStream with initial state',
    // The watch stream's internal async pump creates timers that outlive the
    // test even after reader.cancel() + bridge.close(). This is expected —
    // the underlying WatchableKv poll loop needs a tick to notice cancellation.
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
      const { bridge } = createBridge();
      try {
        await bridge.set(['w', '1'], 'hello');

        const stream = bridge.watch([['w', '1']]);
        const reader = stream.getReader();

        const { value, done } = await reader.read();
        assertEquals(done, false);
        assert(Array.isArray(value));
        assertEquals(value!.length, 1);
        assertEquals(value![0].value, 'hello');

        await reader.cancel();
      } finally {
        await bridge.close();
      }
    },
  },
);

Deno.test(
  {
    name: 'WatchableKvBridge.watch — initial state includes null for missing keys',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
      const { bridge } = createBridge();
      try {
        const stream = bridge.watch([['missing']]);
        const reader = stream.getReader();

        const { value } = await reader.read();
        assertEquals(value![0].value, null);
        assertEquals(value![0].versionstamp, null);

        await reader.cancel();
      } finally {
        await bridge.close();
      }
    },
  },
);

// ---------------------------------------------------------------------------
// close / dispose
// ---------------------------------------------------------------------------

Deno.test('WatchableKvBridge.close — does not throw', async () => {
  const { bridge } = createBridge();
  await bridge.close();
});

Deno.test(
  'WatchableKvBridge[Symbol.asyncDispose] — does not throw',
  async () => {
    const { bridge } = createBridge();
    await bridge[Symbol.asyncDispose]();
  },
);

// ---------------------------------------------------------------------------
// enqueue / listenQueue stubs
// ---------------------------------------------------------------------------

Deno.test(
  'WatchableKvBridge.enqueue — throws synchronously with helpful message',
  async () => {
    const { bridge } = createBridge();
    try {
      // enqueue is synchronous and throws directly
      assertThrows(
        () => bridge.enqueue('data'),
        Error,
        'not supported',
      );
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge.listenQueue — no-op resolves immediately',
  async () => {
    const { bridge } = createBridge();
    try {
      await bridge.listenQueue(() => {});
    } finally {
      await bridge.close();
    }
  },
);

// ---------------------------------------------------------------------------
// createNetscriptDb — in-memory backend (uses kvdex MapKv)
//
// These tests exercise the full kvdex feature set including indexed
// collections, which require Uint8Array key parts. The `{ provider: 'memory' }`
// path uses kvdex's built-in MapKv that handles these correctly.
// ---------------------------------------------------------------------------

Deno.test(
  'createNetscriptDb — memory backend creates functional kvdex db',
  async () => {
    const db = await createNetscriptDb(
      {
        numbers: collection(model<number>()),
      },
      { provider: 'memory' },
    );

    const addResult = await db.numbers.add(42);
    assert(addResult.ok);
    assertEquals(typeof addResult.id, 'string');

    const doc = await db.numbers.find(addResult.id);
    assertEquals(doc?.value, 42);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports indexed collections',
  async () => {
    const db = await createNetscriptDb(
      {
        users: collection(
          model<{ name: string; age: number }>(),
          {
            indices: {
              name: 'primary',
              age: 'secondary',
            },
          },
        ),
      },
      { provider: 'memory' },
    );

    await db.users.add({ name: 'Alice', age: 30 });
    await db.users.add({ name: 'Bob', age: 25 });
    await db.users.add({ name: 'Carol', age: 30 });

    // Primary index lookup
    const alice = await db.users.findByPrimaryIndex('name', 'Alice');
    assertEquals(alice?.value.name, 'Alice');

    // Secondary index lookup
    const age30 = await db.users.findBySecondaryIndex('age', 30);
    assertEquals(age30.result.length, 2);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports getMany',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(model<string>()),
      },
      { provider: 'memory' },
    );

    const r1 = await db.items.add('first');
    assert(r1.ok);
    const r2 = await db.items.add('second');
    assert(r2.ok);

    const docs = await db.items.findMany([r1.id, r2.id]);
    assertEquals(docs.length, 2);
    assertEquals(docs[0]?.value, 'first');
    assertEquals(docs[1]?.value, 'second');
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports count',
  async () => {
    const db = await createNetscriptDb(
      {
        things: collection(model<number>()),
      },
      { provider: 'memory' },
    );

    await db.things.add(1);
    await db.things.add(2);
    await db.things.add(3);

    const count = await db.things.count();
    assertEquals(count, 3);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports delete',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(model<string>()),
      },
      { provider: 'memory' },
    );

    const result = await db.items.add('to-delete');
    assert(result.ok);

    await db.items.delete(result.id);

    const doc = await db.items.find(result.id);
    assertEquals(doc, null);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports countBySecondaryIndex',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(
          model<{ label: string; priority: number }>(),
          {
            indices: {
              label: 'primary',
              priority: 'secondary',
            },
          },
        ),
      },
      { provider: 'memory' },
    );

    await db.items.add({ label: 'a', priority: 1 });
    await db.items.add({ label: 'b', priority: 2 });
    await db.items.add({ label: 'c', priority: 1 });
    await db.items.add({ label: 'd', priority: 3 });

    const countP1 = await db.items.countBySecondaryIndex('priority', 1);
    assertEquals(countP1, 2);

    const countP2 = await db.items.countBySecondaryIndex('priority', 2);
    assertEquals(countP2, 1);

    const countP3 = await db.items.countBySecondaryIndex('priority', 3);
    assertEquals(countP3, 1);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports updateByPrimaryIndex',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(
          model<{ label: string; priority: number }>(),
          {
            indices: {
              label: 'primary',
              priority: 'secondary',
            },
          },
        ),
      },
      { provider: 'memory' },
    );

    await db.items.add({ label: 'target', priority: 5 });

    const result = await db.items.updateByPrimaryIndex(
      'label',
      'target',
      { priority: 10 },
    );
    assert(result.ok);

    const updated = await db.items.findByPrimaryIndex('label', 'target');
    assertEquals(updated?.value.priority, 10);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports deleteMany',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(model<string>()),
      },
      { provider: 'memory' },
    );

    await db.items.add('x');
    await db.items.add('y');
    await db.items.add('z');

    assertEquals(await db.items.count(), 3);

    await db.items.deleteMany();
    assertEquals(await db.items.count(), 0);
  },
);

Deno.test(
  'createNetscriptDb — memory backend supports addMany',
  async () => {
    const db = await createNetscriptDb(
      {
        items: collection(model<string>()),
      },
      { provider: 'memory' },
    );

    await db.items.addMany(['one', 'two', 'three']);

    const count = await db.items.count();
    assertEquals(count, 3);
  },
);

// ---------------------------------------------------------------------------
// WatchableKvBridge + kvdex integration (string-only key operations)
//
// These test the bridge as a kvdex backend using string-only collections
// (no Uint8Array key parts). This validates the bridge's get/set/list/atomic
// methods work correctly with kvdex's internal machinery.
//
// NOTE: Indexed collection tests are NOT included here because kvdex encodes
// index values as Uint8Array key parts, which the MemoryKvAdapter doesn't
// preserve through its key storage. For indexed collections, use
// `createNetscriptDb` with `{ provider: 'memory' }` (MapKv) or the
// Redis/Garnet backend (the bridge's production target).
// ---------------------------------------------------------------------------

import { kvdex } from '@olli/kvdex';

/** Create a simple kvdex db backed by a WatchableKvBridge (string items). */
function createSimpleBridgeDb() {
  const adapter = new MemoryKvAdapter();
  const bridge = new WatchableKvBridge(adapter);
  const db = kvdex({
    // deno-lint-ignore no-explicit-any
    kv: bridge as any,
    schema: {
      items: collection(model<string>()),
    },
  });
  return { db, bridge, adapter };
}

Deno.test(
  'WatchableKvBridge — works as kvdex backend for basic CRUD',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      const addResult = await db.items.add('test-value');
      assert(addResult.ok);

      const doc = await db.items.find(addResult.id);
      assertEquals(doc?.value, 'test-value');

      await db.items.delete(addResult.id);
      const deleted = await db.items.find(addResult.id);
      assertEquals(deleted, null);
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for getMany',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      const r1 = await db.items.add('one');
      assert(r1.ok);
      const r2 = await db.items.add('two');
      assert(r2.ok);
      const r3 = await db.items.add('three');
      assert(r3.ok);

      const docs = await db.items.findMany([r1.id, r2.id, r3.id]);
      assertEquals(docs.length, 3);
      assertEquals(
        docs.map((d) => d?.value).sort(),
        ['one', 'three', 'two'],
      );
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for count',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      await db.items.add('a');
      await db.items.add('b');

      const count = await db.items.count();
      assertEquals(count, 2);
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for atomic check-and-set',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      const addResult = await db.items.add('original');
      assert(addResult.ok);

      // Atomic update with correct versionstamp
      const updateResult = await db.items.update(addResult.id, 'updated');
      assert(updateResult.ok);

      const updated = await db.items.find(addResult.id);
      assertEquals(updated?.value, 'updated');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for deleteMany',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      await db.items.add('x');
      await db.items.add('y');
      await db.items.add('z');

      assertEquals(await db.items.count(), 3);

      await db.items.deleteMany();
      assertEquals(await db.items.count(), 0);
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for getOne',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      await db.items.add('alpha');
      await db.items.add('beta');

      const one = await db.items.getOne();
      assert(one !== null);
      assert(
        one.value === 'alpha' || one.value === 'beta',
        `Expected 'alpha' or 'beta', got '${one.value}'`,
      );
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for set with explicit id',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      const result = await db.items.set('my-id', 'my-value');
      assert(result.ok);

      const doc = await db.items.find('my-id');
      assertEquals(doc?.value, 'my-value');
    } finally {
      await bridge.close();
    }
  },
);

Deno.test(
  'WatchableKvBridge — works as kvdex backend for forEach',
  async () => {
    const { db, bridge } = createSimpleBridgeDb();
    try {
      await db.items.add('one');
      await db.items.add('two');
      await db.items.add('three');

      const values: string[] = [];
      await db.items.forEach((doc) => {
        values.push(doc.value);
      });

      assertEquals(values.sort(), ['one', 'three', 'two']);
    } finally {
      await bridge.close();
    }
  },
);
