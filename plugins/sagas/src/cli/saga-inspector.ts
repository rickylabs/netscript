import { type ProjectFiles, selectRegistrySources } from '@netscript/plugin/cli';
import {
  readSagaDeclarations,
  SAGA_CONFIG_SUFFIX,
  SAGA_ROOT_CONFIG,
  type SagaRuntimeDeclaration,
} from './saga-declarations.ts';

/** Options for inspecting saga source files. */
export interface InspectSagasOptions {
  /** Project-relative roots to scan. */
  readonly roots?: readonly string[];
  /** Manifest filename exclusions, including inactive config companions. */
  readonly exclude?: readonly string[];
}

/** Static saga definition discovered in project source. */
export interface SagaInspectionEntry {
  /** Source file path relative to the project root. */
  readonly sourcePath: string;
  /** Saga ids passed to `defineSaga(...)` in this file. */
  readonly sagaIds: readonly string[];
  /** Saga ids passed to `defineSagaConfig(...)` in this file. */
  readonly configIds: readonly string[];
  /** Explicit runtime entrypoints declared by a config companion or root config. */
  readonly runtimeDeclarations?: readonly SagaRuntimeDeclaration[];
}

/** Result returned by `ns-sagas inspect`. */
export interface InspectSagasResult {
  /** Roots scanned by the inspector. */
  readonly roots: readonly string[];
  /** Files containing saga definitions or config definitions. */
  readonly entries: readonly SagaInspectionEntry[];
}

const DEFAULT_INSPECT_ROOTS = ['sagas'] as const;

/** Inspect project files for fluent saga definitions and config definitions. */
export async function inspectSagasProject(
  files: ProjectFiles,
  options: InspectSagasOptions = {},
): Promise<InspectSagasResult> {
  const roots = options.roots?.length ? options.roots : DEFAULT_INSPECT_ROOTS;
  const sourceFiles = (await Promise.all(
    roots.map((root) => files.listFiles(root, ['.ts', '.tsx'])),
  )).flat();
  const paths = [...new Set([...sourceFiles.map((file) => file.relativePath), SAGA_ROOT_CONFIG])]
    .sort();
  const entries = await Promise.all(
    paths.map((path) => inspectFile(files, path, options)),
  );

  return Object.freeze({
    roots: Object.freeze([...roots]),
    entries: Object.freeze(
      entries.filter((entry) => entry.sagaIds.length > 0 || entry.configIds.length > 0),
    ),
  });
}

async function inspectFile(
  files: ProjectFiles,
  path: string,
  options: InspectSagasOptions,
): Promise<SagaInspectionEntry> {
  const content = await files.readTextFile(path) ?? '';
  const config = path === SAGA_ROOT_CONFIG || path.endsWith(SAGA_CONFIG_SUFFIX);
  const excluded = options.exclude?.includes(path.replaceAll('\\', '/').split('/').at(-1) ?? '');
  const active = config && !excluded &&
    (await selectRegistrySources(files, [path])).sourceFiles.length > 0;
  const runtimeDeclarations = active ? readSagaDeclarations(content, path) : [];
  return Object.freeze({
    sourcePath: path,
    sagaIds: Object.freeze(config ? [] : extractDefinitionIds(content, 'defineSaga')),
    configIds: Object.freeze(runtimeDeclarations.map((declaration) => declaration.id)),
    ...(runtimeDeclarations.length ? { runtimeDeclarations } : {}),
  });
}

function extractDefinitionIds(content: string, functionName: string): readonly string[] {
  const pattern = new RegExp(`${functionName}\\(\\s*(['"\`])([^'"\`]+)\\1`, 'g');
  return Object.freeze([...content.matchAll(pattern)].map((match) => match[2]));
}
