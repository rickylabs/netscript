import { createService } from '@netscript/service';
import { ORPCError } from '@orpc/contract';
import { assertEquals, assertRejects } from '@std/assert';
import type { AuthnRequest } from '@netscript/service/auth';
import { createPluginService } from '../../../plugin/src/service/mod.ts';
import { authContractV1 } from '../contracts/v1/mod.ts';
import {
  createAuthServiceAuthenticator,
  REMOTE_SESSION_REJECTIONS,
  RemoteSessionVerificationError,
} from './auth-service-authenticator.ts';

// Fault fixture only. Native KV-OAuth acceptance lives in the auth plugin HTTP test.
Deno.test('remote verifier distinguishes contract denial, provider failure and timeout over HTTP', async () => {
  let mode: 'denied' | 'provider' | 'timeout' | 'contradictory' | 'expired' = 'denied';
  let calls = 0;
  let release: (() => void) | undefined;
  const running = await createPluginService({
    v1: {
      auth: {
        session: authContractV1.session.handler(async () => {
          calls++;
          if (mode === 'denied') {
            throw new ORPCError('UNAUTHORIZED', { data: { reason: 'synthetic-secret' } });
          }
          if (mode === 'provider') {
            throw new ORPCError('AUTH_PROVIDER_ERROR', {
              status: 502,
              data: { reason: 'synthetic-secret' },
            });
          }
          if (mode === 'expired') {
            return {
              authenticated: true,
              session: {
                id: 'synthetic-session',
                userId: 'synthetic-user',
                subject: 'synthetic-user',
                state: 'active',
                scopes: [],
                roles: [],
                claims: {},
                issuedAt: '2020-01-01T00:00:00.000Z',
                expiresAt: '2020-01-02T00:00:00.000Z',
              },
            };
          }
          if (mode === 'timeout') {
            await new Promise<void>((resolve) => {
              release = resolve;
            });
          }
          return { authenticated: true };
        }),
      },
    },
  }, { name: 'auth-fault-fixture', version: '0.0.0', traceContext: false }).serve({ port: 0 });
  const serviceName = `auth-fault-${crypto.randomUUID()}`;
  const key = `services__${serviceName}__http__0`;
  Deno.env.set(key, `http://127.0.0.1:${running.addr.port}`);
  const headers = new Headers({ authorization: 'Bearer synthetic-secret' });
  const request: AuthnRequest = {
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: () => undefined,
    method: 'GET',
    path: '/private',
  };
  const verifier = createAuthServiceAuthenticator({ serviceName, timeoutMs: 100 });
  const app = createService({}, { name: 'remote-verifier-consumer' })
    .route('get', '/api/private', () => Response.json({ allowed: true }))
    .withAuthn({ authenticator: verifier })
    .withHealth()
    .build();
  try {
    assertEquals((await app.request('/health')).status, 200);
    assertEquals((await app.request('/api/private')).status, 401);
    assertEquals(calls, 0);
    assertEquals((await app.request('/api/private', { headers })).status, 401);
    assertEquals(await verifier.authenticate(request), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.unauthorized,
    });
    mode = 'provider';
    const unavailable = await app.request('/api/private', { headers });
    assertEquals(unavailable.status, 503);
    assertEquals((await unavailable.text()).includes('synthetic-secret'), false);
    const providerError = await assertRejects(
      async () => await verifier.authenticate(request),
      RemoteSessionVerificationError,
    );
    assertEquals(providerError.code, 'remote_error');
    assertEquals(JSON.stringify(providerError).includes('synthetic-secret'), false);
    mode = 'contradictory';
    assertEquals(await verifier.authenticate(request), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.notActive,
    });
    mode = 'expired';
    assertEquals(await verifier.authenticate(request), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.expired,
    });
    assertEquals((await app.request('/api/private', { headers })).status, 401);
    mode = 'timeout';
    const timeoutError = await assertRejects(
      async () => await verifier.authenticate(request),
      RemoteSessionVerificationError,
    );
    assertEquals(timeoutError.code, 'timeout');
  } finally {
    release?.();
    await running.stop();
    Deno.env.delete(key);
  }
});

Deno.test('malformed HTTP response fails closed through the native middleware', async () => {
  // Deliberately invalid wire fixture, not a substitute for native service acceptance.
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    () => Response.json({ json: { authenticated: 'synthetic-private-body' } }),
  );
  const serviceName = `malformed-auth-${crypto.randomUUID()}`;
  const key = `services__${serviceName}__http__0`;
  Deno.env.set(key, `http://127.0.0.1:${server.addr.port}`);
  try {
    const verifier = createAuthServiceAuthenticator({ serviceName, timeoutMs: 1000 });
    const app = createService({}, { name: 'malformed-verifier-consumer' })
      .route('get', '/api/private', () => Response.json({ allowed: true }))
      .withAuthn({ authenticator: verifier })
      .build();
    const response = await app.request('/api/private', {
      headers: { authorization: 'Bearer synthetic-private-credential' },
    });
    assertEquals(response.status, 503);
    const body = await response.text();
    assertEquals(body.includes('synthetic-private-body'), false);
    assertEquals(body.includes('synthetic-private-credential'), false);
  } finally {
    await server.shutdown();
    Deno.env.delete(key);
  }
});
