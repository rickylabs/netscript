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

Deno.test('WorkOS bearer fence refuses two unexpired signed tokens and preserves unrelated subjects', async () => {
  const { DenoKvAdapter } = await import('@netscript/kv');
  const { createWorkosRevocationStore } = await import('../mod.ts');
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const revocations = createWorkosRevocationStore(kv);
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  const server = Deno.serve(
    { port: 0 },
    () => Response.json({ keys: [{ ...jwk, kid: 'fence', alg: 'RS256', use: 'sig' }] }),
  );
  try {
    const authenticator = createWorkosAccessTokenAuthenticator({
      clientId: 'client_123',
      jwksUrl: `http://127.0.0.1:${server.addr.port}/jwks`,
      revocations,
    });
    const token = async (subject: string, sid: string) =>
      await new SignJWT({ sid })
        .setProtectedHeader({ alg: 'RS256', kid: 'fence' }).setSubject(subject).setAudience(
          'client_123',
        )
        .setIssuedAt().setExpirationTime('1h').sign(privateKey);
    const alice = [await token('alice', 'a'), await token('alice', 'b')];
    const bob = await token('bob', 'c');
    for (const value of [...alice, bob]) {
      assert((await authenticator.authenticate(requestWithAuthorization(`Bearer ${value}`))).ok);
    }
    await revocations.revokeSubject('alice', new Date().toISOString());
    for (const value of alice) {
      assertEquals(
        (await authenticator.authenticate(requestWithAuthorization(`Bearer ${value}`))).ok,
        false,
      );
    }
    assert((await authenticator.authenticate(requestWithAuthorization(`Bearer ${bob}`))).ok);
  } finally {
    await server.shutdown();
  }
});
