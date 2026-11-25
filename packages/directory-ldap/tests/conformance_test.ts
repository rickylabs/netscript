import {
  createDeterministicClock,
  DIRECTORY_CONFORMANCE_DATASET,
  runDirectoryConformanceSuite,
} from '@netscript/plugin-directory-core/testing';
import { createLdapDirectoryPort } from '../mod.ts';
import { buildConformanceLdapEntries, FakeLdapServer } from './fake-ldap-client.ts';

const DS = DIRECTORY_CONFORMANCE_DATASET;

runDirectoryConformanceSuite({
  name: 'directory-ldap (fake ldapts seam)',
  createFixture: async () => {
    const secretDir = await Deno.makeTempDir({ prefix: 'directory-ldap-conformance-' });
    const passwordFile = `${secretDir}/bind_password`;
    const caFile = `${secretDir}/corp-ca.pem`;
    await Deno.writeTextFile(passwordFile, 'test-bind-password-only\n');
    await Deno.writeTextFile(
      caFile,
      '-----BEGIN CERTIFICATE-----\nMIIBFAKECERTFORUNITTESTINGONLY\n-----END CERTIFICATE-----\n',
    );

    const clock = createDeterministicClock(DS.initialTimeIso);
    const entries = buildConformanceLdapEntries();
    const server = new FakeLdapServer({
      entries,
      expectedBindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      expectedBindPassword: 'test-bind-password-only',
    });
    const slowServer = new FakeLdapServer({
      entries,
      expectedBindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      expectedBindPassword: 'test-bind-password-only',
      hostBehaviors: {
        'ldaps://dc-slow.example.test:636': { delayMs: 5_000 },
      },
    });

    const port = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc1.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { caFile },
      maxSearchLimit: 3,
      clock,
      clientFactory: server.createClientFactory(),
    });

    const timeoutPort = await createLdapDirectoryPort({
      directoryInstance: DS.directoryInstance,
      urls: ['ldaps://dc-slow.example.test:636'],
      baseDn: 'DC=example,DC=test',
      bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
      bindPasswordFile: passwordFile,
      tls: { caFile },
      maxSearchLimit: 3,
      clock,
      clientFactory: slowServer.createClientFactory(),
    });

    return {
      port,
      timeoutPort,
      clock,
      maxSearchLimit: 3,
      teardown: async () => {
        await Deno.remove(secretDir, { recursive: true });
      },
    };
  },
});
