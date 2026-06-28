import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { buildScaffoldPluginJson } from '@netscript/plugin/scaffold';
import { MemoryFileSystemAdapter } from '@netscript/plugin/testing';
import type { PluginLogger, ScaffolderContext } from '@netscript/plugin/scaffold';
import { createPluginScaffold } from '@netscript/plugin/scaffold';
import { buildArtifacts } from './scaffolder.ts';
import { authManifestSpec } from './spec.ts';

/** Manifest version pinned to the auth package version. */
const MANIFEST_VERSION = '0.0.1-alpha.12';

/**
 * Dep-internal paths the thin scaffolder must never emit into a user workspace. The legacy auth
 * scaffolder copied an entire `plugins/<name>/` plugin tree (26 files, including the plugin's own
 * `deno.json` and `auth.prisma`); this sweep proves that is gone.
 */
const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'src/',
  'streams/',
  'database/',
  'scaffold.plugin.json',
  'deno.json',
  '.prisma',
] as const;

const silentLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function context(workspaceRoot: string, dryRun: boolean): ScaffolderContext {
  return { workspaceRoot, options: { pluginName: 'auth' }, dryRun, logger: silentLogger };
}

/** Resolve the auth plugin root from this test file (src/scaffold -> plugins/auth). */
function pluginRoot(): string {
  return fromFileUrl(new URL('../../', import.meta.url));
}

Deno.test('authManifestSpec reproduces the committed scaffold.plugin.json byte-for-byte', async () => {
  const committed = await Deno.readTextFile(`${pluginRoot()}scaffold.plugin.json`);
  const built = buildScaffoldPluginJson(authManifestSpec, MANIFEST_VERSION);
  assertEquals(built, committed);
});

Deno.test('buildArtifacts emits only the single userland barrel', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  assertEquals(artifacts.map((artifact) => artifact.path), ['auth/mod.ts']);
});

Deno.test('buildArtifacts never emits a dep-internal plugin path', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  for (const artifact of artifacts) {
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain dep-internal path ${forbidden}`,
      );
    }
  }
});

Deno.test('userland barrel re-exports the published auth core, not plugin internals', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  const barrel = artifacts.find((artifact) => artifact.path === 'auth/mod.ts');
  assertStringIncludes(barrel?.content ?? '', "from '@netscript/plugin-auth-core/contracts/v1'");
  assertEquals(barrel?.content.includes('services/'), false);
  assertEquals(barrel?.content.includes('plugins/'), false);
});

Deno.test('scaffold writes the userland barrel through the file system port', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, ['auth/mod.ts']);
  assertEquals(result.modifiedFiles, []);
  // Auth's database migration (auth.prisma) travels in the dependency tarball and is aggregated by
  // the CLI (D-PRISMA); the scaffolder emits no .prisma, so no migration is added at scaffold time.
  assertEquals(result.databaseMigrationsAdded, false);
  assertStringIncludes(
    fileSystem.files.get('/ws/auth/mod.ts') ?? '',
    '@netscript/plugin-auth-core/contracts/v1',
  );
});

Deno.test('scaffold dryRun writes nothing and reports planned', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', true));

  assertEquals(result.status, 'planned');
  assertEquals(result.createdFiles, ['auth/mod.ts']);
  assertEquals(result.databaseMigrationsAdded, false);
  assertEquals(fileSystem.files.size, 0);
});
