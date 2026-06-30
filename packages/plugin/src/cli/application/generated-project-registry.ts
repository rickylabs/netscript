/** Generated project registry loader shared by plugin CLIs. */

import { fromFileUrl, isAbsolute, join } from '@std/path';
import type { ProjectFiles } from '../adapters/project-files.ts';

/** Runtime guard for a generated definition value. */
export type DefinitionGuard<TDefinition> = (value: unknown) => value is TDefinition;

/** Options for loading a generated registry from a NetScript project. */
export interface GeneratedProjectRegistryOptions<TDefinition> {
  /** Project file adapter used to resolve paths. */
  readonly files: ProjectFiles;
  /** Generated registry path relative to the project root. */
  readonly registryPath: string;
  /** Export name that contains the registry array. */
  readonly exportName: string;
  /** Runtime guard for each registry entry. */
  readonly isDefinition: DefinitionGuard<TDefinition>;
  /** Optional module importer, supplied by tests. */
  readonly importModule?: (specifier: string) => Promise<Readonly<Record<string, unknown>>>;
}

/**
 * Find a project root from a path or URL and a project file adapter.
 *
 * @param input - Optional absolute path, relative path, or `file:` URL.
 * @param fallback - Fallback project root when `input` is omitted.
 * @returns Absolute project root path.
 */
export function findGeneratedProjectRoot(input: string | undefined, fallback: string): string {
  if (input === undefined || input.length === 0) {
    return fallback;
  }
  const path = input.startsWith('file:') ? fromFileUrl(input) : input;
  return isAbsolute(path) ? path : join(fallback, path);
}

/**
 * Load and validate a generated project registry export.
 *
 * @param options - Registry path, export name, file adapter, and definition guard.
 * @returns Validated registry definitions.
 */
export async function loadGeneratedProjectRegistry<TDefinition>(
  options: GeneratedProjectRegistryOptions<TDefinition>,
): Promise<readonly TDefinition[]> {
  const specifier = options.files.toImportUrl(options.registryPath);
  const module = await (options.importModule ?? importModule)(specifier);
  const value = module[options.exportName];

  if (!Array.isArray(value)) {
    throw new TypeError(`Generated registry export "${options.exportName}" is not an array.`);
  }

  const definitions: TDefinition[] = [];
  for (const entry of value) {
    if (!options.isDefinition(entry)) {
      throw new TypeError(
        `Generated registry export "${options.exportName}" contains an invalid entry.`,
      );
    }
    definitions.push(entry);
  }

  return Object.freeze(definitions);
}

async function importModule(specifier: string): Promise<Readonly<Record<string, unknown>>> {
  return await import(specifier) as Readonly<Record<string, unknown>>;
}
