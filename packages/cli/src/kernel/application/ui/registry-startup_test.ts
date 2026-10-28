import { assert, assertEquals } from '@std/assert';

type Module = {
  specifier: string;
  dependencies?: { isDynamic?: boolean; code?: { specifier: string } }[];
};

Deno.test('CLI registry command graph keeps registry payload out of static startup', async () => {
  const entry = new URL('./registry.ts', import.meta.url).href;
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json', entry],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  const graph: { modules: Module[] } = JSON.parse(new TextDecoder().decode(result.stdout));
  const modules = new Map(graph.modules.map((module) => [module.specifier, module]));
  const seen = new Set<string>();
  function visit(specifier: string) {
    if (seen.has(specifier)) return;
    seen.add(specifier);
    assert(!specifier.endsWith('/fresh-ui/registry.generated.ts'), specifier);
    for (const dependency of modules.get(specifier)?.dependencies ?? []) {
      if (dependency.code && !dependency.isDynamic) visit(dependency.code.specifier);
    }
  }
  visit(entry);
  assert(seen.size > 1, 'Traverse resolved static imports, not only the entrypoint');
  assert(
    graph.modules.some((module) => module.specifier.endsWith('/fresh-ui/registry.generated.ts')),
    'Registry remains reachable through the dynamic command path',
  );
});
