/**
 * Optional containerised Samba AD / LDAP integration test.
 *
 * Skipped in default `deno task test` runs (zero network I/O) unless
 * `NETSCRIPT_LDAP_INTEGRATION_URL` is configured.
 *
 * Example:
 * ```bash
 * NETSCRIPT_LDAP_INTEGRATION_URL=ldaps://127.0.0.1:6360 \
 * NETSCRIPT_LDAP_INTEGRATION_BASE_DN=DC=example,DC=test \
 * NETSCRIPT_LDAP_INTEGRATION_BIND_DN=CN=Administrator,CN=Users,DC=example,DC=test \
 * NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE=/tmp/samba-bind-password \
 * NETSCRIPT_LDAP_INTEGRATION_CA_FILE=/tmp/samba-ca.pem \
 * deno test --allow-read --allow-env --allow-net packages/directory-ldap/tests/samba_integration_test.ts
 * ```
 */

import { assert, assertEquals } from '@std/assert';
import { createLdapDirectoryPort } from '../mod.ts';

const integrationUrl = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_URL');

Deno.test({
  name: 'optional live Samba AD / LDAP integration smoke',
  ignore: !integrationUrl,
  fn: async () => {
    const baseDn = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BASE_DN') ?? 'DC=example,DC=test';
    const bindDn = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BIND_DN') ??
      `CN=Administrator,CN=Users,${baseDn}`;
    const bindPasswordFile = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE');
    const caFile = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_CA_FILE');
    const tlsMode = Deno.env.get('NETSCRIPT_LDAP_INTEGRATION_TLS_MODE') as
      | 'ldaps'
      | 'starttls'
      | undefined;

    assert(
      bindPasswordFile,
      'NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE must point to a secret file when running integration tests.',
    );

    const port = await createLdapDirectoryPort({
      directoryInstance: 'samba-integration',
      urls: [integrationUrl!],
      baseDn,
      bindDn,
      bindPasswordFile,
      tls: {
        ...(tlsMode ? { mode: tlsMode } : {}),
        ...(caFile ? { caFile } : {}),
      },
    });

    const health = await port.health({ timeoutMs: 5_000 });
    assertEquals(health.status, 'healthy');
    assertEquals(health.reachableHosts, 1);
    assertEquals(health.totalHosts, 1);

    const groups = await port.searchGroups({ text: 'Domain', limit: 10 }, { timeoutMs: 5_000 });
    assert(groups.items.length >= 1, 'Expected at least one matching group from Samba AD');
    assert(groups.evaluatedAt.includes('T'));
  },
});
