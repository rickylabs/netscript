import { assert, assertEquals } from '@std/assert';
import { APP_TOKEN_FILES, PREVIEW_TOKEN_FILES } from '../token-config.ts';
import { freshUiRegistryManifest } from '../registry.manifest.ts';

Deno.test('preview assets are opt-in and lightweight metadata excludes the compiler', async () => {
  assertEquals(APP_TOKEN_FILES.length, 5);
  assertEquals(PREVIEW_TOKEN_FILES.length, 24);
  for (const item of freshUiRegistryManifest.items.filter((item) => item.kind === 'theme')) {
    assert(!item.files.some((file) => file.target.startsWith('static/presets/')), item.name);
  }
  const previews = freshUiRegistryManifest.items.find((item) => item.name === 'theme-previews')!;
  assertEquals(previews.files.length, PREVIEW_TOKEN_FILES.length);
  const entry = new URL('../token-config.ts', import.meta.url).href;
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json', entry],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0);
  const graph: {
    modules: {
      specifier: string;
      dependencies?: { isDynamic?: boolean; code?: { specifier: string } }[];
    }[];
  } = JSON.parse(new TextDecoder().decode(output.stdout));
  const modules = new Map(graph.modules.map((module) => [module.specifier, module]));
  const seen = new Set<string>();
  function visit(specifier: string) {
    if (seen.has(specifier)) return;
    seen.add(specifier);
    assert(!/style-dictionary|sources.generated|figma.generated/.test(specifier), specifier);
    for (const edge of modules.get(specifier)?.dependencies ?? []) {
      if (edge.code && !edge.isDynamic) visit(edge.code.specifier);
    }
  }
  visit(entry);
  assert(seen.size > 1);
});
