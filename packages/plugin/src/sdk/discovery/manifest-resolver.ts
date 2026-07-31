import { join, resolve, toFileUrl } from '@std/path';

import type { PluginManifest } from '../../config/mod.ts';
import type { ManifestResolverPort } from './ports/manifest-resolver-port.ts';

/** In-memory manifest resolver used by tests and alpha SDK stubs. */
export class MemoryManifestResolver implements ManifestResolverPort {
  /** Create a resolver that always returns the provided manifest. */
  constructor(private readonly manifest: PluginManifest | undefined = undefined) {}

  /** Resolve a manifest from the in-memory value. */
  resolve(_spec: string): Promise<PluginManifest | undefined> {
    return Promise.resolve(this.manifest);
  }
}

/** Options for resolving manifests from importable module specifiers. */
export interface ModuleManifestResolverOptions {
  /** Project root used to resolve relative plugin specifiers. */
  readonly projectRoot: string;
}

/** Manifest resolver backed by dynamic imports. */
export class ModuleManifestResolver implements ManifestResolverPort {
  /** Create a module resolver with project-root options. */
  constructor(private readonly options: ModuleManifestResolverOptions) {}

  /** Resolve a plugin manifest module by package or file specifier. */
  async resolve(spec: string): Promise<PluginManifest | undefined> {
    const specifier = await resolveManifestImportSpecifier(this.options.projectRoot, spec);
    let module: { readonly default?: PluginManifest };
    try {
      module = await import(specifier) as { readonly default?: PluginManifest };
    } catch (error) {
      if (isModuleNotFoundError(error)) {
        return undefined;
      }
      throw error;
    }
    return module.default;
  }
}

const MODULE_EXTENSIONS: readonly string[] = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.cjs'];

function hasModuleExtension(path: string): boolean {
  return MODULE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

async function resolveManifestImportSpecifier(projectRoot: string, spec: string): Promise<string> {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const resolved = resolve(projectRoot, spec);
    const modulePath = hasModuleExtension(resolved) ? resolved : join(resolved, 'mod.ts');
    return toFileUrl(modulePath).href;
  }
  return await resolveWorkspaceMemberSpecifier(projectRoot, spec) ?? spec;
}

interface DenoWorkspaceConfig {
  readonly name?: string;
  readonly exports?: string | Readonly<Record<string, string>>;
  readonly workspace?: readonly string[] | { readonly members?: readonly string[] };
}

async function resolveWorkspaceMemberSpecifier(
  projectRoot: string,
  spec: string,
): Promise<string | undefined> {
  const rootConfig = await readDenoConfig(join(projectRoot, 'deno.json'));
  if (!rootConfig) return undefined;

  const packageName = packageNameFromSpecifier(spec);
  const exportName = spec.slice(packageName.length) || '.';
  const workspace = rootConfig.workspace;
  const members = Array.isArray(workspace)
    ? workspace
    : workspace && 'members' in workspace
    ? workspace.members ?? []
    : [];

  for (const memberDir of await expandWorkspaceMembers(projectRoot, members)) {
    const memberConfig = await readDenoConfig(join(memberDir, 'deno.json'));
    if (memberConfig?.name !== packageName) continue;
    const target = typeof memberConfig.exports === 'string'
      ? exportName === '.' ? memberConfig.exports : undefined
      : memberConfig.exports?.[exportName];
    if (!target) return undefined;
    return toFileUrl(resolve(memberDir, target)).href;
  }
  return undefined;
}

function packageNameFromSpecifier(spec: string): string {
  const segments = spec.split('/');
  return spec.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

async function expandWorkspaceMembers(
  projectRoot: string,
  members: readonly string[],
): Promise<readonly string[]> {
  const expanded: string[] = [];
  for (const member of members) {
    if (!member.endsWith('/*')) {
      expanded.push(resolve(projectRoot, member));
      continue;
    }
    const parent = resolve(projectRoot, member.slice(0, -2));
    try {
      for await (const entry of Deno.readDir(parent)) {
        if (entry.isDirectory) expanded.push(join(parent, entry.name));
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return expanded;
}

async function readDenoConfig(path: string): Promise<DenoWorkspaceConfig | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as DenoWorkspaceConfig;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

function isModuleNotFoundError(error: unknown): boolean {
  if (error instanceof Deno.errors.NotFound) return true;
  if (error instanceof TypeError) {
    const message = error.message;
    return message.includes('Module not found') ||
      message.includes('Cannot find module') ||
      message.includes('Cannot resolve module');
  }
  return false;
}
