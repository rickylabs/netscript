/**
 * Redacted multi-host Active Directory / Samba AD health probe helper.
 *
 * Probes RootDSE (`supportedCapabilities`) and every unique configured search base DN
 * (`baseDn`, `usersBaseDn`, `groupsBaseDn`) with bounded base-scope searches, propagating
 * programming errors, caller aborts, and whole-call timeouts cleanly.
 *
 * @module
 */

import {
  assertDirectoryCallContext,
  type CallContext,
  classifyDirectoryAbortError,
  type DirectoryClock,
  type DirectoryHealth,
  type DirectoryHealthProbe,
  DirectoryTimeout,
} from '@netscript/plugin-directory-core';
import {
  isNonLdapProgramError,
  LDAP_CAP_ACTIVE_DIRECTORY_OID,
  mapLdapError,
  type ResolvedLdapConfig,
} from '../domain/mod.ts';
import type { LdapRawEntry } from '../ports/mod.ts';
import { buildHealthProbeFilter } from './ldap-filters.ts';
import type { LdapSessionRunner } from './ldap-session.ts';

function rootDseAdvertisesOid(entry: LdapRawEntry | undefined, oid: string): boolean {
  if (!entry) return false;
  for (const [key, val] of Object.entries(entry)) {
    if (key.toLowerCase() !== 'supportedcapabilities') continue;
    if (typeof val === 'string') return val === oid;
    if (Array.isArray(val)) {
      return val.some((item) => typeof item === 'string' && item === oid);
    }
  }
  return false;
}

/**
 * Executes redacted per-host bind, RootDSE, and configured base-DN health probes across all
 * configured directory controllers.
 */
export async function runLdapHealthCheck(
  config: ResolvedLdapConfig,
  session: LdapSessionRunner,
  clock: DirectoryClock,
  probeBaseDns: readonly string[],
  ctx: CallContext,
): Promise<DirectoryHealth> {
  const timeoutMs = assertDirectoryCallContext(
    config.name,
    'health',
    ctx,
    config.defaultTimeoutMs,
  )!;
  const deadlineWallMs = Date.now() + timeoutMs;
  const hostCount = config.hosts.length;
  const probes: DirectoryHealthProbe[] = [];
  let reachableHosts = 0;
  let timeoutFailures = 0;
  const transportLabel = config.tlsMode === 'insecure-plaintext-dev'
    ? 'plaintext dev bind'
    : 'TLS bind';

  for (let i = 0; i < hostCount; i++) {
    const host = config.hosts[i]!;
    const remainingMs = deadlineWallMs - Date.now();
    if (ctx.signal?.aborted) {
      throw classifyDirectoryAbortError(config.name, 'health', ctx.signal.reason, timeoutMs);
    }
    if (remainingMs <= 0) {
      throw new DirectoryTimeout(
        config.name,
        'health',
        'LDAP health check exceeded its timeout budget.',
        { timeoutMs },
      );
    }
    const hostsLeft = hostCount - i;
    const perHostBudgetMs = Math.max(1, Math.floor(remainingMs / hostsLeft));
    const startedWallMs = Date.now();

    try {
      const adDetected = await session.runOnHost(
        host,
        'health',
        perHostBudgetMs,
        ctx.signal,
        async (client, timeLimit) => {
          const rootRes = await client.search('', {
            scope: 'base',
            filter: buildHealthProbeFilter(),
            attributes: ['supportedCapabilities'],
            sizeLimit: 1,
            timeLimit,
          });
          for (const baseDn of probeBaseDns) {
            await client.search(baseDn, {
              scope: 'base',
              filter: buildHealthProbeFilter(),
              attributes: ['distinguishedName'],
              sizeLimit: 1,
              timeLimit,
            });
          }
          return rootDseAdvertisesOid(rootRes.searchEntries[0], LDAP_CAP_ACTIVE_DIRECTORY_OID);
        },
      );
      reachableHosts += 1;
      probes.push({
        name: host.probeName,
        status: 'pass',
        message: `Directory host answered ${transportLabel}, RootDSE, and base-DN probes.`,
        latencyMs: Math.max(0, Date.now() - startedWallMs),
      });
      if (config.supportsInChainMatching && !adDetected) {
        probes.push({
          name: `${host.probeName}-ad-capability`,
          status: 'warn',
          message:
            'RootDSE did not advertise Active Directory capability OID; transitive in-chain matching may be unavailable.',
        });
      }
    } catch (err) {
      if (isNonLdapProgramError(err)) {
        throw err;
      }
      if (ctx.signal?.aborted) {
        throw classifyDirectoryAbortError(config.name, 'health', ctx.signal.reason, timeoutMs);
      }
      const mapped = mapLdapError(err, config.name, 'health', perHostBudgetMs);
      if (mapped instanceof DirectoryTimeout) {
        timeoutFailures += 1;
      }
      probes.push({
        name: host.probeName,
        status: 'fail',
        message: mapped.reason,
        latencyMs: Math.max(0, Date.now() - startedWallMs),
      });
    }
  }

  if (timeoutFailures === hostCount) {
    throw new DirectoryTimeout(
      config.name,
      'health',
      'All configured LDAP hosts timed out during health check.',
      { timeoutMs },
    );
  }

  const status = reachableHosts === hostCount
    ? 'healthy'
    : reachableHosts > 0
    ? 'degraded'
    : 'unhealthy';

  return {
    status,
    checkedAt: clock.nowIso(),
    reachableHosts,
    totalHosts: hostCount,
    probes,
  };
}
