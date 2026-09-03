import { assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@1';
import {
  convertDriverError,
  isConnectionError,
  mapDriverError,
  MYSQL_CONNECTION_ERROR_CODES,
} from '../src/errors.ts';

const EXPECTED_CONNECTION_ERROR_CODES = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'PROTOCOL_ENQUEUE_AFTER_DESTROY',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'HANDSHAKE_NO_SSL_SUPPORT',
  'POOL_CLOSED',
  'POOL_CLOSED_CONNECTION',
  'POOL_ENQUEUELIMIT',
  'POOL_NONEONLINE',
] as const;

Deno.test('mapDriverError maps unique constraint violations', () => {
  assertEquals(
    mapDriverError({
      errno: 1062,
      sqlMessage: "Duplicate entry 'demo' for key 'User.email'",
    }),
    {
      kind: 'UniqueConstraintViolation',
      constraint: { index: 'email' },
    },
  );
});

Deno.test('mapDriverError maps authentication failures', () => {
  assertEquals(
    mapDriverError({
      errno: 1045,
      sqlMessage: "Access denied for user 'app'@'localhost'",
    }),
    {
      kind: 'AuthenticationFailed',
      user: 'app',
    },
  );
});

Deno.test('convertDriverError preserves non-driver errors by throwing them', () => {
  const error = new Error('plain failure');
  assertThrows(() => convertDriverError(error), Error, 'plain failure');
});

Deno.test('isConnectionError uses the exact closed transport and pool code set', () => {
  assertEquals([...MYSQL_CONNECTION_ERROR_CODES], [...EXPECTED_CONNECTION_ERROR_CODES]);

  for (const code of EXPECTED_CONNECTION_ERROR_CODES) {
    assertEquals(isConnectionError({ code }), true, code);
  }
});

Deno.test('isConnectionError classifies fatal and capacity driver errors', () => {
  assertEquals(isConnectionError({ fatal: true, code: 'ER_HANDSHAKE_ERROR' }), true);
  assertEquals(isConnectionError({ errno: 1040 }), true);
  assertEquals(isConnectionError({ errno: 1203 }), true);
});

Deno.test('isConnectionError requires fatal auth, access, and missing-database errors', () => {
  for (const errno of [1045, 1044, 1049]) {
    assertFalse(isConnectionError({ errno, fatal: false }));
    assertEquals(isConnectionError({ errno, fatal: true }), true);
  }
});

Deno.test('isConnectionError excludes ordinary mapped and non-driver errors', () => {
  assertFalse(isConnectionError({ errno: 1146 }));
  assertFalse(isConnectionError(new Error('plain failure')));
  assertFalse(isConnectionError(null));
});
