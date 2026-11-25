import { InvalidCredentialsError, UnavailableError } from 'ldapts';
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
    const secretValue = 'test-bind-password-only';
    await Deno.writeTextFile(passwordFile, `${secretValue}\n`);
    await Deno.writeTextFile(
      caFile,
      '-----BEGIN CERTIFICATE-----\nMIIBFAKECERTFORUNITTESTINGONLY\n-----END CERTIFICATE-----\n',
    );

    const clock = createDeterministicClock(DS.initialTimeIso);
    const entries = buildConformanceLdapEntries();
    const bindDn = 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test';
    const baseOptions = {
      directoryInstance: DS.directoryInstance,
      baseDn: 'DC=example,DC=test',
      bindDn,
      bindPasswordFile: passwordFile,
      tls: { caFile },
      maxSearchLimit: 3,
      clock,
    };

    const server = new FakeLdapServer({
      entries,
      expectedBindDn: bindDn,
      expectedBindPassword: secretValue,
    });
    const slowServer = new FakeLdapServer({
      entries,
      expectedBindDn: bindDn,
      expectedBindPassword: secretValue,
      hostBehaviors: {
        'ldaps://dc-slow.example.test:636': { delayMs: 5_000 },
      },
    });
    const unavailableServer = new FakeLdapServer({
      entries,
      expectedBindDn: bindDn,
      expectedBindPassword: secretValue,
      hostBehaviors: {
        'ldaps://dc-down.example.test:636': {
          connectError: new UnavailableError(
            `dc-down.example.test failed bind for ${bindDn} secret=${secretValue}`,
          ),
        },
      },
    });
    const unauthorizedServer = new FakeLdapServer({
      entries,
      expectedBindDn: bindDn,
      expectedBindPassword: secretValue,
      hostBehaviors: {
        'ldaps://dc-unauth.example.test:636': {
          bindError: new InvalidCredentialsError(
            `Invalid credentials for ${bindDn} using ${secretValue}`,
          ),
        },
      },
    });

    const [port, timeoutPort, unavailablePort, unauthorizedPort] = await Promise.all([
      createLdapDirectoryPort({
        ...baseOptions,
        urls: ['ldaps://dc1.example.test:636'],
        clientFactory: server.createClientFactory(),
      }),
      createLdapDirectoryPort({
        ...baseOptions,
        urls: ['ldaps://dc-slow.example.test:636'],
        clientFactory: slowServer.createClientFactory(),
      }),
      createLdapDirectoryPort({
        ...baseOptions,
        urls: ['ldaps://dc-down.example.test:636'],
        clientFactory: unavailableServer.createClientFactory(),
      }),
      createLdapDirectoryPort({
        ...baseOptions,
        urls: ['ldaps://dc-unauth.example.test:636'],
        clientFactory: unauthorizedServer.createClientFactory(),
      }),
    ]);

    return {
      port,
      timeoutPort,
      unavailablePort,
      unauthorizedPort,
      clock,
      maxSearchLimit: 3,
      sensitiveValues: [
        secretValue,
        bindDn,
        passwordFile,
        'dc1.example.test',
        'dc-down.example.test',
      ],
      teardown: async () => {
        await Deno.remove(secretDir, { recursive: true });
      },
    };
  },
});
