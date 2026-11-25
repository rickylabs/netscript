/**
 * Active Directory account-state codecs (`userAccountControl`, Windows FILETIME `accountExpires`,
 * and `primaryGroupID`).
 *
 * @module
 */

/** AD `userAccountControl` bit flag indicating a disabled account (`ACCOUNTDISABLE`). */
export const AD_ACCOUNT_DISABLE_FLAG: number = 0x0002;

const FILETIME_UNIX_EPOCH_TICKS = 116_444_736_000_000_000n;
const FILETIME_TICKS_PER_MS = 10_000n;
const FILETIME_NEVER_EXPIRES_MAX = 9_223_372_036_854_775_807n; // 0x7FFF_FFFF_FFFF_FFFF
const MAX_UINT32 = 0xFFFF_FFFF;

/**
 * Decodes Active Directory `userAccountControl` into an account-enabled boolean (fail-closed).
 *
 * Returns `false` when the attribute is missing, non-numeric, or has bit `0x0002`
 * (`ACCOUNTDISABLE`) set.
 *
 * @param rawValue - String or number value of `userAccountControl`.
 * @returns `true` only when `userAccountControl` parses cleanly and `ACCOUNTDISABLE` is clear.
 */
export function decodeAdAccountEnabled(rawValue: string | number | undefined): boolean {
  if (rawValue === undefined) {
    return false;
  }
  let flags: number;
  if (typeof rawValue === 'number') {
    if (!Number.isInteger(rawValue) || rawValue < 0) {
      return false;
    }
    flags = rawValue;
  } else {
    const trimmed = rawValue.trim();
    if (!/^\d+$/.test(trimmed)) {
      return false;
    }
    flags = Number(trimmed);
    if (!Number.isSafeInteger(flags) || flags < 0) {
      return false;
    }
  }
  return (flags & AD_ACCOUNT_DISABLE_FLAG) === 0;
}

/**
 * Decodes an Active Directory `accountExpires` Windows FILETIME value into an ISO-8601 UTC
 * timestamp or `undefined` when the account never expires.
 *
 * AD encodes "never expires" as `0` or `9223372036854775807` (`Int64.MaxValue`). Malformed or
 * out-of-range non-empty values fail closed by returning `'1970-01-01T00:00:00.000Z'` (expired).
 *
 * @param rawValue - Decimal FILETIME string (or `undefined` when absent).
 * @returns ISO-8601 UTC expiration string, or `undefined` when the account has no expiration.
 *
 * @example
 * ```ts
 * import { decodeAdAccountExpires, encodeAdAccountExpires } from '@netscript/directory-ldap';
 *
 * const filetime = encodeAdAccountExpires('2027-01-01T00:00:00.000Z');
 * console.log(decodeAdAccountExpires(filetime)); // '2027-01-01T00:00:00.000Z'
 * console.log(decodeAdAccountExpires('0')); // undefined
 * ```
 */
export function decodeAdAccountExpires(rawValue: string | undefined): string | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!/^\d+$/.test(trimmed)) {
    return '1970-01-01T00:00:00.000Z';
  }
  let ticks: bigint;
  try {
    ticks = BigInt(trimmed);
  } catch {
    return '1970-01-01T00:00:00.000Z';
  }
  if (ticks === 0n || ticks >= FILETIME_NEVER_EXPIRES_MAX) {
    return undefined;
  }
  if (ticks < FILETIME_UNIX_EPOCH_TICKS) {
    return '1970-01-01T00:00:00.000Z';
  }
  const unixMsBig = (ticks - FILETIME_UNIX_EPOCH_TICKS) / FILETIME_TICKS_PER_MS;
  const unixMs = Number(unixMsBig);
  if (!Number.isFinite(unixMs)) {
    return '1970-01-01T00:00:00.000Z';
  }
  const date = new Date(unixMs);
  if (!Number.isFinite(date.getTime())) {
    return '1970-01-01T00:00:00.000Z';
  }
  return date.toISOString();
}

/**
 * Encodes an ISO-8601 UTC timestamp into an Active Directory Windows FILETIME decimal string.
 *
 * @param isoTimestamp - Valid ISO-8601 UTC timestamp string.
 * @returns Decimal FILETIME string (100ns ticks since `1601-01-01T00:00:00.000Z`).
 * @throws {RangeError} When `isoTimestamp` is not a valid ISO-8601 timestamp.
 */
export function encodeAdAccountExpires(isoTimestamp: string): string {
  const unixMs = Date.parse(isoTimestamp);
  if (!Number.isFinite(unixMs)) {
    throw new RangeError(`Invalid ISO-8601 timestamp: ${isoTimestamp}`);
  }
  const ticks = FILETIME_UNIX_EPOCH_TICKS + BigInt(Math.trunc(unixMs)) * FILETIME_TICKS_PER_MS;
  if (ticks < 0n) {
    throw new RangeError('Timestamp precedes Windows FILETIME epoch (1601-01-01T00:00:00.000Z).');
  }
  return ticks.toString(10);
}

/**
 * Parses an Active Directory `primaryGroupID` attribute into an unsigned 32-bit RID.
 *
 * @param rawValue - String or number value of `primaryGroupID`.
 * @returns Unsigned 32-bit RID, or `undefined` when missing or malformed.
 */
export function parseAdPrimaryGroupId(rawValue: string | number | undefined): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  let rid: number;
  if (typeof rawValue === 'number') {
    rid = rawValue;
  } else {
    const trimmed = rawValue.trim();
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    rid = Number(trimmed);
  }
  if (!Number.isInteger(rid) || rid < 0 || rid > MAX_UINT32) {
    return undefined;
  }
  return rid;
}
