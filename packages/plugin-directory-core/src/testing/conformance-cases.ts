/**
 * Identity and membership conformance scenarios combined with search and resilience scenarios
 * executed by {@link runDirectoryConformanceSuite}.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import {
  DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS,
  DIRECTORY_CONFORMANCE_DATASET,
} from './conformance-dataset.ts';
import {
  assertIsoTimestamp,
  assertNoSensitiveLeak,
  HOSTILE_FILTER_PAYLOADS,
} from './conformance-helpers.ts';
import { type ConformanceCase, SEARCH_AND_RESILIENCE_CASES } from './conformance-search-cases.ts';

export type { ConformanceCase };

const DS = DIRECTORY_CONFORMANCE_DATASET;

function buildSyntheticGroupIds(count: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const suffix = String(i).padStart(12, '0');
    out.push(`18888888-0000-4000-8000-${suffix}`);
  }
  return out;
}

const IDENTITY_AND_MEMBERSHIP_CASES: readonly ConformanceCase[] = [
  {
    name: 'metadata, redacted health probe, and sensitive value hygiene',
    async run({ port, clock, sensitiveValues }) {
      assert(port.name.trim().length > 0, 'DirectoryPort.name must be non-empty');
      assert(port.capabilities instanceof Set, 'DirectoryPort.capabilities must be a Set');
      const health = await port.health({});
      assertEquals(health.status, 'healthy');
      assertEquals(health.checkedAt, clock.nowIso());
      assertIsoTimestamp(health.checkedAt, 'health.checkedAt');
      assertNoSensitiveLeak(JSON.stringify(health), sensitiveValues, 'health()');
    },
  },
  {
    name:
      'getUser returns immutable identity, secondary lookups, ambiguity fail-closed, and isolation',
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

      const frankByMail = await port.getUser(
        { directoryInstance: DS.directoryInstance, mail: 'frank@example.test' },
        {},
      );
      assertEquals(frankByMail?.immutableId, DS.userIds.frank);

      const aliceByUsername = await port.getUser(
        { directoryInstance: DS.directoryInstance, username: 'alice' },
        {},
      );
      assertEquals(aliceByUsername?.immutableId, DS.userIds.alice);

      // Ambiguous secondary lookup: alice and aliceAdmin share mail='alice@example.test'.
      const ambiguousMail = await port.getUser(
        { directoryInstance: DS.directoryInstance, mail: 'alice@example.test' },
        {},
      );
      assertEquals(
        ambiguousMail,
        undefined,
        'Ambiguous secondary getUser lookup matching multiple accounts must fail closed (undefined)',
      );

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

      assertEquals(
        await port.getUser(
          { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.unknown },
          {},
        ),
        undefined,
      );

      // Wrong directoryInstance must isolate all four selectors.
      assertEquals(
        await port.getUser(
          { directoryInstance: 'other-example', immutableId: DS.userIds.alice },
          {},
        ),
        undefined,
      );
      assertEquals(
        await port.getUser(
          { directoryInstance: 'other-example', userPrincipalName: 'alice@example.test' },
          {},
        ),
        undefined,
      );
      assertEquals(
        await port.getUser(
          { directoryInstance: 'other-example', mail: 'frank@example.test' },
          {},
        ),
        undefined,
      );
      assertEquals(
        await port.getUser(
          { directoryInstance: 'other-example', username: 'alice' },
          {},
        ),
        undefined,
      );
    },
  },
  {
    name: 'getUser and memberOfAny reject hostile and blank selectors without injection',
    async run({ port }) {
      const payloads = ['', '   ', ...HOSTILE_FILTER_PAYLOADS];
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };

      for (const payload of payloads) {
        assertEquals(
          await port.getUser({ directoryInstance: DS.directoryInstance, immutableId: payload }, {}),
          undefined,
          `getUser(immutableId=${JSON.stringify(payload)}) must return undefined`,
        );
        assertEquals(
          await port.getUser(
            { directoryInstance: DS.directoryInstance, userPrincipalName: payload },
            {},
          ),
          undefined,
          `getUser(userPrincipalName=${JSON.stringify(payload)}) must return undefined`,
        );
        assertEquals(
          await port.getUser({ directoryInstance: DS.directoryInstance, mail: payload }, {}),
          undefined,
          `getUser(mail=${JSON.stringify(payload)}) must return undefined`,
        );
        assertEquals(
          await port.getUser({ directoryInstance: DS.directoryInstance, username: payload }, {}),
          undefined,
          `getUser(username=${JSON.stringify(payload)}) must return undefined`,
        );
        const byHostileUser = await port.memberOfAny(
          {
            user: { directoryInstance: DS.directoryInstance, immutableId: payload },
            candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.engLeaf],
          },
          {},
        );
        assertEquals(byHostileUser.memberOf, []);
      }

      const hostileCandidates = await port.memberOfAny(
        { user: aliceRef, candidateGroupIds: payloads },
        {},
      );
      assertEquals(hostileCandidates.memberOf, []);
    },
  },
  {
    name:
      'nested groups honor transitive-membership capability and terminate cycles for non-members',
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
      } else {
        assert(
          !matched.has(DS.groupIds.engChild) &&
            !matched.has(DS.groupIds.engParent) &&
            !matched.has(DS.groupIds.cycleA),
          'Adapter without transitive-membership must not match nested-only groups',
        );
      }

      // Non-member evaluated against cyclic groups must terminate cleanly without stack overflow.
      const frankCycle = await port.memberOfAny(
        {
          user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.frank },
          candidateGroupIds: [DS.groupIds.cycleA, DS.groupIds.cycleB],
        },
        {},
      );
      assertEquals(frankCycle.memberOf, []);
    },
  },
  {
    name: 'primary group (direct and nested) and never-expiring accounts resolve accurately',
    async run({ port, clock }) {
      const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
      const aliceDirect = await port.memberOfAny(
        {
          user: aliceRef,
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.finance],
        },
        {},
      );
      assertEquals(aliceDirect.memberOf, [DS.groupIds.domainUsers]);
      assertEquals(aliceDirect.evaluatedAt, clock.nowIso());
      assertEquals(aliceDirect.consistency, { source: 'live', ageMs: 0 });

      // Frank has no expiresAt (never expires) and must be active.
      const frankDirect = await port.memberOfAny(
        {
          user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.frank },
          candidateGroupIds: [DS.groupIds.domainUsers, DS.groupIds.finance],
        },
        {},
      );
      assertEquals(frankDirect.memberOf, [DS.groupIds.domainUsers]);

      // All Staff nests Domain Users; transitive adapters must follow primary group into nesting.
      const nestedPrimary = await port.memberOfAny(
        {
          user: aliceRef,
          candidateGroupIds: [DS.groupIds.allStaff, DS.groupIds.finance],
        },
        {},
      );
      if (port.capabilities.has('transitive-membership')) {
        assertEquals(nestedPrimary.memberOf, [DS.groupIds.allStaff]);
      } else {
        assertEquals(nestedPrimary.memberOf, []);
      }
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
    name: 'candidateGroupIds handles empty, unknown, duplicated, and 60-candidate batches',
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

      // 60-candidate batch with real matches placed beyond positions 20 and 40.
      const batch = buildSyntheticGroupIds(60);
      batch[0] = DS.groupIds.engLeaf;
      batch[25] = DS.groupIds.domainUsers;
      batch[45] = DS.groupIds.engParent;
      batch[55] = DS.groupIds.cycleB;
      const largeBatch = await port.memberOfAny({ user: aliceRef, candidateGroupIds: batch }, {});
      const expected = port.capabilities.has('transitive-membership')
        ? [DS.groupIds.cycleB, DS.groupIds.domainUsers, DS.groupIds.engLeaf, DS.groupIds.engParent]
        : [DS.groupIds.cycleB, DS.groupIds.domainUsers, DS.groupIds.engLeaf];
      assertEquals([...largeBatch.memberOf].sort(), expected.sort());
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
];

export const CONFORMANCE_CASES: readonly ConformanceCase[] = [
  ...IDENTITY_AND_MEMBERSHIP_CASES,
  ...SEARCH_AND_RESILIENCE_CASES,
];
