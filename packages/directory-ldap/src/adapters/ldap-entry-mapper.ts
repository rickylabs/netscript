/**
 * Case-insensitive raw LDAP entry decoders producing normalized `@netscript/plugin-directory-core`
 * `DirectoryUser` and `DirectoryGroup` records plus AD primary-group metadata.
 *
 * @module
 */

import type { DirectoryGroup, DirectoryUser } from '@netscript/plugin-directory-core';
import {
  decodeAdAccountEnabled,
  decodeAdAccountExpires,
  decodeAdObjectGuid,
  parseAdPrimaryGroupId,
  type ResolvedLdapAttributeMap,
} from '../domain/mod.ts';
import type { LdapRawEntry } from '../ports/mod.ts';

/** Normalized user record paired with internal LDAP DN and AD primary-group metadata. */
export type MappedLdapUser = Readonly<{
  dn: string;
  user: DirectoryUser;
  primaryGroupRid?: number;
  objectSid?: Uint8Array;
}>;

/** Normalized group record paired with its internal LDAP DN. */
export type MappedLdapGroup = Readonly<{
  dn: string;
  group: DirectoryGroup;
}>;

function readRawAttribute(
  entry: LdapRawEntry,
  attributeName: string,
): string | readonly string[] | Uint8Array | readonly Uint8Array[] | undefined {
  if (Object.prototype.hasOwnProperty.call(entry, attributeName)) {
    return entry[attributeName];
  }
  const target = attributeName.toLowerCase();
  for (const [key, value] of Object.entries(entry)) {
    if (key.toLowerCase() === target) {
      return value;
    }
  }
  return undefined;
}

/** Extracts the first non-empty string value for an LDAP attribute (case-insensitive). */
export function readStringAttribute(
  entry: LdapRawEntry,
  attributeName: string,
): string | undefined {
  const raw = readRawAttribute(entry, attributeName);
  if (typeof raw === 'string') {
    return raw.length > 0 ? raw : undefined;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.length > 0) {
        return item;
      }
    }
  }
  return undefined;
}

/** Extracts the first binary `Uint8Array` value for an LDAP attribute (case-insensitive). */
export function readBinaryAttribute(
  entry: LdapRawEntry,
  attributeName: string,
): Uint8Array | undefined {
  const raw = readRawAttribute(entry, attributeName);
  if (raw instanceof Uint8Array) {
    return raw.length > 0 ? raw : undefined;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item instanceof Uint8Array && item.length > 0) {
        return item;
      }
    }
  }
  return undefined;
}

/** Extracts and decodes the 16-byte binary `objectGUID` from a raw LDAP entry. */
export function readEntryImmutableId(
  entry: LdapRawEntry,
  attributeName: string,
): string | undefined {
  const binary = readBinaryAttribute(entry, attributeName);
  if (binary && binary.length === 16) {
    return decodeAdObjectGuid(binary);
  }
  return undefined;
}

/** Maps a raw LDAP user entry into a normalized {@link MappedLdapUser}, or `undefined` if `objectGUID` is missing. */
export function mapLdapUserEntry(
  entry: LdapRawEntry,
  directoryInstance: string,
  attributes: ResolvedLdapAttributeMap,
): MappedLdapUser | undefined {
  const immutableId = readEntryImmutableId(entry, attributes.immutableId);
  if (!immutableId) {
    return undefined;
  }
  const enabled = decodeAdAccountEnabled(
    readStringAttribute(entry, attributes.userAccountControl),
  );
  const expiresAt = decodeAdAccountExpires(
    readStringAttribute(entry, attributes.accountExpires),
  );
  const displayName = readStringAttribute(entry, attributes.displayName);
  const userPrincipalName = readStringAttribute(entry, attributes.userPrincipalName);
  const mail = readStringAttribute(entry, attributes.mail);
  const username = readStringAttribute(entry, attributes.username);
  const primaryGroupRid = parseAdPrimaryGroupId(
    readStringAttribute(entry, attributes.primaryGroupId),
  );
  const objectSid = readBinaryAttribute(entry, attributes.objectSid);

  const user: DirectoryUser = {
    ref: { directoryInstance, immutableId },
    immutableId,
    enabled,
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(displayName !== undefined ? { displayName } : {}),
    ...(userPrincipalName !== undefined ? { userPrincipalName } : {}),
    ...(mail !== undefined ? { mail } : {}),
    ...(username !== undefined ? { username } : {}),
  };

  return {
    dn: entry.dn,
    user,
    ...(primaryGroupRid !== undefined ? { primaryGroupRid } : {}),
    ...(objectSid !== undefined ? { objectSid } : {}),
  };
}

/** Maps a raw LDAP group entry into a normalized {@link MappedLdapGroup}, or `undefined` if `objectGUID` is missing. */
export function mapLdapGroupEntry(
  entry: LdapRawEntry,
  directoryInstance: string,
  attributes: ResolvedLdapAttributeMap,
): MappedLdapGroup | undefined {
  const immutableId = readEntryImmutableId(entry, attributes.immutableId);
  if (!immutableId) {
    return undefined;
  }
  const displayName = readStringAttribute(entry, attributes.groupDisplayName) ??
    readStringAttribute(entry, attributes.displayName) ??
    immutableId;
  const description = readStringAttribute(entry, attributes.groupDescription);
  const mail = readStringAttribute(entry, attributes.mail);

  return {
    dn: entry.dn,
    group: {
      ref: { directoryInstance, immutableId },
      immutableId,
      displayName,
      ...(description !== undefined ? { description } : {}),
      ...(mail !== undefined ? { mail } : {}),
    },
  };
}
