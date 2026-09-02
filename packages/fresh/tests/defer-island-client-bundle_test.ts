import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { createLockedViteCommand } from './_fixtures/vite-runtime.ts';

interface ViteManifestEntry {
  readonly file: string;
  readonly isEntry?: boolean;
  readonly name?: string;
  readonly src?: string;
}

const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/defer-island-client/', import.meta.url),
);

Deno.test('vite build emits the registered defer island in the client bundle', async () => {
  const outputDir = await Deno.makeTempDir({ prefix: 'netscript-defer-island-' });
  const npmCacheDir = await Deno.makeTempDir({ prefix: 'netscript-empty-npm-cache-' });

  try {
    const output = await createLockedViteCommand({
      args: [
        'build',
        '--config',
        'vite.config.ts',
        '--outDir',
        outputDir,
      ],
      cwd: FIXTURE_ROOT,
      stdout: 'piped',
      stderr: 'piped',
      env: { NPM_CONFIG_CACHE: npmCacheDir },
    }).output();

    const stderr = new TextDecoder().decode(output.stderr);
    assertEquals(output.code, 0, `Vite fixture build failed:\n${stderr}`);

    const manifest = JSON.parse(
      await Deno.readTextFile(join(outputDir, 'client', '.vite', 'manifest.json')),
    ) as Record<string, ViteManifestEntry>;
    const islandEntries = Object.values(manifest).filter((entry) =>
      entry.name?.startsWith('fresh-island__')
    );

    assertEquals(islandEntries.length, 1, 'Expected exactly one registered island client entry');
    const islandEntry = islandEntries[0];
    assert(islandEntry.isEntry, 'Expected the defer island chunk to be a client entry');
    assertStringIncludes(
      `${islandEntry.name ?? ''} ${islandEntry.src ?? ''}`,
      'defer',
      'Expected the emitted island entry metadata to identify the defer island',
    );

    const islandBundle = await Deno.readTextFile(join(outputDir, 'client', islandEntry.file));
    assertStringIncludes(
      islandBundle,
      'partial-miss',
      'Expected the defer client policy to be present in the emitted island bundle',
    );
  } finally {
    await Deno.remove(outputDir, { recursive: true });
    await Deno.remove(npmCacheDir, { recursive: true });
  }
});
