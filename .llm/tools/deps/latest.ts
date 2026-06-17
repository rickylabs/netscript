/**
 * deps/latest.ts — report each workspace dependency against its registry's
 * **stable** channel (jsr `meta.json.latest` / npm `dist-tags.latest`).
 *
 * Why this exists: `deno outdated --latest` ignores semver AND surfaces
 * pre-release tags (e.g. it reports `@fedify/fedify 2.3.0-dev.*` as "latest"
 * while the real stable latest is `2.2.5`). That misled a dependency audit.
 * The source of truth for "latest stable" is the registry stable channel, which
 * already excludes pre-releases. This tool queries it directly.
 *
 * Usage:
 *   deno run --allow-read --allow-net .llm/tools/deps/latest.ts [--pretty]
 *   deno run --allow-read --allow-net .llm/tools/deps/latest.ts --behind-only
 *   deno run --allow-read --allow-net .llm/tools/deps/latest.ts --allow-prerelease
 *   deno run --allow-read --allow-net .llm/tools/deps/latest.ts --filter "@fedify/*"
 *
 * Output (JSON by default): { generatedAt, behind, entries: DepReport[] }.
 * Exit code is 0 even when deps are behind — this is a report, not a gate.
 * Use --fail-behind to exit 1 when any dependency is behind (for CI report lanes).
 */

import { greaterThan, parse as parseSemver, type SemVer } from 'jsr:@std/semver@^1';

type JsonObject = Record<string, unknown>;
type Registry = 'npm' | 'jsr';

interface DepReport {
  name: string;
  registry: Registry;
  pinned: string;
  pinnedIsPrerelease: boolean;
  latestStable: string | null;
  behind: boolean;
  error?: string;
  sources: string[];
}

interface Args {
  pretty: boolean;
  behindOnly: boolean;
  allowPrerelease: boolean;
  failBehind: boolean;
  filter: RegExp | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    pretty: false,
    behindOnly: false,
    allowPrerelease: false,
    failBehind: false,
    filter: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pretty') args.pretty = true;
    else if (arg === '--behind-only') args.behindOnly = true;
    else if (arg === '--allow-prerelease') args.allowPrerelease = true;
    else if (arg === '--fail-behind') args.failBehind = true;
    else if (arg === '--filter') {
      const value = argv[++i] ?? '';
      args.filter = new RegExp(
        '^' + value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
      );
    }
  }
  return args;
}

/** Strip a range operator (^ ~ >= = etc.) and any subpath, return the base version token. */
function basePinnedVersion(range: string): string {
  const cleaned = range.replace(/^[\s=^~><]+/, '').trim();
  const match = cleaned.match(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/);
  return match ? match[0] : cleaned;
}

function isPrerelease(version: string): boolean {
  return version.includes('-');
}

function safeParse(version: string): SemVer | null {
  try {
    return parseSemver(version);
  } catch {
    return null;
  }
}

/** Parse a Deno import-map specifier value into {registry, name, range}, or null to skip. */
function parseSpecifier(value: string): { registry: Registry; name: string; range: string } | null {
  if (value === 'catalog:') return null; // resolved through the root catalog entry
  let rest: string;
  let registry: Registry;
  if (value.startsWith('npm:')) {
    registry = 'npm';
    rest = value.slice(4);
  } else if (value.startsWith('jsr:')) {
    registry = 'jsr';
    rest = value.slice(4);
  } else {
    return null; // node:, https:, relative, etc. — out of scope
  }
  // rest = [@scope/]name[@range][/subpath]
  const scoped = rest.startsWith('@');
  const body = scoped ? rest.slice(1) : rest;
  const atIndex = body.indexOf('@');
  let nameAndPath: string;
  let range: string;
  if (atIndex === -1) {
    nameAndPath = body;
    range = '';
  } else {
    nameAndPath = body.slice(0, atIndex);
    range = body.slice(atIndex + 1);
  }
  // drop subpath from range (range may be like "4.12.24/cors")
  const rangeSlash = range.indexOf('/');
  if (rangeSlash !== -1) range = range.slice(0, rangeSlash);
  // drop subpath from name
  const name = (scoped ? '@' : '') + nameAndPath.split('/').slice(0, scoped ? 2 : 1).join('/');
  return { registry, name, range };
}

async function discoverMemberConfigs(root: string): Promise<string[]> {
  const configs: string[] = [`${root}/deno.json`];
  for (const parent of ['packages', 'plugins', 'apps', 'examples']) {
    let dir: string;
    try {
      dir = `${root}/${parent}`;
      await Deno.stat(dir);
    } catch {
      continue;
    }
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isDirectory) continue;
      const path = `${dir}/${entry.name}/deno.json`;
      try {
        await Deno.stat(path);
        configs.push(path);
      } catch { /* no deno.json here */ }
    }
  }
  return configs;
}

interface Pin {
  registry: Registry;
  pinned: string;
  sources: Set<string>;
}

async function collectPins(root: string): Promise<Map<string, Pin>> {
  const pins = new Map<string, Pin>();
  const add = (registry: Registry, name: string, pinned: string, source: string) => {
    const key = `${registry}:${name}`;
    const existing = pins.get(key);
    if (existing) {
      existing.sources.add(source);
      // prefer the most specific (longest) pin string for display
      if (pinned.length > existing.pinned.length) existing.pinned = pinned;
    } else {
      pins.set(key, { registry, pinned, sources: new Set([source]) });
    }
  };

  const rootRaw = JSON.parse(await Deno.readTextFile(`${root}/deno.json`)) as JsonObject;
  const catalog = (rootRaw.catalog ?? {}) as Record<string, string>;
  for (const [name, version] of Object.entries(catalog)) {
    add('npm', name, version, 'catalog');
  }

  for (const configPath of await discoverMemberConfigs(root)) {
    let config: JsonObject;
    try {
      config = JSON.parse(await Deno.readTextFile(configPath)) as JsonObject;
    } catch {
      continue;
    }
    const imports = (config.imports ?? {}) as Record<string, unknown>;
    const rel = configPath.slice(root.length + 1) || 'deno.json';
    for (const value of Object.values(imports)) {
      if (typeof value !== 'string') continue;
      const spec = parseSpecifier(value);
      if (!spec || spec.range === '' || spec.range === 'catalog:') continue;
      add(spec.registry, spec.name, spec.range, rel);
    }
  }
  return pins;
}

async function fetchLatestStable(registry: Registry, name: string): Promise<string> {
  if (registry === 'npm') {
    const res = await fetch(`https://registry.npmjs.org/${name}`);
    if (!res.ok) throw new Error(`npm ${res.status}`);
    const body = await res.json() as { 'dist-tags'?: Record<string, string> };
    const latest = body['dist-tags']?.latest;
    if (!latest) throw new Error('no dist-tags.latest');
    return latest;
  }
  const res = await fetch(`https://jsr.io/${name}/meta.json`);
  if (!res.ok) throw new Error(`jsr ${res.status}`);
  const body = await res.json() as { latest?: string };
  if (!body.latest) throw new Error('no meta.latest');
  return body.latest;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const args = parseArgs(Deno.args);
  const root = Deno.cwd();
  const pins = await collectPins(root);

  let entries = [...pins.entries()].map(([key, pin]) => ({ key, ...pin }));
  if (args.filter) {
    const filter = args.filter;
    entries = entries.filter((entry) => filter.test(entry.key.split(':').slice(1).join(':')));
  }
  entries.sort((a, b) => a.key.localeCompare(b.key));

  const reports = await mapWithConcurrency(entries, 8, async (entry): Promise<DepReport> => {
    const name = entry.key.split(':').slice(1).join(':');
    const pinnedBase = basePinnedVersion(entry.pinned);
    const report: DepReport = {
      name,
      registry: entry.registry,
      pinned: entry.pinned,
      pinnedIsPrerelease: isPrerelease(pinnedBase),
      latestStable: null,
      behind: false,
      sources: [...entry.sources].sort(),
    };
    try {
      const latest = await fetchLatestStable(entry.registry, name);
      report.latestStable = latest;
      const latestSem = safeParse(latest);
      const pinnedSem = safeParse(pinnedBase);
      if (latestSem && pinnedSem) {
        if (!args.allowPrerelease && isPrerelease(latest)) {
          report.behind = false; // registry stable channel should never be prerelease; guard anyway
        } else {
          report.behind = greaterThan(latestSem, pinnedSem);
        }
      }
    } catch (err) {
      report.error = err instanceof Error ? err.message : String(err);
    }
    return report;
  });

  const shown = args.behindOnly ? reports.filter((report) => report.behind) : reports;
  const behindCount = reports.filter((report) => report.behind).length;
  const result = { generatedAt: new Date().toISOString(), behind: behindCount, entries: shown };

  if (args.pretty) {
    console.log(`deps:latest — ${behindCount} behind / ${reports.length} total\n`);
    for (const report of shown) {
      const flag = report.error ? '?' : report.behind ? '✗' : '✓';
      const latest = report.error ? `ERR ${report.error}` : report.latestStable ?? '—';
      console.log(`  ${flag} ${report.registry}:${report.name}  ${report.pinned}  →  ${latest}`);
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  if (args.failBehind && behindCount > 0) Deno.exit(1);
}

await main();
