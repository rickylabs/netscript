/**
 * Optional containerised Samba AD integration suite.
 *
 * Skipped in default `deno task test` runs (zero network I/O) unless
 * `NETSCRIPT_LDAP_INTEGRATION_URL` is configured. See `tests/fixtures/samba-ad/README.md` for
 * the throwaway Alpine `samba-dc` fixture recipe.
 */

import { assert, assertEquals } from '@std/assert';
import { createLdapDirectoryPort } from '../mod.ts';

const integrationUrl = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_URL');

Deno.test({
  name:
    'optional live Samba AD integration: health, bounded paging, ambiguity, membership, and hung-host failover',
  ignore: !integrationUrl,
  fn: async () => {
    const baseDn = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BASE_DN') ?? 'DC=example,DC=test';
    const bindDn = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BIND_DN') ??
      `CN=svc-dir,CN=Users,${baseDn}`;
    const bindPasswordFile = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE');
    const caFile = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_CA_FILE');
    const servername = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_SERVERNAME');
    const tlsMode = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_TLS_MODE') as
      | 'ldaps'
      | 'starttls'
      | undefined;

    assert(
      bindPasswordFile,
      'NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE must point to a secret file when running integration tests.',
    );

    const tls = {
      ...(tlsMode ? { mode: tlsMode } : {}),
      ...(caFile ? { caFile } : {}),
      ...(servername ? { servername } : {}),
    };

    const port = await createLdapDirectoryPort({
      directoryInstance: 'samba-integration',
      urls: [integrationUrl!],
      baseDn,
      bindDn,
      bindPasswordFile,
      tls,
      pageSize: 50,
    });

    // 1. Health (RootDSE + configured base DN probe).
    const health = await port.health({ timeoutMs: 5_000 });
    assertEquals(health.status, 'healthy');
    assertEquals(health.reachableHosts, 1);
    assertEquals(health.totalHosts, 1);

    // 2. Bounded paged search over 320+ bulk users stops on page 1 instead of pulling all entries.
    const bulkPage = await port.searchUsers({ text: 'Bulk Staff', limit: 5 }, { timeoutMs: 5_000 });
    assertEquals(bulkPage.items.length, 5);
    assertEquals(bulkPage.truncated, true);

    // 3. Exact-fit search reports truncated: false.
    const exactFinance = await port.searchGroups(
      { text: 'Finance', limit: 1 },
      { timeoutMs: 5_000 },
    );
    assertEquals(exactFinance.items.length, 1);
    assertEquals(exactFinance.truncated, false);

    // 4. Ambiguous secondary mail lookup (alice + adm-alice) fails closed to undefined.
    const ambiguous = await port.getUser(
      { directoryInstance: 'samba-integration', mail: 'alice@example.test' },
      { timeoutMs: 5_000 },
    );
    assertEquals(ambiguous, undefined);

    // 5. Hostile lookup & search payloads never inject filters.
    const hostileLookup = await port.getUser(
      { directoryInstance: 'samba-integration', username: '*)(|(objectClass=*)' },
      { timeoutMs: 5_000 },
    );
    assertEquals(hostileLookup, undefined);

    // 6. Transitive, cyclic, and direct + nested primary-group membership + disabled/expired fail-closed.
    const alice = await port.getUser(
      { directoryInstance: 'samba-integration', username: 'alice' },
      { timeoutMs: 5_000 },
    );
    const bob = await port.getUser(
      { directoryInstance: 'samba-integration', username: 'bob' },
      { timeoutMs: 5_000 },
    );
    const carol = await port.getUser(
      { directoryInstance: 'samba-integration', username: 'carol' },
      { timeoutMs: 5_000 },
    );
    assert(alice !== undefined && alice.enabled);
    assert(bob !== undefined && !bob.enabled);
    assert(carol !== undefined && carol.enabled);

    const findGroupId = async (name: string): Promise<string> => {
      const res = await port.searchGroups({ text: name, limit: 10 }, { timeoutMs: 5_000 });
      const found = res.items.find((g) => g.displayName.toLowerCase() === name.toLowerCase());
      assert(found !== undefined, `Expected Samba group ${name}`);
      return found.immutableId;
    };

    const [domainUsersId, allStaffId, engParentId, cycleAId, financeId] = await Promise.all([
      findGroupId('Domain Users'),
      findGroupId('All Staff'),
      findGroupId('Eng Parent'),
      findGroupId('Cycle A'),
      findGroupId('Finance'),
    ]);

    const aliceMemberships = await port.memberOfAny(
      {
        user: alice.ref,
        candidateGroupIds: [domainUsersId, allStaffId, engParentId, cycleAId, financeId],
      },
      { timeoutMs: 5_000 },
    );
    assertEquals(
      [...aliceMemberships.memberOf].sort(),
      [allStaffId, cycleAId, domainUsersId, engParentId].sort(),
    );

    const bobMemberships = await port.memberOfAny(
      { user: bob.ref, candidateGroupIds: [domainUsersId, engParentId, financeId] },
      { timeoutMs: 5_000 },
    );
    assertEquals(bobMemberships.memberOf, []);

    const carolMemberships = await port.memberOfAny(
      { user: carol.ref, candidateGroupIds: [domainUsersId, engParentId, financeId] },
      { timeoutMs: 5_000 },
    );
    assertEquals(carolMemberships.memberOf, []);

    // 7. Hung TCP host failover: blackhole socket accepts TCP and never answers -> slices budget to Samba DC.
    const blackhole = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const accepted: Deno.Conn[] = [];
    const acceptLoop = (async () => {
      try {
        for await (const conn of blackhole) {
          accepted.push(conn);
        }
      } catch {
        // Listener closed during cleanup.
      }
    })();

    try {
      const blackholePort = (blackhole.addr as Deno.NetAddr).port;
      const scheme = integrationUrl!.startsWith('ldap://') ? 'ldap' : 'ldaps';
      const failoverPort = await createLdapDirectoryPort({
        directoryInstance: 'samba-integration',
        urls: [`${scheme}://127.0.0.1:${blackholePort}`, integrationUrl!],
        baseDn,
        bindDn,
        bindPasswordFile,
        tls,
      });
      const resolved = await failoverPort.getUser(
        { directoryInstance: 'samba-integration', username: 'alice' },
        { timeoutMs: 2_000 },
      );
      assertEquals(resolved?.immutableId, alice.immutableId);
    } finally {
      blackhole.close();
      for (const conn of accepted) {
        try {
          conn.close();
        } catch {
          // Ignore already closed socket.
        }
      }
      await acceptLoop;
    }
  },
});
