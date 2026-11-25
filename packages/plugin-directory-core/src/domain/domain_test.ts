import { assertEquals, assertThrows } from '@std/assert';
import {
  computeRevocationBoundMs,
  DIRECTORY_MAX_SEARCH_LIMIT,
  DIRECTORY_MIN_SEARCH_LIMIT,
  type DirectoryUser,
  isDirectoryUserActive,
  normalizeDirectorySearchLimit,
} from './mod.ts';

Deno.test('normalizeDirectorySearchLimit: caps positive integers and rejects invalid values', () => {
  assertEquals(normalizeDirectorySearchLimit(1), 1);
  assertEquals(normalizeDirectorySearchLimit(25), 25);
  assertEquals(normalizeDirectorySearchLimit(500), DIRECTORY_MAX_SEARCH_LIMIT);
  assertEquals(normalizeDirectorySearchLimit(50, 10), 10);
  assertEquals(DIRECTORY_MIN_SEARCH_LIMIT, 1);

  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assertThrows(() => normalizeDirectorySearchLimit(invalid), RangeError);
  }
  for (const invalidCap of [0, -5, 2.2, Number.NaN]) {
    assertThrows(() => normalizeDirectorySearchLimit(5, invalidCap), RangeError);
  }
});

Deno.test('isDirectoryUserActive: fails closed for disabled, expired, and malformed timestamps', () => {
  const nowMs = Date.parse('2026-06-01T12:00:00.000Z');
  const baseUser: DirectoryUser = {
    ref: { directoryInstance: 'corp-example', immutableId: '20000000-0000-4000-8000-000000000001' },
    immutableId: '20000000-0000-4000-8000-000000000001',
    enabled: true,
  };

  assertEquals(isDirectoryUserActive(baseUser, nowMs), true);
  assertEquals(
    isDirectoryUserActive({ ...baseUser, expiresAt: '2026-06-01T12:00:00.001Z' }, nowMs),
    true,
  );
  assertEquals(
    isDirectoryUserActive({ ...baseUser, expiresAt: '2026-06-01T12:00:00.000Z' }, nowMs),
    false,
  );
  assertEquals(
    isDirectoryUserActive({ ...baseUser, expiresAt: '2026-05-31T23:59:59.999Z' }, nowMs),
    false,
  );
  assertEquals(isDirectoryUserActive({ ...baseUser, enabled: false }, nowMs), false);
  assertEquals(isDirectoryUserActive({ ...baseUser, expiresAt: 'not-a-timestamp' }, nowMs), false);
  assertEquals(isDirectoryUserActive(baseUser, Number.NaN), false);
});

Deno.test('computeRevocationBoundMs: sums replication allowance and cache TTL and rejects negative budgets', () => {
  assertEquals(
    computeRevocationBoundMs({
      replicationAllowanceMs: 15_000,
      membershipCacheTtlMs: 45_000,
      maxStalenessMs: 90_000,
    }),
    60_000,
  );
  assertEquals(
    computeRevocationBoundMs({
      replicationAllowanceMs: 0,
      membershipCacheTtlMs: 0,
      maxStalenessMs: 0,
    }),
    0,
  );

  assertThrows(
    () =>
      computeRevocationBoundMs({
        replicationAllowanceMs: -1,
        membershipCacheTtlMs: 1_000,
        maxStalenessMs: 2_000,
      }),
    RangeError,
  );
  assertThrows(
    () =>
      computeRevocationBoundMs({
        replicationAllowanceMs: 1_000,
        membershipCacheTtlMs: Number.POSITIVE_INFINITY,
        maxStalenessMs: 2_000,
      }),
    RangeError,
  );
});
