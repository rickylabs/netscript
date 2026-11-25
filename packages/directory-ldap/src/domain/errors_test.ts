import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import {
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
} from '@netscript/plugin-directory-core';
import {
  InappropriateMatchingError,
  InsufficientAccessError,
  InvalidCredentialsError,
  TimeLimitExceededError,
  TLSNotSupportedError,
  UnavailableError,
} from 'ldapts';
import { mapLdapError } from './errors.ts';

Deno.test('mapLdapError maps ldapts and transport errors to canonical typed core errors', () => {
  const badCreds = mapLdapError(
    new InvalidCredentialsError('Invalid credentials for CN=svc-secret,DC=example,DC=test'),
    'ldap',
    'getUser',
  );
  assertInstanceOf(badCreds, DirectoryUnauthorized);
  assert(!badCreds.message.includes('CN=svc-secret'), 'DN must be redacted from error message');

  const denied = mapLdapError(
    new InsufficientAccessError('Access denied on OU=Secret,DC=example,DC=test'),
    'ldap',
    'searchUsers',
  );
  assertInstanceOf(denied, DirectoryUnauthorized);
  assert(!denied.message.includes('OU=Secret'));

  const timedOut = mapLdapError(
    new TimeLimitExceededError('Time limit exceeded'),
    'ldap',
    'memberOfAny',
    2_000,
  );
  assertInstanceOf(timedOut, DirectoryTimeout);
  assertEquals(timedOut.timeoutMs, 2_000);

  const unsupportedRule = mapLdapError(
    new InappropriateMatchingError('Matching rule 1.2.840.113556.1.4.1941 not supported'),
    'ldap',
    'memberOfAny',
  );
  assertInstanceOf(unsupportedRule, DirectoryUnsupported);

  const noStartTls = mapLdapError(
    new TLSNotSupportedError('StartTLS not supported'),
    'ldap',
    'health',
  );
  assertInstanceOf(noStartTls, DirectoryUnsupported);

  const tlsCertError = Object.assign(new Error('unable to verify the first certificate'), {
    code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  });
  const mappedTls = mapLdapError(tlsCertError, 'ldap', 'health');
  assertInstanceOf(mappedTls, DirectoryUnavailable);
  assert(mappedTls.reason.includes('TLS'));

  const serverDown = mapLdapError(new UnavailableError('Server unavailable'), 'ldap', 'getUser');
  assertInstanceOf(serverDown, DirectoryUnavailable);
});
