import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { buildScaffoldPluginJson } from '@netscript/plugin/scaffold';
import { MemoryFileSystemAdapter } from '@netscript/plugin/testing';
import type { PluginLogger, ScaffolderContext } from '@netscript/plugin/scaffold';
import { createPluginScaffold } from '@netscript/plugin/scaffold';
import { buildArtifacts } from './scaffolder.ts';
import { streamsManifestSpec } from './spec.ts';

/** Manifest version pinned to the streams package version. */
const MANIFEST_VERSION = '0.0.1-alpha.12';

/**
 * Dep-internal paths the thin scaffolder must never emit into a user workspace. The legacy streams
 * scaffolder copied an entire `plugins/<name>/` plugin tree; this sweep proves that is gone.
 */
const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'src/streams/',
  'src/aspire/',
  'src/e2e/',
  'scaffold.plugin.json',
] as const;

const silentLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function context(workspaceRoot: string, dryRun: boolean): ScaffolderContext {
  return { workspaceRoot, options: { pluginName: 'streams' }, dryRun, logger: silentLogger };
}

/** Resolve the streams plugin root from this test file (src/scaffold -> plugins/streams). */
function pluginRoot(): string {
  return fromFileUrl(new URL('../../', import.meta.url));
}

Deno.test('streamsManifestSpec reproduces the committed scaffold.plugin.json byte-for-byte', async () => {
  const committed = await Deno.readTextFile(`${pluginRoot()}scaffold.plugin.json`);
  const built = buildScaffoldPluginJson(streamsManifestSpec, MANIFEST_VERSION);
  assertEquals(built, committed);
});

Deno.test('buildArtifacts emits only the two userland sample stubs', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  assertEquals(artifacts.map((artifact) => artifact.path), [
    'streams/notifications-stream.ts',
    'streams/mod.ts',
  ]);
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

Deno.test('userland sample stubs import the published runtime core, not plugin internals', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  const sample = artifacts.find((artifact) => artifact.path === 'streams/notifications-stream.ts');
  const barrel = artifacts.find((artifact) => artifact.path === 'streams/mod.ts');
  assertStringIncludes(sample?.content ?? '', "from '@netscript/plugin-streams-core'");
  assertStringIncludes(barrel?.content ?? '', "from './notifications-stream.ts'");
});

Deno.test('scaffold writes the userland stubs through the file system port', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, [
    'streams/notifications-stream.ts',
    'streams/mod.ts',
  ]);
  assertEquals(result.modifiedFiles, []);
  assertEquals(result.databaseMigrationsAdded, false);
  assertStringIncludes(
    fileSystem.files.get('/ws/streams/notifications-stream.ts') ?? '',
    'createDurableStream',
  );
  assertStringIncludes(
    fileSystem.files.get('/ws/streams/mod.ts') ?? '',
    'notificationsStream',
  );
});

Deno.test('scaffold dryRun writes nothing and reports planned', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', true));

  assertEquals(result.status, 'planned');
  assertEquals(result.createdFiles, [
    'streams/notifications-stream.ts',
    'streams/mod.ts',
  ]);
  assertEquals(fileSystem.files.size, 0);
});
