import { assertEquals, assertThrows } from '@std/assert';
import { type LdapStaticConfigOptions, resolveLdapConfig } from './mod.ts';

function validOptions(
  overrides: Partial<LdapStaticConfigOptions> = {},
): LdapStaticConfigOptions {
  return {
    directoryInstance: 'corp-example',
    urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
    baseDn: 'DC=example,DC=test',
    bindDn: 'CN=svc-dir,OU=ServiceAccounts,DC=example,DC=test',
    bindPasswordFile: '/run/secrets/ldap_bind_password',
    ...overrides,
  };
}

Deno.test('resolveLdapConfig enforces strict LDAPS defaults and multi-host targets', () => {
  const config = resolveLdapConfig(validOptions());
  assertEquals(config.name, 'ldap');
  assertEquals(config.tlsMode, 'ldaps');
  assertEquals(config.supportsInChainMatching, true);
  assertEquals(config.hosts.length, 2);
  assertEquals(config.hosts[0], {
    url: 'ldaps://dc1.example.test:636',
    hostname: 'dc1.example.test',
    directTls: true,
    useStartTls: false,
    probeName: 'host-1',
  });
  assertEquals(config.hosts[1]?.probeName, 'host-2');
});

Deno.test('resolveLdapConfig refuses plaintext ldap:// by default and supports StartTLS or dev opt-in', () => {
  assertThrows(
    () => resolveLdapConfig(validOptions({ urls: ['ldap://dc1.example.test:389'] })),
    RangeError,
    'Plaintext ldap://',
  );

  const startTls = resolveLdapConfig(
    validOptions({
      urls: ['ldap://dc1.example.test:389'],
      tls: { mode: 'starttls', caFile: '/etc/ssl/corp-ca.pem' },
    }),
  );
  assertEquals(startTls.tlsMode, 'starttls');
  assertEquals(startTls.hosts[0]?.directTls, false);
  assertEquals(startTls.hosts[0]?.useStartTls, true);
  assertEquals(startTls.caFile, '/etc/ssl/corp-ca.pem');

  const devPlaintext = resolveLdapConfig(
    validOptions({
      urls: ['ldap://dc1.example.test:389'],
      tls: { allowInsecurePlaintextDev: true },
    }),
  );
  assertEquals(devPlaintext.tlsMode, 'insecure-plaintext-dev');
  assertEquals(devPlaintext.hosts[0]?.directTls, false);
  assertEquals(devPlaintext.hosts[0]?.useStartTls, false);

  // Explicit mode='insecure-plaintext-dev' without boolean opt-in is refused.
  assertThrows(
    () =>
      resolveLdapConfig(
        validOptions({
          urls: ['ldap://dc1.example.test:389'],
          tls: { mode: 'insecure-plaintext-dev' },
        }),
      ),
    RangeError,
    'allowInsecurePlaintextDev=true',
  );
});

Deno.test('resolveLdapConfig rejects disabled certificate verification, inline passwords, and URL creds', () => {
  assertThrows(
    () =>
      resolveLdapConfig(
        validOptions({
          tls: { rejectUnauthorized: false } as unknown as LdapStaticConfigOptions['tls'],
        }),
      ),
    RangeError,
    'rejectUnauthorized: true',
  );

  assertThrows(
    () =>
      resolveLdapConfig({
        ...validOptions(),
        bindPassword: 'super-secret-inline-password',
      } as unknown as LdapStaticConfigOptions),
    RangeError,
    'bindPasswordFile',
  );

  assertThrows(
    () =>
      resolveLdapConfig(
        validOptions({ urls: ['ldaps://svc:super-secret@dc1.example.test:636'] }),
      ),
    RangeError,
    'must not embed credentials',
  );

  assertThrows(
    () =>
      resolveLdapConfig(
        validOptions({
          urls: ['ldaps://dc1.example.test:636', 'ldap://dc2.example.test:389'],
        }),
      ),
    RangeError,
  );

  assertThrows(
    () => resolveLdapConfig(validOptions({ urls: [] })),
    RangeError,
  );
  assertThrows(
    () => resolveLdapConfig(validOptions({ maxSearchLimit: 0 })),
    RangeError,
  );
  assertThrows(
    () => resolveLdapConfig(validOptions({ defaultTimeoutMs: 0 })),
    RangeError,
  );
  assertThrows(
    () => resolveLdapConfig(validOptions({ defaultTimeoutMs: 2_147_483_648 })),
    RangeError,
  );
  assertThrows(
    () => resolveLdapConfig(validOptions({ connectTimeoutMs: 2_147_483_648 })),
    RangeError,
  );
  assertThrows(
    () =>
      resolveLdapConfig(
        validOptions({
          tls: { mode: 'bogus-mode' } as unknown as LdapStaticConfigOptions['tls'],
        }),
      ),
    RangeError,
    'tls.mode',
  );
});
