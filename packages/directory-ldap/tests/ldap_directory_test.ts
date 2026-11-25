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
import { createLdapDirectoryPort } from '../mod.ts';
import { buildConformanceLdapEntries, FakeLdapServer } from './fake-ldap-client.ts';

const DS = DIRECTORY_CONFORMANCE_DATASET;

async function withSecretFiles(
  fn: (paths: { passwordFile: string; caFile: string; emptyFile: string }) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'directory-ldap-test-' });
  const passwordFile = `${dir}/bind_password`;
  const caFile = `${dir}/ca.pem`;
  const emptyFile = `${dir}/empty`;
  await Deno.writeTextFile(passwordFile, 'test-bind-password-only\r\n');
  await Deno.writeTextFile(
    caFile,
    '-----BEGIN CERTIFICATE-----\nMIIBTESTCA\n-----END CERTIFICATE-----\n',
  );
  await Deno.writeTextFile(emptyFile, '\n');
  try {
    await fn({ passwordFile, caFile, emptyFile });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('LDAPS enforces rejectUnauthorized:true, loads caFile and bindPasswordFile, and unbinds cleanly', async () => {
  await withSecretFiles(async ({ passwordFile, caFile, emptyFile }) => {
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
    assertEquals(call.events, ['connect', 'bind', 'search', 'unbind']);
    assertEquals(call.unbound, true);
  });
});

Deno.test('StartTLS connects without tlsOptions and upgrades via startTLS strictly before bind', async () => {
  await withSecretFiles(async ({ passwordFile, caFile }) => {
    const server = new FakeLdapServer({ entries: buildConformanceLdapEntries() });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldap://dc1.example.test:389'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { mode: 'starttls', caFile },
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const health = await port.health({});
    assertEquals(health.status, 'healthy');
    const call = server.calls[0]!;
    assertEquals(call.connectOptions.tlsOptions, undefined);
    assertEquals(call.startTlsOptions?.rejectUnauthorized, true);
    assertEquals(call.startTlsOptions?.servername, 'dc1.example.test');
    assert(call.startTlsOptions?.ca?.includes('MIIBTESTCA'));
    assertEquals(call.events, ['connect', 'startTLS', 'bind', 'search', 'unbind']);
  });
});

Deno.test('multi-host failover tries hosts in order and health reports healthy/degraded/unhealthy', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const entries = buildConformanceLdapEntries();
    const clock = createDeterministicClock(DS.initialTimeIso);

    // Host 1 down, host 2 healthy -> queries fail over; health reports 'degraded' (1/2).
    const partialServer = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': {
          connectError: new UnavailableError('dc1 down'),
        },
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

    const alice = await degradedPort.getUser(
      { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
      {},
    );
    assertEquals(alice?.immutableId, DS.userIds.alice);
    assertEquals(
      partialServer.calls.map((c) => c.url),
      ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
    );

    const degradedHealth = await degradedPort.health({});
    assertEquals(degradedHealth.status, 'degraded');
    assertEquals(degradedHealth.reachableHosts, 1);
    assertEquals(degradedHealth.totalHosts, 2);
    assertEquals(degradedHealth.probes?.map((p) => p.status), ['fail', 'pass']);
    const healthJson = JSON.stringify(degradedHealth);
    assert(!/\b(?:cn|ou|dc)=/i.test(healthJson));
    assert(!healthJson.includes('test-bind-password-only'));

    // Both hosts down -> queries throw DirectoryUnavailable; health reports 'unhealthy' (0/2).
    const downServer = new FakeLdapServer({
      entries,
      hostBehaviors: {
        'ldaps://dc1.example.test:636': { connectError: new UnavailableError('dc1 down') },
        'ldaps://dc2.example.test:636': { connectError: new UnavailableError('dc2 down') },
      },
    });
    const downPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock,
      clientFactory: downServer.createClientFactory(),
    });

    await assertRejects(
      () =>
        downPort.getUser(
          { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice },
          {},
        ),
      DirectoryUnavailable,
    );
    const unhealthy = await downPort.health({});
    assertEquals(unhealthy.status, 'unhealthy');
    assertEquals(unhealthy.reachableHosts, 0);
    assertEquals(unhealthy.totalHosts, 2);
  });
});

Deno.test('unauthorized bind fails fast on host 1 without spraying host 2 (prevents AD lockout)', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const server = new FakeLdapServer({
      entries: buildConformanceLdapEntries(),
      hostBehaviors: {
        'ldaps://dc1.example.test:636': {
          bindError: new InvalidCredentialsError(
            'bad credentials for CN=svc-dir,DC=example,DC=test',
          ),
        },
      },
    });
    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: server.createClientFactory(),
    });

    const err = await assertRejects(
      () => port.searchUsers({ text: 'Alice', limit: 5 }, {}),
      DirectoryUnauthorized,
    );
    assert(!err.message.includes('CN=svc-dir'));
    assert(!err.message.includes('test-bind-password-only'));
    assertEquals(
      server.calls.length,
      1,
      'Must fail fast without replaying bad credentials on host 2',
    );
  });
});

Deno.test('supportsInChainMatching capability flag toggles transitive matching and maps unsupported errors', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const entries = buildConformanceLdapEntries();
    const clock = createDeterministicClock(DS.initialTimeIso);
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

    assertEquals(directOnlyPort.capabilities.has('search'), true);
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
    // Direct group (engLeaf) + AD primary group (domainUsers) match; 3-level nested (engParent) does not.
    assertEquals(
      [...directResult.memberOf].sort(),
      [DS.groupIds.domainUsers, DS.groupIds.engLeaf].sort(),
    );

    // When server rejects in-chain matching rule, map to DirectoryUnsupported.
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
  });
});

Deno.test('memberOfAny resolves transitive groups containing a user primary group and batches large candidate sets', async () => {
  await withSecretFiles(async ({ passwordFile }) => {
    const allEmployeesId = '10000000-0000-4000-8000-0000000000aa';
    const customGroups = [
      ...DS.groups,
      {
        immutableId: allEmployeesId,
        displayName: 'All Employees',
        memberGroupIds: [DS.groupIds.domainUsers],
      },
    ];
    const server = new FakeLdapServer({
      entries: buildConformanceLdapEntries(DS.users, customGroups),
    });

    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
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
          allEmployeesId,
          DS.groupIds.engParent,
          DS.groupIds.engChild,
          DS.groupIds.finance,
          DS.groupIds.domainUsers,
        ],
      },
      {},
    );
    assertEquals(
      [...result.memberOf].sort(),
      [allEmployeesId, DS.groupIds.domainUsers, DS.groupIds.engChild, DS.groupIds.engParent].sort(),
    );

    // Computer object named "Alice Example Computer" must never appear in user searches.
    const search = await port.searchUsers({ text: 'Alice Example', limit: 10 }, {});
    assertEquals(search.items.map((u) => u.immutableId), [DS.userIds.alice]);

    // Timeout across slow host fails closed with DirectoryTimeout.
    const slowServer = new FakeLdapServer({
      entries: buildConformanceLdapEntries(),
      hostBehaviors: {
        'ldaps://dc1.example.test:636': { delayMs: 2_000 },
      },
    });
    const slowPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      clock: createDeterministicClock(DS.initialTimeIso),
      clientFactory: slowServer.createClientFactory(),
    });
    await assertRejects(
      () => slowPort.searchGroups({ text: 'Ops', limit: 5 }, { timeoutMs: 20 }),
      DirectoryTimeout,
    );
  });
});
