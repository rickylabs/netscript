import { assertEquals } from '@std/assert';
import { readBearerCredential } from './bearer-credential.ts';

Deno.test('bearer reader accepts one opaque credential and rejects ambiguous headers', () => {
  for (const header of ['Bearer token', 'bearer token', 'BEARER\ttoken']) {
    assertEquals(readBearerCredential({ header: () => header }), 'token');
  }
  for (
    const header of [
      undefined,
      '',
      'Bearer',
      'Basic token',
      'Bearer a b',
      'Bearer a,b',
      'Bearer a, Bearer b',
    ]
  ) {
    assertEquals(readBearerCredential({ header: () => header }), undefined);
  }
});
