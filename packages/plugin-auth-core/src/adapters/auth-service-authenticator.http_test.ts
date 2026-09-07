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
  let mode: 'denied' | 'provider' | 'timeout' | 'contradictory' = 'denied';
  let release: (() => void) | undefined;
  const running = await createPluginService({
    v1: {
      auth: {
        session: authContractV1.session.handler(async () => {
          if (mode === 'denied') {
            throw new ORPCError('UNAUTHORIZED', { data: { reason: 'synthetic-secret' } });
          }
          if (mode === 'provider') {
            throw new ORPCError('AUTH_PROVIDER_ERROR', {
              status: 502,
              data: { reason: 'synthetic-secret' },
            });
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
  try {
    assertEquals(await verifier.authenticate(request), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.unauthorized,
    });
    mode = 'provider';
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
