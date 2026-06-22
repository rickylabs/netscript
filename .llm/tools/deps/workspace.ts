import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { parse as parseJsonc } from 'jsr:@std/jsonc@^1.0.0/parse';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';

export type FindingLevel = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface Finding {
  ref: string;
  level: FindingLevel;
  message: string;
  path?: string;
  line?: number;
}

export type Registry = 'npm' | 'jsr';

export interface ParsedSpecifier {
  registry: Registry;
  name: string;
  range: string;
  subpath: string;
  raw: string;
}

export interface WorkspaceMember {
  name: string;
  root: string;
  denoJsonPath: string;
  packageJsonPath: string | null;
  publishable: boolean;
}

export interface DependencyUse {
  registry: Registry;
  name: string;
  range: string;
  raw: string;
  source: 'deno.imports' | 'deno.scopes' | 'package.json' | 'source.import';
  member: WorkspaceMember;
  path: string;
  line: number;
  catalogVersion?: string;
}

export interface TaskDefinition {
  member: WorkspaceMember | null;
  name: string;
  command: string;
  path: string;
  line: number;
}

export interface WorkspaceFacts {
  root: string;
  catalog: Record<string, string>;
  members: WorkspaceMember[];
  dependencies: DependencyUse[];
  tasks: TaskDefinition[];
}

type JsonObject = Record<string, unknown>;

export async function readJsonFile(path: string): Promise<JsonObject> {
  return parseJsonc(await Deno.readTextFile(path)) as JsonObject;
}

export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

export function lineOf(text: string, needle: string): number {
  const index = text.indexOf(needle);
  if (index === -1) return 1;
  return text.slice(0, index).split('\n').length;
}

export function parseRegistrySpecifier(raw: string): ParsedSpecifier | null {
  const registry = raw.startsWith('npm:') ? 'npm' : raw.startsWith('jsr:') ? 'jsr' : null;
  if (!registry) return null;
  const rest = raw.slice(4);
  const scoped = rest.startsWith('@');
  const searchFrom = scoped ? 1 : 0;
  const versionAt = rest.indexOf('@', searchFrom);
  const nameAndPath = versionAt === -1 ? rest : rest.slice(0, versionAt);
  const rangeAndPath = versionAt === -1 ? '' : rest.slice(versionAt + 1);
  const nameParts = nameAndPath.split('/');
  const name = scoped ? nameParts.slice(0, 2).join('/') : nameParts[0];
  const nameSubpath = scoped ? nameParts.slice(2).join('/') : nameParts.slice(1).join('/');
  const slash = rangeAndPath.indexOf('/');
  const range = slash === -1 ? rangeAndPath : rangeAndPath.slice(0, slash);
  const rangeSubpath = slash === -1 ? '' : rangeAndPath.slice(slash + 1);
  return { registry, name, range, subpath: rangeSubpath || nameSubpath, raw };
}

export async function discoverWorkspaceMembers(
  root: string = Deno.cwd(),
): Promise<WorkspaceMember[]> {
  const rootConfig = await readJsonFile(join(root, 'deno.json'));
  const patterns = Array.isArray(rootConfig.workspace) ? rootConfig.workspace : [];
  const members: WorkspaceMember[] = [];
  for (const pattern of patterns) {
    if (typeof pattern !== 'string' || !pattern.endsWith('/*')) {
      const denoJsonPath = join(root, pattern, 'deno.json');
      if (await exists(denoJsonPath)) members.push(await memberFromDenoJson(root, denoJsonPath));
      continue;
    }
    const parent = join(root, pattern.slice(0, -2));
    if (!(await exists(parent))) continue;
    for await (const entry of Deno.readDir(parent)) {
      if (!entry.isDirectory) continue;
      const denoJsonPath = join(parent, entry.name, 'deno.json');
      if (await exists(denoJsonPath)) members.push(await memberFromDenoJson(root, denoJsonPath));
    }
  }
  members.sort((a, b) => a.root.localeCompare(b.root));
  return members;
}

async function memberFromDenoJson(root: string, denoJsonPath: string): Promise<WorkspaceMember> {
  const memberRoot = denoJsonPath.slice(0, -'/deno.json'.length);
  const denoJson = await readJsonFile(denoJsonPath);
  const packageJsonPath = join(memberRoot, 'package.json');
  const packageJson = await exists(packageJsonPath) ? await readJsonFile(packageJsonPath) : null;
  const name = typeof denoJson.name === 'string'
    ? denoJson.name
    : typeof packageJson?.name === 'string'
    ? packageJson.name
    : relative(root, memberRoot);
  return {
    name,
    root: normalize(relative(root, memberRoot)),
    denoJsonPath: normalize(relative(root, denoJsonPath)),
    packageJsonPath: packageJson ? normalize(relative(root, packageJsonPath)) : null,
    publishable: denoJson.publish !== false,
  };
}

export async function collectWorkspaceFacts(root: string = Deno.cwd()): Promise<WorkspaceFacts> {
  const rootConfig = await readJsonFile(join(root, 'deno.json'));
  const catalog = (rootConfig.catalog ?? {}) as Record<string, string>;
  const rootMember: WorkspaceMember = {
    name: '<root>',
    root: '.',
    denoJsonPath: 'deno.json',
    packageJsonPath: null,
    publishable: false,
  };
  const members = await discoverWorkspaceMembers(root);
  const dependencies: DependencyUse[] = [];
  const tasks: TaskDefinition[] = [];
  await collectDenoJson(root, rootMember, dependencies, tasks);
  for (const member of members) {
    await collectDenoJson(root, member, dependencies, tasks);
    await collectPackageJson(root, member, catalog, dependencies);
    await collectSourceImports(root, member, dependencies);
  }
  return { root, catalog, members, dependencies, tasks };
}

async function collectDenoJson(
  root: string,
  member: WorkspaceMember,
  dependencies: DependencyUse[],
  tasks: TaskDefinition[],
): Promise<void> {
  const path = member.denoJsonPath;
  const abs = join(root, path);
  const text = await Deno.readTextFile(abs);
  const json = parseJsonc(text) as JsonObject;
  collectTaskDefinitions(member.root === '.' ? null : member, path, text, json, tasks);
  collectImportMap(member, path, text, json.imports, 'deno.imports', dependencies);
  const scopes = json.scopes;
  if (scopes && typeof scopes === 'object' && !Array.isArray(scopes)) {
    for (const value of Object.values(scopes as Record<string, unknown>)) {
      collectImportMap(member, path, text, value, 'deno.scopes', dependencies);
    }
  }
}

function collectTaskDefinitions(
  member: WorkspaceMember | null,
  path: string,
  text: string,
  json: JsonObject,
  tasks: TaskDefinition[],
): void {
  const rawTasks = json.tasks;
  if (!rawTasks || typeof rawTasks !== 'object' || Array.isArray(rawTasks)) return;
  for (const [name, value] of Object.entries(rawTasks as Record<string, unknown>)) {
    const command = typeof value === 'string'
      ? value
      : value && typeof value === 'object' && typeof (value as JsonObject).command === 'string'
      ? (value as JsonObject).command as string
      : '';
    tasks.push({ member, name, command, path, line: lineOf(text, `"${name}"`) });
  }
}

function collectImportMap(
  member: WorkspaceMember,
  path: string,
  text: string,
  value: unknown,
  source: 'deno.imports' | 'deno.scopes',
  dependencies: DependencyUse[],
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const specifier of Object.values(value as Record<string, unknown>)) {
    if (typeof specifier !== 'string') continue;
    const parsed = parseRegistrySpecifier(specifier);
    if (!parsed) continue;
    dependencies.push({ ...parsed, source, member, path, line: lineOf(text, specifier) });
  }
}

async function collectPackageJson(
  root: string,
  member: WorkspaceMember,
  catalog: Record<string, string>,
  dependencies: DependencyUse[],
): Promise<void> {
  if (!member.packageJsonPath) return;
  const path = member.packageJsonPath;
  const text = await Deno.readTextFile(join(root, path));
  const json = parseJsonc(text) as JsonObject;
  for (
    const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  ) {
    const deps = json[section];
    if (!deps || typeof deps !== 'object' || Array.isArray(deps)) continue;
    for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
      if (typeof version !== 'string') continue;
      if (version === 'catalog:') {
        dependencies.push({
          registry: 'npm',
          name,
          range: catalog[name] ?? '',
          raw: version,
          source: 'package.json',
          member,
          path,
          line: lineOf(text, `"${name}"`),
          catalogVersion: catalog[name],
        });
        continue;
      }
      const parsed = parseRegistrySpecifier(version);
      if (parsed) {
        dependencies.push({
          ...parsed,
          source: 'package.json',
          member,
          path,
          line: lineOf(text, `"${name}"`),
        });
      } else if (version.startsWith('file:') || version.startsWith('link:')) {
        dependencies.push({
          registry: 'npm',
          name,
          range: version,
          raw: version,
          source: 'package.json',
          member,
          path,
          line: lineOf(text, `"${name}"`),
        });
      }
    }
  }
}

async function collectSourceImports(
  root: string,
  member: WorkspaceMember,
  dependencies: DependencyUse[],
): Promise<void> {
  const memberRoot = join(root, member.root);
  for await (
    const entry of walk(memberRoot, {
      match: [/\.[cm]?tsx?$/],
      skip: [/node_modules/, /\.generated/, /_fresh/, /\.deploy/],
    })
  ) {
    const path = normalize(relative(root, entry.path));
    const text = await Deno.readTextFile(entry.path);
    for (
      const match of text.matchAll(
        /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]((?:npm|jsr):[^'"]+)['"]/g,
      )
    ) {
      const raw = match[1];
      const parsed = parseRegistrySpecifier(raw);
      if (!parsed) continue;
      dependencies.push({
        ...parsed,
        source: 'source.import',
        member,
        path,
        line: text.slice(0, match.index ?? 0).split('\n').length,
      });
    }
  }
}

export function hasFail(findings: Finding[]): boolean {
  return findings.some((finding) => finding.level === 'FAIL');
}

export function printFindings(findings: Finding[], json: boolean): void {
  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }
  for (const finding of findings) {
    const where = finding.path ? `${finding.path}${finding.line ? `:${finding.line}` : ''}` : '';
    console.log(`${finding.level} ${finding.ref}${where ? ` ${where}` : ''} ${finding.message}`);
  }
}
