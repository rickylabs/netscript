import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  configureLogging,
  ensureLogging,
  isLoggingConfigured,
  resetLogging,
  withContext,
} from '../mod.ts';

const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');

interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}

function findLoggerProbe(): ActiveAsyncStoreProbe | undefined {
  const probes: unknown = Reflect.get(globalThis, ACTIVE_STORE_PROBES_SYMBOL);
  if (!(probes instanceof Set)) return undefined;
  for (const probe of probes) {
    if (
      probe !== null &&
      typeof probe === 'object' &&
      'name' in probe &&
      probe.name === '@netscript/logger'
    ) {
      return probe as ActiveAsyncStoreProbe;
    }
  }
  return undefined;
}

Deno.test('configureLogging marks logging as configured', async () => {
  await resetLogging();
  assertEquals(isLoggingConfigured(), false);

  await configureLogging({ format: 'text', level: 'info' });

  assertEquals(isLoggingConfigured(), true);

  await resetLogging();
});

Deno.test('resetLogging clears configured state for later ensureLogging calls', async () => {
  await ensureLogging({ format: 'text', level: 'info' });
  assertEquals(isLoggingConfigured(), true);

  await resetLogging();
  assertEquals(isLoggingConfigured(), false);

  await ensureLogging({ format: 'text', level: 'debug' });
  assert(isLoggingConfigured());

  await resetLogging();
});

Deno.test('logger active-store probe reports active only inside withContext scopes', async () => {
  await resetLogging();
  await configureLogging({ format: 'text', level: 'info' });
  try {
    const probe = findLoggerProbe();
    assert(probe !== undefined, 'Expected @netscript/logger active-store probe to be registered');
    assertEquals(probe.isActive(), false);

    const insideNormal = await withContext({ tenantId: 'tenant-1' }, async () => {
      await Promise.resolve();
      return probe.isActive();
    });
    assertEquals(insideNormal, true);
    assertEquals(probe.isActive(), false);

    let insideThrow = false;
    await assertRejects(
      () =>
        withContext({ tenantId: 'tenant-2' }, async () => {
          await Promise.resolve();
          insideThrow = probe.isActive();
          throw new Error('boom');
        }),
      Error,
      'boom',
    );
    assertEquals(insideThrow, true);
    assertEquals(probe.isActive(), false);
  } finally {
    await resetLogging();
  }
});
