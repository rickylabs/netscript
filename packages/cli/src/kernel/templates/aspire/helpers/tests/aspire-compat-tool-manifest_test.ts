import { assertEquals } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import { afterAll } from '@std/testing/bdd';
import { SCAFFOLD_VERSIONS } from '../../../../constants/scaffold/scaffold-versions.ts';

// Execute the shipped helper with real filesystem IO. Only the process edge is replaced:
// focused manifest proofs must neither download tools nor require an installed dotnet SDK.
const root = await Deno.makeTempDir({ prefix: 'netscript-garnet-manifest-' });
const source = await Deno.readTextFile(
  new URL('../../../../assets/aspire/helpers/_aspire-compat.ts.template', import.meta.url),
);
const processImport = "import { execFileSync } from 'node:child_process';";
assertEquals(source.split(processImport).length, 2);
await Deno.mkdir(join(root, '.aspire/modules'), { recursive: true });
await Deno.writeTextFile(
  join(root, '.aspire/modules/aspire.mts'),
  "export const HealthStatus = { Healthy: 'Healthy', Unhealthy: 'Unhealthy' };\nexport const DenoPermissionKind = { Net: 'Net', Read: 'Read', Write: 'Write', Run: 'Run', Env: 'Env', Import: 'Import', Sys: 'Sys', Ffi: 'Ffi' };\n",
);
// Match the helper's relative SDK and readiness import shape.
await Deno.mkdir(join(root, '.helpers'));
const readinessSource = await Deno.readTextFile(
  new URL('../../../../assets/aspire/helpers/_apphost-readiness.ts.template', import.meta.url),
);
const postgresReadinessSource = await Deno.readTextFile(
  new URL(
    '../../../../assets/aspire/helpers/_apphost-postgres-readiness.ts.template',
    import.meta.url,
  ),
);
await Deno.writeTextFile(join(root, '.helpers/_apphost-readiness.mts'), readinessSource);
await Deno.writeTextFile(
  join(root, '.helpers/_apphost-postgres-readiness.mts'),
  postgresReadinessSource,
);
const generatedPath = join(root, '.helpers/_aspire-compat.mts');
await Deno.writeTextFile(
  generatedPath,
  source.replace(
    processImport,
    "import { execFileSync } from 'data:text/javascript,export function execFileSync() {}';",
  ),
);
const { applyDenoPermissions, ensureGarnetToolManifest } = await import(
  toFileUrl(generatedPath).href
);
const version = SCAFFOLD_VERSIONS.GARNET_TOOL;
const garnet = { version, commands: ['garnet-server'] };

const fixtures = [
  {
    name: 'absent manifest',
    initial: undefined,
    expected: { version: 1, isRoot: true, tools: { 'garnet-server': garnet } },
  },
  {
    name: 'current manifest',
    initial: { version: 1, isRoot: false, tools: { 'garnet-server': garnet } },
    expected: { version: 1, isRoot: false, tools: { 'garnet-server': garnet } },
  },
  {
    name: 'stale manifest',
    initial: {
      version: 1,
      isRoot: true,
      tools: { 'garnet-server': { ...garnet, version: '1.1.10' } },
    },
    expected: { version: 1, isRoot: true, tools: { 'garnet-server': garnet } },
  },
  {
    name: 'authored extras with stale Garnet',
    initial: {
      version: 1,
      isRoot: false,
      owner: 'fixture',
      tools: {
        'garnet-server': { ...garnet, version: '1.1.10', rollForward: false },
        'other-tool': { version: '9.0.0', commands: ['other'], rollForward: true },
      },
    },
    expected: {
      version: 1,
      isRoot: false,
      owner: 'fixture',
      tools: {
        'garnet-server': { ...garnet, rollForward: false },
        'other-tool': { version: '9.0.0', commands: ['other'], rollForward: true },
      },
    },
  },
  {
    name: 'authored extras without Garnet',
    initial: {
      version: 1,
      isRoot: false,
      tools: { 'other-tool': { version: '9.0.0', commands: ['other'] } },
    },
    expected: {
      version: 1,
      isRoot: false,
      tools: { 'other-tool': { version: '9.0.0', commands: ['other'] }, 'garnet-server': garnet },
    },
  },
];
for (const fixture of fixtures) {
  Deno.test(`generated Garnet tool manifest: ${fixture.name}`, async () => {
    const appHostDir = join(root, fixture.name);
    await Deno.mkdir(join(appHostDir, '.config'), { recursive: true });
    const manifestPath = join(appHostDir, '.config/dotnet-tools.json');
    const initialBytes = JSON.stringify(fixture.initial);
    if (initialBytes) await Deno.writeTextFile(manifestPath, initialBytes);
    assertEquals(ensureGarnetToolManifest(appHostDir, version), appHostDir);
    const written = await Deno.readTextFile(manifestPath);
    assertEquals(JSON.parse(written), fixture.expected);
    if (fixture.name === 'current manifest') assertEquals(written, initialBytes);
    ensureGarnetToolManifest(appHostDir, version);
    assertEquals(await Deno.readTextFile(manifestPath), written);
  });
}
Deno.test('generated Garnet tool manifest: explicit requested version overrides the default', async () => {
  const appHostDir = join(root, 'override');
  await Deno.mkdir(appHostDir);
  ensureGarnetToolManifest(appHostDir, version);
  ensureGarnetToolManifest(appHostDir, '1.0.61');
  const manifest = JSON.parse(
    await Deno.readTextFile(join(appHostDir, '.config/dotnet-tools.json')),
  );
  assertEquals(manifest.tools['garnet-server'].version, '1.0.61');
});
Deno.test('applyDenoPermissions maps granular permissions, watch, unstable, and allow-all without duplicate managed flags', async () => {
  const calls: Array<readonly [string, ...unknown[]]> = [];
  const target = {
    withDenoAllowAll(options?: { enabled?: boolean }) {
      calls.push(['allowAll', options]);
      return Promise.resolve();
    },
    withDenoAllow(kind: string, values: string[]) {
      calls.push(['allow', kind, values]);
      return Promise.resolve();
    },
    withDenoDeny(kind: string, values: string[]) {
      calls.push(['deny', kind, values]);
      return Promise.resolve();
    },
    withDenoWatch(options?: { hmr?: boolean }) {
      calls.push(['watch', options]);
      return Promise.resolve();
    },
    withDenoUnstable(features: string[]) {
      calls.push(['unstable', features]);
      return Promise.resolve();
    },
    withDenoRuntimeArgs(args: string[]) {
      calls.push(['runtimeArgs', args]);
      return Promise.resolve();
    },
  };

  await applyDenoPermissions(target, [
    '--allow-net',
    '--allow-read=./config,/tmp/secret',
    '--allow-read=./extra',
    '--deny-write=/etc',
    '--watch',
    '--watch-hmr',
    '--unstable-kv',
    '--unstable-worker-options',
    '--unstable-kv',
    '--node-modules-dir=none',
    '--config',
    '--minimum-dependency-age=0',
    '--cached-only',
  ]);
  assertEquals(calls, [
    ['allowAll', { enabled: false }],
    ['allow', 'Net', []],
    ['allow', 'Read', ['./config', '/tmp/secret', './extra']],
    ['deny', 'Write', ['/etc']],
    ['watch', { hmr: true }],
    ['unstable', ['kv', 'worker-options']],
    ['runtimeArgs', ['--cached-only']],
  ]);

  calls.length = 0;
  await applyDenoPermissions(target, ['-A', '--watch']);
  assertEquals(calls, [
    ['allowAll', { enabled: true }],
    ['watch', { hmr: false }],
  ]);
});
afterAll(() => Deno.remove(root, { recursive: true }));
