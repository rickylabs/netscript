import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs/walk';
import { join, toFileUrl } from '@std/path';

Deno.test('production route template graph imports only small theme metadata', async () => {
  const root = new URL('../../assets/app/', import.meta.url);
  const templates = new Map<string, string>();
  for await (const entry of walk(root, { includeDirs: false, exts: ['.template'] })) {
    const path = new URL(`file://${entry.path}`).href.slice(root.href.length).replace(
      /\.template$/,
      '',
    );
    templates.set(path, await Deno.readTextFile(entry.path));
  }
  const routeFilters: Record<'development' | 'production', readonly RegExp[]> = {
    development: [],
    production: [],
  };
  const configRoot = await Deno.makeTempDir({ prefix: 'netscript-production-theme-' });
  try {
    // Capture the actual config callback's Fresh options without starting its plugin side effects.
    const stubs = `
export let freshOptions: { ignore?: readonly RegExp[]; islandSpecifiers?: readonly string[] } | undefined;
const fresh = (options: NonNullable<typeof freshOptions>) => { freshOptions = options; return {}; };
const tailwindCSS = () => ({});
const createNetScriptVitePlugin = (_options: unknown) => ({});
const loadEnv = (..._args: readonly string[]): Record<string, string> => ({});
const defineConfig = (configure: (env: { mode: string }) => unknown) => configure;
`;
    const configPath = join(configRoot, 'vite.config.ts');
    await Deno.writeTextFile(
      configPath,
      stubs +
        templates.get('vite.config.ts')!.replace(/^import .* from '(?!node:)[^']+';\r?\n/gm, ''),
    );
    const config = await import(toFileUrl(configPath).href);
    for (const mode of ['development', 'production'] as const) {
      config.default({ mode });
      const ignored: unknown = config.freshOptions?.ignore;
      assert(Array.isArray(ignored) && ignored.every((pattern) => pattern instanceof RegExp));
      routeFilters[mode] = ignored;
    }
  } finally {
    await Deno.remove(configRoot, { recursive: true });
  }
  assertEquals(routeFilters.development, []);
  for (
    const path of [
      '/app/routes/(design)/design/tokens.tsx',
      'C:\\app\\routes\\(design)\\design\\tokens.tsx',
    ]
  ) {
    assert(
      routeFilters.production.some((pattern) => pattern.test(path)),
      'Production Vite routes must exclude the eager design-only token catalog import',
    );
  }
  const seen = new Set<string>();
  function visit(path: string) {
    if (seen.has(path)) return;
    seen.add(path);
    assert(!path.endsWith('tokens.json'), `Production imports full manifest through ${path}`);
    assert(!path.includes('(design)'), `Production imports a design module: ${path}`);
    const content = templates.get(path);
    if (!content) return;
    for (const match of content.matchAll(/(?:from\s*|import\s*\(?\s*)['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      const next = specifier.startsWith('@app/')
        ? specifier.slice(5)
        : specifier.startsWith('.')
        ? new URL(specifier, new URL(path, root)).href.slice(root.href.length)
        : undefined;
      if (next) visit(next);
    }
  }
  const productionRoutes = [...templates.keys()].filter((path) =>
    path.startsWith('routes/') &&
    !routeFilters.production.some((pattern) => pattern.test(`/app/${path}`))
  );
  assert(productionRoutes.length > 5);
  for (const path of productionRoutes) visit(path);
  assert(seen.has('lib/theme.ts'));
  assert(seen.has('assets/theme-preset.json'));
  assert(seen.has('assets/fonts.json'));
  const designLayout = templates.get('routes/(design)/design/_layout.tsx')!;
  assertStringIncludes(designLayout, "from './(_shared)/theme.ts'");
  const preview = templates.get('routes/(design)/design/(_shared)/theme.ts')!;
  assert(preview.includes("from '@app/assets/tokens.json'"));
  const route = templates.get('routes/(design)/design/tokens.tsx')!;
  assertEquals([...route.matchAll(/\.withRoute\(/g)].length, 1);
  assert(route.includes('.withRoute(appRoutes.designTokens)'));
});
