import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';
import { buildScaffoldPluginJson } from '@netscript/plugin/scaffold';
import { MemoryFileSystemAdapter } from '@netscript/plugin/testing';
import type { PluginLogger, ScaffolderContext } from '@netscript/plugin/scaffold';
import { createPluginScaffold } from '@netscript/plugin/scaffold';
import { buildArtifacts } from './scaffolder.ts';
import { triggersManifestSpec } from './spec.ts';

/** Manifest version pinned to the triggers package version. */
const MANIFEST_VERSION = '0.0.1-alpha.12';

/** Dep-internal directories the thin scaffolder must never emit into a user workspace. */
const FORBIDDEN_PREFIXES = [
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'bin/',
  'database/',
] as const;

const silentLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function context(workspaceRoot: string, dryRun: boolean): ScaffolderContext {
  return { workspaceRoot, options: { pluginName: 'triggers' }, dryRun, logger: silentLogger };
}

/** Resolve the triggers plugin root from this test file (src/scaffold -> plugins/triggers). */
function pluginRoot(): string {
  return fromFileUrl(new URL('../../', import.meta.url));
}

Deno.test('triggersManifestSpec reproduces the committed scaffold.plugin.json byte-for-byte', async () => {
  const committed = await Deno.readTextFile(`${pluginRoot()}scaffold.plugin.json`);
  const built = buildScaffoldPluginJson(triggersManifestSpec, MANIFEST_VERSION);
  assertEquals(built, committed);
});

Deno.test('buildArtifacts emits only the four userland sample stubs', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  assertEquals(artifacts.map((artifact) => artifact.path), [
    'triggers/generic-inbound-webhook.ts',
    'triggers/daily-maintenance.ts',
    'triggers/incoming-file-watch.ts',
    'triggers/mod.ts',
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
    // No plugins/<name>/ copy of the plugin source either.
    assertEquals(
      artifact.path.startsWith('plugins/'),
      false,
      `artifact ${artifact.path} must not write into plugins/`,
    );
  }
});

Deno.test('userland sample stubs import the published runtime core, not plugin internals', () => {
  const artifacts = buildArtifacts(context('/ws', false));
  const webhook = artifacts.find((artifact) =>
    artifact.path === 'triggers/generic-inbound-webhook.ts'
  );
  const schedule = artifacts.find((artifact) => artifact.path === 'triggers/daily-maintenance.ts');
  const fileWatch = artifacts.find((artifact) =>
    artifact.path === 'triggers/incoming-file-watch.ts'
  );
  const barrel = artifacts.find((artifact) => artifact.path === 'triggers/mod.ts');
  assertStringIncludes(webhook?.content ?? '', "from '@netscript/plugin-triggers-core/builders'");
  assertStringIncludes(schedule?.content ?? '', "from '@netscript/plugin-triggers-core/builders'");
  assertStringIncludes(fileWatch?.content ?? '', "from '@netscript/plugin-triggers-core/builders'");
  assertStringIncludes(barrel?.content ?? '', "from './generic-inbound-webhook.ts'");
  assertStringIncludes(barrel?.content ?? '', "from './daily-maintenance.ts'");
  assertStringIncludes(barrel?.content ?? '', "from './incoming-file-watch.ts'");
});

Deno.test('scaffold writes the userland stubs through the file system port', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, [
    'triggers/generic-inbound-webhook.ts',
    'triggers/daily-maintenance.ts',
    'triggers/incoming-file-watch.ts',
    'triggers/mod.ts',
  ]);
  assertEquals(result.modifiedFiles, []);
  assertEquals(result.databaseMigrationsAdded, false);
  assertStringIncludes(
    fileSystem.files.get('/ws/triggers/generic-inbound-webhook.ts') ?? '',
    'defineWebhook',
  );
  assertStringIncludes(
    fileSystem.files.get('/ws/triggers/mod.ts') ?? '',
    'genericInboundWebhookTrigger',
  );
});

Deno.test('scaffold dryRun writes nothing and reports planned', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });

  const result = await scaffold(context('/ws', true));

  assertEquals(result.status, 'planned');
  assertEquals(result.createdFiles, [
    'triggers/generic-inbound-webhook.ts',
    'triggers/daily-maintenance.ts',
    'triggers/incoming-file-watch.ts',
    'triggers/mod.ts',
  ]);
  assertEquals(fileSystem.files.size, 0);
});
