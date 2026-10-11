import { parse as parseJsonc } from '@std/jsonc';
import { dirname, fromFileUrl, isAbsolute, join, resolve, SEPARATOR } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
export interface RuntimeRegistryGeneratorDeclaration {
  readonly args?: readonly string[];
  readonly command: string;
  readonly inspectionProtocol: unknown;
  readonly inspectionProtocolDeclared: boolean;
}

export interface RuntimeRegistryDirectory {
  readonly dir: string;
  readonly exclude?: readonly string[];
  readonly fileSuffixes?: readonly string[];
}

export interface RuntimeRegistryTarget extends RuntimeRegistryDirectory {
  readonly pluginDirs?: readonly RuntimeRegistryDirectory[];
  readonly registryPath: string;
}

export interface RuntimeRegistryManifest {
  readonly raw: unknown;
  readonly runtimeRegistries?: readonly RuntimeRegistryTarget[];
  readonly runtimeRegistryGenerator?: RuntimeRegistryGeneratorDeclaration;
}

export interface InstalledRuntimePackage {
  readonly name: string;
  readonly packageName: string;
  readonly version: string;
}

export interface ResolvedRuntimeManifest {
  readonly generatorBase: string;
  readonly value: unknown;
}

/** Minimal JSON HTTP response used to fetch published runtime manifests. */
export interface RuntimeManifestResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

/** HTTP seam for published `scaffold.runtime.json` files. */
export type FetchRuntimeManifest = (url: string) => Promise<RuntimeManifestResponse>;

/** Dependencies for the installed runtime registry adapter. */
export interface InstalledRuntimeRegistryGeneratorDependencies {
  readonly fetchManifest: FetchRuntimeManifest;
  readonly fs: FileSystemPort;
  readonly process: ProcessPort;
}

export async function resolveRuntimeManifest(
  projectRoot: string,
  installed: InstalledRuntimePackage,
  dependencies: InstalledRuntimeRegistryGeneratorDependencies,
): Promise<ResolvedRuntimeManifest | undefined> {
  const memberRoot = await findWorkspaceMemberRoot(
    projectRoot,
    installed.packageName,
    dependencies.fs,
  );
  if (memberRoot) {
    const manifestPath = join(memberRoot, 'scaffold.runtime.json');
    if (await dependencies.fs.exists(manifestPath)) {
      return {
        generatorBase: memberRoot,
        value: JSON.parse(await dependencies.fs.readFile(manifestPath)),
      };
    }
  }

  const sourceRoot = await readMarkedSourceRoot(projectRoot, dependencies.fs);
  if (sourceRoot) {
    const sourceMemberRoot = await findWorkspaceMemberRoot(
      sourceRoot,
      installed.packageName,
      dependencies.fs,
    );
    if (sourceMemberRoot) {
      const manifestPath = join(sourceMemberRoot, 'scaffold.runtime.json');
      if (await dependencies.fs.exists(manifestPath)) {
        return {
          generatorBase: sourceMemberRoot,
          value: JSON.parse(await dependencies.fs.readFile(manifestPath)),
        };
      }
    }
  }

  const manifestUrl = publishedPackageFileUrl(installed, 'scaffold.runtime.json');
  const response = await dependencies.fetchManifest(manifestUrl);
  if (response.status === 404) return undefined;
  if (!response.ok) {
    throw new Error(
      `Failed to load runtime registry manifest for "${installed.name}" (HTTP ${response.status}).`,
    );
  }
  return { generatorBase: manifestUrl, value: await response.json() };
}

async function readMarkedSourceRoot(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  const markerPath = join(projectRoot, SCAFFOLD_FILES.SOURCE_ROOT_MARKER);
  if (!await fs.exists(markerPath)) return undefined;
  const sourceRoot = (await fs.readFile(markerPath)).trim();
  return sourceRoot.length > 0 ? sourceRoot : undefined;
}

async function findWorkspaceMemberRoot(
  projectRoot: string,
  packageName: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  const configPath = join(projectRoot, 'deno.json');
  if (!await fs.exists(configPath)) return undefined;
  const config = asRecord(parseJsonc(await fs.readFile(configPath)));
  const workspaceMember = await findDeclaredWorkspaceMember(
    projectRoot,
    config.workspace,
    packageName,
    fs,
  );
  if (workspaceMember) return workspaceMember;

  const imports = asRecord(config.imports);
  const candidates = Object.entries(imports).filter(([key, value]) =>
    (key === packageName || key.startsWith(`${packageName}/`)) &&
    typeof value === 'string' && isLocalImport(value)
  );
  for (const [, value] of candidates) {
    let current = dirname(resolveLocalImport(projectRoot, value as string));
    while (true) {
      for (const configName of ['deno.json', 'deno.jsonc']) {
        const memberConfigPath = join(current, configName);
        if (!await fs.exists(memberConfigPath)) continue;
        const memberConfig = asRecord(parseJsonc(await fs.readFile(memberConfigPath)));
        if (memberConfig.name === packageName) return current;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return undefined;
}

async function findDeclaredWorkspaceMember(
  projectRoot: string,
  rawWorkspace: unknown,
  packageName: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  for (const entry of readStrings(rawWorkspace) ?? []) {
    if (!isLocalWorkspaceEntry(entry)) continue;
    for (const candidate of await expandWorkspaceEntry(projectRoot, entry, fs)) {
      for (const configName of ['deno.json', 'deno.jsonc']) {
        const memberConfigPath = join(candidate, configName);
        if (!await fs.exists(memberConfigPath)) continue;
        const memberConfig = asRecord(parseJsonc(await fs.readFile(memberConfigPath)));
        if (memberConfig.name === packageName) return candidate;
      }
    }
  }
  return undefined;
}

function isLocalWorkspaceEntry(value: string): boolean {
  return !/^(?:jsr|npm|https?):/.test(value);
}

async function expandWorkspaceEntry(
  projectRoot: string,
  entry: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const absolute = resolveLocalImport(projectRoot, entry);
  const wildcardIndex = absolute.search(/[?*]/);
  if (wildcardIndex === -1) return await fs.exists(absolute) ? [absolute] : [];

  const separatorIndex = absolute.lastIndexOf(SEPARATOR, wildcardIndex);
  const root = separatorIndex <= 0 ? SEPARATOR : absolute.slice(0, separatorIndex);
  if (!await fs.exists(root)) return [];
  const pattern = absolute.slice(separatorIndex + 1).split(SEPARATOR);
  return await expandWorkspaceSegments(root, pattern, fs);
}

async function expandWorkspaceSegments(
  current: string,
  segments: readonly string[],
  fs: FileSystemPort,
): Promise<readonly string[]> {
  if (segments.length === 0) return [current];
  const [segment, ...rest] = segments;
  if (!/[?*]/.test(segment)) {
    const next = join(current, segment);
    return await fs.exists(next) ? await expandWorkspaceSegments(next, rest, fs) : [];
  }

  const matches: string[] = [];
  const expression = wildcardSegmentRegExp(segment);
  for (const child of await fs.readDir(current)) {
    if (!child.isDirectory || !expression.test(child.name)) continue;
    matches.push(...await expandWorkspaceSegments(join(current, child.name), rest, fs));
  }
  return matches;
}

function wildcardSegmentRegExp(segment: string): RegExp {
  const escaped = segment.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('*', '.*')
    .replaceAll('?', '.');
  return new RegExp(`^${escaped}$`);
}

function isLocalImport(value: string): boolean {
  return value.startsWith('./') || value.startsWith('../') || value.startsWith('file:') ||
    isAbsolute(value);
}

function resolveLocalImport(projectRoot: string, value: string): string {
  if (value.startsWith('file:')) return fromFileUrl(value);
  return isAbsolute(value) ? value : resolve(projectRoot, value);
}

export async function discoverInstalledRuntimePackages(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly InstalledRuntimePackage[]> {
  const path = join(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) return [];
  const settings = asRecord(JSON.parse(await fs.readFile(path)));
  const plugins = asRecord(asRecord(settings.NetScript).Plugins);
  const found = new Map<string, InstalledRuntimePackage>();
  for (const raw of Object.values(plugins)) {
    const entrypoint = asRecord(raw).Entrypoint;
    if (typeof entrypoint !== 'string') {
      throw new Error('Installed plugin declaration is missing its entrypoint.');
    }
    const parsed = parseJsrEntrypoint(entrypoint);
    if (!parsed) throw new Error('Installed plugin entrypoint must be a versioned JSR specifier.');
    found.set(`${parsed.packageName}@${parsed.version}`, parsed);
  }
  return [...found.values()];
}

function parseJsrEntrypoint(entrypoint: string): InstalledRuntimePackage | undefined {
  const match = /^jsr:(@[a-z0-9-]+\/[a-z0-9-]+)@([^/\s]+)(?:\/.*)?$/.exec(entrypoint);
  if (!match) return undefined;
  return { name: match[1], packageName: match[1], version: match[2] };
}

function publishedPackageFileUrl(installed: InstalledRuntimePackage, path: string): string {
  const [scope, packageName] = installed.packageName.slice(1).split('/');
  return `https://jsr.io/@${scope}/${packageName}/${installed.version}/${path}`;
}

export function readRuntimeManifest(value: unknown, plugin: string): RuntimeRegistryManifest {
  const manifest = asRecord(value);
  const generator = asRecord(manifest.runtimeRegistryGenerator);
  const targets = Array.isArray(manifest.runtimeRegistries)
    ? manifest.runtimeRegistries.map(readTarget)
    : [];
  const inspectionProtocolDeclared = Object.hasOwn(generator, 'inspectionProtocol');
  if (typeof generator.command !== 'string') {
    if (inspectionProtocolDeclared) {
      throw new Error(
        `Generator inspection protocol 1 failed for ${plugin}: ` +
          'manifest declares inspectionProtocol but omits or malforms command',
      );
    }
    return { raw: value, runtimeRegistries: targets };
  }
  return {
    raw: value,
    runtimeRegistryGenerator: {
      command: generator.command,
      args: readStrings(generator.args),
      inspectionProtocol: generator.inspectionProtocol,
      inspectionProtocolDeclared,
    },
    runtimeRegistries: targets,
  };

  function readTarget(raw: unknown): RuntimeRegistryTarget {
    const target = asRecord(raw);
    if (typeof target.dir !== 'string' || typeof target.registryPath !== 'string') {
      throw new Error(`Invalid runtime registry target declared by installed plugin "${plugin}".`);
    }
    return {
      dir: target.dir,
      registryPath: target.registryPath,
      exclude: readStrings(target.exclude),
      fileSuffixes: readStrings(target.fileSuffixes),
      pluginDirs: Array.isArray(target.pluginDirs)
        ? target.pluginDirs.map((rawDir) => {
          const directory = asRecord(rawDir);
          if (typeof directory.dir !== 'string') {
            throw new Error(`Invalid plugin registry directory declared by "${plugin}".`);
          }
          return {
            dir: directory.dir,
            exclude: readStrings(directory.exclude),
            fileSuffixes: readStrings(directory.fileSuffixes),
          };
        })
        : undefined,
    };
  }
}

function readStrings(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? Object(value) : {};
}
