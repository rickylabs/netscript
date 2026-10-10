import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { type AuthTelemetry, createAuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
import {
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

for (const projection of ['rest', 'rpc'] as const) {
  Deno.test(`${projection}: callback audit failure does not emit a session cookie`, async () => {
    await using kv = new MemoryKvAdapter();
    const registry = await createKvOAuthTestRegistry(kv);
    const flow = registry.resolveBackend().interactive;
    assert(flow);
    const started = await flow.signIn(new Request('https://app.example.test/api/v1/auth/signin'));
    const redirect = new URL(started.headers.get('location')!);
    const base = createAuthTelemetry({ enabled: false });
    const telemetry: AuthTelemetry = {
      ...base,
      async traceOperation(input, run) {
        return await base.traceOperation(input, (recorder) =>
          run({
            ...recorder,
            setOutcome: () => Promise.reject(new Error('audit unavailable')),
          }));
      },
    };
    await using service = await serveAuthTestService(registry, telemetry);
    const input = { code: 'code_test', state: redirect.searchParams.get('state')! };
    const response = await fetch(
      `${service.baseUrl}/api/${projection === 'rpc' ? 'rpc/' : ''}v1/auth/callback`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-proto': 'https',
          cookie: started.headers.getSetCookie()[0].split(';')[0],
        },
        body: JSON.stringify(projection === 'rpc' ? { json: input } : input),
      },
    );
    await response.json();
    assertEquals(response.status, 500);
    assertEquals(response.headers.getSetCookie(), []);
  });
}
