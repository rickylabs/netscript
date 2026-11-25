/**
 * Deterministic in-memory LDAP server and `LdapClientPort` fake that evaluates genuine `ldapts`
 * `Filter` AST trees (`AndFilter`, `OrFilter`, `NotFilter`, `EqualityFilter`, `SubstringFilter`,
 * `PresenceFilter`, and `ExtensibleFilter` for `LDAP_MATCHING_RULE_IN_CHAIN`) and emulates
 * RFC 2696 paging semantics (ignoring `sizeLimit` on unbounded paged searches like real AD/Samba).
 */

import { Buffer } from 'node:buffer';
import {
  AndFilter,
  EqualityFilter,
  ExtensibleFilter,
  Filter,
  InvalidCredentialsError,
  NoSuchObjectError,
  NotFilter,
  OrFilter,
  PresenceFilter,
  SubstringFilter,
} from 'ldapts';
import {
  DIRECTORY_CONFORMANCE_DATASET,
  type InMemoryDirectoryGroup,
  type InMemoryDirectoryUser,
} from '@netscript/plugin-directory-core/testing';
import {
  encodeAdAccountExpires,
  encodeAdObjectGuid,
  LDAP_CAP_ACTIVE_DIRECTORY_OID,
  LDAP_MATCHING_RULE_IN_CHAIN_OID,
} from '../src/domain/mod.ts';
import type {
  LdapBoundedSearchParams,
  LdapClientConnectOptions,
  LdapClientFactory,
  LdapClientPort,
  LdapRawEntry,
  LdapSearchParams,
  LdapSearchResult,
  LdapTransportTlsOptions,
} from '../src/ports/mod.ts';

export type FakeLdapHostBehavior = Readonly<{
  connectError?: Error;
  startTlsError?: Error;
  bindError?: Error;
  searchError?: Error;
  delayMs?: number;
  rootDseCapabilities?: readonly string[];
}>;

export type FakeLdapCallRecord = Readonly<{
  url: string;
  connectOptions: LdapClientConnectOptions;
  startTlsOptions?: LdapTransportTlsOptions;
  events: string[];
  searches: LdapSearchParams[];
  pagesRequested: number;
  wireEntriesDelivered: number;
  unbound: boolean;
}>;

export interface FakeLdapServerOptions {
  readonly baseDn?: string;
  readonly validBaseDns?: readonly string[];
  readonly expectedBindDn?: string;
  readonly expectedBindPassword?: string;
  readonly entries: readonly LdapRawEntry[];
  readonly hostBehaviors?: Readonly<Record<string, FakeLdapHostBehavior>>;
}

function makeBinarySid(rid: number): Uint8Array {
  // S-1-5-21-1111-2222-3333-<rid>
  const bytes = new Uint8Array(28);
  bytes[0] = 1; // revision
  bytes[1] = 5; // subAuthorityCount
  bytes[7] = 5; // SECURITY_NT_AUTHORITY
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 21, true);
  view.setUint32(12, 1111, true);
  view.setUint32(16, 2222, true);
  view.setUint32(20, 3333, true);
  view.setUint32(24, rid >>> 0, true);
  return bytes;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getAttrValues(
  entry: LdapRawEntry,
  attrName: string,
): readonly (string | Uint8Array)[] {
  const lower = attrName.toLowerCase();
  for (const [k, v] of Object.entries(entry)) {
    if (k.toLowerCase() === lower && v !== undefined) {
      if (typeof v === 'string' || v instanceof Uint8Array) {
        return [v];
      }
      if (Array.isArray(v)) {
        return v;
      }
    }
  }
  return [];
}

function isMemberInChain(
  groupEntry: LdapRawEntry,
  targetDnLower: string,
  entriesByDn: ReadonlyMap<string, LdapRawEntry>,
  memberAttr: string,
  visited = new Set<string>(),
): boolean {
  const groupDnLower = groupEntry.dn.toLowerCase();
  if (visited.has(groupDnLower)) {
    return false;
  }
  visited.add(groupDnLower);

  const directMembers = getAttrValues(groupEntry, memberAttr);
  for (const raw of directMembers) {
    if (typeof raw !== 'string') continue;
    const memberDnLower = raw.toLowerCase();
    if (memberDnLower === targetDnLower) {
      return true;
    }
    const nested = entriesByDn.get(memberDnLower);
    if (nested && isMemberInChain(nested, targetDnLower, entriesByDn, memberAttr, visited)) {
      return true;
    }
  }
  return false;
}

function evaluateFilter(
  filter: Filter,
  entry: LdapRawEntry,
  entriesByDn: ReadonlyMap<string, LdapRawEntry>,
): boolean {
  if (filter instanceof AndFilter) {
    return filter.filters.every((child) => evaluateFilter(child, entry, entriesByDn));
  }
  if (filter instanceof OrFilter) {
    return filter.filters.some((child) => evaluateFilter(child, entry, entriesByDn));
  }
  if (filter instanceof NotFilter) {
    return !evaluateFilter(filter.filter, entry, entriesByDn);
  }
  if (filter instanceof PresenceFilter) {
    return getAttrValues(entry, filter.attribute).length > 0;
  }
  if (filter instanceof EqualityFilter) {
    const values = getAttrValues(entry, filter.attribute);
    if (Buffer.isBuffer(filter.value)) {
      const expected = new Uint8Array(filter.value);
      return values.some((val) => val instanceof Uint8Array && bytesEqual(val, expected));
    }
    const expectedLower = String(filter.value).toLowerCase();
    return values.some((val) => typeof val === 'string' && val.toLowerCase() === expectedLower);
  }
  if (filter instanceof SubstringFilter) {
    const values = getAttrValues(entry, filter.attribute);
    return values.some((val) => {
      if (typeof val !== 'string') return false;
      const haystack = val.toLowerCase();
      let cursor = 0;
      if (filter.initial) {
        const init = filter.initial.toLowerCase();
        if (!haystack.startsWith(init)) return false;
        cursor = init.length;
      }
      for (const piece of filter.any) {
        const needle = piece.toLowerCase();
        const found = haystack.indexOf(needle, cursor);
        if (found < 0) return false;
        cursor = found + needle.length;
      }
      if (filter.final) {
        const fin = filter.final.toLowerCase();
        return haystack.slice(cursor).endsWith(fin);
      }
      return true;
    });
  }
  if (filter instanceof ExtensibleFilter) {
    if (filter.rule !== LDAP_MATCHING_RULE_IN_CHAIN_OID) {
      return false;
    }
    const targetDn = typeof filter.value === 'string'
      ? filter.value.toLowerCase()
      : new TextDecoder().decode(filter.value).toLowerCase();
    return isMemberInChain(entry, targetDn, entriesByDn, filter.matchType);
  }
  throw new Error(`Unsupported filter AST node in FakeLdapServer: ${filter.constructor.name}`);
}

function projectEntry(entry: LdapRawEntry, params: LdapSearchParams): LdapRawEntry {
  const out: Record<string, string | readonly string[] | Uint8Array | readonly Uint8Array[]> = {
    dn: entry.dn,
  };
  const explicitBuf = new Set((params.explicitBufferAttributes ?? []).map((a) => a.toLowerCase()));
  for (const attr of params.attributes) {
    const values = getAttrValues(entry, attr);
    if (values.length === 0) continue;
    const isBinary = explicitBuf.has(attr.toLowerCase()) ||
      values.some((v) => v instanceof Uint8Array);
    if (isBinary) {
      const buffers = values.map((v) => v instanceof Uint8Array ? Buffer.from(v) : Buffer.from(v));
      out[attr] = buffers.length === 1 ? buffers[0]! : buffers;
    } else {
      const strs = values.map((v) => String(v));
      out[attr] = strs.length === 1 ? strs[0]! : strs;
    }
  }
  return out as LdapRawEntry;
}

function deriveContainerDns(baseDn: string, entries: readonly LdapRawEntry[]): Set<string> {
  const containers = new Set<string>([baseDn.toLowerCase()]);
  for (const entry of entries) {
    const parts = entry.dn.split(',');
    for (let i = 0; i < parts.length; i++) {
      const suffix = parts.slice(i).join(',').trim().toLowerCase();
      if (suffix.length > 0) containers.add(suffix);
    }
  }
  return containers;
}

export class FakeLdapServer {
  readonly baseDn: string;
  readonly calls: FakeLdapCallRecord[] = [];
  readonly #entries: readonly LdapRawEntry[];
  readonly #entriesByDn: Map<string, LdapRawEntry>;
  readonly #validBaseDns: Set<string>;
  readonly #expectedBindDn: string;
  readonly #expectedBindPassword: string;
  readonly #hostBehaviors: Readonly<Record<string, FakeLdapHostBehavior>>;

  constructor(options: FakeLdapServerOptions) {
    this.baseDn = options.baseDn ?? 'DC=example,DC=test';
    this.#entries = options.entries;
    this.#entriesByDn = new Map(options.entries.map((entry) => [entry.dn.toLowerCase(), entry]));
    this.#validBaseDns = options.validBaseDns
      ? new Set(options.validBaseDns.map((dn) => dn.toLowerCase()))
      : deriveContainerDns(this.baseDn, options.entries);
    this.#expectedBindDn = options.expectedBindDn ??
      'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test';
    this.#expectedBindPassword = options.expectedBindPassword ?? 'test-bind-password-only';
    this.#hostBehaviors = options.hostBehaviors ?? {};
  }

  #assertBaseExists(baseDn: string): void {
    const baseLower = baseDn.toLowerCase();
    if (baseLower.length > 0 && !this.#validBaseDns.has(baseLower)) {
      throw new NoSuchObjectError(`No such object: ${baseDn}`);
    }
  }

  #collectMatches(baseDn: string, params: LdapSearchParams): LdapRawEntry[] {
    if (!(params.filter instanceof Filter)) {
      throw new TypeError('LDAP filter must be a genuine ldapts Filter AST instance.');
    }
    this.#assertBaseExists(baseDn);
    const baseLower = baseDn.toLowerCase();
    const matched: LdapRawEntry[] = [];
    for (const entry of this.#entries) {
      if (baseLower.length > 0 && !entry.dn.toLowerCase().endsWith(baseLower)) {
        continue;
      }
      if (evaluateFilter(params.filter, entry, this.#entriesByDn)) {
        matched.push(projectEntry(entry, params));
      }
    }
    return matched;
  }

  createClientFactory(): LdapClientFactory {
    return (connectOptions: LdapClientConnectOptions): LdapClientPort => {
      const behavior = this.#hostBehaviors[connectOptions.url] ?? {};
      const record: {
        url: string;
        connectOptions: LdapClientConnectOptions;
        startTlsOptions?: LdapTransportTlsOptions;
        events: string[];
        searches: LdapSearchParams[];
        pagesRequested: number;
        wireEntriesDelivered: number;
        unbound: boolean;
      } = {
        url: connectOptions.url,
        connectOptions,
        events: ['connect'],
        searches: [],
        pagesRequested: 0,
        wireEntriesDelivered: 0,
        unbound: false,
      };
      this.calls.push(record);

      let activeTimer: ReturnType<typeof setTimeout> | undefined;
      let cancelDelay: (() => void) | undefined;

      const waitDelay = async (): Promise<void> => {
        if (!behavior.delayMs || behavior.delayMs <= 0) {
          return;
        }
        await new Promise<void>((resolve) => {
          cancelDelay = () => {
            if (activeTimer !== undefined) {
              clearTimeout(activeTimer);
              activeTimer = undefined;
            }
            resolve();
          };
          activeTimer = setTimeout(() => {
            activeTimer = undefined;
            cancelDelay = undefined;
            resolve();
          }, behavior.delayMs);
        });
      };

      const assertConnected = (): void => {
        if (behavior.connectError) {
          throw behavior.connectError;
        }
      };

      return {
        startTLS: async (tlsOptions: LdapTransportTlsOptions): Promise<void> => {
          assertConnected();
          record.events.push('startTLS');
          record.startTlsOptions = tlsOptions;
          await waitDelay();
          if (behavior.startTlsError) {
            throw behavior.startTlsError;
          }
        },
        bind: async (dn: string, password: string): Promise<void> => {
          assertConnected();
          record.events.push('bind');
          await waitDelay();
          if (behavior.bindError) {
            throw behavior.bindError;
          }
          if (dn !== this.#expectedBindDn || password !== this.#expectedBindPassword) {
            throw new InvalidCredentialsError(`Invalid bind credentials for ${dn}`);
          }
        },
        search: async (baseDn: string, params: LdapSearchParams): Promise<LdapSearchResult> => {
          assertConnected();
          record.events.push('search');
          record.searches.push(params);
          await waitDelay();
          if (behavior.searchError) {
            throw behavior.searchError;
          }
          if (!(params.filter instanceof Filter)) {
            throw new TypeError('LDAP filter must be a genuine ldapts Filter AST instance.');
          }
          if (params.scope === 'base' && baseDn === '') {
            return {
              searchEntries: [
                {
                  dn: '',
                  supportedCapabilities: behavior.rootDseCapabilities ??
                    [LDAP_CAP_ACTIVE_DIRECTORY_OID],
                },
              ],
            };
          }
          if (params.scope === 'base') {
            this.#assertBaseExists(baseDn);
            return { searchEntries: [{ dn: baseDn, distinguishedName: baseDn }] };
          }
          const allMatches = this.#collectMatches(baseDn, params);
          // Emulate real AD/Samba: paged client.search pulls every page ignoring sizeLimit.
          const delivered = params.paged !== undefined
            ? allMatches
            : params.sizeLimit > 0
            ? allMatches.slice(0, params.sizeLimit)
            : allMatches;
          const pageSize = params.paged?.pageSize ?? Math.max(1, delivered.length);
          record.pagesRequested += Math.max(1, Math.ceil(delivered.length / pageSize));
          record.wireEntriesDelivered += delivered.length;
          return { searchEntries: delivered };
        },
        searchBounded: async (
          baseDn: string,
          params: LdapBoundedSearchParams,
        ): Promise<LdapSearchResult> => {
          assertConnected();
          record.events.push('searchBounded');
          record.searches.push(params);
          await waitDelay();
          if (behavior.searchError) {
            throw behavior.searchError;
          }
          if (!Number.isInteger(params.maxEntries) || params.maxEntries < 1) {
            throw new RangeError('maxEntries must be a positive integer.');
          }
          const allMatches = this.#collectMatches(baseDn, params);
          const pageSize = Math.max(
            1,
            Math.min(params.paged?.pageSize ?? params.maxEntries, params.maxEntries),
          );
          const collected: LdapRawEntry[] = [];
          for (let offset = 0; offset < allMatches.length || offset === 0; offset += pageSize) {
            const page = allMatches.slice(offset, offset + pageSize);
            record.pagesRequested += 1;
            record.wireEntriesDelivered += page.length;
            for (const entry of page) {
              collected.push(entry);
              if (collected.length >= params.maxEntries) {
                return { searchEntries: collected };
              }
            }
            if (offset + pageSize >= allMatches.length) {
              break;
            }
          }
          return { searchEntries: collected };
        },
        unbind: (): Promise<void> => {
          record.events.push('unbind');
          record.unbound = true;
          cancelDelay?.();
          return Promise.resolve();
        },
      };
    };
  }
}

/**
 * Builds AD-shaped LDAP entries from `DIRECTORY_CONFORMANCE_DATASET` (including `Domain Users`
 * under `CN=Users`, a computer object, and a `krbtgt` built-in account to verify exclusions).
 */
export function buildConformanceLdapEntries(
  users: readonly InMemoryDirectoryUser[] = DIRECTORY_CONFORMANCE_DATASET.users,
  groups: readonly InMemoryDirectoryGroup[] = DIRECTORY_CONFORMANCE_DATASET.groups,
  baseDn = 'DC=example,DC=test',
): LdapRawEntry[] {
  const groupDnById = new Map<string, string>();
  const groupRidById = new Map<string, number>();

  groups.forEach((group, idx) => {
    const isDomainUsers = group.immutableId === DIRECTORY_CONFORMANCE_DATASET.groupIds.domainUsers;
    const rid = isDomainUsers ? 513 : 2000 + idx;
    groupRidById.set(group.immutableId, rid);
    const container = isDomainUsers ? `CN=Users,${baseDn}` : `OU=Groups,${baseDn}`;
    groupDnById.set(group.immutableId, `CN=${group.displayName},${container}`);
  });

  const userDnById = new Map<string, string>();
  users.forEach((user) => {
    const cn = user.username ?? user.immutableId;
    userDnById.set(user.immutableId, `CN=${cn},OU=Users,${baseDn}`);
  });

  const entries: LdapRawEntry[] = [];

  users.forEach((user, idx) => {
    const dn = userDnById.get(user.immutableId)!;
    const primaryGroupRid = user.primaryGroupId !== undefined
      ? groupRidById.get(user.primaryGroupId)
      : undefined;
    entries.push({
      dn,
      objectClass: ['top', 'person', 'organizationalPerson', 'user'],
      objectGUID: encodeAdObjectGuid(user.immutableId),
      objectSid: makeBinarySid(1100 + idx),
      userAccountControl: user.enabled ? '512' : '514',
      accountExpires: user.expiresAt !== undefined
        ? encodeAdAccountExpires(user.expiresAt)
        : '9223372036854775807',
      ...(primaryGroupRid !== undefined ? { primaryGroupID: String(primaryGroupRid) } : {}),
      ...(user.displayName !== undefined ? { displayName: user.displayName } : {}),
      ...(user.userPrincipalName !== undefined
        ? { userPrincipalName: user.userPrincipalName }
        : {}),
      ...(user.mail !== undefined ? { mail: user.mail } : {}),
      ...(user.username !== undefined ? { sAMAccountName: user.username } : {}),
    });
  });

  // AD computer object (objectClass includes `user` AND `computer`) — excluded from user searches.
  entries.push({
    dn: `CN=WORKSTATION-01,OU=Computers,${baseDn}`,
    objectClass: ['top', 'person', 'organizationalPerson', 'user', 'computer'],
    objectGUID: encodeAdObjectGuid('30000000-0000-4000-8000-000000000099'),
    objectSid: makeBinarySid(9999),
    userAccountControl: '4096',
    displayName: 'Alice Example Computer',
    sAMAccountName: 'WORKSTATION-01$',
  });

  // AD built-in krbtgt service account — excluded from user searches.
  entries.push({
    dn: `CN=krbtgt,CN=Users,${baseDn}`,
    objectClass: ['top', 'person', 'organizationalPerson', 'user'],
    objectGUID: encodeAdObjectGuid('30000000-0000-4000-8000-000000000098'),
    objectSid: makeBinarySid(502),
    userAccountControl: '514',
    displayName: 'krbtgt',
    sAMAccountName: 'krbtgt',
  });

  groups.forEach((group) => {
    const dn = groupDnById.get(group.immutableId)!;
    const rid = groupRidById.get(group.immutableId)!;
    const memberDns: string[] = [];
    for (const userId of group.memberUserIds ?? []) {
      const memberDn = userDnById.get(userId);
      if (memberDn) memberDns.push(memberDn);
    }
    for (const childGroupId of group.memberGroupIds ?? []) {
      const childDn = groupDnById.get(childGroupId);
      if (childDn) memberDns.push(childDn);
    }
    entries.push({
      dn,
      objectClass: ['top', 'group'],
      objectGUID: encodeAdObjectGuid(group.immutableId),
      objectSid: makeBinarySid(rid),
      cn: group.displayName,
      displayName: group.displayName,
      ...(group.description !== undefined ? { description: group.description } : {}),
      ...(group.mail !== undefined ? { mail: group.mail } : {}),
      ...(memberDns.length > 0 ? { member: memberDns } : {}),
    });
  });

  return entries;
}
