#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
/** Snapshot and classify the publishable NetScript API surface from `deno doc --json`. */

import { dirname, fromFileUrl, join, resolve } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers } from './publish-workspace.ts';

export const SURFACE_SCHEMA_VERSION = 1;

export interface SymbolSnapshot {
  readonly signature: string;
  readonly deprecatedRemoval?: string;
}

export interface ExportSnapshot {
  readonly symbols: Readonly<Record<string, SymbolSnapshot>>;
}

export interface PackageSnapshot {
  readonly path: string;
  readonly exports: Readonly<Record<string, ExportSnapshot>>;
}

export interface SurfaceSnapshot {
  readonly schemaVersion: typeof SURFACE_SCHEMA_VERSION;
  readonly rootVersion: string;
  readonly packages: Readonly<Record<string, PackageSnapshot>>;
}

export interface SurfaceChange {
  readonly kind: 'major' | 'minor';
  readonly package: string;
  readonly export: string;
  readonly symbol: string;
  readonly reason: string;
}

export interface MajorDeclaration {
  readonly package: string;
  readonly export: string;
  readonly symbol: string;
  readonly reason: string;
}

export interface DeprecationWarning {
  readonly package: string;
  readonly export: string;
  readonly symbol: string;
  readonly removal: string;
  readonly currentVersion: string;
}

export interface SurfaceDiffResult {
  readonly verdict: 'major' | 'minor' | 'patch';
  readonly changes: readonly SurfaceChange[];
  readonly undeclaredMajors: readonly SurfaceChange[];
  readonly deprecationWarnings: readonly DeprecationWarning[];
}

export type SourceReader = (filename: string) => Promise<string>;

interface CliArgs {
  readonly root: string;
  readonly baseline: string;
  readonly current?: string;
  readonly declarations: string;
  readonly writeBaseline: boolean;
  readonly json: boolean;
}

const toolDirectory = dirname(fromFileUrl(import.meta.url));
const defaultRoot = resolve(toolDirectory, '../../..');
const defaultBaseline = join(toolDirectory, 'baselines', 'public-surfaces.json');
const defaultDeclarations = join(toolDirectory, 'surface-major-declarations.json');
const volatileDocKeys = new Set(['location', 'jsDoc', 'hasBody', 'resolution']);
const removalPattern = /\{removal:\s*(\d+\.\d+)\}/;

/** Generate a deterministic snapshot for every publishable package and every declared export. */
export async function createSurfaceSnapshot(root: string): Promise<SurfaceSnapshot> {
  const rootConfig = parseObject(
    await Deno.readTextFile(join(root, 'deno.json')),
    'root deno.json',
  );
  if (typeof rootConfig.version !== 'string') throw new Error('Root deno.json lacks a version.');
  const members = await discoverWorkspaceMembers(root);
  const packages: Record<string, PackageSnapshot> = {};

  for (const member of members) {
    const manifestPath = join(root, member.path, 'deno.json');
    const manifest = parseObject(await Deno.readTextFile(manifestPath), manifestPath);
    const exports = readExports(manifest.exports, manifestPath);
    const exportSnapshots: Record<string, ExportSnapshot> = {};
    for (const [exportName, relativeEntrypoint] of exports) {
      const entrypoint = resolve(root, member.path, relativeEntrypoint);
      exportSnapshots[exportName] = await snapshotDocJson(
        await runDenoDoc(root, entrypoint),
        readDeclarationSource,
      );
    }
    packages[member.name] = { path: member.path, exports: sortRecord(exportSnapshots) };
  }

  return {
    schemaVersion: SURFACE_SCHEMA_VERSION,
    rootVersion: rootConfig.version,
    packages: sortRecord(packages),
  };
}

/** Normalize one Deno-doc JSON document into public symbol signature hashes. */
export async function snapshotDocJson(
  docJson: unknown,
  sourceReader?: SourceReader,
): Promise<ExportSnapshot> {
  const doc = requireObject(docJson, 'Deno doc JSON');
  const nodes = requireObject(doc.nodes, 'Deno doc nodes');
  const symbols = new Map<string, SymbolSnapshot>();

  for (const node of Object.values(nodes)) {
    const moduleNode = requireObject(node, 'Deno doc module');
    if (!Array.isArray(moduleNode.symbols)) continue;
    for (const rawSymbol of moduleNode.symbols) {
      const symbol = requireObject(rawSymbol, 'Deno doc symbol');
      if (typeof symbol.name !== 'string' || !Array.isArray(symbol.declarations)) continue;
      const declarations = symbol.declarations.map((rawDeclaration) => {
        const declaration = requireObject(rawDeclaration, 'Deno doc declaration');
        return normalizeValue({ kind: declaration.kind, def: declaration.def });
      });
      declarations.sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
      symbols.set(symbol.name, {
        signature: await sha256(stableJson(declarations)),
        ...await readDeprecatedRemoval(symbol.declarations, sourceReader),
      });
    }
  }
  return { symbols: sortRecord(Object.fromEntries(symbols)) };
}

/** Diff two normalized snapshots and classify semver impact. */
export function diffSurfaceSnapshots(
  before: SurfaceSnapshot,
  after: SurfaceSnapshot,
): SurfaceChange[] {
  assertSnapshot(before, 'baseline');
  assertSnapshot(after, 'current');
  const changes: SurfaceChange[] = [];
  const packageNames = sortedUnion(Object.keys(before.packages), Object.keys(after.packages));
  for (const packageName of packageNames) {
    const oldPackage = before.packages[packageName];
    const newPackage = after.packages[packageName];
    if (!newPackage) {
      changes.push(change('major', packageName, '*', '*', 'package removed'));
      continue;
    }
    if (!oldPackage) {
      changes.push(change('minor', packageName, '*', '*', 'package added'));
      continue;
    }
    for (
      const exportName of sortedUnion(
        Object.keys(oldPackage.exports),
        Object.keys(newPackage.exports),
      )
    ) {
      const oldExport = oldPackage.exports[exportName];
      const newExport = newPackage.exports[exportName];
      if (!newExport) {
        changes.push(change('major', packageName, exportName, '*', 'export path removed'));
        continue;
      }
      if (!oldExport) {
        changes.push(change('minor', packageName, exportName, '*', 'export path added'));
        continue;
      }
      for (
        const symbolName of sortedUnion(
          Object.keys(oldExport.symbols),
          Object.keys(newExport.symbols),
        )
      ) {
        const oldSymbol = oldExport.symbols[symbolName];
        const newSymbol = newExport.symbols[symbolName];
        if (!newSymbol) {
          changes.push(change('major', packageName, exportName, symbolName, 'symbol removed'));
        } else if (!oldSymbol) {
          changes.push(change('minor', packageName, exportName, symbolName, 'symbol added'));
        } else if (oldSymbol.signature !== newSymbol.signature) {
          changes.push(
            change('major', packageName, exportName, symbolName, 'export signature changed'),
          );
        }
      }
    }
  }
  return changes;
}

/** Evaluate declarations and expired deprecations for a complete CI verdict. */
export function evaluateSurfaceDiff(
  before: SurfaceSnapshot,
  after: SurfaceSnapshot,
  declarations: readonly MajorDeclaration[] = [],
): SurfaceDiffResult {
  const changes = diffSurfaceSnapshots(before, after);
  const majors = changes.filter((item) => item.kind === 'major');
  const minors = changes.filter((item) => item.kind === 'minor');
  return {
    verdict: majors.length > 0 ? 'major' : minors.length > 0 ? 'minor' : 'patch',
    changes,
    undeclaredMajors: majors.filter((item) => !declarations.some((decl) => matches(decl, item))),
    deprecationWarnings: findExpiredDeprecations(after),
  };
}

/** Warn when an exported symbol remains at or beyond its declared removal major/minor. */
export function findExpiredDeprecations(snapshot: SurfaceSnapshot): DeprecationWarning[] {
  const current = parseMajorMinor(snapshot.rootVersion);
  const warnings: DeprecationWarning[] = [];
  for (const [packageName, packageSnapshot] of Object.entries(snapshot.packages)) {
    for (const [exportName, exportSnapshot] of Object.entries(packageSnapshot.exports)) {
      for (const [symbolName, symbol] of Object.entries(exportSnapshot.symbols)) {
        if (!symbol.deprecatedRemoval) continue;
        const removal = parseMajorMinor(symbol.deprecatedRemoval);
        if (
          current.major > removal.major ||
          (current.major === removal.major && current.minor >= removal.minor)
        ) {
          warnings.push({
            package: packageName,
            export: exportName,
            symbol: symbolName,
            removal: symbol.deprecatedRemoval,
            currentVersion: snapshot.rootVersion,
          });
        }
      }
    }
  }
  return warnings;
}

async function main(): Promise<number> {
  const args = parseArgs(Deno.args);
  const current = args.current
    ? await readSnapshot(args.current)
    : await createSurfaceSnapshot(args.root);
  if (args.writeBaseline) {
    await Deno.mkdir(dirname(args.baseline), { recursive: true });
    await Deno.writeTextFile(args.baseline, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`surface:diff baseline written: ${args.baseline}`);
    return 0;
  }
  const baseline = await readSnapshot(args.baseline);
  const declarations = await readDeclarations(args.declarations);
  const result = evaluateSurfaceDiff(baseline, current, declarations);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printResult(result);
  return result.undeclaredMajors.length > 0 ? 1 : 0;
}

function parseArgs(argv: readonly string[]): CliArgs {
  let root = defaultRoot;
  let baseline = defaultBaseline;
  let current: string | undefined;
  let declarations = defaultDeclarations;
  let writeBaseline = false;
  let json = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--root') root = requireArg(argv, ++index, arg);
    else if (arg === '--baseline') baseline = requireArg(argv, ++index, arg);
    else if (arg === '--current') current = requireArg(argv, ++index, arg);
    else if (arg === '--declarations') declarations = requireArg(argv, ++index, arg);
    else if (arg === '--write-baseline') writeBaseline = true;
    else if (arg === '--json') json = true;
    else if (arg !== '--') throw new Error(`Unknown argument: ${arg}`);
  }
  return {
    root: resolve(root),
    baseline: resolve(baseline),
    current: current ? resolve(current) : undefined,
    declarations: resolve(declarations),
    writeBaseline,
    json,
  };
}

function readExports(value: unknown, manifestPath: string): [string, string][] {
  if (typeof value === 'string') return [['.', value]];
  const exports = requireObject(value, `${manifestPath} exports`);
  const entries = Object.entries(exports);
  if (!entries.every((entry) => typeof entry[1] === 'string')) {
    throw new Error(`${manifestPath} exports must map names to string entrypoints.`);
  }
  return (entries as [string, string][]).sort(([left], [right]) => left.localeCompare(right));
}

async function runDenoDoc(root: string, entrypoint: string): Promise<unknown> {
  const output = await new Deno.Command('deno', {
    args: ['doc', '--json', entrypoint],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `deno doc failed for ${entrypoint}: ${new TextDecoder().decode(output.stderr)}`,
    );
  }
  return JSON.parse(new TextDecoder().decode(output.stdout));
}

async function readDeprecatedRemoval(
  declarations: readonly unknown[],
  sourceReader?: SourceReader,
): Promise<{ deprecatedRemoval?: string }> {
  for (const rawDeclaration of declarations) {
    const declaration = requireObject(rawDeclaration, 'Deno doc declaration');
    const jsDoc = isObject(declaration.jsDoc) ? declaration.jsDoc : undefined;
    if (!jsDoc || !Array.isArray(jsDoc.tags)) continue;
    for (const rawTag of jsDoc.tags) {
      const tag = requireObject(rawTag, 'JSDoc tag');
      if (tag.kind !== 'deprecated') continue;
      const match = removalPattern.exec(JSON.stringify(tag));
      if (match) return { deprecatedRemoval: match[1] };
      if (
        sourceReader && isObject(declaration.location) &&
        typeof declaration.location.filename === 'string'
      ) {
        const source = await sourceReader(declaration.location.filename);
        const sourceMatch = removalPattern.exec(
          sourceBeforeDeclaration(source, declaration.location.line),
        );
        if (sourceMatch) return { deprecatedRemoval: sourceMatch[1] };
      }
    }
  }
  return {};
}

async function readDeclarationSource(filename: string): Promise<string> {
  return await Deno.readTextFile(filename.startsWith('file:') ? fromFileUrl(filename) : filename);
}

function sourceBeforeDeclaration(source: string, line: unknown): string {
  if (typeof line !== 'number' || !Number.isInteger(line) || line < 0) return source;
  const lines = source.split('\n');
  const end = Math.min(line + 1, lines.length);
  return lines.slice(Math.max(0, end - 40), end).join('\n');
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!isObject(value)) return value;
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    if (!volatileDocKeys.has(key)) normalized[key] = normalizeValue(value[key]);
  }
  return normalized;
}

function matches(declaration: MajorDeclaration, item: SurfaceChange): boolean {
  return declaration.package === item.package &&
    declaration.export === item.export &&
    declaration.symbol === item.symbol &&
    declaration.reason.trim().length > 0;
}

function change(
  kind: 'major' | 'minor',
  packageName: string,
  exportName: string,
  symbol: string,
  reason: string,
): SurfaceChange {
  return { kind, package: packageName, export: exportName, symbol, reason };
}

function assertSnapshot(snapshot: SurfaceSnapshot, label: string): void {
  if (snapshot.schemaVersion !== SURFACE_SCHEMA_VERSION || !isObject(snapshot.packages)) {
    throw new Error(`${label} is not a surface snapshot schema ${SURFACE_SCHEMA_VERSION}.`);
  }
}

async function readSnapshot(path: string): Promise<SurfaceSnapshot> {
  const value = JSON.parse(await Deno.readTextFile(path)) as SurfaceSnapshot;
  assertSnapshot(value, path);
  return value;
}

async function readDeclarations(path: string): Promise<MajorDeclaration[]> {
  const parsed = parseObject(await Deno.readTextFile(path), path);
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.declarations)) {
    throw new Error(`${path} must contain schemaVersion 1 and declarations array.`);
  }
  return parsed.declarations.map((value) => {
    const item = requireObject(value, 'major declaration');
    if (
      typeof item.package !== 'string' || typeof item.export !== 'string' ||
      typeof item.symbol !== 'string' || typeof item.reason !== 'string'
    ) {
      throw new Error(
        'Each major declaration requires package, export, symbol, and reason strings.',
      );
    }
    return {
      package: item.package,
      export: item.export,
      symbol: item.symbol,
      reason: item.reason,
    };
  });
}

function printResult(result: SurfaceDiffResult): void {
  console.log(`surface:diff verdict: ${result.verdict}`);
  for (const item of result.changes) {
    console.log(
      `${item.kind.toUpperCase()} ${item.package} ${item.export} ${item.symbol}: ${item.reason}`,
    );
  }
  for (const warning of result.deprecationWarnings) {
    console.warn(
      `WARN ${warning.package} ${warning.export} ${warning.symbol}: deprecated removal ${warning.removal} reached at ${warning.currentVersion}`,
    );
  }
  if (result.undeclaredMajors.length > 0) {
    console.error(
      `surface:diff failed: ${result.undeclaredMajors.length} undeclared major change(s).`,
    );
  }
}

function parseMajorMinor(version: string): { major: number; minor: number } {
  const match = /^(\d+)\.(\d+)(?:\.|$)/.exec(version);
  if (!match) throw new Error(`Invalid major.minor version: ${version}`);
  return { major: Number(match[1]), minor: Number(match[2]) };
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function stableJson(value: unknown): string {
  return JSON.stringify(normalizeValue(value));
}

function sortedUnion(left: readonly string[], right: readonly string[]): string[] {
  return [...new Set([...left, ...right])].sort();
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function parseObject(source: string, label: string): Record<string, unknown> {
  return requireObject(JSON.parse(source), label);
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!isObject(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireArg(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

if (import.meta.main) Deno.exit(await main());
