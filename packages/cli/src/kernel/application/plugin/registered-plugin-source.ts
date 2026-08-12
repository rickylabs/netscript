import { dirname, relative } from '@std/path';
import { fromFileUrl } from '@std/path/from-file-url';
import type { RegisteredPluginSource } from '../../domain/resolved-config.ts';
import { resolvePluginImportSpecifier } from './configured-plugin-specifier.ts';

/** Classify a plugin from its configured installation contract, never filesystem presence. */
export function resolveRegisteredPluginSource(
  projectRoot: string,
  configuredSpecifier: string,
): RegisteredPluginSource {
  const specifier = configuredSpecifier.trim();
  const resolvedSpecifier = resolvePluginImportSpecifier(projectRoot, specifier);
  if (!isExplicitFilesystemSpecifier(specifier)) {
    return {
      kind: 'package',
      configuredSpecifier: specifier,
      resolvedSpecifier,
    };
  }

  const modulePath = fromFileUrl(resolvedSpecifier);
  const rootDir = modulePath.endsWith('.ts') ? dirname(modulePath) : modulePath;
  return {
    kind: 'local-workdir',
    configuredSpecifier: specifier,
    resolvedSpecifier,
    workdir: normalizePath(relative(projectRoot, rootDir)) || '.',
    rootDir,
  };
}

/** Explicit filesystem forms opt into the local-workdir contract. */
export function isExplicitFilesystemSpecifier(specifier: string): boolean {
  const normalized = specifier.trim();
  return normalized.startsWith('.') || normalized.startsWith('/') || normalized.startsWith('file:');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}
