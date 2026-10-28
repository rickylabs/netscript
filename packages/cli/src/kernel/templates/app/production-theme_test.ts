import { assert, assertEquals } from '@std/assert';
import { walk } from '@std/fs/walk';

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
    path.startsWith('routes/') && !path.includes('(design)')
  );
  assert(productionRoutes.length > 5);
  for (const path of productionRoutes) visit(path);
  assert(seen.has('lib/theme.ts'));
  assert(seen.has('assets/theme-preset.json'));
  assert(seen.has('assets/fonts.json'));
  const preview = templates.get('routes/(design)/design/(_shared)/theme.ts')!;
  assert(preview.includes("from '@app/assets/tokens.json'"));
  const route = templates.get('routes/(design)/design/tokens.tsx')!;
  assertEquals([...route.matchAll(/\.withRoute\(/g)].length, 1);
  assert(route.includes('.withRoute(appRoutes.designTokens)'));
});
