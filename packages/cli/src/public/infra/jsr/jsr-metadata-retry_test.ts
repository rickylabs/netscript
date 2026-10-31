import { assertEquals, assertStringIncludes } from '@std/assert';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { FetchJsrPluginValidator, WebFetchJsrHttpClient } from './fetch-jsr-plugin-validator.ts';
import { resolvePluginPackageSpec } from '../../features/plugins/install/plugin-package-resolver.ts';

const version = '1.0.0';
const base = 'https://jsr.io/@example/plugin';
const fixtures = new Map<string, unknown>([
  [`${base}/meta.json`, { latest: version, versions: { [version]: {} } }],
  [`${base}/${version}_meta.json`, { exports: { '.': './mod.ts' }, manifest: {} }],
  ['https://api.jsr.io/scopes/example/packages/plugin', {}],
  [`${base}/${version}/scaffold.plugin.json`, {
    schemaVersion: 1,
    name: '@example/plugin',
    version,
    displayName: 'Fixture',
    description: 'Fixture plugin',
    peerDependencies: {},
    capabilities: { hasDatabaseMigrations: false, hasRoutes: false, hasBackgroundWorkers: false },
    scaffolder: {
      export: './scaffold',
      requiredPermissions: { net: [], read: [], write: [] },
    },
  }],
]);

for (const target of fixtures.keys()) {
  for (const persistent of [false, true]) {
    Deno.test(`JSR validator ${target}: ${persistent ? 'terminal diagnostics' : 'recovers after 502'}`, async () => {
      using time = new FakeTime();
      let attempts = 0;
      const fetcher: typeof fetch = (input) => {
        const url = String(input);
        if (url === target && (++attempts === 1 || persistent)) {
          return Promise.resolve(new Response(null, { status: persistent ? 503 : 502 }));
        }
        assertEquals(fixtures.has(url), true);
        return Promise.resolve(Response.json(fixtures.get(url)));
      };
      const validator = new FetchJsrPluginValidator(new WebFetchJsrHttpClient(fetcher));
      const pending = validator.validate(resolvePluginPackageSpec('@example/plugin'));
      await time.runMicrotasks();
      await time.nextAsync();
      await time.nextAsync();
      const result = await pending;
      assertEquals(result.ok, !persistent);
      assertEquals(attempts, persistent ? 3 : 2);
      if (!result.ok) {
        assertEquals(result.error.code, 'invalid-metadata');
        assertStringIncludes(result.error.message, target);
        assertStringIncludes(result.error.message, '3 attempts');
        assertStringIncludes(result.error.message, 'HTTP 503');
      }
    });
  }
}

Deno.test('JSR validator 404 preserves not-found result without retry', async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(new Response(null, { status: 404 }));
  };
  const result = await new FetchJsrPluginValidator(new WebFetchJsrHttpClient(fetcher)).validate(
    resolvePluginPackageSpec('@example/plugin'),
  );
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.code, 'not-found');
  assertEquals(calls, 1);
});
