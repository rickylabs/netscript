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
  "export const HealthStatus = { Healthy: 'Healthy', Unhealthy: 'Unhealthy' };\n",
);
// Match the helper's relative SDK import shape.
await Deno.mkdir(join(root, '.helpers'));
const generatedPath = join(root, '.helpers/_aspire-compat.mts');
await Deno.writeTextFile(
  generatedPath,
  source.replace(
    processImport,
    "import { execFileSync } from 'data:text/javascript,export function execFileSync() {}';",
  )
    .replace("from 'zod';", `from '${import.meta.resolve('zod')}';`),
);
const { ensureGarnetToolManifest } = await import(toFileUrl(generatedPath).href);
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
afterAll(() => Deno.remove(root, { recursive: true }));
