import { assert, assertEquals } from '@std/assert';
import { createWorkosAccessTokenAuthenticator } from '../mod.ts';
import type { AuthnRequest } from '@netscript/service/auth';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

Deno.test('createWorkosAccessTokenAuthenticator verifies a WorkOS bearer token via JWKS', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  const keyId = 'test-key';
  const server = Deno.serve({ port: 0 }, () =>
    Response.json({
      keys: [{ ...jwk, kid: keyId, alg: 'RS256', use: 'sig' }],
    }));

  try {
    const token = await new SignJWT({
      sid: 'sess_123',
      org_id: 'org_123',
      role: 'admin',
      roles: ['member'],
      permissions: ['users:read'],
      feature_flags: ['beta'],
    })
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setSubject('user_123')
      .setAudience('client_123')
      .setIssuer('https://issuer.example.test')
      .setExpirationTime('5m')
      .sign(privateKey);

    const authenticator = createWorkosAccessTokenAuthenticator({
      clientId: 'client_123',
      issuer: 'https://issuer.example.test',
      jwksUrl: `http://127.0.0.1:${server.addr.port}/jwks`,
    });

    const result = await authenticator.authenticate(requestWithAuthorization(`Bearer ${token}`));

    assert(result.ok);
    assertEquals(result.principal.subject, 'user_123');
    assertEquals(result.principal.scopes, ['users:read']);
    assertEquals(result.principal.roles, ['admin', 'member']);
    assertEquals(result.principal.scheme, 'custom');
    assertEquals(result.principal.claims.organizationId, 'org_123');
    assertEquals(result.principal.claims.sessionId, 'sess_123');
    assertEquals(result.principal.claims.org_id, 'org_123');
    assertEquals(result.principal.claims.sid, 'sess_123');
    assertEquals(result.principal.claims.feature_flags, ['beta']);
  } finally {
    await server.shutdown();
  }
});

Deno.test('createWorkosAccessTokenAuthenticator rejects missing and invalid bearer tokens', async () => {
  const authenticator = createWorkosAccessTokenAuthenticator({
    clientId: 'client_123',
    jwksUrl: 'http://127.0.0.1:1/jwks',
  });

  assertEquals(await authenticator.authenticate(requestWithAuthorization(undefined)), {
    ok: false,
    reason: 'workos_bearer_token_missing',
  });

  const invalid = await authenticator.authenticate(requestWithAuthorization('Bearer invalid'));
  assertEquals(invalid.ok, false);
  if (!invalid.ok) {
    assert(invalid.reason.startsWith('workos_bearer_token_invalid'));
  }
});

function requestWithAuthorization(value: string | undefined): AuthnRequest {
  return {
    header: (name: string) => name.toLowerCase() === 'authorization' ? value : undefined,
    headers: () => new Headers(value ? { authorization: value } : {}),
    cookie: () => undefined,
    method: 'GET',
    path: '/private',
  };
}
