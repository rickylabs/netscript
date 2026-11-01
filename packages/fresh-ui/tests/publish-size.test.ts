import { assert, assertEquals } from '@std/assert';
import { walk } from 'jsr:@std/fs@1';
import { fromFileUrl, relative } from '@std/path';
import { FRESH_UI_REGISTRY_CONTENT } from '../registry.generated.ts';

// Budget the actual uncompressed publish file set, not a directory approximation or tar size.
const PUBLISH_BUDGET_BYTES = 5_000_000;

// Fixed growth policy (#2561): retain the 220 KB raw ceiling; a planned 1.5 KB gzip
// allowance above #2558's measured 26,527 bytes rounds to 28 KB. Never scale with file
// count. A later raise needs an issue, before/after byte costs and browser parity evidence.
const COMPONENT_CSS_BUDGET = { raw: 220_000, gzip: 28_000 } as const;

Deno.test('shipped component CSS stays within raw and gzip budgets', async (t) => {
  const root = new URL('../', import.meta.url);
  const sources: string[] = [];
  for await (
    const entry of walk(new URL('registry/', root), {
      exts: ['.css'],
      includeDirs: false,
    })
  ) {
    const path = relative(fromFileUrl(root), entry.path).replaceAll('\\', '/');
    if (!path.startsWith('registry/theme/')) sources.push(path);
  }
  const shipped = Object.keys(FRESH_UI_REGISTRY_CONTENT)
    .filter((path) => path.endsWith('.css') && !path.startsWith('registry/theme/'))
    .sort();
  assert(sources.length > 0, 'Component CSS inventory must not be empty');
  assertEquals(shipped, sources.sort(), 'Budget must cover every authored and shipped CSS file');
  for (const path of shipped) {
    assertEquals(
      FRESH_UI_REGISTRY_CONTENT[path],
      await Deno.readTextFile(new URL(path, root)),
      `Stale shipped CSS: ${path}; run deno task gen:assets-barrel`,
    );
  }
  // Stable ordering and one separator model the combined component stylesheet before minification.
  const css = new TextEncoder().encode(
    shipped.map((path) => FRESH_UI_REGISTRY_CONTENT[path]).join('\n'),
  );
  const compressed = await new Response(
    new Blob([css]).stream().pipeThrough(new CompressionStream('gzip')),
  ).arrayBuffer();
  const bytes = { raw: css.byteLength, gzip: compressed.byteLength };
  console.log(
    JSON.stringify({
      componentCss: { files: shipped.length, bytes, budget: COMPONENT_CSS_BUDGET },
    }),
  );
  for (const kind of ['raw', 'gzip'] as const) {
    await t.step(kind, () => {
      assert(
        bytes[kind] <= COMPONENT_CSS_BUDGET[kind],
        `Component CSS ${kind} payload ${bytes[kind]} exceeds ${
          COMPONENT_CSS_BUDGET[kind]
        } bytes; ` +
          'review the fixed growth policy at COMPONENT_CSS_BUDGET before raising it',
      );
    });
  }
});

Deno.test('fresh-ui native publish file set stays below five MB', async () => {
  const root = new URL('../', import.meta.url);
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['publish', '--dry-run', '--allow-dirty'],
    cwd: root,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    env: { NO_COLOR: '1' },
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  const files = [...output.matchAll(/^\s+(file:\/\/.+) \([^\n]+\)$/gm)].map((match) => match[1]);
  assert(files.length > 0, 'Native publish output must enumerate files');
  const bytes = (await Promise.all(files.map(async (url) => (await Deno.stat(new URL(url))).size)))
    .reduce((sum, size) => sum + size, 0);
  console.log(
    JSON.stringify({
      package: '@netscript/fresh-ui',
      files: files.length,
      bytes,
      budget: PUBLISH_BUDGET_BYTES,
    }),
  );
  assert(
    bytes <= PUBLISH_BUDGET_BYTES,
    `Published payload ${bytes} exceeds ${PUBLISH_BUDGET_BYTES} bytes`,
  );
});
