import { assertEquals } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import { analyzeDbGraph } from './check-db-alignment.ts';

Deno.test('DB guard requires one complete Collection identity and a resolved graph', () => {
  const core = '@tanstack/db@0.6.17_typescript@7.0.2';
  const modules = [{ kind: 'esm', error: undefined }];
  assertEquals(analyzeDbGraph({ npmPackages: { [core]: {} }, modules }).findings, []);
  for (
    const other of [
      '@tanstack/db@0.7.0_typescript@7.0.2',
      '@tanstack/db@0.6.17_typescript@6.0.2',
    ]
  ) {
    assertEquals(
      analyzeDbGraph({ npmPackages: { [core]: {}, [other]: {} }, modules }).findings.length,
      1,
    );
  }
  assertEquals(analyzeDbGraph({ npmPackages: {}, modules }).findings.length, 1);
  assertEquals(
    analyzeDbGraph({
      npmPackages: { [core]: {} },
      modules: [{ ...modules[0], error: 'not resolved' }],
    })
      .findings.length,
    1,
  );
});

for (
  const [name, modules] of [
    ['missing', undefined],
    ['empty', []],
    ['external-only', [{ kind: 'external', error: undefined }]],
    ['kind-less', [{}]],
  ] as const
) {
  Deno.test({
    name: `DB guard rejects ${name} module graphs despite identity metadata`,
    sanitizeOps: true,
    sanitizeResources: true,
    sanitizeExit: true,
    fn: () => {
      const graph = { npmPackages: { '@tanstack/db@0.13.0_typescript@7.0.2': {} }, modules };
      assertEquals(analyzeDbGraph(graph).findings, ['Consumer graph contains no resolved modules']);
    },
  });
}

Deno.test({
  name: 'native info resolves a cold local file URL with spaces and a fragment character',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  fn: async () => {
    const directory = await Deno.makeTempDir({ prefix: 'netscript-db-info-' });
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 10_000);
    try {
      const entry = join(directory, 'consumer space #.ts');
      await Deno.writeTextFile(entry, 'export const value = 1;\n');
      const fileUrl = toFileUrl(entry).href;
      const result = await new Deno.Command(Deno.execPath(), {
        args: ['info', '--json', '--no-config', '--no-lock', '--node-modules-dir=none', fileUrl],
        env: { DENO_DIR: join(directory, 'cache') },
        signal: controller.signal,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.success, true, new TextDecoder().decode(result.stderr));
      const graph: {
        roots: string[];
        modules: { kind: string; specifier: string; error?: unknown }[];
      } = JSON.parse(new TextDecoder().decode(result.stdout));
      assertEquals(graph.roots, [fileUrl]);
      assertEquals(graph.modules.map(({ kind, specifier }) => ({ kind, specifier })), [
        { kind: 'esm', specifier: fileUrl },
      ]);
      assertEquals(graph.modules.filter((module) => module.error !== undefined), []);
    } finally {
      clearTimeout(deadline);
      await Deno.remove(directory, { recursive: true });
    }
  },
});
