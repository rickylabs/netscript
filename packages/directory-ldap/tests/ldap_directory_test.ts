import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
} from '@netscript/plugin-directory-core';
import {
  createDeterministicClock,
  DIRECTORY_CONFORMANCE_DATASET,
} from '@netscript/plugin-directory-core/testing';
import { InappropriateMatchingError, InvalidCredentialsError, UnavailableError } from 'ldapts';
import { createLdapDirectoryPort, encodeAdObjectGuid } from '../mod.ts';
import { buildConformanceLdapEntries, FakeLdapServer } from './fake-ldap-client.ts';

const DS = DIRECTORY_CONFORMANCE_DATASET;

async function withSecretFiles(
  fn: (
    paths: { passwordFile: string; caFile: string; badCaFile: string; emptyFile: string },
  ) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'directory-ldap-test-' });
  const passwordFile = `${dir}/bind_password`;
  const caFile = `${dir}/ca.pem`;
  const badCaFile = `${dir}/not-a-pem.txt`;
  const emptyFile = `${dir}/empty`;
  await Deno.writeTextFile(passwordFile, 'test-bind-password-only\r\n');
  await Deno.writeTextFile(
    caFile,
    '-----BEGIN CERTIFICATE-----\nMIIBTESTCA\n-----END CERTIFICATE-----\n',
  );
  await Deno.writeTextFile(badCaFile, 'not a PEM certificate bundle\n');
  await Deno.writeTextFile(emptyFile, '\n');
  try {
    await fn({ passwordFile, caFile, badCaFile, emptyFile });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('LDAPS enforces rejectUnauthorized:true, PEM caFile validation, and clean unbind', async () => {
  await withSecretFiles(async ({ passwordFile, caFile, badCaFile, emptyFile }) => {
    await assertRejects(
      () =>
        createLdapDirectoryPort({
          directoryInstance: DS.directoryInstance,
          urls: ['ldaps://dc1.example.test:636'],
          baseDn: 'DC=example,DC=test',
          bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
          bindPasswordFile: emptyFile,
        }),
      RangeError,
      'non-empty secret',
    );

    await assertRejects(
      () =>
        createLdapDirectoryPort({
          directoryInstance: DS.directoryInstance,
          urls: ['ldaps://dc1.example.test:636'],
          baseDn: 'DC=example,DC=test',
          bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
          bindPasswordFile: passwordFile,
          tls: { caFile: badCaFile },
        }),
      RangeError,
      'PEM-encoded',
    );

    const server = new FakeLdapServer({ entries: buildConformanceLdapEntries() });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { caFile },
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const user = await port.getUser(
      { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
      {},
    );
    assertEquals(user?.userPrincipalName, 'alice@example.test');
    assertEquals(server.calls.length, 1);
    const call = server.calls[0]!;
    assertEquals(call.connectOptions.tlsOptions?.rejectUnauthorized, true);
    assertEquals(call.connectOptions.tlsOptions?.servername, 'dc1.example.test');
    assert(call.connectOptions.tlsOptions?.ca?.includes('MIIBTESTCA'));
    assertEquals(call.events, ['connect', 'bind', 'searchBounded', 'unbind']);
    assertEquals(call.unbound, true);
  });
});

Deno.test('searchUsers and searchGroups bound wire reads strictly to limit + 1 entries (1 page)', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const bulkUsers = Array.from({ length: 500 }, (_, i) => {
      const n = String(i + 1).padStart(4, '0');
      return {
        dn: `CN=bulk${n},OU=Bulk,DC=example,DC=test`,
        objectClass: ['top', 'person', 'organizationalPerson', 'user'],
        objectGUID: encodeAdObjectGuid(
          `40000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        ),
        userAccountControl: '512',
        displayName: `Bulk Staff ${n}`,
        userPrincipalName: `bulk${n}@example.test`,
        sAMAccountName: `bulk${n}`,
      };
    });
    const server = new FakeLdapServer({
      entries: [...buildConformanceLdapEntries(), ...bulkUsers],
    });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      pageSize: 100,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const page = await port.searchUsers({ text: 'Bulk Staff', limit: 5 }, {});
    assertEquals(page.items.length, 5);
    assertEquals(page.truncated, true);
    assertEquals(server.calls.length, 1);
    assertEquals(
      server.calls[0]!.wireEntriesDelivered,
      6,
      'Bounded search must never transfer more than limit + 1 entries over the wire',
    );
    assertEquals(server.calls[0]!.pagesRequested, 1);

    // Built-in krbtgt and AD computer accounts are excluded from user searches.
    const krbtgt = await port.searchUsers({ text: 'krbtgt', limit: 5 }, {});
    assertEquals(krbtgt.items, []);
    const comp = await port.searchUsers({ text: 'WORKSTATION', limit: 5 }, {});
    assertEquals(comp.items, []);
  });
});

Deno.test('StartTLS connects without tlsOptions and plaintext dev health message avoids claiming TLS', async () => {
  await withSecretFiles(async ({ passwordFile, caFile }) => {
    const server = new FakeLdapServer({ entries: buildConformanceLdapEntries() });
    const startTlsPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldap://dc1.example.test:389'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { mode: 'starttls', caFile },
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const health = await startTlsPort.health({});
    assertEquals(health.status, 'healthy');
    assert(health.probes?.[0]?.message.includes('TLS bind'));
    const call = server.calls[0]!;
    assertEquals(call.connectOptions.tlsOptions, undefined);
    assertEquals(call.startTlsOptions?.rejectUnauthorized, true);
    assertEquals(call.startTlsOptions?.servername, 'dc1.example.test');
    assert(call.startTlsOptions?.ca?.includes('MIIBTESTCA'));
    assertEquals(call.events, ['connect', 'startTLS', 'bind', 'search', 'search', 'unbind']);

    const plaintextPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldap://dc1.example.test:389'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { allowInsecurePlaintextDev: true },
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });
    const plainHealth = await plaintextPort.health({});
    assertEquals(plainHealth.status, 'healthy');
    assert(plainHealth.probes?.[0]?.message.includes('plaintext dev bind'));
    assert(!plainHealth.probes?.[0]?.message.includes('TLS bind'));
  });
});

Deno.test('hung-host failover slices budget across hosts and prefers the last healthy host', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const entries = buildConformanceLdapEntries();
    const clock = createDeterministicClock(DS.initialTimeIso);

    // 3 hosts: hosts 1 and 2 hang (5s), host 3 is healthy -> 300ms budget slices to ~100ms each.
    const server = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': { delayMs: 5_000 },
        'ldaps://dc2.example.test:636': { delayMs: 5_000 },
      },
    });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: [
        'ldaps://dc1.example.test:636',
        'ldaps://dc2.example.test:636',
        'ldaps://dc3.example.test:636',
      ],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: server.createClientFactory(),
    });

    const first = await port.getUser(
      { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
      { timeoutMs: 300 },
    );
    assertEquals(first?.immutableId, DS.userIds.alice);
    assertEquals(server.calls.map((c) => c.url), [
      'ldaps://dc1.example.test:636',
      'ldaps://dc2.example.test:636',
      'ldaps://dc3.example.test:636',
    ]);

    // Subsequent call starts directly with host 3 (zero hung-host penalty).
    const beforeSecond = server.calls.length;
    const second = await port.getUser(
      { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.frank },
      { timeoutMs: 300 },
    );
    assertEquals(second?.immutableId, DS.userIds.frank);
    assertEquals(server.calls.slice(beforeSecond).map((c) => c.url), [
      'ldaps://dc3.example.test:636',
    ]);
  });
});

Deno.test('misconfigured baseDn fails health and fails fast without failover; TypeError propagates', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const server = new FakeLdapServer({ entries: buildConformanceLdapEntries() });
    const badBasePort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
      baseDn: 'DC=typo,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const health = await badBasePort.health({});
    assertEquals(health.status, 'unhealthy');
    assertEquals(health.reachableHosts, 0);
    assert(health.probes?.[0]?.message.includes('base DN'));

    const callsBefore = server.calls.length;
    const err = await assertRejects(
      () => badBasePort.searchUsers({ text: 'Alice', limit: 5 }, {}),
      DirectoryUnavailable,
    );
    assert(err.reason.includes('base DN'));
    assertEquals(
      server.calls.length - callsBefore,
      1,
      'Misconfigured baseDn must fail fast without walking all hosts',
    );

    // Programming TypeError thrown by client propagates rather than becoming DirectoryUnavailable.
    const buggyServer = new FakeLdapServer({
      entries: buildConformanceLdapEntries(),
      hostBehaviors: {
        'ldaps://dc1.example.test:636': { searchError: new TypeError('internal decoder bug') },
      },
    });
    const buggyPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: buggyServer.createClientFactory(),
    });
    await assertRejects(
      () => buggyPort.searchUsers({ text: 'Alice', limit: 5 }, {}),
      TypeError,
      'internal decoder bug',
    );
  });
});

Deno.test('narrowed groupsBaseDn still resolves primary group and groups nesting it, and deduplicates spellings', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const server = new FakeLdapServer({ entries: buildConformanceLdapEntries() });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      usersBaseDn: 'OU=Users,DC=example,DC=test',
      groupsBaseDn: 'OU=Groups,DC=example,DC=test', // Excludes CN=Users where Domain Users lives!
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      candidateBatchSize: 2,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const result = await port.memberOfAny(
      {
        user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
        candidateGroupIds: [
          DS.groupIds.domainUsers,
          DS.groupIds.allStaff,
          DS.groupIds.engLeaf.toUpperCase(),
          `  ${DS.groupIds.engLeaf}  `,
        ],
      },
      {},
    );
    assertEquals(result.memberOf.length, 3);
    assertEquals(
      result.memberOf.map((id) => id.trim().toLowerCase()).sort(),
      [DS.groupIds.allStaff, DS.groupIds.domainUsers, DS.groupIds.engLeaf].sort(),
    );
  });
});

Deno.test('unauthorized bind fails fast, capability flag toggles transitive matching, and slow search times out', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const entries = buildConformanceLdapEntries();
    const clock = createDeterministicClock(DS.initialTimeIso);

    const unauthServer = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': {
          bindError: new InvalidCredentialsError('bad creds for CN=svc-dir,DC=example,DC=test'),
        },
      },
    });
    const unauthPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: unauthServer.createClientFactory(),
    });
    const unauthErr = await assertRejects(
      () => unauthPort.searchUsers({ text: 'Alice', limit: 5 }, {}),
      DirectoryUnauthorized,
    );
    assert(!unauthErr.message.includes('CN=svc-dir'));
    assertEquals(unauthServer.calls.length, 1);

    const server = new FakeLdapServer({ entries });
    const directOnlyPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      supportsInChainMatching: false,
      clock,
      clientFactory: server.createClientFactory(),
    });
    assertEquals(directOnlyPort.capabilities.has('transitive-membership'), false);
    const directResult = await directOnlyPort.memberOfAny(
      {
        user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
        candidateGroupIds: [
          DS.groupIds.domainUsers,
          DS.groupIds.engLeaf,
          DS.groupIds.engParent,
        ],
      },
      {},
    );
    assertEquals(
      [...directResult.memberOf].sort(),
      [DS.groupIds.domainUsers, DS.groupIds.engLeaf].sort(),
    );

    const unsupportedServer = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': {
          searchError: new InappropriateMatchingError('1.2.840.113556.1.4.1941 unsupported'),
        },
      },
    });
    const unsupportedPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: unsupportedServer.createClientFactory(),
    });
    await assertRejects(
      () =>
        unsupportedPort.memberOfAny(
          {
            user: { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
            candidateGroupIds: [DS.groupIds.engParent],
          },
          {},
        ),
      DirectoryUnsupported,
    );

    // Health degraded/unhealthy reporting on unreachable hosts.
    const partialServer = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': { connectError: new UnavailableError('dc1 down') },
      },
    });
    const degradedPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: partialServer.createClientFactory(),
    });
    const degraded = await degradedPort.health({});
    assertEquals(degraded.status, 'degraded');
    assertEquals(degraded.reachableHosts, 1);
    assertEquals(degraded.totalHosts, 2);

    const slowServer = new FakeLdapServer({
      entries,
      hostBehaviors: { 'ldaps://dc1.example.test:636': { delayMs: 2_000 } },
    });
    const slowPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: slowServer.createClientFactory(),
    });
    await assertRejects(
      () => slowPort.searchGroups({ text: 'Ops', limit: 5 }, { timeoutMs: 20 }),
      DirectoryTimeout,
    );
  });
});
