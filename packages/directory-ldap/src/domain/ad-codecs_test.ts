import { assertEquals, assertThrows } from '@std/assert';
import {
  AD_ACCOUNT_DISABLE_FLAG,
  decodeAdAccountEnabled,
  decodeAdAccountExpires,
  decodeAdObjectGuid,
  derivePrimaryGroupSid,
  encodeAdAccountExpires,
  encodeAdObjectGuid,
  parseAdPrimaryGroupId,
  readObjectSidRid,
  tryEncodeAdObjectGuid,
} from './mod.ts';

Deno.test('AD objectGUID codec preserves Microsoft mixed-endian byte layout', () => {
  // Canonical UUID: 01020304-0506-0708-090a-0b0c0d0e0f10
  // AD bytes: Data1 LE (04 03 02 01), Data2 LE (06 05), Data3 LE (08 07), Data4 BE (09 0a 0b 0c 0d 0e 0f 10)
  const expectedBytes = new Uint8Array([
    0x04,
    0x03,
    0x02,
    0x01,
    0x06,
    0x05,
    0x08,
    0x07,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
  ]);
  const uuid = '01020304-0506-0708-090a-0b0c0d0e0f10';

  assertEquals(encodeAdObjectGuid(uuid), expectedBytes);
  assertEquals(decodeAdObjectGuid(expectedBytes), uuid);
  assertEquals(decodeAdObjectGuid(encodeAdObjectGuid(uuid.toUpperCase())), uuid);
  assertEquals(tryEncodeAdObjectGuid('not-a-guid'), undefined);

  assertThrows(() => decodeAdObjectGuid(new Uint8Array(15)), RangeError);
  assertThrows(() => encodeAdObjectGuid('not-a-guid'), RangeError);
});

Deno.test('objectSid RID reader and derivePrimaryGroupSid preserve domain SID prefix', () => {
  // S-1-5-21-100-200-300-1105 (revision=1, subAuthCount=5, authority=5)
  const userSid = new Uint8Array([
    1,
    5,
    0,
    0,
    0,
    0,
    0,
    5,
    21,
    0,
    0,
    0,
    100,
    0,
    0,
    0,
    200,
    0,
    0,
    0,
    44,
    1,
    0,
    0,
    0x51,
    0x04,
    0x00,
    0x00, // 1105 LE
  ]);

  assertEquals(readObjectSidRid(userSid), 1105);

  const primaryGroupSid = derivePrimaryGroupSid(userSid, 513);
  assertEquals(primaryGroupSid?.length, userSid.length);
  assertEquals(primaryGroupSid?.slice(0, 24), userSid.slice(0, 24));
  assertEquals(readObjectSidRid(primaryGroupSid!), 513);

  // Original buffer is never mutated.
  assertEquals(readObjectSidRid(userSid), 1105);

  // Malformed SIDs or out-of-range RIDs return undefined.
  assertEquals(derivePrimaryGroupSid(new Uint8Array(8), 513), undefined);
  assertEquals(derivePrimaryGroupSid(userSid, -1), undefined);
  assertEquals(derivePrimaryGroupSid(userSid, 0x1_0000_0000), undefined);
  assertEquals(readObjectSidRid(new Uint8Array([2, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0])), undefined);
});

Deno.test('decodeAdAccountEnabled fails closed on missing, malformed, or ACCOUNTDISABLE values', () => {
  assertEquals(AD_ACCOUNT_DISABLE_FLAG, 0x0002);
  assertEquals(decodeAdAccountEnabled('512'), true);
  assertEquals(decodeAdAccountEnabled(66048), true);
  assertEquals(decodeAdAccountEnabled('514'), false);
  assertEquals(decodeAdAccountEnabled(66050), false);
  assertEquals(decodeAdAccountEnabled(undefined), false);
  assertEquals(decodeAdAccountEnabled(''), false);
  assertEquals(decodeAdAccountEnabled('not-a-number'), false);
  assertEquals(decodeAdAccountEnabled(-512), false);
});

Deno.test('Windows FILETIME accountExpires codec handles never-expires, BigInt precision, and fail-closed errors', () => {
  assertEquals(decodeAdAccountExpires(undefined), undefined);
  assertEquals(decodeAdAccountExpires(''), undefined);
  assertEquals(decodeAdAccountExpires('0'), undefined);
  assertEquals(decodeAdAccountExpires('9223372036854775807'), undefined);

  assertEquals(encodeAdAccountExpires('1970-01-01T00:00:00.000Z'), '116444736000000000');

  const iso = '2027-01-01T00:00:00.000Z';
  const filetime = encodeAdAccountExpires(iso);
  assertEquals(filetime, '134432352000000000');
  assertEquals(decodeAdAccountExpires(filetime), iso);

  // Malformed FILETIME fails closed to Unix epoch (expired).
  assertEquals(decodeAdAccountExpires('garbage'), '1970-01-01T00:00:00.000Z');
  assertEquals(decodeAdAccountExpires('1000'), '1970-01-01T00:00:00.000Z');

  assertThrows(() => encodeAdAccountExpires('not-a-date'), RangeError);
});

Deno.test('parseAdPrimaryGroupId accepts valid uint32 RIDs and rejects invalid values', () => {
  assertEquals(parseAdPrimaryGroupId('513'), 513);
  assertEquals(parseAdPrimaryGroupId(513), 513);
  assertEquals(parseAdPrimaryGroupId(undefined), undefined);
  assertEquals(parseAdPrimaryGroupId('abc'), undefined);
  assertEquals(parseAdPrimaryGroupId(-1), undefined);
  assertEquals(parseAdPrimaryGroupId(0x1_0000_0000), undefined);
});
