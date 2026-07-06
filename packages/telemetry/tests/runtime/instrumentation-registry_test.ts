import { assertEquals, assertInstanceOf } from '@std/assert';
import { DuplicateInstrumentationError, InstrumentationRegistry } from '../../src/application/registry/mod.ts';

Deno.test('InstrumentationRegistry resolves registrations in insertion order', () => {
  const registry = new InstrumentationRegistry();

  registry.register({ name: 'queue' });
  registry.register({ name: 'rpc', setup: () => undefined });

  assertEquals(registry.resolve('queue')?.name, 'queue');
  assertEquals(registry.list(), [
    { name: 'queue', hasSetup: false, hasTeardown: false },
    { name: 'rpc', hasSetup: true, hasTeardown: false },
  ]);
});

Deno.test('InstrumentationRegistry rejects duplicate registration names', () => {
  const registry = new InstrumentationRegistry();
  registry.register({ name: 'queue' });

  let caught: unknown;
  try {
    registry.register({ name: 'queue' });
  } catch (error) {
    caught = error;
  }

  assertInstanceOf(caught, DuplicateInstrumentationError);
});

Deno.test('InstrumentationRegistry runs setup and teardown hooks predictably', async () => {
  const calls: string[] = [];
  const registry = new InstrumentationRegistry();

  registry.register({
    name: 'first',
    setup: (context) => {
      calls.push(`setup:${context.serviceName}:first`);
    },
    teardown: () => {
      calls.push('teardown:first');
    },
  });
  registry.register({
    name: 'second',
    setup: () => {
      calls.push('setup:second');
    },
    teardown: () => {
      calls.push('teardown:second');
    },
  });

  await registry.setupAll({ serviceName: 'api' });
  await registry.teardownAll({ serviceName: 'api' });

  assertEquals(calls, [
    'setup:api:first',
    'setup:second',
    'teardown:second',
    'teardown:first',
  ]);
});
