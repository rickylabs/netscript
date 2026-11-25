/**
 * Active Directory binary identifier codecs (`objectGUID` mixed-endian UUID and `objectSid` RID).
 *
 * @module
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_UINT32 = 0xFFFF_FFFF;

function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

function parseHexByte(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

/**
 * Decodes a 16-byte Active Directory binary `objectGUID` into a canonical lowercase UUID string.
 *
 * Active Directory stores `objectGUID` in Microsoft mixed-endian GUID layout:
 * Data1 (4 bytes), Data2 (2 bytes), and Data3 (2 bytes) are little-endian, while Data4 (8 bytes)
 * is big-endian.
 *
 * @param bytes - 16-byte binary `objectGUID` value.
 * @returns Canonical lowercase `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` string.
 * @throws {RangeError} When `bytes.length !== 16`.
 *
 * @example
 * ```ts
 * import { decodeAdObjectGuid, encodeAdObjectGuid } from '@netscript/directory-ldap';
 *
 * const raw = encodeAdObjectGuid('20000000-0000-4000-8000-000000000001');
 * console.log(decodeAdObjectGuid(raw));
 * ```
 */
export function decodeAdObjectGuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new RangeError(
      `Active Directory objectGUID must be exactly 16 bytes (received ${bytes.length}).`,
    );
  }
  const d1 = `${byteToHex(bytes[3]!)}${byteToHex(bytes[2]!)}${byteToHex(bytes[1]!)}${
    byteToHex(bytes[0]!)
  }`;
  const d2 = `${byteToHex(bytes[5]!)}${byteToHex(bytes[4]!)}`;
  const d3 = `${byteToHex(bytes[7]!)}${byteToHex(bytes[6]!)}`;
  const d4a = `${byteToHex(bytes[8]!)}${byteToHex(bytes[9]!)}`;
  const d4b = `${byteToHex(bytes[10]!)}${byteToHex(bytes[11]!)}${byteToHex(bytes[12]!)}${
    byteToHex(bytes[13]!)
  }${byteToHex(bytes[14]!)}${byteToHex(bytes[15]!)}`;
  return `${d1}-${d2}-${d3}-${d4a}-${d4b}`;
}

/**
 * Encodes a canonical UUID string into a 16-byte Active Directory mixed-endian `objectGUID`.
 *
 * @param guid - Canonical UUID string (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
 * @returns 16-byte `Uint8Array` in AD binary `objectGUID` byte order.
 * @throws {RangeError} When `guid` is not a valid canonical UUID string.
 *
 * @example
 * ```ts
 * import { encodeAdObjectGuid } from '@netscript/directory-ldap';
 *
 * const bytes = encodeAdObjectGuid('10000000-0000-4000-8000-000000000001');
 * console.log(bytes.length); // 16
 * ```
 */
export function encodeAdObjectGuid(guid: string): Uint8Array {
  const encoded = tryEncodeAdObjectGuid(guid);
  if (!encoded) {
    throw new RangeError('Invalid canonical UUID/GUID string.');
  }
  return encoded;
}

/**
 * Attempts to encode a canonical UUID string into a 16-byte AD binary `objectGUID`.
 *
 * Returns `undefined` for malformed or non-UUID strings instead of throwing, allowing adapters
 * to safely ignore unknown/non-UUID candidate identifiers.
 *
 * @param guid - Candidate UUID string.
 * @returns 16-byte `Uint8Array` or `undefined` when `guid` is not a canonical UUID.
 */
export function tryEncodeAdObjectGuid(guid: string): Uint8Array | undefined {
  const trimmed = guid.trim();
  if (!UUID_PATTERN.test(trimmed)) {
    return undefined;
  }
  const hex = trimmed.replaceAll('-', '').toLowerCase();
  const out = new Uint8Array(16);
  out[0] = parseHexByte(hex, 6);
  out[1] = parseHexByte(hex, 4);
  out[2] = parseHexByte(hex, 2);
  out[3] = parseHexByte(hex, 0);
  out[4] = parseHexByte(hex, 10);
  out[5] = parseHexByte(hex, 8);
  out[6] = parseHexByte(hex, 14);
  out[7] = parseHexByte(hex, 12);
  for (let i = 0; i < 8; i++) {
    out[8 + i] = parseHexByte(hex, 16 + i * 2);
  }
  return out;
}

/**
 * Replaces the trailing 32-bit RID of a binary Active Directory `objectSid` with `primaryGroupRid`.
 *
 * Active Directory represents a user's primary group via `primaryGroupID` (a uint32 RID such as
 * `513` for Domain Users) and omits the user from that group's `member` attribute. Substituting
 * the user's RID with `primaryGroupID` yields the exact binary `objectSid` of the primary group.
 *
 * @param userObjectSid - Binary `objectSid` of a user (`revision=1`, `subAuthorityCount>=1`).
 * @param primaryGroupRid - Unsigned 32-bit RID from the user's `primaryGroupID` attribute.
 * @returns New binary `objectSid` for the primary group, or `undefined` if inputs are malformed.
 *
 * @example
 * ```ts
 * import { derivePrimaryGroupSid } from '@netscript/directory-ldap';
 *
 * const userSid = new Uint8Array([
 *   1, 5, 0, 0, 0, 0, 0, 5,
 *   21, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
 *   0x51, 0x04, 0x00, 0x00,
 * ]);
 * const groupSid = derivePrimaryGroupSid(userSid, 513);
 * console.log(groupSid?.length); // 28
 * ```
 */
export function derivePrimaryGroupSid(
  userObjectSid: Uint8Array,
  primaryGroupRid: number,
): Uint8Array | undefined {
  if (!Number.isInteger(primaryGroupRid) || primaryGroupRid < 0 || primaryGroupRid > MAX_UINT32) {
    return undefined;
  }
  if (userObjectSid.length < 12) {
    return undefined;
  }
  const revision = userObjectSid[0];
  const subAuthorityCount = userObjectSid[1]!;
  if (revision !== 1 || subAuthorityCount < 1 || subAuthorityCount > 15) {
    return undefined;
  }
  const expectedLength = 8 + subAuthorityCount * 4;
  if (userObjectSid.length !== expectedLength) {
    return undefined;
  }
  const result = new Uint8Array(userObjectSid);
  const ridOffset = expectedLength - 4;
  result[ridOffset] = primaryGroupRid & 0xFF;
  result[ridOffset + 1] = (primaryGroupRid >>> 8) & 0xFF;
  result[ridOffset + 2] = (primaryGroupRid >>> 16) & 0xFF;
  result[ridOffset + 3] = (primaryGroupRid >>> 24) & 0xFF;
  return result;
}

/**
 * Extracts the trailing unsigned 32-bit RID from a binary Active Directory `objectSid`.
 *
 * @param objectSid - Binary `objectSid` buffer.
 * @returns Unsigned 32-bit RID, or `undefined` when the SID is malformed.
 */
export function readObjectSidRid(objectSid: Uint8Array): number | undefined {
  if (objectSid.length < 12) {
    return undefined;
  }
  const revision = objectSid[0];
  const subAuthorityCount = objectSid[1]!;
  if (revision !== 1 || subAuthorityCount < 1 || subAuthorityCount > 15) {
    return undefined;
  }
  const expectedLength = 8 + subAuthorityCount * 4;
  if (objectSid.length !== expectedLength) {
    return undefined;
  }
  const ridOffset = expectedLength - 4;
  return (
    (objectSid[ridOffset]! |
      (objectSid[ridOffset + 1]! << 8) |
      (objectSid[ridOffset + 2]! << 16) |
      (objectSid[ridOffset + 3]! << 24)) >>> 0
  );
}
