/** Prepare npm resolution metadata for Fresh's cached-only Vite loader. */
export type MetadataCommand = (args: readonly string[]) => Promise<number>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Select every locked version, stripping peer suffixes without damaging scoped names. */
export function metadataArgs(lock: unknown): string[] {
  if (!isRecord(lock) || !isRecord(lock.npm)) {
    throw new Error('Expected deno.lock to contain an npm package map');
  }
  const packages = Object.keys(lock.npm).map((id) => {
    const version = id.match(/^(@?[^@]+@[^_]+)/)?.[1];
    if (!version) throw new Error(`Invalid locked npm package: ${id}`);
    return `npm:${version}`;
  });
  if (packages.length === 0) throw new Error('Cannot prepare an empty npm package map');
  // Native install resolves metadata in one graph. It neither executes packages nor
  // downloads their tarballs. No config/lock discovery keeps the repository lock unchanged;
  // the actual test commands continue to use that frozen graph.
  return [
    'install',
    '--entrypoint',
    '--lockfile-only',
    '--no-config',
    '--no-lock',
    ...[...new Set(packages)].sort(),
  ];
}

async function execute(args: readonly string[]): Promise<number> {
  const status = await new Deno.Command(Deno.execPath(), { args: [...args] }).spawn().status;
  return status.code;
}

/** Prepare metadata once and propagate the native command's failure. */
export async function primeMetadata(
  lockPath: string,
  command: MetadataCommand = execute,
): Promise<number> {
  const lock: unknown = JSON.parse(await Deno.readTextFile(lockPath));
  return await command(metadataArgs(lock));
}

if (import.meta.main) Deno.exit(await primeMetadata('deno.lock'));
