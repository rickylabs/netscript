/** Validate declared AI peer ranges and an isolated, lock-free consumer graph. @module */
import { parse, parseRange, satisfies } from '@std/semver';
import { join } from '@std/path';
import { parseRegistrySpecifier, readJsonFile } from './workspace.ts';

/** A registry version and the AI core peer declared by that release. */
export interface AiAdapterPeer {
  readonly name: string;
  readonly version: string;
  readonly corePeer?: string;
}

/** Find incompatible combinations admitted by the published import ranges. */
export function findAiPeerConflicts(
  coreVersions: readonly string[],
  adapters: readonly AiAdapterPeer[],
): string[] {
  if (coreVersions.length === 0) throw new Error('No admitted AI core versions found.');
  const conflicts: string[] = [];
  for (const adapter of adapters) {
    if (adapter.corePeer === undefined) continue;
    const range = parseRange(adapter.corePeer);
    for (const core of coreVersions) {
      if (!satisfies(parse(core), range)) {
        conflicts.push(
          `${adapter.name}@${adapter.version} requires AI ${adapter.corePeer}; got ${core}`,
        );
      }
    }
  }
  return conflicts;
}

async function registryVersions(specifier: string): Promise<AiAdapterPeer[]> {
  const output = await new Deno.Command('npm', {
    args: ['view', specifier, 'version', 'peerDependencies', '--json'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) throw new Error(`Registry metadata failed for ${specifier}.`);
  const value: unknown = JSON.parse(new TextDecoder().decode(output.stdout));
  const rows: unknown[] = Array.isArray(value) ? value : [value];
  if (rows.length === 0) throw new Error(`No registry versions found for ${specifier}.`);
  const name = specifier.slice(0, specifier.lastIndexOf('@'));
  return rows.map((row) => {
    if (typeof row === 'string') return { name, version: row };
    if (
      typeof row !== 'object' || row === null || !('version' in row) ||
      typeof row.version !== 'string'
    ) {
      throw new Error(`Malformed registry version for ${specifier}.`);
    }
    const peers = 'peerDependencies' in row ? row.peerDependencies : undefined;
    const corePeer = typeof peers === 'object' && peers !== null && '@tanstack/ai' in peers
      ? peers['@tanstack/ai']
      : undefined;
    if (corePeer !== undefined && typeof corePeer !== 'string') {
      throw new Error(`Malformed AI peer for ${specifier}.`);
    }
    return { name, version: row.version, corePeer };
  });
}

async function coldResolution(
  specifiers: readonly string[],
  publishedVersion?: string,
): Promise<string[]> {
  const temporary = await Deno.makeTempDir({ prefix: 'netscript-ai-peers-' });
  try {
    const entrypoint = join(temporary, 'consumer.ts');
    const imports = publishedVersion === undefined ? specifiers : [
      `jsr:@netscript/ai@${publishedVersion}/anthropic`,
      `jsr:@netscript/ai@${publishedVersion}/openai-compatible`,
    ];
    await Deno.writeTextFile(
      entrypoint,
      imports.map((value) => `import ${JSON.stringify(value)};`).join('\n'),
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['info', '--no-config', '--no-lock', '--node-modules-dir=none', '--json', entrypoint],
      cwd: temporary,
      env: { DENO_DIR: join(temporary, 'cache') },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!output.success) throw new Error('Cold consumer resolution failed.');
    const graph: { npmPackages?: Record<string, unknown>; modules?: { error?: unknown }[] } = JSON
      .parse(new TextDecoder().decode(output.stdout));
    if (graph.modules?.some((module) => module.error !== undefined)) {
      throw new Error('Cold consumer graph has unresolved modules.');
    }
    const packages = Object.keys(graph.npmPackages ?? {});
    const core = [
      ...new Set(
        packages.filter((name) => name.startsWith('@tanstack/ai@'))
          .map((name) => name.slice('@tanstack/ai@'.length).split('_')[0]!),
      ),
    ];
    if (core.length !== 1) {
      throw new Error('Cold consumer must resolve exactly one AI core version.');
    }
    const adapters = await Promise.all(
      packages.filter((name) => name.startsWith('@tanstack/ai-'))
        .map((name) => registryVersions(name.split('_')[0]!)),
    );
    const conflicts = findAiPeerConflicts(core, adapters.flat());
    if (conflicts.length) throw new Error(conflicts.join('\n'));
    return core;
  } finally {
    await Deno.remove(temporary, { recursive: true });
  }
}

async function main(): Promise<void> {
  const publishedIndex = Deno.args.indexOf('--published-version');
  const publishedVersion = publishedIndex < 0 ? undefined : Deno.args[publishedIndex + 1];
  if (publishedIndex >= 0 && !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(publishedVersion ?? '')) {
    throw new Error('Pass an exact published package version.');
  }
  const declarations = new Set<string>();
  for (const path of ['packages/ai/deno.json', 'packages/fresh/deno.json']) {
    const config = await readJsonFile(path);
    const imports = config.imports;
    if (typeof imports !== 'object' || imports === null) {
      throw new Error(`Missing imports: ${path}`);
    }
    for (const value of Object.values(imports)) {
      if (typeof value !== 'string') continue;
      const parsed = parseRegistrySpecifier(value);
      if (parsed?.name === '@tanstack/ai' || parsed?.name.startsWith('@tanstack/ai-')) {
        declarations.add(value);
      }
    }
  }
  const metadata = await Promise.all(
    [...declarations].map((value) => registryVersions(value.slice(4))),
  );
  const rows = metadata.flat();
  const core = rows.filter((row) => row.name === '@tanstack/ai').map((row) => row.version);
  const conflicts = findAiPeerConflicts(core, rows.filter((row) => row.name !== '@tanstack/ai'));
  if (conflicts.length) throw new Error(conflicts.join('\n'));
  const resolved = await coldResolution([...declarations], publishedVersion);
  console.log(JSON.stringify({ ok: true, core: resolved, lockFree: true, publishedVersion }));
}

if (import.meta.main) await main();
