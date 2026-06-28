import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { buildScaffoldPluginJson } from './manifest-spec.ts';
import { committedSpecs, FIXTURE_VERSION } from './test_fixtures/manifest-specs.ts';

/** Resolve the repo root from this test file (packages/plugin/src/scaffold -> repo root). */
function repoRoot(): string {
  return fromFileUrl(new URL('../../../../', import.meta.url));
}

Deno.test('buildScaffoldPluginJson reproduces every committed scaffold.plugin.json byte-for-byte', async () => {
  for (const { dir, spec } of committedSpecs) {
    const path = `${repoRoot()}plugins/${dir}/scaffold.plugin.json`;
    const committed = await Deno.readTextFile(path);
    const built = buildScaffoldPluginJson(spec, FIXTURE_VERSION);
    assertEquals(built, committed, `manifest mismatch for plugins/${dir}`);
  }
});

Deno.test('buildScaffoldPluginJson injects version into version and peerDependencies', () => {
  const json = buildScaffoldPluginJson(committedSpecs[0].spec, '9.9.9');
  const parsed = JSON.parse(json);
  assertEquals(parsed.version, '9.9.9');
  assertEquals(parsed.peerDependencies['@netscript/plugin'], '9.9.9');
});

Deno.test('buildScaffoldPluginJson output ends with a single trailing newline', () => {
  const json = buildScaffoldPluginJson(committedSpecs[0].spec, FIXTURE_VERSION);
  assertEquals(json.endsWith('}\n'), true);
  assertEquals(json.endsWith('}\n\n'), false);
});
