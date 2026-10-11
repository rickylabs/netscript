/** Signal test child: a held delivery must drain through the shipped service's hook. */
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { serveAuthService } from '../../services/src/auth-service-runtime.ts';
import { createAuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
import { createAuthServiceGuard } from '../../services/src/auth-guard.ts';
import { MemoryKvAdapter } from '@netscript/kv';

const kv = new MemoryKvAdapter();
let started = false;
const drained = Promise.withResolvers<void>();
const release = new Response(Deno.stdin.readable).text();
const registry = await createAuthServiceBackendRegistry({
  kv,
  env: {
    PORT: '0',
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
  },
});
await serveAuthService(
  {
    env: { PORT: '0' },
    kv,
    logger: {},
    contracts: {},
    db: { getClient: () => Promise.resolve({}) },
  },
  {
    ...registry,
    cookieName: '__Host-ns_session',
    background: {
      start() {
        started = true;
        console.log('worker-started');
        return drained.promise;
      },
      async stop() {
        await release;
        console.log('worker-drained');
        drained.resolve();
      },
    },
  },
  {
    name: 'auth',
    port: 0,
    auth: createAuthServiceGuard(registry),
    context: () => ({
      registry,
      telemetry: createAuthTelemetry(),
      cookieName: '__Host-ns_session',
    }),
  },
);
if (!started) throw new Error('Shipped runtime did not start its background worker.');
await kv.close();
await drained.promise;
