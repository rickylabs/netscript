import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { convertDriverError, mapDriverError } from '../src/errors.ts';

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
