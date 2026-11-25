import { assertEquals, assertInstanceOf, assertRejects, assertThrows } from '@std/assert';
import {
  assertDirectoryCallContext,
  classifyDirectoryAbortError,
  createSystemDirectoryClock,
  DIRECTORY_ERROR_CODES,
  DIRECTORY_MAX_TIMEOUT_MS,
  DirectoryError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  isDirectoryError,
  resolveDirectoryTimeoutMs,
  runWithDirectoryDeadline,
} from './mod.ts';

Deno.test('DirectoryError subclasses: expose exact names, codes, fields, cause, and cross-copy guard', () => {
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

  // Structural guard recognizes a DirectoryError emitted by another package copy.
  const foreignCopyError = Object.assign(new Error('ldap timed out'), {
    code: DIRECTORY_ERROR_CODES.timeout,
    directoryName: 'ldap',
    operation: 'getUser',
    reason: 'Timed out.',
  });
  assertEquals(isDirectoryError(foreignCopyError), true);

  assertEquals(isDirectoryError(new Error('plain')), false);
  assertEquals(isDirectoryError(null), false);
});

Deno.test('ports clock and shared deadline helpers enforce timeout bounds and abort semantics', async () => {
  const clock = createSystemDirectoryClock();
  assertEquals(Number.isFinite(clock.nowMs()), true);
  assertEquals(clock.nowIso().includes('T'), true);

  assertEquals(resolveDirectoryTimeoutMs({}, 5_000), 5_000);
  assertEquals(
    resolveDirectoryTimeoutMs({ timeoutMs: DIRECTORY_MAX_TIMEOUT_MS }),
    DIRECTORY_MAX_TIMEOUT_MS,
  );
  assertThrows(
    () => resolveDirectoryTimeoutMs({ timeoutMs: DIRECTORY_MAX_TIMEOUT_MS + 1 }),
    RangeError,
  );
  assertThrows(() => resolveDirectoryTimeoutMs({ timeoutMs: Number.NaN }), RangeError);
  assertThrows(
    () => resolveDirectoryTimeoutMs({ timeoutMs: Number.POSITIVE_INFINITY }),
    RangeError,
  );

  assertThrows(
    () => assertDirectoryCallContext('ldap', 'getUser', { timeoutMs: 0 }),
    DirectoryTimeout,
  );

  const timeoutAbort = classifyDirectoryAbortError(
    'ldap',
    'getUser',
    new DOMException('timed out', 'TimeoutError'),
    100,
  );
  assertInstanceOf(timeoutAbort, DirectoryTimeout);

  const cancelAbort = classifyDirectoryAbortError(
    'ldap',
    'getUser',
    new Error('caller cancelled'),
    100,
  );
  assertInstanceOf(cancelAbort, DirectoryUnavailable);

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await assertRejects(
    () =>
      runWithDirectoryDeadline({
        directoryName: 'ldap',
        operation: 'health',
        timeoutMs: 20,
        onCancel: () => {
          cancelled = true;
          if (timer !== undefined) clearTimeout(timer);
        },
        task: () =>
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, 250);
          }),
      }),
    DirectoryTimeout,
  );
  assertEquals(cancelled, true);
});
