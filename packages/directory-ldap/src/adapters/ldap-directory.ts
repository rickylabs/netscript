/**
 * Active Directory and Samba AD implementation of NetScript's `DirectoryPort`.
 *
 * @module
 */

import {
  assertDirectoryCallContext,
  type CallContext,
  createSystemDirectoryClock,
  type DirectoryCapability,
  type DirectoryClock,
  type DirectoryGroup,
  type DirectoryHealth,
  type DirectoryPort,
  type DirectoryUser,
  isDirectoryUserActive,
  type MemberOfAnyQuery,
  type MemberOfAnyResult,
  normalizeDirectorySearchLimit,
  type Page,
  type SearchGroupsQuery,
  type SearchUsersQuery,
  type UserLookup,
} from '@netscript/plugin-directory-core';
import {
  derivePrimaryGroupSid,
  type LdapStaticConfigOptions,
  type ResolvedLdapConfig,
  resolveLdapConfig,
  tryEncodeAdObjectGuid,
} from '../domain/mod.ts';
import type { LdapClientFactory } from '../ports/mod.ts';
import { mapLdapGroupEntry, mapLdapUserEntry, readEntryImmutableId } from './ldap-entry-mapper.ts';
import {
  buildBoundedMembershipFilter,
  buildGroupSearchFilter,
  buildPrimaryGroupBySidFilter,
  buildUserLookupFilter,
  buildUserSearchFilter,
} from './ldap-filters.ts';
import { runLdapHealthCheck } from './ldap-health.ts';
import {
  createLdapSessionRunner,
  readCaFileAtStartup,
  readSecretFileAtStartup,
} from './ldap-session.ts';
import { defaultLdapClientFactory } from './ldapts-client.ts';

/**
 * Options accepted by {@link createLdapDirectoryPort}.
 *
 * Targets Active Directory and Samba AD over strict TLS (`rejectUnauthorized: true`), reading
 * bind credentials strictly from `bindPasswordFile` (`*_FILE`) once at startup.
 */
export type LdapDirectoryOptions =
  & LdapStaticConfigOptions
  & Readonly<{
    /** Optional injectable LDAP client factory (defaults to `npm:ldapts`). */
    clientFactory?: LdapClientFactory;
    /** Optional injectable clock for deterministic tests (defaults to system UTC clock). */
    clock?: DirectoryClock;
  }>;

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/**
 * Creates a configured Active Directory / Samba AD {@link DirectoryPort}.
 *
 * Reads `bindPasswordFile` (and optional PEM-validated `tls.caFile`) once at startup, validates
 * strict TLS settings (refusing plaintext `ldap://` unless `tls.allowInsecurePlaintextDev` is
 * explicitly `true`), and returns an immutable {@link DirectoryPort} ready for bounded queries.
 *
 * @param options - LDAP hosts, base DNs, `bindPasswordFile`, strict TLS config, and optional seams.
 * @returns Configured {@link DirectoryPort} instance.
 *
 * @example
 * ```ts
 * import { createLdapDirectoryPort } from '@netscript/directory-ldap';
 *
 * const createAdapter = () =>
 *   createLdapDirectoryPort({
 *     directoryInstance: 'corp-example',
 *     urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
 *     baseDn: 'DC=example,DC=test',
 *     bindDn: 'CN=svc-directory,OU=ServiceAccounts,DC=example,DC=test',
 *     bindPasswordFile: '/run/secrets/ldap_bind_password',
 *     tls: { caFile: '/etc/ssl/certs/corp-root-ca.pem' },
 *   });
 * console.log(typeof createAdapter);
 * ```
 */
export async function createLdapDirectoryPort(
  options: LdapDirectoryOptions,
): Promise<DirectoryPort> {
  const config: ResolvedLdapConfig = resolveLdapConfig(options);
  const bindPassword = await readSecretFileAtStartup(config.bindPasswordFile);
  const caPem = config.caFile !== undefined ? await readCaFileAtStartup(config.caFile) : undefined;
  const clientFactory = options.clientFactory ?? defaultLdapClientFactory;
  const clock: DirectoryClock = options.clock ?? createSystemDirectoryClock();
  const session = createLdapSessionRunner(config, bindPassword, caPem, clientFactory);

  const capabilities = new Set<DirectoryCapability>(['search']);
  if (config.supportsInChainMatching) {
    capabilities.add('transitive-membership');
  }

  const userAttributes = uniqueStrings([
    config.attributes.immutableId,
    config.attributes.userAccountControl,
    config.attributes.accountExpires,
    config.attributes.displayName,
    config.attributes.userPrincipalName,
    config.attributes.mail,
    config.attributes.username,
    config.attributes.primaryGroupId,
    config.attributes.objectSid,
  ]);
  const userBinaryAttributes = uniqueStrings([
    config.attributes.immutableId,
    config.attributes.objectSid,
  ]);
  const groupAttributes = uniqueStrings([
    config.attributes.immutableId,
    config.attributes.groupDisplayName,
    config.attributes.displayName,
    config.attributes.groupDescription,
    config.attributes.mail,
  ]);
  const groupBinaryAttributes = [config.attributes.immutableId];
  const probeBaseDns = uniqueStrings([config.baseDn, config.usersBaseDn, config.groupsBaseDn]);

  return {
    name: config.name,
    capabilities,

    async searchUsers(q: SearchUsersQuery, ctx: CallContext): Promise<Page<DirectoryUser>> {
      const appliedLimit = normalizeDirectorySearchLimit(q.limit, config.maxSearchLimit);
      assertDirectoryCallContext(config.name, 'searchUsers', ctx, config.defaultTimeoutMs);

      const term = q.text.trim();
      if (term.length === 0) {
        return { items: [], truncated: false, evaluatedAt: clock.nowIso() };
      }

      const filter = buildUserSearchFilter(term, config.attributes);
      const requestSize = appliedLimit + 1;

      const entries = await session.withFailover('searchUsers', ctx, async (client, timeLimit) => {
        const res = await client.searchBounded(config.usersBaseDn, {
          scope: 'sub',
          filter,
          attributes: userAttributes,
          explicitBufferAttributes: userBinaryAttributes,
          sizeLimit: 0,
          maxEntries: requestSize,
          timeLimit,
          paged: { pageSize: Math.min(config.pageSize, requestSize) },
        });
        return res.searchEntries;
      });

      const mapped: DirectoryUser[] = [];
      for (const entry of entries) {
        const record = mapLdapUserEntry(entry, config.directoryInstance, config.attributes);
        if (record) {
          mapped.push(record.user);
        }
      }
      const truncated = entries.length > appliedLimit || mapped.length > appliedLimit;
      return {
        items: mapped.length > appliedLimit ? mapped.slice(0, appliedLimit) : mapped,
        truncated,
        evaluatedAt: clock.nowIso(),
      };
    },

    async searchGroups(q: SearchGroupsQuery, ctx: CallContext): Promise<Page<DirectoryGroup>> {
      const appliedLimit = normalizeDirectorySearchLimit(q.limit, config.maxSearchLimit);
      assertDirectoryCallContext(config.name, 'searchGroups', ctx, config.defaultTimeoutMs);

      const term = q.text.trim();
      if (term.length === 0) {
        return { items: [], truncated: false, evaluatedAt: clock.nowIso() };
      }

      const filter = buildGroupSearchFilter(term, config.attributes);
      const requestSize = appliedLimit + 1;

      const entries = await session.withFailover('searchGroups', ctx, async (client, timeLimit) => {
        const res = await client.searchBounded(config.groupsBaseDn, {
          scope: 'sub',
          filter,
          attributes: groupAttributes,
          explicitBufferAttributes: groupBinaryAttributes,
          sizeLimit: 0,
          maxEntries: requestSize,
          timeLimit,
          paged: { pageSize: Math.min(config.pageSize, requestSize) },
        });
        return res.searchEntries;
      });

      const mapped: DirectoryGroup[] = [];
      for (const entry of entries) {
        const record = mapLdapGroupEntry(entry, config.directoryInstance, config.attributes);
        if (record) {
          mapped.push(record.group);
        }
      }
      const truncated = entries.length > appliedLimit || mapped.length > appliedLimit;
      return {
        items: mapped.length > appliedLimit ? mapped.slice(0, appliedLimit) : mapped,
        truncated,
        evaluatedAt: clock.nowIso(),
      };
    },

    async getUser(ref: UserLookup, ctx: CallContext): Promise<DirectoryUser | undefined> {
      assertDirectoryCallContext(config.name, 'getUser', ctx, config.defaultTimeoutMs);

      if (ref.directoryInstance !== config.directoryInstance) {
        return undefined;
      }

      const filter = buildUserLookupFilter(ref, config.attributes);
      if (!filter) {
        return undefined;
      }

      // Request 2 entries for secondary attribute selectors so ambiguous matches fail closed.
      const isImmutableSelector = 'immutableId' in ref && ref.immutableId !== undefined;
      const maxEntries = isImmutableSelector ? 1 : 2;

      const entries = await session.withFailover('getUser', ctx, async (client, timeLimit) => {
        const res = await client.searchBounded(config.usersBaseDn, {
          scope: 'sub',
          filter,
          attributes: userAttributes,
          explicitBufferAttributes: userBinaryAttributes,
          sizeLimit: 0,
          maxEntries,
          timeLimit,
          paged: { pageSize: maxEntries },
        });
        return res.searchEntries;
      });

      if (entries.length !== 1) {
        return undefined;
      }
      return mapLdapUserEntry(entries[0]!, config.directoryInstance, config.attributes)?.user;
    },

    async memberOfAny(q: MemberOfAnyQuery, ctx: CallContext): Promise<MemberOfAnyResult> {
      assertDirectoryCallContext(config.name, 'memberOfAny', ctx, config.defaultTimeoutMs);

      const emptyResult = (): MemberOfAnyResult => ({
        memberOf: [],
        evaluatedAt: clock.nowIso(),
        consistency: { source: 'live', ageMs: 0 },
      });

      if (q.user.directoryInstance !== config.directoryInstance) {
        return emptyResult();
      }

      const uniqueCandidates = uniqueStrings(q.candidateGroupIds);
      if (uniqueCandidates.length === 0) {
        return emptyResult();
      }

      const userFilter = buildUserLookupFilter(q.user, config.attributes);
      if (!userFilter) {
        return emptyResult();
      }

      const validCandidates: Array<{ id: string; guidBytes: Uint8Array }> = [];
      const candidateCanonicalMap = new Map<string, string>();
      for (const candidateId of uniqueCandidates) {
        const guidBytes = tryEncodeAdObjectGuid(candidateId);
        if (guidBytes) {
          const normalized = candidateId.trim().toLowerCase();
          if (!candidateCanonicalMap.has(normalized)) {
            candidateCanonicalMap.set(normalized, candidateId);
            validCandidates.push({ id: candidateId, guidBytes });
          }
        }
      }
      if (validCandidates.length === 0) {
        return emptyResult();
      }

      const matchedNormalized = await session.withFailover(
        'memberOfAny',
        ctx,
        async (client, timeLimit) => {
          const userResult = await client.searchBounded(config.usersBaseDn, {
            scope: 'sub',
            filter: userFilter,
            attributes: userAttributes,
            explicitBufferAttributes: userBinaryAttributes,
            sizeLimit: 0,
            maxEntries: 1,
            timeLimit,
            paged: { pageSize: 1 },
          });
          const rawUser = userResult.searchEntries[0];
          if (!rawUser) {
            return new Set<string>();
          }
          const mappedUser = mapLdapUserEntry(rawUser, config.directoryInstance, config.attributes);
          if (!mappedUser || !isDirectoryUserActive(mappedUser.user, clock.nowMs())) {
            return new Set<string>();
          }

          const matches = new Set<string>();
          let primaryGroupDn: string | undefined;

          if (mappedUser.objectSid !== undefined && mappedUser.primaryGroupRid !== undefined) {
            const primaryGroupSid = derivePrimaryGroupSid(
              mappedUser.objectSid,
              mappedUser.primaryGroupRid,
            );
            if (primaryGroupSid) {
              // Resolve primary group by exact binary SID under baseDn so narrowed groupsBaseDn
              // cannot hide Domain Users or break groups nesting the primary group.
              const primaryRes = await client.searchBounded(config.baseDn, {
                scope: 'sub',
                filter: buildPrimaryGroupBySidFilter(primaryGroupSid, config.attributes),
                attributes: [config.attributes.immutableId],
                explicitBufferAttributes: groupBinaryAttributes,
                sizeLimit: 0,
                maxEntries: 1,
                timeLimit,
                paged: { pageSize: 1 },
              });
              const primaryEntry = primaryRes.searchEntries[0];
              if (primaryEntry) {
                primaryGroupDn = primaryEntry.dn;
                const primaryGuid = readEntryImmutableId(
                  primaryEntry,
                  config.attributes.immutableId,
                );
                if (primaryGuid && candidateCanonicalMap.has(primaryGuid)) {
                  matches.add(primaryGuid);
                }
              }
            }
          }

          const remaining = validCandidates.filter((item) =>
            !matches.has(item.id.trim().toLowerCase())
          );

          for (let i = 0; i < remaining.length; i += config.candidateBatchSize) {
            const batch = remaining.slice(i, i + config.candidateBatchSize);
            const filter = buildBoundedMembershipFilter({
              userDn: mappedUser.dn,
              primaryGroupDn,
              candidateGroupGuids: batch.map((item) => item.guidBytes),
              supportsInChainMatching: config.supportsInChainMatching,
              attributes: config.attributes,
            });
            const groupResult = await client.searchBounded(config.groupsBaseDn, {
              scope: 'sub',
              filter,
              attributes: [config.attributes.immutableId],
              explicitBufferAttributes: groupBinaryAttributes,
              sizeLimit: 0,
              maxEntries: batch.length,
              timeLimit,
              paged: { pageSize: Math.min(config.pageSize, batch.length) },
            });
            for (const entry of groupResult.searchEntries) {
              const guid = readEntryImmutableId(entry, config.attributes.immutableId);
              if (guid && candidateCanonicalMap.has(guid)) {
                matches.add(guid);
              }
            }
          }

          return matches;
        },
      );

      const memberOf: string[] = [];
      const emittedNormalized = new Set<string>();
      for (const candidateId of uniqueCandidates) {
        const normalized = candidateId.trim().toLowerCase();
        if (matchedNormalized.has(normalized) && !emittedNormalized.has(normalized)) {
          emittedNormalized.add(normalized);
          memberOf.push(candidateId);
        }
      }

      return {
        memberOf,
        evaluatedAt: clock.nowIso(),
        consistency: { source: 'live', ageMs: 0 },
      };
    },

    health(ctx: CallContext): Promise<DirectoryHealth> {
      return runLdapHealthCheck(config, session, clock, probeBaseDns, ctx);
    },
  };
}
