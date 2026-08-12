import { join, toFileUrl } from '@std/path';

interface JsonObject {
  [key: string]: unknown;
}

interface WorkspaceMember {
  directory: string;
  configPath: string;
  config: JsonObject;
}

/** Resolved synthetic configuration inputs derived from the real workspace. */
export interface WorkspaceSurface {
  imports: Record<string, string>;
  catalog: Record<string, string>;
  memberCount: number;
  declaredConflictCount: number;
  catalogConflictCount: number;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJsonObject(path: string): Promise<JsonObject> {
  const value: unknown = JSON.parse(await Deno.readTextFile(path));
  if (!isJsonObject(value)) throw new Error(`${path}: expected a JSON object`);
  return value;
}

function stringRecord(value: unknown, label: string): Record<string, string> {
  if (value === undefined) return {};
  if (!isJsonObject(value)) throw new Error(`${label}: expected an object`);
  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') throw new Error(`${label}.${key}: expected a string`);
    record[key] = entry;
  }
  return record;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${label}: expected a string array`);
  }
  return value;
}

function exportTarget(value: unknown, label: string): string {
  if (typeof value === 'string') return value;
  if (!isJsonObject(value)) throw new Error(`${label}: expected a string or conditional export`);
  for (const condition of ['deno', 'import', 'default']) {
    if (condition in value) return exportTarget(value[condition], `${label}.${condition}`);
  }
  throw new Error(`${label}: no deno/import/default target`);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function discoverWorkspaceMembers(
  repositoryRoot: string,
  patterns: string[],
): Promise<WorkspaceMember[]> {
  const directories = new Set<string>();
  for (const pattern of patterns) {
    if (pattern.endsWith('/*')) {
      const parent = join(repositoryRoot, pattern.slice(0, -2));
      if (!await pathExists(parent)) continue;
      for await (const entry of Deno.readDir(parent)) {
        if (entry.isDirectory) directories.add(join(parent, entry.name));
      }
    } else {
      directories.add(join(repositoryRoot, pattern));
    }
  }

  const members: WorkspaceMember[] = [];
  for (const directory of [...directories].sort()) {
    const configPath = join(directory, 'deno.json');
    if (!await pathExists(configPath)) continue;
    members.push({ directory, configPath, config: await readJsonObject(configPath) });
  }
  return members;
}

function normalizeRange(range: string): string {
  return /^\d+(?:\.\d+)?$/.test(range) ? `^${range}` : range;
}

/** Canonicalize equivalent JSR/npm major shorthand before merge conflict comparison. */
export function canonicalizePackageSpecifier(specifier: string): string {
  const match = /^(jsr|npm):(@[^/]+\/[^@/]+|[^@/]+)(?:@([^/]+))?(\/.*)?$/.exec(specifier);
  if (!match) return specifier;
  const [, protocol, packageName, range, subpath = ''] = match;
  return `${protocol}:${packageName}${range ? `@${normalizeRange(range)}` : ''}${subpath}`;
}

function addImport(
  imports: Record<string, string>,
  origins: Map<string, string>,
  alias: string,
  specifier: string,
  origin: string,
): void {
  const existing = imports[alias];
  if (existing === undefined) {
    imports[alias] = specifier;
    origins.set(alias, origin);
    return;
  }
  if (canonicalizePackageSpecifier(existing) !== canonicalizePackageSpecifier(specifier)) {
    throw new Error(
      `conflicting import ${alias}: ${existing} (${
        origins.get(alias)
      }) vs ${specifier} (${origin})`,
    );
  }
}

function resolveCatalogImport(
  alias: string,
  specifier: string,
  catalog: Record<string, string>,
  origin: string,
): string {
  if (specifier !== 'catalog:') return specifier;
  const range = catalog[alias];
  if (!range) throw new Error(`${origin}: ${alias} references missing root catalog entry`);
  return `npm:${alias}@${range}`;
}

/** Derive exact public workspace exports and canonicalized external imports for synthetic checks. */
export async function resolveWorkspaceSurface(
  repositoryRoot: string,
  supportImports: Record<string, string> = {},
): Promise<WorkspaceSurface> {
  const rootPath = join(repositoryRoot, 'deno.json');
  const rootConfig = await readJsonObject(rootPath);
  const catalog = stringRecord(rootConfig.catalog, `${rootPath}.catalog`);
  const members = await discoverWorkspaceMembers(
    repositoryRoot,
    stringArray(rootConfig.workspace, `${rootPath}.workspace`),
  );
  const imports: Record<string, string> = {};
  const origins = new Map<string, string>();
  const publicWorkspaceSpecifiers = new Set<string>();

  for (const member of members) {
    const name = member.config.name;
    if (typeof name !== 'string' || !name.startsWith('@netscript/')) continue;
    const exportsValue = member.config.exports;
    if (typeof exportsValue === 'string') {
      addImport(
        imports,
        origins,
        name,
        toFileUrl(join(member.directory, exportsValue)).href,
        member.configPath,
      );
      publicWorkspaceSpecifiers.add(name);
      continue;
    }
    if (!isJsonObject(exportsValue)) continue;
    for (const [key, value] of Object.entries(exportsValue)) {
      if (key !== '.' && !key.startsWith('./')) continue;
      const publicSpecifier = key === '.' ? name : `${name}/${key.slice(2)}`;
      addImport(
        imports,
        origins,
        publicSpecifier,
        toFileUrl(
          join(member.directory, exportTarget(value, `${member.configPath}.exports.${key}`)),
        )
          .href,
        member.configPath,
      );
      publicWorkspaceSpecifiers.add(publicSpecifier);
    }
  }

  const configs: Array<readonly [string, JsonObject]> = [
    [rootPath, rootConfig],
    ...members.map((member) => [member.configPath, member.config] as const),
  ];
  for (const [configPath, config] of configs) {
    for (
      const [alias, rawSpecifier] of Object.entries(
        stringRecord(config.imports, `${configPath}.imports`),
      )
    ) {
      if (alias.startsWith('@netscript/')) continue;
      addImport(
        imports,
        origins,
        alias,
        resolveCatalogImport(alias, rawSpecifier, catalog, configPath),
        configPath,
      );
    }
  }

  for (const [packageName, range] of Object.entries(catalog)) {
    addImport(
      imports,
      origins,
      packageName,
      `npm:${packageName}@${range}`,
      `${rootPath}.catalog`,
    );
  }

  for (const [alias, specifier] of Object.entries(supportImports)) {
    if (publicWorkspaceSpecifiers.has(alias)) {
      throw new Error(`support import ${alias} would shadow a public workspace export`);
    }
    addImport(imports, origins, alias, specifier, 'snippet support');
  }

  const preactRange = catalog.preact;
  if (!preactRange) throw new Error(`${rootPath}.catalog: preact entry missing`);
  addImport(
    imports,
    origins,
    'preact/jsx-runtime',
    `npm:preact@${preactRange}/jsx-runtime`,
    'snippet JSX runtime',
  );
  addImport(
    imports,
    origins,
    'preact/jsx-dev-runtime',
    `npm:preact@${preactRange}/jsx-dev-runtime`,
    'snippet JSX runtime',
  );

  return {
    imports,
    catalog,
    memberCount: members.length,
    declaredConflictCount: 0,
    catalogConflictCount: 0,
  };
}
