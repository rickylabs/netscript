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
  InvalidDNSyntaxError,
  NoSuchObjectError,
  TimeLimitExceededError,
  TLSNotSupportedError,
  UnavailableError,
} from 'ldapts';
import {
  isLdapBaseDnMisconfigurationError,
  isNonLdapProgramError,
  mapLdapError,
} from './errors.ts';

Deno.test('mapLdapError prioritizes structured name/code over message text and classifies base-DN errors', () => {
  // InvalidCredentialsError whose server text mentions "timed out" must still be DirectoryUnauthorized.
  const badCredsWithTimeoutWord = mapLdapError(
    new InvalidCredentialsError(
      'Invalid credentials for CN=svc-secret,DC=example,DC=test (auth timed out)',
    ),
    'ldap',
    'getUser',
  );
  assertInstanceOf(badCredsWithTimeoutWord, DirectoryUnauthorized);
  assert(!badCredsWithTimeoutWord.message.includes('CN=svc-secret'));

  const noSuch = new NoSuchObjectError('No such object DC=typo,DC=test');
  assertEquals(isLdapBaseDnMisconfigurationError(noSuch), true);
  const mappedNoSuch = mapLdapError(noSuch, 'ldap', 'searchUsers');
  assertInstanceOf(mappedNoSuch, DirectoryUnavailable);
  assert(mappedNoSuch.reason.includes('base DN'));
  assert(!mappedNoSuch.message.includes('DC=typo'));

  const badDn = new InvalidDNSyntaxError('Invalid DN syntax');
  assertEquals(isLdapBaseDnMisconfigurationError(badDn), true);

  const abortErr = new DOMException('Aborted', 'AbortError');
  assertInstanceOf(mapLdapError(abortErr, 'ldap', 'getUser'), DirectoryUnavailable);

  assertEquals(isNonLdapProgramError(new TypeError('bug')), true);
  assertEquals(isNonLdapProgramError(new RangeError('range')), true);
  assertEquals(isNonLdapProgramError(new UnavailableError('down')), false);
});

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
