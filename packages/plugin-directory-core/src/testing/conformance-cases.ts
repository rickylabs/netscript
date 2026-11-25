/**
 * Conformance scenario definitions executed by {@link runDirectoryConformanceSuite}.
 *
 * @module
 */

import { assert, assertEquals, assertRejects } from '@std/assert';
import { DIRECTORY_MAX_SEARCH_LIMIT } from '../domain/mod.ts';
import { DirectoryTimeout } from '../ports/mod.ts';
import type { DirectoryConformanceFixture } from './conformance.ts';
import {
  DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS,
  DIRECTORY_CONFORMANCE_DATASET,
} from './conformance-dataset.ts';

export interface ConformanceCase {
  readonly name: string;
  readonly run: (fixture: DirectoryConformanceFixture) => Promise<void>;
}

const DS = DIRECTORY_CONFORMANCE_DATASET;

function assertIsoTimestamp(value: string, label: string): void {
  const parsed = Date.parse(value);
  assert(
    Number.isFinite(parsed) && value.includes('T'),
    `${label} must be a valid ISO-8601 timestamp, received: ${JSON.stringify(value)}`,
  );
}

function createTimedOutSignal(): AbortSignal {
  const controller = new AbortController();
  controller.abort(new DOMException('Directory call timed out.', 'TimeoutError'));
  return controller.signal;
}

export const CONFORMANCE_CASES: readonly ConformanceCase[] = [
  {
    name: 'metadata and redacted health probe',
    async run({ port, clock }) {
      assert(port.name.trim().length > 0, 'DirectoryPort.name must be non-empty');
      assert(port.capabilities instanceof Set, 'DirectoryPort.capabilities must be a Set');
      const health = await port.health({});
      assertEquals(health.status, 'healthy');
      assertEquals(health.checkedAt, clock.nowIso());
      assertIsoTimestamp(health.checkedAt, 'health.checkedAt');
      const serialized = JSON.stringify(health);
      assert(
        !/\b(?:cn|ou|dc)=/i.test(serialized),
        `health() output must not leak LDAP DNs: ${serialized}`,
      );
      assert(
        !/password|secret|bindpw/i.test(serialized),
        `health() output must not leak credential names or values: ${serialized}`,
      );
    },
  },
  {
    name: 'getUser returns normalized immutable identity and account state',
    async run({ port }) {
      const alice = await port.getUser(
        { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
        {},
      );
      assert(alice !== undefined, 'Expected active user alice to be found');
      assertEquals(alice.ref, {
        directoryInstance: DS.directoryInstance,
        immutableId: DS.userIds.alice,
      });
      assertEquals(alice.immutableId, DS.userIds.alice);
      assertEquals(alice.enabled, true);
      assertEquals(alice.expiresAt, '2027-01-01T00:00:00.000Z');
      assertEquals(alice.userPrincipalName, 'alice@example.test');

      const aliceByUpn = await port.getUser(
        { directoryInstance: DS.directoryInstance, userPrincipalName: 'alice@example.test' },
        {},
      );
      assertEquals(aliceByUpn?.immutableId, DS.userIds.alice);

      const bob = await port.getUser(
        { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.bobDisabled },
        {},
      );
      assert(bob !== undefined, 'Expected disabled user bob to be returned by getUser');
      assertEquals(bob.enabled, false);

      const carol = await port.getUser(
        { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.carolExpired },
        {},
      );
      assert(carol !== undefined, 'Expected expired user carol to be returned by getUser');
      assertEquals(carol.enabled, true);
      assertEquals(carol.expiresAt, '2026-05-01T00:00:00.000Z');

      const missing = await port.getUser(
        { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.unknown },
        {},
      );
      assertEquals(missing, undefined);

      const wrongInstance = await port.getUser(
        { directoryInstance: 'other-example', immutableId: DS.userIds.alice },
        {},
      );
      assertEquals(wrongInstance, undefined);
    },
  },
  {
    name: 'nested groups resolve transitively and handle cycles safely',
    async run({ port, clock }) {
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
      const result = await port.memberOfAny(
        {
          user: aliceRef,
          candidateGroupIds: [
            DS.groupIds.engParent,
            DS.groupIds.engChild,
            DS.groupIds.engLeaf,
            DS.groupIds.finance,
            DS.groupIds.cycleA,
            DS.groupIds.cycleB,
          ],
        },
        {},
      );
      assertEquals(result.evaluatedAt, clock.nowIso());
      assertEquals(result.consistency.source, 'live');
      assertEquals(result.consistency.ageMs, 0);

      const matched = new Set(result.memberOf);
      assert(matched.has(DS.groupIds.engLeaf), 'Direct group membership must match');
      assert(matched.has(DS.groupIds.cycleB), 'Direct cyclic group membership must match');
      assert(!matched.has(DS.groupIds.finance), 'Non-member group must not match');

      if (port.capabilities.has('transitive-membership')) {
        assert(matched.has(DS.groupIds.engChild), '2-level nested group must match');
        assert(matched.has(DS.groupIds.engParent), '3-level nested group must match');
        assert(matched.has(DS.groupIds.cycleA), 'Cyclic nested group must match without looping');
      }
    },
  },
  {
    name: 'primary group membership is included without explicit member entry',
    async run({ port, clock }) {
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
      const result = await port.memberOfAny(
        {
          user: aliceRef,
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.finance],
        },
        {},
      );
      assertEquals(result.memberOf, [DS.groupIds.domainUsers]);
      assertEquals(result.evaluatedAt, clock.nowIso());
      assertEquals(result.consistency, { source: 'live', ageMs: 0 });
    },
  },
  {
    name: 'disabled user fails closed on memberOfAny',
    async run({ port, clock }) {
      const bobRef = {
        directoryInstance: DS.directoryInstance,
        immutableId: DS.userIds.bobDisabled,
      };
      const result = await port.memberOfAny(
        {
          user: bobRef,
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.engParent, DS.groupIds.finance],
        },
        {},
      );
      assertEquals(result.memberOf, []);
      assertEquals(result.evaluatedAt, clock.nowIso());
    },
  },
  {
    name: 'expired user fails closed and responds to deterministic clock advance',
    async run({ port, clock }) {
      const carolRef = {
        directoryInstance: DS.directoryInstance,
        immutableId: DS.userIds.carolExpired,
      };
      const carolResult = await port.memberOfAny(
        {
          user: carolRef,
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.finance, DS.groupIds.engParent],
        },
        {},
      );
      assertEquals(carolResult.memberOf, []);

      const danaRef = {
        directoryInstance: DS.directoryInstance,
        immutableId: DS.userIds.danaExpiringSoon,
      };
      const beforeExpiry = await port.memberOfAny(
        {
          user: danaRef,
          candidateGroupIds: [DS.groupIds.finance, DS.groupIds.domainUsers],
        },
        {},
      );
      assertEquals(
        [...beforeExpiry.memberOf].sort(),
        [DS.groupIds.domainUsers, DS.groupIds.finance].sort(),
      );

      clock.advanceMs(DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS);

      const afterExpiry = await port.memberOfAny(
        {
          user: danaRef,
          candidateGroupIds: [DS.groupIds.finance, DS.groupIds.domainUsers],
        },
        {},
      );
      assertEquals(afterExpiry.memberOf, []);
      assertEquals(afterExpiry.evaluatedAt, clock.nowIso());
    },
  },
  {
    name: 'candidateGroupIds handles empty, unknown, and duplicated ids',
    async run({ port }) {
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };

      const empty = await port.memberOfAny({ user: aliceRef, candidateGroupIds: [] }, {});
      assertEquals(empty.memberOf, []);

      const unknownOnly = await port.memberOfAny(
        { user: aliceRef, candidateGroupIds: [DS.groupIds.unknown, 'not-a-real-group'] },
        {},
      );
      assertEquals(unknownOnly.memberOf, []);

      const duplicated = await port.memberOfAny(
        {
          user: aliceRef,
          candidateGroupIds: [
            DS.groupIds.engLeaf,
            DS.groupIds.engLeaf,
            DS.groupIds.domainUsers,
            DS.groupIds.unknown,
            DS.groupIds.domainUsers,
            DS.groupIds.finance,
          ],
        },
        {},
      );
      assertEquals(duplicated.memberOf.length, 2);
      assertEquals(
        [...duplicated.memberOf].sort(),
        [DS.groupIds.domainUsers, DS.groupIds.engLeaf].sort(),
      );
    },
  },
  {
    name: 'unknown user and wrong directoryInstance fail closed on memberOfAny',
    async run({ port }) {
      const unknownUser = await port.memberOfAny(
        {
          user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.unknown },
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.engParent],
        },
        {},
      );
      assertEquals(unknownUser.memberOf, []);

      const wrongInstance = await port.memberOfAny(
        {
          user: { directoryInstance: 'wrong-example', immutableId: DS.userIds.alice },
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.engParent],
        },
        {},
      );
      assertEquals(wrongInstance.memberOf, []);
    },
  },
  {
    name: 'searchUsers enforces mandatory capped limit and reports truncation',
    async run({ port, clock, maxSearchLimit = DIRECTORY_MAX_SEARCH_LIMIT }) {
      for (const badLimit of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
        await assertRejects(
          () => port.searchUsers({ text: 'Example', limit: badLimit }, {}),
          RangeError,
        );
      }

      const paged = await port.searchUsers({ text: 'Example', limit: 2 }, {});
      assertEquals(paged.items.length, 2);
      assertEquals(paged.truncated, true);
      assertEquals(paged.evaluatedAt, clock.nowIso());

      const exact = await port.searchUsers({ text: 'Alice Example', limit: 5 }, {});
      assertEquals(exact.items.length, 1);
      assertEquals(exact.items[0]?.immutableId, DS.userIds.alice);
      assertEquals(exact.truncated, false);

      const capped = await port.searchUsers({ text: 'Example', limit: 10_000 }, {});
      assert(
        capped.items.length <= maxSearchLimit,
        `Expected at most ${maxSearchLimit} items, got ${capped.items.length}`,
      );
      if (maxSearchLimit < 5) {
        assertEquals(capped.items.length, maxSearchLimit);
        assertEquals(capped.truncated, true);
      }
    },
  },
  {
    name: 'searchGroups enforces mandatory capped limit and reports truncation',
    async run({ port, clock, maxSearchLimit = DIRECTORY_MAX_SEARCH_LIMIT }) {
      for (const badLimit of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, 2.5]) {
        await assertRejects(
          () => port.searchGroups({ text: 'Ops', limit: badLimit }, {}),
          RangeError,
        );
      }

      const paged = await port.searchGroups({ text: 'Ops', limit: 2 }, {});
      assertEquals(paged.items.length, 2);
      assertEquals(paged.truncated, true);
      assertEquals(paged.evaluatedAt, clock.nowIso());

      const exact = await port.searchGroups({ text: 'Finance', limit: 5 }, {});
      assertEquals(exact.items.length, 1);
      assertEquals(exact.items[0]?.immutableId, DS.groupIds.finance);
      assertEquals(exact.truncated, false);

      const capped = await port.searchGroups({ text: 'Ops', limit: 10_000 }, {});
      assert(
        capped.items.length <= maxSearchLimit,
        `Expected at most ${maxSearchLimit} items, got ${capped.items.length}`,
      );
      if (maxSearchLimit < 4) {
        assertEquals(capped.items.length, maxSearchLimit);
        assertEquals(capped.truncated, true);
      }
    },
  },
  {
    name: 'hostile search strings cannot inject filters or dump directory entries',
    async run({ port }) {
      for (const blank of ['', '   ']) {
        const blankUsers = await port.searchUsers({ text: blank, limit: 10 }, {});
        assertEquals(blankUsers.items, []);
        assertEquals(blankUsers.truncated, false);

        const blankGroups = await port.searchGroups({ text: blank, limit: 10 }, {});
        assertEquals(blankGroups.items, []);
        assertEquals(blankGroups.truncated, false);
      }

      const injectionStrings = [
        '*)(|(objectClass=*)',
        'alice)(|(uid=*',
        '\\2a',
        'admin\0ignored',
      ];
      for (const payload of injectionStrings) {
        const users = await port.searchUsers({ text: payload, limit: 10 }, {});
        assertEquals(
          users.items,
          [],
          `Hostile user search ${JSON.stringify(payload)} must not match unintended records`,
        );
        const groups = await port.searchGroups({ text: payload, limit: 10 }, {});
        assertEquals(
          groups.items,
          [],
          `Hostile group search ${JSON.stringify(payload)} must not match unintended records`,
        );
      }

      const literalWildcard = await port.searchUsers({ text: '*', limit: 10 }, {});
      assertEquals(
        literalWildcard.items.map((u) => u.immutableId),
        [DS.userIds.erinHostile],
        'Literal "*" must only match Erin (O*Connor) and must never act as a wildcard',
      );

      const literalParens = await port.searchUsers({ text: '(O*Connor)', limit: 10 }, {});
      assertEquals(literalParens.items.map((u) => u.immutableId), [DS.userIds.erinHostile]);

      const literalBackslash = await port.searchUsers({ text: '\\ Ops', limit: 10 }, {});
      assertEquals(literalBackslash.items.map((u) => u.immutableId), [DS.userIds.erinHostile]);
    },
  },
  {
    name: 'timeout fails closed with DirectoryTimeout',
    async run({ port, timeoutPort }) {
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
      const timedOutCtx = { signal: createTimedOutSignal() };

      await assertRejects(
        () => port.searchUsers({ text: 'alice', limit: 5 }, timedOutCtx),
        DirectoryTimeout,
      );
      await assertRejects(() => port.getUser(aliceRef, timedOutCtx), DirectoryTimeout);
      await assertRejects(
        () =>
          port.memberOfAny(
            { user: aliceRef, candidateGroupIds: [DS.groupIds.domainUsers] },
            timedOutCtx,
          ),
        DirectoryTimeout,
      );
      await assertRejects(
        () => port.searchUsers({ text: 'alice', limit: 5 }, { timeoutMs: 0 }),
        DirectoryTimeout,
      );

      if (timeoutPort) {
        await assertRejects(
          () => timeoutPort.searchUsers({ text: 'alice', limit: 5 }, { timeoutMs: 25 }),
          DirectoryTimeout,
        );
        await assertRejects(
          () => timeoutPort.getUser(aliceRef, { timeoutMs: 25 }),
          DirectoryTimeout,
        );
        await assertRejects(
          () =>
            timeoutPort.memberOfAny(
              { user: aliceRef, candidateGroupIds: [DS.groupIds.domainUsers] },
              { timeoutMs: 25 },
            ),
          DirectoryTimeout,
        );
      }
    },
  },
];
