import { assertEquals, assertInstanceOf } from '@std/assert';
import {
  DIRECTORY_ERROR_CODES,
  DirectoryError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  isDirectoryError,
} from './mod.ts';

Deno.test('DirectoryError subclasses: expose exact names, codes, fields, and cause preservation', () => {
  const cause = new Error('ECONNREFUSED');

  const unavailable = new DirectoryUnavailable('ldap', 'searchUsers', 'No host answered.', {
    cause,
  });
  assertInstanceOf(unavailable, Error);
  assertInstanceOf(unavailable, DirectoryError);
  assertInstanceOf(unavailable, DirectoryUnavailable);
  assertEquals(unavailable.name, 'DirectoryUnavailable');
  assertEquals(unavailable.code, DIRECTORY_ERROR_CODES.unavailable);
  assertEquals(unavailable.directoryName, 'ldap');
  assertEquals(unavailable.operation, 'searchUsers');
  assertEquals(unavailable.reason, 'No host answered.');
  assertEquals(unavailable.cause, cause);
  assertEquals(isDirectoryError(unavailable), true);

  const unauthorized = new DirectoryUnauthorized('ldap', 'getUser', 'Bind rejected.');
  assertInstanceOf(unauthorized, DirectoryError);
  assertEquals(unauthorized.name, 'DirectoryUnauthorized');
  assertEquals(unauthorized.code, DIRECTORY_ERROR_CODES.unauthorized);

  const timeout = new DirectoryTimeout('ldap', 'memberOfAny', 'Budget elapsed.', {
    timeoutMs: 2_500,
  });
  assertInstanceOf(timeout, DirectoryError);
  assertEquals(timeout.name, 'DirectoryTimeout');
  assertEquals(timeout.code, DIRECTORY_ERROR_CODES.timeout);
  assertEquals(timeout.timeoutMs, 2_500);

  const unsupported = new DirectoryUnsupported(
    'ldap',
    'memberOfAny',
    'Server lacks in-chain matching.',
  );
  assertInstanceOf(unsupported, DirectoryError);
  assertEquals(unsupported.name, 'DirectoryUnsupported');
  assertEquals(unsupported.code, DIRECTORY_ERROR_CODES.unsupported);
  assertEquals(
    unsupported.message,
    'ldap does not support memberOfAny: Server lacks in-chain matching.',
  );

  assertEquals(isDirectoryError(new Error('plain')), false);
  assertEquals(isDirectoryError(null), false);
});
