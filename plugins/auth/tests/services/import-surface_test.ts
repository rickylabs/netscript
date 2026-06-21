import { assertEquals } from 'jsr:@std/assert@^1';
import { authContract } from '../../contracts.ts';
import createAuthService from '../../services/src/main.ts';

Deno.test('public contract and service imports resolve', () => {
  assertEquals(typeof authContract, 'object');
  assertEquals(typeof createAuthService, 'function');
});
