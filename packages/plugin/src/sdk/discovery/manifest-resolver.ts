import { join, resolve, toFileUrl } from '@std/path';

import type { PluginManifest } from '../../config/mod.ts';
import type { ManifestResolverPort } from './ports/manifest-resolver-port.ts';

/** In-memory manifest resolver used by tests and alpha SDK stubs. */
export class MemoryManifestResolver implements ManifestResolverPort {
  /** Create a resolver that always returns the provided manifest. */
  constructor(private readonly manifest: PluginManifest | undefined = undefined) {}

  /** Resolve a manifest from the in-memory value. */
  async resolve(_spec: string): Promise<PluginManifest | undefined> {
    return this.manifest;
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
    const specifier = resolveManifestImportSpecifier(this.options.projectRoot, spec);
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

function resolveManifestImportSpecifier(projectRoot: string, spec: string): string {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const resolved = resolve(projectRoot, spec);
    const modulePath = hasModuleExtension(resolved) ? resolved : join(resolved, 'mod.ts');
    return toFileUrl(modulePath).href;
  }
  return spec;
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
