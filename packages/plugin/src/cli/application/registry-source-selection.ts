import type { ProjectFiles } from '../adapters/project-files.ts';
export type { ProjectFileEntry, ProjectFiles } from '../adapters/project-files.ts';

/** Exact first-line directive excluding a module from generated runtime registries. */
export const REGISTRY_IGNORE_DIRECTIVE: string = '// @netscript-registry-ignore';

/** Candidate partition shared by registry generation and read-only inspection. */
export interface RegistrySourceSelection {
  /** Candidate paths retained in their original order. */
  readonly sourceFiles: readonly string[];
  /** Candidate paths explicitly opted out by the first-line directive. */
  readonly excludedSourceFiles: readonly string[];
}

/**
 * Partition manifest-eligible modules without importing or executing them.
 *
 * Only an exact first-line comment opts out; a BOM, indentation and CRLF are
 * accepted. Later comments and strings containing the directive have no effect.
 * Existing manifest excludes and definition validation remain the caller's policy.
 *
 * @param files Project source reader; no project writes are required.
 * @param candidates Project-relative paths in the caller's deterministic order.
 * @returns Selected and explicitly excluded paths, preserving that order.
 * @example
 * ```ts
 * const selection = await selectRegistrySources({
 *   readTextFile: () => Promise.resolve('// @netscript-registry-ignore\nexport const helper = 1;'),
 * }, ['triggers/helper.ts']);
 * console.log(selection.excludedSourceFiles); // ['triggers/helper.ts']
 * ```
 */
export async function selectRegistrySources(
  files: Pick<ProjectFiles, 'readTextFile'>,
  candidates: readonly string[],
): Promise<RegistrySourceSelection> {
  const sourceFiles: string[] = [];
  const excludedSourceFiles: string[] = [];
  for (const path of candidates) {
    const source = await files.readTextFile(path);
    const firstLine = source?.split('\n', 1)[0].replace(/^\uFEFF/, '').trim();
    (firstLine === REGISTRY_IGNORE_DIRECTIVE ? excludedSourceFiles : sourceFiles).push(path);
  }
  return Object.freeze({
    sourceFiles: Object.freeze(sourceFiles),
    excludedSourceFiles: Object.freeze(excludedSourceFiles),
  });
}
