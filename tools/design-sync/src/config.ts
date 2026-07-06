/**
 * SyncConfig loading + validation.
 *
 * The config file is the single machine-readable manifest of a sync target
 * (Claude Design project id, synthetic package identity, registry location,
 * exclusions). Paths inside it are repo-relative; the repo root is derived
 * from the config location (`<repoRoot>/resources/design/**` by convention)
 * or passed explicitly.
 */
import type { SyncConfig } from './types.ts';

const REQUIRED_STRING_FIELDS = [
  'projectId',
  'projectName',
  'pkg',
  'globalName',
  'shape',
  'scratchDir',
  'fontImport',
] as const;

function fail(msg: string): never {
  throw new Error(`design-sync config: ${msg}`);
}

/** Normalize to forward slashes so path handling is uniform on Windows. */
export function fwd(path: string): string {
  return path.replaceAll('\\', '/');
}

export function dirOf(path: string): string {
  const p = fwd(path);
  const i = p.lastIndexOf('/');
  return i < 0 ? '.' : p.slice(0, i);
}

/** Walk up from `start` until a directory containing `deno.json` with a workspace is found. */
async function findRepoRoot(start: string): Promise<string> {
  let dir = fwd(start);
  for (let hops = 0; hops < 12; hops++) {
    try {
      const raw = await Deno.readTextFile(`${dir}/deno.json`);
      if (JSON.parse(raw).workspace) return dir;
    } catch {
      // keep walking
    }
    const parent = dirOf(dir);
    if (parent === dir) break;
    dir = parent;
  }
  fail(`could not locate repo root (deno.json with workspace) above ${start}`);
}

export async function loadConfig(configPath: string): Promise<SyncConfig> {
  const abs = fwd(
    configPath.match(/^([a-zA-Z]:\/|\/)/) ? configPath : `${fwd(Deno.cwd())}/${configPath}`,
  );
  let raw: string;
  try {
    raw = await Deno.readTextFile(abs);
  } catch (e) {
    fail(`cannot read ${abs}: ${e instanceof Error ? e.message : e}`);
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof parsed[field] !== 'string' || !(parsed[field] as string).length) {
      fail(`missing or empty string field "${field}" in ${abs}`);
    }
  }
  if (parsed.shape !== 'package') fail(`unsupported shape "${parsed.shape}" (only "package")`);
  const registry = parsed.registry as { root?: string; manifest?: string } | undefined;
  if (!registry?.root || !registry?.manifest) fail('missing registry.root / registry.manifest');
  const react = parsed.react as { version?: string; domVersion?: string } | undefined;
  if (!react?.version || !react?.domVersion) fail('missing react.version / react.domVersion');

  const repoRoot = await findRepoRoot(dirOf(abs));
  const cfg: SyncConfig = {
    ...(parsed as unknown as Omit<SyncConfig, 'repoRoot' | 'configPath'>),
    exclude: Array.isArray(parsed.exclude) ? parsed.exclude as SyncConfig['exclude'] : [],
    subpaths: (parsed.subpaths ?? {}) as SyncConfig['subpaths'],
    groups: (parsed.groups ?? {}) as SyncConfig['groups'],
    repoRoot,
    configPath: abs,
  };

  try {
    const st = await Deno.stat(
      `${repoRoot}/${fwd(cfg.registry.root)}/${fwd(cfg.registry.manifest)}`,
    );
    if (!st.isFile) fail('registry manifest path is not a file');
  } catch {
    fail(`registry manifest not found under ${repoRoot}/${cfg.registry.root}`);
  }
  return cfg;
}
