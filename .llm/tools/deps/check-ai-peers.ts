/** Validate declared AI peer ranges and an isolated, lock-free consumer graph. @module */
import { parseArgs } from 'jsr:@std/cli@1/parse-args';
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
  if (coreVersions.length === 0) {
    throw new Error('No admitted AI core versions found.');
  }
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

/** Inventory exact resolved releases, including transitive holders outside adapter names. */
export function resolvedNpmSpecifiers(packageIds: readonly string[]): string[] {
  return [
    ...new Set(packageIds.map((id) => {
      const delimiter = id.indexOf('@', 1);
      if (delimiter < 1) {
        throw new Error(`Malformed resolved npm package: ${id}`);
      }
      return `${id.slice(0, delimiter)}@${id.slice(delimiter + 1).split('_')[0]}`;
    })),
  ];
}

/** Parse an exact published probe version without silently selecting workspace mode. */
export function parsePublishedVersion(
  args: readonly string[],
): string | undefined {
  const parsed = parseArgs([...args], {
    string: ['published-version'],
    collect: ['published-version'],
    unknown: () => {
      throw new Error('Unknown AI peer probe argument.');
    },
  });
  const versions = parsed['published-version'];
  if (parsed._.length !== 0 || versions.length > 1) {
    throw new Error('Pass one exact published package version.');
  }
  if (versions.length === 0) return undefined;
  const version = versions[0];
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) {
    throw new Error('Pass an exact published package version.');
  }
  parse(version);
  return version;
}

/** Read each admitted release's peer metadata independently of npm range-output shape. */
export async function loadRegistryVersions(
  specifier: string,
  view: (
    specifier: string,
    field: 'version' | 'peerDependencies',
  ) => Promise<unknown>,
): Promise<AiAdapterPeer[]> {
  const value = await view(specifier, 'version');
  const versions: unknown[] = Array.isArray(value) ? value : [value];
  if (
    versions.length === 0 ||
    versions.some((version) => typeof version !== 'string')
  ) {
    throw new Error(`Malformed registry versions for ${specifier}.`);
  }
  const name = specifier.slice(0, specifier.lastIndexOf('@'));
  const rows: AiAdapterPeer[] = [];
  for (let index = 0; index < versions.length; index += 8) {
    const batch = await Promise.all(
      versions.slice(index, index + 8).map(async (version) => {
        if (typeof version !== 'string') {
          throw new Error('Malformed registry version.');
        }
        parse(version);
        const metadata = await view(`${name}@${version}`, 'peerDependencies');
        const peers = Array.isArray(metadata) && metadata.length === 1 ? metadata[0] : metadata;
        if (
          peers !== undefined &&
          (typeof peers !== 'object' || peers === null || Array.isArray(peers))
        ) {
          throw new Error(`Malformed registry peers for ${name}@${version}.`);
        }
        const corePeer = peers !== undefined && '@tanstack/ai' in peers
          ? peers['@tanstack/ai']
          : undefined;
        if (corePeer !== undefined && typeof corePeer !== 'string') {
          throw new Error(`Malformed AI peer for ${name}@${version}.`);
        }
        return { name, version, corePeer };
      }),
    );
    rows.push(...batch);
  }
  return rows;
}

async function registryView(
  specifier: string,
  field: 'version' | 'peerDependencies',
): Promise<unknown> {
  const output = await new Deno.Command('npm', {
    args: ['view', specifier, field, '--json'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(`Registry metadata failed for ${specifier}.`);
  }
  const text = new TextDecoder().decode(output.stdout).trim();
  return text === '' ? undefined : JSON.parse(text);
}

function registryVersions(specifier: string): Promise<AiAdapterPeer[]> {
  return loadRegistryVersions(specifier, registryView);
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
      args: [
        'info',
        '--no-config',
        '--no-lock',
        '--node-modules-dir=none',
        '--json',
        entrypoint,
      ],
      cwd: temporary,
      env: { DENO_DIR: join(temporary, 'cache') },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!output.success) throw new Error('Cold consumer resolution failed.');
    const graph: {
      npmPackages?: Record<string, unknown>;
      modules?: { error?: unknown }[];
    } = JSON
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
      throw new Error(
        'Cold consumer must resolve exactly one AI core version.',
      );
    }
    const releases = resolvedNpmSpecifiers(packages);
    const adapters: AiAdapterPeer[] = [];
    // Registry subprocesses stay bounded even for a large published consumer graph.
    for (let index = 0; index < releases.length; index += 8) {
      const batch = await Promise.all(
        releases.slice(index, index + 8).map(registryVersions),
      );
      adapters.push(...batch.flat());
    }
    const conflicts = findAiPeerConflicts(core, adapters);
    if (conflicts.length) throw new Error(conflicts.join('\n'));
    return core;
  } finally {
    await Deno.remove(temporary, { recursive: true });
  }
}

async function main(): Promise<void> {
  const publishedVersion = parsePublishedVersion(Deno.args);
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
      if (
        parsed?.name === '@tanstack/ai' ||
        parsed?.name.startsWith('@tanstack/ai-')
      ) {
        declarations.add(value);
      }
    }
  }
  const rows: AiAdapterPeer[] = [];
  for (const declaration of declarations) {
    rows.push(...await registryVersions(declaration.slice(4)));
  }
  const core = rows.filter((row) => row.name === '@tanstack/ai').map((row) => row.version);
  const conflicts = findAiPeerConflicts(
    core,
    rows.filter((row) => row.name !== '@tanstack/ai'),
  );
  if (conflicts.length) throw new Error(conflicts.join('\n'));
  const resolved = await coldResolution([...declarations], publishedVersion);
  console.log(
    JSON.stringify({
      ok: true,
      core: resolved,
      lockFree: true,
      publishedVersion,
    }),
  );
}

if (import.meta.main) await main();
