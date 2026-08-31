interface InfoDependency {
  readonly specifier: string;
}

interface InfoModule {
  readonly dependencies?: readonly InfoDependency[];
  readonly specifier: string;
}

interface InfoGraph {
  readonly modules: readonly InfoModule[];
}

const sdkRoot = new URL('../../mod.ts', import.meta.url);
const sdkPresets = new URL('../../src/presets/mod.ts', import.meta.url);
const queryEntry = new URL('../../src/query/mod.ts', import.meta.url);

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

function findBrowserUnsafeEdges(graph: InfoGraph): readonly string[] {
  const unsafeEdges = new Set<string>();

  for (const module of graph.modules) {
    if (
      module.specifier.includes('/packages/kv/') ||
      module.specifier.startsWith('jsr:@netscript/kv') ||
      module.specifier.startsWith('jsr:/@netscript/kv') ||
      module.specifier.startsWith('node:') ||
      module.specifier.includes('/packages/logger/')
    ) {
      unsafeEdges.add(module.specifier);
    }

    for (const dependency of module.dependencies ?? []) {
      if (
        dependency.specifier === '@netscript/kv' ||
        dependency.specifier.startsWith('node:')
      ) {
        unsafeEdges.add(`${module.specifier} -> ${dependency.specifier}`);
      }
    }
  }

  return [...unsafeEdges].sort();
}

Deno.test('defineServices entries remain browser-safe and do not install the server cache', async () => {
  const childSource = `
    const sdk = await import(${JSON.stringify(sdkRoot.href)});
    if (typeof sdk.defineServices !== 'function') {
      throw new Error('SDK root no longer exports defineServices');
    }

    const query = await import(${JSON.stringify(queryEntry.href)});
    const rootHasProvider = query.hasCacheProvider();
    if (rootHasProvider !== false) {
      throw new Error(
        'Expected root defineServices import to leave hasCacheProvider() false; observed ' +
          String(rootHasProvider),
      );
    }

    const presets = await import(${JSON.stringify(sdkPresets.href)});
    if (typeof presets.defineServices !== 'function') {
      throw new Error('SDK presets entry does not export defineServices');
    }
    if (query.hasCacheProvider() !== false) {
      throw new Error('SDK presets import installed a cache provider');
    }
  `;
  const child = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--quiet', childSource],
    stderr: 'piped',
    stdout: 'piped',
  }).output();

  if (!child.success) {
    throw new Error(
      `fresh Deno child rejected a defineServices entry (exit ${child.code}):\n${
        decode(child.stderr)
      }`,
    );
  }

  for (const entry of [sdkRoot, sdkPresets]) {
    const unsafeEdges = findBrowserUnsafeEdges(await readInfoGraph(entry));
    if (unsafeEdges.length > 0) {
      throw new Error(
        `${entry.pathname} reaches server-only browser-unsafe edges:\n${unsafeEdges.join('\n')}`,
      );
    }
  }
});
