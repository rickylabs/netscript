import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { DirectoryUnauthorized, DirectoryUnavailable, DirectoryUnsupported } from '../ports/mod.ts';
import {
  createDeterministicClock,
  createInMemoryDirectoryPort,
  createSystemDirectoryClock,
  DEFAULT_DETERMINISTIC_CLOCK_ISO,
  DIRECTORY_CONFORMANCE_DATASET,
  runDirectoryConformanceSuite,
  verifyDirectoryConformance,
} from './mod.ts';

runDirectoryConformanceSuite({
  name: 'in-memory',
  createFixture: () => {
    const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
    const baseOptions = {
      name: 'memory',
      directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
      clock,
      maxSearchLimit: 3,
      users: DIRECTORY_CONFORMANCE_DATASET.users,
      groups: DIRECTORY_CONFORMANCE_DATASET.groups,
    };
    return {
      clock,
      maxSearchLimit: 3,
      port: createInMemoryDirectoryPort(baseOptions),
      timeoutPort: createInMemoryDirectoryPort({
        ...baseOptions,
        operationDelayMs: 250,
      }),
    };
  },
});

Deno.test('createDeterministicClock: advances, sets, and rejects invalid timestamps', () => {
  const clock = createDeterministicClock();
  assertEquals(clock.nowIso(), DEFAULT_DETERMINISTIC_CLOCK_ISO);

  clock.advanceMs(5_000);
  assertEquals(clock.nowIso(), '2026-06-01T12:00:05.000Z');

  clock.set(new Date('2026-06-02T00:00:00.000Z'));
  assertEquals(clock.nowIso(), '2026-06-02T00:00:00.000Z');

  assertThrows(() => clock.advanceMs(-1), RangeError);
  assertThrows(() => clock.advanceMs(Number.NaN), RangeError);
  assertThrows(() => clock.set('not-a-date'), RangeError);

  const systemClock = createSystemDirectoryClock();
  assertEquals(Number.isFinite(systemClock.nowMs()), true);
  assertEquals(systemClock.nowIso().includes('T'), true);
});

Deno.test('createInMemoryDirectoryPort: enforces capability boundaries, secondary lookups, and abort/failure hooks', async () => {
  const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
  const directOnly = createInMemoryDirectoryPort({
    directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
    clock,
    capabilities: [],
    users: DIRECTORY_CONFORMANCE_DATASET.users,
    groups: DIRECTORY_CONFORMANCE_DATASET.groups,
  });

  await assertRejects(
    () => directOnly.searchUsers({ text: 'alice', limit: 5 }, {}),
    DirectoryUnsupported,
  );
  await assertRejects(
    () => directOnly.searchGroups({ text: 'Ops', limit: 5 }, {}),
    DirectoryUnsupported,
  );

  // Without transitive-membership capability, only direct and primary memberships match.
  const membership = await directOnly.memberOfAny(
    {
      user: {
        directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
        immutableId: DIRECTORY_CONFORMANCE_DATASET.userIds.alice,
      },
      candidateGroupIds: [
        DIRECTORY_CONFORMANCE_DATASET.groupIds.engParent,
        DIRECTORY_CONFORMANCE_DATASET.groupIds.engLeaf,
        DIRECTORY_CONFORMANCE_DATASET.groupIds.domainUsers,
      ],
    },
    {},
  );
  assertEquals(
    [...membership.memberOf].sort(),
    [
      DIRECTORY_CONFORMANCE_DATASET.groupIds.domainUsers,
      DIRECTORY_CONFORMANCE_DATASET.groupIds.engLeaf,
    ].sort(),
  );

  const byMail = await directOnly.getUser(
    {
      directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
      mail: 'ALICE@EXAMPLE.TEST',
    },
    {},
  );
  assertEquals(byMail?.immutableId, DIRECTORY_CONFORMANCE_DATASET.userIds.alice);

  const byUsername = await directOnly.getUser(
    {
      directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
      username: 'alice',
    },
    {},
  );
  assertEquals(byUsername?.immutableId, DIRECTORY_CONFORMANCE_DATASET.userIds.alice);

  const abortController = new AbortController();
  abortController.abort(new Error('caller cancelled'));
  await assertRejects(
    () => directOnly.health({ signal: abortController.signal }),
    DirectoryUnavailable,
  );

  const failingPort = createInMemoryDirectoryPort({
    simulateFailure: (op) =>
      op === 'getUser' ? new DirectoryUnauthorized('memory', op, 'Denied.') : undefined,
  });
  await assertRejects(
    () => failingPort.getUser({ directoryInstance: 'memory-example', immutableId: 'x' }, {}),
    DirectoryUnauthorized,
  );
});

Deno.test('verifyDirectoryConformance: reports all passing scenarios programmatically', async () => {
  const report = await verifyDirectoryConformance({
    name: 'memory-programmatic',
    createFixture: () => {
      const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
      return {
        clock,
        maxSearchLimit: 3,
        port: createInMemoryDirectoryPort({
          directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
          clock,
          maxSearchLimit: 3,
          users: DIRECTORY_CONFORMANCE_DATASET.users,
          groups: DIRECTORY_CONFORMANCE_DATASET.groups,
        }),
      };
    },
  });
  assertEquals(report.suiteName, 'memory-programmatic');
  assertEquals(report.passed, 12);
  assertEquals(report.cases.every((c) => c.passed), true);
});
