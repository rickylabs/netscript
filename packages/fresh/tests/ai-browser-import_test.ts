import { assert } from '@std/assert';

interface InfoDependency {
  readonly specifier: string;
  readonly code?: {
    readonly specifier?: string;
  };
}

interface InfoModule {
  readonly dependencies?: readonly InfoDependency[];
  readonly specifier: string;
}

interface InfoGraph {
  readonly roots: readonly string[];
  readonly modules: readonly InfoModule[];
}

interface BrowserUnsafeGraphReport {
  readonly visitedCount: number;
  readonly unsafeEdges: readonly string[];
}

const aiEntry = new URL('../src/runtime/ai/mod.ts', import.meta.url);

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function readInfoGraph(entry: URL): Promise<InfoGraph> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json', entry.href],
    stderr: 'piped',
    stdout: 'piped',
  }).output();

  if (!output.success) {
    throw new Error(
      `deno info failed for ${entry.href} (exit ${output.code}):\n${decode(output.stderr)}`,
    );
  }

  return JSON.parse(decode(output.stdout));
}

function isBrowserUnsafeSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith('node:') ||
    specifier.includes('/packages/logger/') ||
    specifier === '@netscript/logger' ||
    specifier.startsWith('jsr:@netscript/logger') ||
    specifier.startsWith('jsr:/@netscript/logger') ||
    specifier.includes('/packages/kv/') ||
    specifier === '@netscript/kv' ||
    specifier.startsWith('jsr:@netscript/kv') ||
    specifier.startsWith('jsr:/@netscript/kv') ||
    specifier.includes('/packages/service/') ||
    specifier === '@netscript/service' ||
    specifier.startsWith('jsr:@netscript/service') ||
    specifier.startsWith('jsr:/@netscript/service')
  );
}

function findBrowserUnsafeEdges(graph: InfoGraph): BrowserUnsafeGraphReport {
  const bySpecifier = new Map(graph.modules.map((module) => [module.specifier, module]));
  const visited = new Set<string>();
  const queue = [...graph.roots];
  const unsafeEdges = new Set<string>();

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (visited.has(current)) continue;
    visited.add(current);

    if (isBrowserUnsafeSpecifier(current)) {
      unsafeEdges.add(current);
    }

    const module = bySpecifier.get(current);
    if (!module) continue;

    for (const dependency of module.dependencies ?? []) {
      const next = dependency.code?.specifier;
      if (!next) continue;

      if (isBrowserUnsafeSpecifier(next)) {
        unsafeEdges.add(`${current} -> ${next}`);
      }
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return {
    visitedCount: visited.size,
    unsafeEdges: [...unsafeEdges].sort(),
  };
}

Deno.test(
  '@netscript/fresh/ai remains browser-safe without node: or logger/kv/service runtime edges',
  async () => {
    const { visitedCount, unsafeEdges } = findBrowserUnsafeEdges(await readInfoGraph(aiEntry));
    assert(visitedCount > 0, `Expected non-empty runtime graph for ${aiEntry.href}`);
    if (unsafeEdges.length > 0) {
      throw new Error(
        `${aiEntry.pathname} reaches server-only runtime edges:\n${unsafeEdges.join('\n')}`,
      );
    }
  },
);
