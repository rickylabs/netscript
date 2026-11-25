import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  type DirectoryPort,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
} from '../ports/mod.ts';
import {
  createDeterministicClock,
  createInMemoryDirectoryPort,
  createSystemDirectoryClock,
  DEFAULT_DETERMINISTIC_CLOCK_ISO,
  DIRECTORY_CONFORMANCE_DATASET,
  type DirectoryConformanceFixture,
  runDirectoryConformanceSuite,
  verifyDirectoryConformance,
} from './mod.ts';

function makeReferenceFixture(): DirectoryConformanceFixture {
  const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
  const baseOptions = {
    name: 'memory',
    directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
    clock,
    maxSearchLimit: 3,
    users: DIRECTORY_CONFORMANCE_DATASET.users,
    groups: DIRECTORY_CONFORMANCE_DATASET.groups,
    healthProbes: [
      {
        name: 'client-secret-expiry',
        status: 'pass' as const,
        message: 'Directory credentials valid for 180 days.',
      },
    ],
  };
  return {
    clock,
    maxSearchLimit: 3,
    sensitiveValues: ['s3cr3t-bind-value-42', 'dc1.internal.example.test', 'EXAMPLE\\svc-dir'],
    port: createInMemoryDirectoryPort(baseOptions),
    timeoutPort: createInMemoryDirectoryPort({ ...baseOptions, operationDelayMs: 250 }),
    unavailablePort: createInMemoryDirectoryPort({
      ...baseOptions,
      simulateFailure: (op) => new DirectoryUnavailable('memory', op, 'Backend unreachable.'),
    }),
    unauthorizedPort: createInMemoryDirectoryPort({
      ...baseOptions,
      simulateFailure: (op) =>
        new DirectoryUnauthorized('memory', op, 'Bind credentials rejected.'),
    }),
  };
}

runDirectoryConformanceSuite({
  name: 'in-memory',
  createFixture: makeReferenceFixture,
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

Deno.test('createInMemoryDirectoryPort: enforces exact opaque IDs, health invariants, and restricted capabilities', async () => {
  const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);

  // Case-distinct opaque IDs do not collide.
  const opaquePort = createInMemoryDirectoryPort({
    directoryInstance: 'opaque-example',
    clock,
    users: [
      { immutableId: 'User-A', enabled: true, displayName: 'Upper A' },
      { immutableId: 'user-a', enabled: true, displayName: 'Lower a' },
    ],
    groups: [
      { immutableId: 'Group-X', displayName: 'Upper X', memberUserIds: ['User-A'] },
      { immutableId: 'group-x', displayName: 'Lower x', memberUserIds: ['user-a'] },
    ],
  });
  assertEquals(
    (await opaquePort.getUser({ directoryInstance: 'opaque-example', immutableId: 'User-A' }, {}))
      ?.displayName,
    'Upper A',
  );
  assertEquals(
    (await opaquePort.memberOfAny(
      {
        user: { directoryInstance: 'opaque-example', immutableId: 'User-A' },
        candidateGroupIds: ['Group-X', 'group-x'],
      },
      {},
    )).memberOf,
    ['Group-X'],
  );

  // Contradictory health host counts are rejected.
  assertThrows(
    () =>
      createInMemoryDirectoryPort({
        healthStatus: 'healthy',
        reachableHosts: 2,
        totalHosts: 3,
      }),
    RangeError,
  );

  // Restricted adapter (no 'search', no 'transitive-membership') passes the full conformance suite!
  const restrictedReport = await verifyDirectoryConformance({
    name: 'restricted-capabilities',
    createFixture: () => {
      const restrictedClock = createDeterministicClock(
        DIRECTORY_CONFORMANCE_DATASET.initialTimeIso,
      );
      const base = {
        directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
        clock: restrictedClock,
        capabilities: [] as const,
        users: DIRECTORY_CONFORMANCE_DATASET.users,
        groups: DIRECTORY_CONFORMANCE_DATASET.groups,
      };
      return {
        clock: restrictedClock,
        port: createInMemoryDirectoryPort(base),
        timeoutPort: createInMemoryDirectoryPort({ ...base, operationDelayMs: 250 }),
      };
    },
  });
  assertEquals(restrictedReport.failed, 0, JSON.stringify(restrictedReport.cases));
  assertEquals(restrictedReport.passed, 13);

  const directOnly = createInMemoryDirectoryPort({
    directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
    clock,
    capabilities: [],
    users: DIRECTORY_CONFORMANCE_DATASET.users,
    groups: DIRECTORY_CONFORMANCE_DATASET.groups,
  });
  await assertRejects(
    () => directOnly.searchUsers({ text: 'alice', limit: 2 }, {}),
    DirectoryUnsupported,
  );
  await assertRejects(
    () => directOnly.searchGroups({ text: 'Ops', limit: 2 }, {}),
    DirectoryUnsupported,
  );
});

Deno.test('verifyDirectoryConformance: reports passing counts and catches defective adapter probes', async () => {
  const passReport = await verifyDirectoryConformance({
    name: 'memory-programmatic',
    createFixture: makeReferenceFixture,
  });
  assertEquals(passReport.suiteName, 'memory-programmatic');
  assertEquals(passReport.passed, 13);
  assertEquals(passReport.failed, 0);
  assertEquals(passReport.cases.every((c) => c.passed), true);

  // Defective adapter probe: leaks sensitive secret in health() and ignores '*' in getUser.
  const brokenReport = await verifyDirectoryConformance({
    name: 'defective-probe',
    createFixture: () => {
      const fixture = makeReferenceFixture();
      const basePort = fixture.port;
      const defective: DirectoryPort = {
        name: basePort.name,
        capabilities: basePort.capabilities,
        searchUsers: (q, ctx) => basePort.searchUsers(q, ctx),
        searchGroups: (q, ctx) => basePort.searchGroups(q, ctx),
        getUser: (ref, ctx) => {
          if ('userPrincipalName' in ref && ref.userPrincipalName === '*') {
            return basePort.getUser(
              {
                directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
                immutableId: DIRECTORY_CONFORMANCE_DATASET.userIds.alice,
              },
              ctx,
            );
          }
          return basePort.getUser(ref, ctx);
        },
        memberOfAny: (q, ctx) => basePort.memberOfAny(q, ctx),
        async health(ctx) {
          const h = await basePort.health(ctx);
          return {
            ...h,
            probes: [{
              name: 'bind',
              status: 'pass',
              message: 'Connected with s3cr3t-bind-value-42',
            }],
          };
        },
      };
      return { ...fixture, port: defective };
    },
  });
  assert(brokenReport.failed >= 2, `Expected >=2 failures, got ${brokenReport.failed}`);
  assert(
    brokenReport.cases.some((c) => !c.passed && c.error !== undefined),
    'Expected failing case to record passed=false and error message',
  );
});
