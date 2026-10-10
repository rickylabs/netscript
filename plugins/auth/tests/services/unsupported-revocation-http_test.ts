/** Provider capability failures must never masquerade as successful operator revocation. */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { betterAuth } from 'npm:better-auth@^1.6.20';
import { memoryAdapter } from 'npm:better-auth@^1.6.20/adapters/memory';
import { createBetterAuthBackend } from '@netscript/auth-better-auth';
import { createWorkosBackend } from '@netscript/auth-workos';
import { type AuthBackendPort, createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import {
  AuthOutcome,
  type AuthTelemetry,
  createAuthTelemetry,
} from '@netscript/plugin-auth-core/telemetry';
import { toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';
import { serveAuthTestService } from '../testing/auth-service-fixture.ts';

const transports = [
  { name: 'REST', prefix: '/api/v1/auth', rpc: false, revoke: 'sessions/revoke' },
  { name: 'namespaced RPC', prefix: '/api/rpc/v1/auth', rpc: true, revoke: 'revokeSession' },
  { name: 'flat RPC', prefix: '/api/rpc/v1', rpc: true, revoke: 'revokeSession' },
] as const;

type Fixture = Readonly<{
  backend: AuthBackendPort;
  callerCookie: string;
  victimCookie: string;
}>;

async function betterAuthFixture(): Promise<Fixture> {
  const auth = betterAuth({
    secret: crypto.randomUUID().repeat(2),
    baseURL: 'https://auth.example.test',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
    user: {
      additionalFields: {
        permissions: { type: 'string[]', input: false, defaultValue: ['auth:sessions:revoke'] },
      },
    },
  });
  const signup = async (email: string) => {
    const result = await auth.api.signUpEmail({
      body: { email, password: 'password-1234', name: email },
      returnHeaders: true,
    });
    return result.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
  };
  return {
    backend: createBetterAuthBackend({ auth, sessionTokenSecret: 'test-secret' }),
    callerCookie: await signup('operator@example.test'),
    victimCookie: await signup('victim@example.test'),
  };
}

function workosFixture(): Promise<Fixture> {
  const backend = createWorkosBackend({
    cookiePassword: 'x'.repeat(32),
    workos: {
      userManagement: {
        loadSealedSession({ sessionData }) {
          return {
            authenticate() {
              return Promise.resolve({
                authenticated: true,
                accessToken: 'access-token',
                sessionId: `sess_${sessionData}`,
                user: { id: `user_${sessionData}` },
                permissions: sessionData === 'operator' ? ['auth:sessions:revoke'] : [],
              });
            },
            refresh() {
              return Promise.resolve({ authenticated: false, reason: 'refresh_not_requested' });
            },
          };
        },
      },
    },
  });
  return Promise.resolve({
    backend,
    callerCookie: 'wos-session=operator',
    victimCookie: 'wos-session=victim',
  });
}

for (const fixture of [betterAuthFixture, workosFixture]) {
  Deno.test(`${fixture.name}: operator routes report unsupported revocation for a live session without success audit`, async () => {
    const { backend, callerCookie, victimCookie } = await fixture();
    const requestFor = (cookie: string) =>
      toAuthnRequest({
        url: 'https://auth.example.test/api/v1/auth/session',
        headers: new Headers({ cookie }),
      });
    const victim = await backend.sessions.getSession({ request: requestFor(victimCookie) });
    assert(victim);
    assertEquals(victim.state, 'active');
    const base = createAuthTelemetry({ enabled: false });
    const outcomes: string[] = [];
    const revocationEvents: string[] = [];
    const telemetry: AuthTelemetry = {
      ...base,
      traceOperation(input, run) {
        return base.traceOperation(input, (recorder) =>
          run({
            ...recorder,
            async setOutcome(outcome) {
              outcomes.push(outcome.outcome);
              await recorder.setOutcome(outcome);
            },
            async recordSessionRevoked(sessionId, subject) {
              revocationEvents.push(sessionId ?? 'subject');
              await recorder.recordSessionRevoked(sessionId, subject);
            },
          }));
      },
    };
    const registry = createAuthBackendRegistry(new Map([[backend.name, backend]]), backend.name);
    await using service = await serveAuthTestService(registry, telemetry);
    for (const transport of transports) {
      outcomes.length = 0;
      const input = { sessionId: victim.id };
      const response = await fetch(`${service.baseUrl}${transport.prefix}/${transport.revoke}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: callerCookie },
        body: JSON.stringify(transport.rpc ? { json: input } : input),
      });
      const raw = await response.json();
      const payload = transport.rpc ? raw.json : raw;
      assertEquals(response.status, 502, transport.name);
      assertEquals(payload.code, 'AUTH_PROVIDER_ERROR', transport.name);
      assertStringIncludes(payload.data.reason, 'does not support sessions.revokeSession');
      assert(outcomes.length > 0);
      assertEquals(outcomes.includes(AuthOutcome.SUCCESS), false);
      assertEquals(revocationEvents, []);
      assertEquals(
        (await backend.sessions.getSession({ request: requestFor(victimCookie) }))?.state,
        'active',
      );
    }
  });

  Deno.test(`${fixture.name}: signout diagnoses unsupported revocation only after proving the selected session owns the credential`, async () => {
    const { backend, callerCookie, victimCookie } = await fixture();
    const own = await backend.sessions.getSession({
      request: toAuthnRequest({
        url: 'https://auth.example.test/api/v1/auth/session',
        headers: new Headers({ cookie: callerCookie }),
      }),
    });
    const victim = await backend.sessions.getSession({
      request: toAuthnRequest({
        url: 'https://auth.example.test/api/v1/auth/session',
        headers: new Headers({ cookie: victimCookie }),
      }),
    });
    assert(own && victim);
    const registry = createAuthBackendRegistry(new Map([[backend.name, backend]]), backend.name);
    await using service = await serveAuthTestService(registry);
    for (const transport of transports) {
      const call = async (sessionId?: string) => {
        const input = sessionId === undefined ? {} : { sessionId };
        const response = await fetch(`${service.baseUrl}${transport.prefix}/signout`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: callerCookie },
          body: JSON.stringify(transport.rpc ? { json: input } : input),
        });
        const raw = await response.json();
        return { status: response.status, payload: transport.rpc ? raw.json : raw };
      };
      const refused = await call(victim.id);
      const unknown = await call('sess_unknown');
      assertEquals(refused.status, 401);
      assertEquals(unknown, refused);
      const result = await call(own.id);
      assertEquals(result.status, 502, transport.name);
      assertEquals(result.payload.code, 'AUTH_PROVIDER_ERROR');
      assertStringIncludes(result.payload.data.reason, 'does not support sessions.revokeSession');
      const implicit = await call();
      assertEquals(implicit.status, 502);
      assertEquals(implicit.payload.code, 'AUTH_PROVIDER_ERROR');
    }
  });
}
