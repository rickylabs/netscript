import { createAuthServiceAuthenticator } from '@netscript/plugin-auth/authenticator';
import { createAuthServiceAuthenticator as coreAuthenticator } from '@netscript/plugin-auth-core/authenticator';
import { assertEquals } from 'jsr:@std/assert@^1';
import { authContract } from '../../contracts/v1/mod.ts';
import createAuthService from '../../services/src/main.ts';

Deno.test('public contract and service imports resolve', () => {
  assertEquals(typeof authContract, 'object');
  assertEquals(typeof createAuthService, 'function');
});

Deno.test('public authenticator leaf re-exports the core implementation', () => {
  assertEquals(createAuthServiceAuthenticator, coreAuthenticator);
});
