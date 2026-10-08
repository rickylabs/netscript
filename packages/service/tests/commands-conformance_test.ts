import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { createCommandExecutor, defineCommand } from '../commands.ts';
import {
  assertCommandDeterminism,
  assertCommandFaultBoundary,
  createCommandFaultController,
  createMemoryCommandConformanceFixture,
  createMemoryCommandStore,
  createTestingCommandExecutor,
  runCommandConformance,
} from '../commands-testing.ts';
import type { CommandFaultBoundary, MemoryCommandBusiness } from '../commands-testing.ts';
import { codec, command, envelope, ports } from './_fixtures/command-executor-fixture.ts';

const boundaries: readonly CommandFaultBoundary[] = [
  'before_transaction',
  'after_claim',
  'after_handler',
  'after_audit',
  'after_outbox',
  'after_receipt_complete',
  'after_commit_before_return',
];
for (const boundary of boundaries) {
  Deno.test(`command fault ${boundary} preserves atomic recovery`, async () => {
    await assertCommandFaultBoundary(createMemoryCommandConformanceFixture, boundary);
  });
}

Deno.test('command shared conformance qualifies the bound semantic matrix', async () => {
  const report = await runCommandConformance(createMemoryCommandConformanceFixture);
  assertEquals(report.assurance, 'semantic_fixture');
  assert(report.cases.includes('identity_replay_namespaces'));
  assert(report.cases.includes('business_provider_failure'));
  assert(report.cases.includes('cancellation_cas'));
  assertEquals(report.cases.length, 22);
  assert(Object.isFrozen(report.cases));
});

Deno.test('command shared conformance detects actual outside-transaction writes', async () => {
  const fixtures: ReturnType<typeof createMemoryCommandConformanceFixture>[] = [];
  await assertRejects(
    () =>
      runCommandConformance(() => {
        const fixture = createMemoryCommandConformanceFixture();
        fixtures.push(fixture);
        return {
          ...fixture,
          write: (_tx: MemoryCommandBusiness, value: string) => fixture.outsideWrite(value),
        };
      }),
    Error,
    'same-commit fault atomicity',
  );
  const broken = await fixtures.at(-1)?.inspect();
  assertEquals(broken?.businessValue, 'one');
  assertEquals(broken?.receipts.length, 0);
  assertEquals(broken?.audit.length, 0);
  assertEquals(broken?.outbox.length, 0);
});

Deno.test('command testing controllers are instance-bound and keep finite history', async () => {
  const first = createCommandFaultController();
  const second = createCommandFaultController();
  const store = createMemoryCommandStore();
  const executor = createTestingCommandExecutor({ store, ...ports() }, first);
  assertThrows(() => createTestingCommandExecutor({ store }, first), TypeError, 'fresh binding');
  second.failNext('before_transaction');
  const definition = command();
  await executor.execute(definition, envelope);
  for (let index = 0; index < 70; index++) await executor.execute(definition, envelope);
  assertEquals(first.visited().length, 128);
  assert(Object.isFrozen(first.visited()));
  assertEquals(second.visited().length, 0);
  first.failNext('before_transaction');
  first.clear();
  await executor.execute(definition, envelope);
  assertEquals(first.visited(), ['before_transaction', 'after_commit_before_return']);
  const production = createCommandExecutor({ store: createMemoryCommandStore(), ...ports() });
  await production.execute(definition, envelope);
  assertEquals(second.visited().length, 0);
});

Deno.test('command deterministic identity samples equivalent deeply frozen inputs', async () => {
  let scopes = 0;
  let fingerprints = 0;
  const original = { nested: { value: 'one' } };
  const definition = defineCommand({
    name: 'sample.update',
    definitionVersion: 1,
    idempotency: {
      scope: ({ input, actor }) => {
        scopes++;
        assert(Object.isFrozen(input) && Object.isFrozen(input.nested) && Object.isFrozen(actor));
        original.nested.value = 'changed';
        return input.nested.value;
      },
      fingerprint: (input: { nested: { value: string } }) => {
        fingerprints++;
        return input;
      },
      response: codec,
    },
    records: { audit: 'optional', outbox: 'optional' },
    handle: (): Promise<string> => {
      throw new Error('handler must not run');
    },
  });
  const report = await assertCommandDeterminism(definition, { ...envelope, input: original }, 6);
  assertEquals(report.samples, 6);
  assertEquals(report.scope, 'one');
  assertEquals(report.assurance, 'sampled_equivalence');
  assertEquals(scopes, 6);
  assertEquals(fingerprints, 6);
  assertEquals(original.nested.value, 'changed');
  for (const invalid of [0, 1, 33, 2.5, Infinity]) {
    await assertRejects(
      () => assertCommandDeterminism(definition, { ...envelope, input: original }, invalid),
      TypeError,
    );
  }
});

Deno.test('command determinism detects changing scope closures', async () => {
  let sample = 0;
  const definition = defineCommand({
    name: 'sample.scope',
    definitionVersion: 1,
    idempotency: {
      scope: () => `scope-${++sample}`,
      fingerprint: (input: { value: string }) => input,
      response: codec,
    },
    records: { audit: 'optional', outbox: 'optional' },
    handle: () => Promise.resolve('one'),
  });
  await assertRejects(
    () => assertCommandDeterminism(definition, envelope),
    Error,
    'nondeterministic',
  );
  assertEquals(sample, 2);
});

Deno.test('command determinism detects changing fingerprint closures', async () => {
  let sample = 0;
  const definition = defineCommand({
    name: 'sample.fingerprint',
    definitionVersion: 1,
    idempotency: {
      scope: () => 'scope',
      fingerprint: () => ({ sample: ++sample }),
      response: codec,
    },
    records: { audit: 'optional', outbox: 'optional' },
    handle: () => Promise.resolve('one'),
  });
  await assertRejects(
    () => assertCommandDeterminism(definition, envelope),
    Error,
    'nondeterministic',
  );
  assertEquals(sample, 2);
});

Deno.test('command throwing telemetry cannot replace an inherited business error', async () => {
  const store = createMemoryCommandStore();
  const business = new Error('business sentinel');
  const observer = new Error('observer sentinel');
  const executor = createCommandExecutor({
    store,
    ...ports(),
    telemetry: {
      trace: async (_start, operation) =>
        await operation({
          finish: () => {
            throw observer;
          },
        }),
    },
  });
  const definition = command((ctx) => {
    ctx.tx.set('value', 'one');
    return Promise.reject(business);
  });
  const actual = await assertRejects(() => executor.execute(definition, envelope));
  assertEquals(actual, business);
  assert(actual === business);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
});
