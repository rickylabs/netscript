/**
 * Search, hostile-payload, deadline, abort, and failure-path conformance cases.
 *
 * @module
 */

import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
} from '../ports/mod.ts';
import type { DirectoryConformanceFixture } from './conformance.ts';
import { DIRECTORY_CONFORMANCE_DATASET } from './conformance-dataset.ts';
import {
  assertAllMethodsReject,
  assertInvalidTimeoutRejected,
  assertMidFlightCallerAbort,
  createCallerAbortedSignal,
  createTimedOutSignal,
  HOSTILE_SEARCH_NO_MATCH_PAYLOADS,
} from './conformance-helpers.ts';

export interface ConformanceCase {
  readonly name: string;
  readonly run: (fixture: DirectoryConformanceFixture) => Promise<void>;
}

const DS = DIRECTORY_CONFORMANCE_DATASET;

export const SEARCH_AND_RESILIENCE_CASES: readonly ConformanceCase[] = [
  {
    name: 'searchUsers enforces capability boundary, mandatory cap, exact-fit, and truncation',
    async run({ port, clock, maxSearchLimit }) {
      if (!port.capabilities.has('search')) {
        await assertRejects(
          () => port.searchUsers({ text: 'Example', limit: 2 }, {}),
          DirectoryUnsupported,
        );
        return;
      }
      assert(
        maxSearchLimit !== undefined &&
          Number.isInteger(maxSearchLimit) &&
          maxSearchLimit >= 2 &&
          maxSearchLimit < 4,
        'Conformance fixture must configure maxSearchLimit in [2, 3] so ceiling truncation is proven.',
      );

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

      // Exact-fit boundary: 1 match with limit 1, and 2 matches ('Alice Example', 'Alice Admin') with limit 2.
      const exactOne = await port.searchUsers({ text: 'Alice Example', limit: 1 }, {});
      assertEquals(exactOne.items.length, 1);
      assertEquals(exactOne.items[0]?.immutableId, DS.userIds.alice);
      assertEquals(exactOne.truncated, false);

      const exactTwo = await port.searchUsers({ text: 'Alice', limit: 2 }, {});
      assertEquals(exactTwo.items.length, 2);
      assertEquals(exactTwo.truncated, false);

      const capped = await port.searchUsers({ text: 'Example', limit: 10_000 }, {});
      assertEquals(capped.items.length, maxSearchLimit);
      assertEquals(capped.truncated, true);
    },
  },
  {
    name: 'searchGroups enforces capability boundary, mandatory cap, exact-fit, and truncation',
    async run({ port, clock, maxSearchLimit }) {
      if (!port.capabilities.has('search')) {
        await assertRejects(
          () => port.searchGroups({ text: 'Ops', limit: 2 }, {}),
          DirectoryUnsupported,
        );
        return;
      }
      assert(
        maxSearchLimit !== undefined &&
          Number.isInteger(maxSearchLimit) &&
          maxSearchLimit >= 2 &&
          maxSearchLimit < 4,
        'Conformance fixture must configure maxSearchLimit in [2, 3] so ceiling truncation is proven.',
      );

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

      // Exact-fit boundary: 1 match with limit 1, and 2 matches ('Cycle Group A/B') with limit 2.
      const exactOne = await port.searchGroups({ text: 'Finance', limit: 1 }, {});
      assertEquals(exactOne.items.length, 1);
      assertEquals(exactOne.items[0]?.immutableId, DS.groupIds.finance);
      assertEquals(exactOne.truncated, false);

      const exactTwo = await port.searchGroups({ text: 'Cycle Group', limit: 2 }, {});
      assertEquals(exactTwo.items.length, 2);
      assertEquals(exactTwo.truncated, false);

      const capped = await port.searchGroups({ text: 'Ops', limit: 10_000 }, {});
      assertEquals(capped.items.length, maxSearchLimit);
      assertEquals(capped.truncated, true);
    },
  },
  {
    name: 'hostile search strings (LDAP, OData, SCIM, URL, CRLF) cannot inject filters',
    async run({ port }) {
      if (!port.capabilities.has('search')) {
        await assertRejects(
          () => port.searchUsers({ text: '*', limit: 2 }, {}),
          DirectoryUnsupported,
        );
        return;
      }

      for (const blank of ['', '   ']) {
        const blankUsers = await port.searchUsers({ text: blank, limit: 2 }, {});
        assertEquals(blankUsers.items, []);
        assertEquals(blankUsers.truncated, false);

        const blankGroups = await port.searchGroups({ text: blank, limit: 2 }, {});
        assertEquals(blankGroups.items, []);
        assertEquals(blankGroups.truncated, false);
      }

      for (const payload of HOSTILE_SEARCH_NO_MATCH_PAYLOADS) {
        const users = await port.searchUsers({ text: payload, limit: 2 }, {});
        assertEquals(
          users.items,
          [],
          `Hostile user search ${JSON.stringify(payload)} must not match unintended records`,
        );
        const groups = await port.searchGroups({ text: payload, limit: 2 }, {});
        assertEquals(
          groups.items,
          [],
          `Hostile group search ${JSON.stringify(payload)} must not match unintended records`,
        );
      }

      for (const literal of ['*', "'O*Connor'", '"Ops"', '\\ (Test)']) {
        const res = await port.searchUsers({ text: literal, limit: 2 }, {});
        assertEquals(
          res.items.map((u) => u.immutableId),
          [DS.userIds.erinHostile],
          `Literal ${JSON.stringify(literal)} must match only erinHostile`,
        );
      }
    },
  },
  {
    name: 'deadlines, timeouts, caller aborts, and optional failure ports honor CallContext',
    async run({ port, timeoutPort, unavailablePort, unauthorizedPort, sensitiveValues }) {
      assert(
        timeoutPort !== undefined,
        'Conformance fixture must supply timeoutPort to verify mid-flight deadlines and aborts.',
      );

      await assertInvalidTimeoutRejected(port);

      await assertAllMethodsReject(
        port,
        () => ({ signal: createTimedOutSignal() }),
        DirectoryTimeout,
        true,
        sensitiveValues,
      );
      await assertAllMethodsReject(
        port,
        () => ({ signal: createCallerAbortedSignal() }),
        DirectoryUnavailable,
        true,
        sensitiveValues,
      );

      // Mid-flight timeout budget enforcement on required timeoutPort across all methods.
      await assertAllMethodsReject(
        timeoutPort,
        () => ({ timeoutMs: 25 }),
        DirectoryTimeout,
        true,
        sensitiveValues,
      );

      // Mid-flight non-timeout caller cancellation across all methods including health().
      await assertMidFlightCallerAbort(timeoutPort, sensitiveValues);

      if (unavailablePort) {
        await assertAllMethodsReject(
          unavailablePort,
          () => ({ timeoutMs: 2_000 }),
          DirectoryUnavailable,
          false,
          sensitiveValues,
        );
      }
      if (unauthorizedPort) {
        await assertAllMethodsReject(
          unauthorizedPort,
          () => ({ timeoutMs: 2_000 }),
          DirectoryUnauthorized,
          false,
          sensitiveValues,
        );
      }
    },
  },
];
