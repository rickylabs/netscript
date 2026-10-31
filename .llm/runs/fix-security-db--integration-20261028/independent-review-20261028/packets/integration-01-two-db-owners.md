# SAME-session integration two-db-owners part1
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.


## FULL .llm/tools/deps/check-db-alignment.ts
Raw SHA256:babe9043e1296dac30e9923bbfee9d3c02f96f062c62c3ec1e90e0fdba5186b1; rawBytes:3995
/** Guard the Collection identity shared by SDK query and Fresh stream adapters. */
import { join, toFileUrl } from '@std/path';
import { parseRegistrySpecifier, readJsonFile } from './workspace.ts';

interface DependencyGraph {
  readonly npmPackages?: Readonly<Record<string, unknown>>;
  readonly modules?: readonly { readonly kind?: string; readonly error?: unknown }[];
}

/** Cold graph verdict; identities include peer-resolution suffixes. */
export interface DbAlignmentReport {
  readonly identities: readonly string[];
  readonly findings: readonly string[];
}

/** Fail closed on absent, mixed or incomplete Collection graphs. */
export function analyzeDbGraph(graph: DependencyGraph): DbAlignmentReport {
  const identities = Object.keys(graph.npmPackages ?? {}).filter((key) =>
    key.startsWith('@tanstack/db@')
  ).sort();
  const findings: string[] = [];
  if (identities.length !== 1) {
    findings.push('Expected exactly one complete @tanstack/db identity');
  }
  const modules = graph.modules ?? [];
  if (!modules.some((module) => typeof module.kind === 'string' && module.kind !== 'external')) {
    findings.push('Consumer graph contains no resolved modules');
  }
  if (modules.some((module) => module.error !== undefined)) {
    findings.push('Consumer graph contains unresolved modules');
  }
  return { identities, findings };
}

async function declaredImports(root: string, freshOnly: boolean): Promise<string[]> {
  const owners = freshOnly ? ['packages/fresh'] : ['packages/sdk', 'packages/fresh'];
  const imports: string[] = [];
  for (const owner of owners) {
    const config = await readJsonFile(join(root, owner, 'deno.json'));
    const declared = config.imports;
    if (!declared || typeof declared !== 'object') throw new Error('Missing owner imports');
    const names = owner === 'packages/sdk'
      ? ['@tanstack/db', '@tanstack/query-db-collection']
      : ['@tanstack/react-db', '@durable-streams/state'];
    for (const name of names) {
      const specifier: unknown = Reflect.get(declared, name);
      if (typeof specifier !== 'string' || !parseRegistrySpecifier(specifier)) {
        throw new Error(`Missing declared npm dependency: ${name}`);
      }
      imports.push(name === '@durable-streams/state' ? `${specifier}/db` : specifier);
    }
  }
  return imports;
}

async function checkColdConsumer(root: string, freshOnly: boolean): Promise<boolean> {
  const directory = await Deno.makeTempDir({ prefix: 'netscript-db-cold-' });
  try {
    const entry = join(directory, 'consumer.ts');
    await Deno.writeTextFile(
      entry,
      (await declaredImports(root, freshOnly)).map((specifier) =>
        `import ${JSON.stringify(specifier)};`
      ).join('\n'),
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'info',
        '--json',
        '--no-config',
        '--no-lock',
        '--node-modules-dir=none',
        toFileUrl(entry).href,
      ],
      env: { DENO_DIR: join(directory, 'cache') },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const name = freshOnly ? 'fresh-only' : 'sdk-fresh';
    if (!result.success) {
      console.error(`db-alignment ${name} FAIL: cold resolver failed`);
      return false;
    }
    const graph: DependencyGraph = JSON.parse(new TextDecoder().decode(result.stdout));
    const report = analyzeDbGraph(graph);
    console.log(`db-alignment ${name} identities=${report.identities.join(',') || '<none>'}`);
    for (const finding of report.findings) console.error(`db-alignment ${name} FAIL: ${finding}`);
    return report.findings.length === 0;
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
}

if (import.meta.main) {
  if (Deno.args.length !== 0) throw new Error('DB guard accepts no arguments');
  const mixed = await checkColdConsumer(Deno.cwd(), false);
  const fresh = await checkColdConsumer(Deno.cwd(), true);
  if (!mixed || !fresh) Deno.exit(1);
  console.log('db-alignment PASS');
}


## FULL .llm/tools/deps/check-db-alignment_test.ts
Raw SHA256:634c289a7f7b60d8212a227294ed096ed70dc35559732de024d6332a2bbaf96b; rawBytes:3088
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


