import { assertEquals } from '@std/assert';
import { fromFileUrl, toFileUrl } from '@std/path';

const CONFIG = fromFileUrl(new URL('../../../../deno.json', import.meta.url));
const PROVIDER = new URL('../../../../packages/auth-better-auth/mod.ts', import.meta.url).href;
const REGISTRY = new URL('../../services/src/backend-registry.ts', import.meta.url).href;

for (const style of ['absent', 'lower', 'upper'] as const) {
  Deno.test(`auth plugin production sign-in rate rule uses ${style} configuration`, async () => {
    const root = await Deno.makeTempDir();
    const wrapper = `${root}/provider.ts`;
    const customRules = { '/sign-in/*': { window: 60, max: 1 } };
    const appsettings = style === 'lower'
      ? { auth: { rateLimit: { customRules } } }
      : style === 'upper'
      ? { Auth: { RateLimit: { customRules } } }
      : {};
    try {
      // Observe the real provider made by the plugin registry without adding a
      // product injection hook. This wrapper always invokes the original factory.
      await Deno.writeTextFile(
        wrapper,
        `export * from ${JSON.stringify(PROVIDER)};
import { createNetscriptBetterAuth as createReal } from ${JSON.stringify(PROVIDER)};
export let auth;
export let received;
export function createNetscriptBetterAuth(options) {
  received = options;
  auth = createReal(options);
  return auth;
}
`,
      );
      const importMap = `${root}/import-map.json`;
      await Deno.writeTextFile(
        importMap,
        JSON.stringify({
          scopes: { [REGISTRY]: { '@netscript/auth-better-auth': toFileUrl(wrapper).href } },
        }),
      );
      const child = new Deno.Command(Deno.execPath(), {
        args: [
          'eval',
          '--no-check',
          '--unstable-kv',
          '--config',
          CONFIG,
          '--import-map',
          importMap,
          `import { createAuthServiceBackendRegistry } from ${JSON.stringify(REGISTRY)};
import * as provider from ${JSON.stringify(toFileUrl(wrapper).href)};
await createAuthServiceBackendRegistry({
  env: { NETSCRIPT_AUTH_BACKEND: 'better-auth', BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long' },
  appsettings: ${JSON.stringify(appsettings)},
});
if (!provider.auth) throw new Error('The import-map wrapper did not observe provider construction.');
const statuses = [];
for (let attempt = 0; attempt < ${style === 'absent' ? 4 : 2}; attempt++) {
  const response = await provider.auth.handler(new Request('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'x-forwarded-for': '192.0.2.15' },
    body: JSON.stringify({ email: 'fixture@example.test', password: 'test-password' }),
  }));
  statuses.push(response.status);
  await response.body?.cancel();
}
console.log('RATE_PROBE:' + JSON.stringify({ statuses, rateLimit: provider.received.betterAuthOptions?.rateLimit }));
Deno.exit(0);`,
        ],
        env: {
          NODE_ENV: 'production',
          DENO_ENV: 'production',
          BETTER_AUTH_URL: 'http://localhost:3000',
        },
        stdout: 'piped',
        stderr: 'piped',
      }).spawn();
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch { /* The owned child already exited. */ }
      }, 20_000);
      try {
        const result = await child.output();
        assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
        const line = new TextDecoder().decode(result.stdout).split('\n').find((line) =>
          line.startsWith('RATE_PROBE:')
        );
        assertEquals(JSON.parse(line?.slice('RATE_PROBE:'.length) ?? 'null'), {
          statuses: style === 'absent' ? [400, 400, 400, 429] : [400, 429],
          ...(style === 'absent' ? {} : { rateLimit: { customRules } }),
        });
      } finally {
        clearTimeout(timer);
      }
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
