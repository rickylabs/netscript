/** Guard the Collection identity shared by SDK query and Fresh stream adapters. */
import { join } from '@std/path';
import { parseRegistrySpecifier, readJsonFile } from './workspace.ts';

interface DependencyGraph {
  readonly npmPackages?: Readonly<Record<string, unknown>>;
  readonly modules?: readonly { readonly error?: unknown }[];
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
  if ((graph.modules ?? []).some((module) => module.error !== undefined)) {
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
      args: ['info', '--json', '--no-config', '--no-lock', '--node-modules-dir=none', entry],
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
