import { join } from '@std/path';
import { greaterThan, parse, parseRange, satisfies } from '@std/semver';

interface LockedPackage {
  readonly integrity: string;
  readonly dependencies?: readonly string[];
}

interface FixtureLock {
  readonly specifiers?: Readonly<Record<string, string>>;
  readonly npm?: Readonly<Record<string, LockedPackage>>;
  readonly jsr?: Readonly<Record<string, LockedPackage>>;
  readonly remote?: Readonly<Record<string, string>>;
}

/** Adapt consumer metadata and peer IDs while retaining only committed versions and integrities. */
export async function prepareLockedFixture(
  directory: string,
  entrypoints: readonly string[] = [],
  sourceLock: URL = new URL('../../../deno.lock', import.meta.url),
): Promise<readonly string[]> {
  const configPath = join(directory, 'deno.json');
  const lockPath = join(directory, 'deno.lock');
  const rootLock = JSON.parse(
    await Deno.readTextFile(new URL('../../../deno.lock', import.meta.url)),
  );
  const uiLock = JSON.parse(
    await Deno.readTextFile(new URL('../../../packages/fresh-ui/deno.lock', import.meta.url)),
  );
  const fixture = JSON.parse(await Deno.readTextFile(sourceLock));
  const combined = { ...rootLock, ...fixture };
  for (const section of ['specifiers', 'npm', 'jsr', 'remote']) {
    combined[section] = { ...uiLock[section], ...rootLock[section], ...fixture[section] };
  }
  const original = JSON.stringify(combined);
  const committed: FixtureLock = combined;
  const config = JSON.parse(await Deno.readTextFile(configPath));
  const pinned = new Map<string, Set<string>>();
  for (const id of Object.keys(committed.npm ?? {})) {
    const versioned = npmVersion(id);
    const separator = versioned.lastIndexOf('@');
    const name = versioned.slice(0, separator);
    const versions = pinned.get(name) ?? new Set<string>();
    versions.add(versioned.slice(separator + 1));
    pinned.set(name, versions);
  }
  // Freeze native peer recomputation to recorded versions. npm overrides live
  // in package.json; deno.json overrides do not constrain npm imports.
  const overrides: Record<string, string> = {};
  for (const [name, versions] of pinned) {
    const compatible = new Map<string, string>();
    for (const version of versions) {
      const parsed = parse(version);
      const range = parsed.major === 0 ? `~0.${parsed.minor}.0` : `^${parsed.major}.0.0`;
      const previous = compatible.get(range);
      if (!previous || greaterThan(parsed, parse(previous))) compatible.set(range, version);
    }
    for (const [range, version] of compatible) overrides[`${name}@${range}`] = version;
    for (const version of versions) overrides[`${name}@${version}`] = version;
  }
  await Deno.writeTextFile(
    join(directory, 'package.json'),
    JSON.stringify({
      private: true,
      overrides,
    }),
  );
  config.imports ??= {};
  for (const [alias, specifier] of Object.entries(config.imports)) {
    if (typeof specifier !== 'string') continue;
    const match = /^npm:((?:@[^/]+\/)?[^@/]+)(?:@([^/]+))?(\/.*)?$/.exec(specifier);
    if (!match?.[1]) continue;
    const name = match[1];
    const versions = pinned.get(name);
    if (!versions) continue; // Native resolution below must reject an unrecorded package.
    const range = parseRange(match[2] ?? '*');
    let selected: string | undefined;
    for (const version of versions) {
      if (
        satisfies(parse(version), range) &&
        (!selected || greaterThan(parse(version), parse(selected)))
      ) selected = version;
    }
    if (!selected) {
      throw new Error(
        `Fixture dependency requirement is absent from the committed lockfile: ${specifier}`,
      );
    }
    config.imports[alias] = `npm:${name}@${selected}${match[3] ?? ''}`;
  }

  for (const [specifier, version] of Object.entries(committed.specifiers ?? {})) {
    if (!specifier.startsWith('jsr:')) continue;
    const exact = specifier.slice(0, specifier.lastIndexOf('@') + 1) + version;
    config.imports[specifier] = exact;
    config.imports[specifier + '/'] = exact + '/';
  }
  config.nodeModulesDir = 'none';
  config.lock = { path: 'deno.lock', frozen: true };
  await Deno.writeTextFile(configPath, JSON.stringify(config));
  await Deno.writeTextFile(lockPath, original);

  // Deno owns catalog/range normalization and consumer-specific peer IDs. The
  // lockfile-only preparation never executes fixture code or lifecycle scripts.
  const prepared = await new Deno.Command(Deno.execPath(), {
    args: [
      'install',
      '--lockfile-only',
      '--frozen=false',
      '--config',
      configPath,
      '--lock',
      lockPath,
      ...(entrypoints.length ? ['--entrypoint', ...entrypoints] : []),
    ],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!prepared.success) {
    throw new Error(
      `Fixture metadata preparation failed: ${new TextDecoder().decode(prepared.stderr)}`,
    );
  }
  const adapted: FixtureLock = JSON.parse(await Deno.readTextFile(lockPath));

  const versions = new Map(
    Object.entries(committed.npm ?? {}).map(([id, pkg]) => [npmVersion(id), pkg.integrity]),
  );
  for (const [id, pkg] of Object.entries(adapted.npm ?? {})) {
    if (versions.get(npmVersion(id)) !== pkg.integrity) {
      const name = npmVersion(id).slice(0, npmVersion(id).lastIndexOf('@'));
      const consumers = Object.entries(adapted.npm ?? {}).filter(([, value]) =>
        value.dependencies?.some((dependency) =>
          dependency === name || dependency.startsWith(name + '@')
        )
      ).map(([consumer]) => npmVersion(consumer));
      throw new Error(
        `Fixture dependency is absent from the committed lockfile: npm:${
          npmVersion(id)
        } (consumers: ${consumers.join(', ')})`,
      );
    }
  }
  for (const [id, pkg] of Object.entries(adapted.jsr ?? {})) {
    if (committed.jsr?.[id]?.integrity !== pkg.integrity) {
      throw new Error(`Fixture dependency is absent from the committed lockfile: jsr:${id}`);
    }
  }
  for (const [url, integrity] of Object.entries(adapted.remote ?? {})) {
    if (committed.remote?.[url] !== integrity) {
      throw new Error('Fixture remote dependency is absent from the committed lockfile');
    }
  }
  // The config also fails closed if a nested fixture command omits these flags.
  return ['--lock', lockPath, '--frozen'];
}

function npmVersion(id: string): string {
  // Peer suffixes follow the version; underscores in the package name are retained.
  const match = /^((?:@[^/]+\/)?[^@]+@[^_]+)/.exec(id);
  if (!match?.[1]) throw new Error('Invalid npm package ID in fixture lockfile');
  return match[1];
}
