import type { ProjectFiles } from './adapters/local-project-files.ts';

/** Options for the sagas import codemod. */
export interface CodemodSagaImportsOptions {
  /** Project-relative roots to scan. */
  readonly roots?: readonly string[];
  /** Write changed files. Defaults to dry-run. */
  readonly write?: boolean;
}

/** File changed or reported by the sagas codemod. */
export interface CodemodSagaImportsChange {
  /** Project-relative source file. */
  readonly path: string;
  /** Number of specifier replacements. */
  readonly replacements: number;
  /** Whether the file was written. */
  readonly written: boolean;
}

/** Result returned by `ns-sagas codemod`. */
export interface CodemodSagaImportsResult {
  /** Roots scanned by the codemod. */
  readonly roots: readonly string[];
  /** Whether changed files were written. */
  readonly write: boolean;
  /** Changed files. */
  readonly changes: readonly CodemodSagaImportsChange[];
}

const DEFAULT_CODEMOD_ROOTS = ['sagas', 'services', 'workers', 'packages', 'plugins'] as const;

const IMPORT_REPLACEMENTS = [
  Object.freeze({
    from: '@netscript/sagas/streams/schema',
    to: '@netscript/plugin-sagas-core/streams',
  }),
  Object.freeze({
    from: '@netscript/sagas/streams/server',
    to: '@netscript/plugin-sagas/streams/server',
  }),
  Object.freeze({
    from: '@netscript/sagas',
    to: '@netscript/plugin-sagas-core',
  }),
] as const;

interface ReplacementAccumulator {
  readonly content: string;
  readonly replacements: number;
}

/** Rewrite legacy sagas import specifiers to plugin-sagas-core/plugin-sagas specifiers. */
export async function codemodSagaImports(
  files: ProjectFiles,
  options: CodemodSagaImportsOptions = {},
): Promise<CodemodSagaImportsResult> {
  const roots = options.roots?.length ? options.roots : DEFAULT_CODEMOD_ROOTS;
  const write = options.write === true;
  const sourceFiles = (await Promise.all(
    roots.map((root) => files.listFiles(root, ['.ts', '.tsx', '.json'])),
  )).flat();
  const maybeChanges = await Promise.all(
    sourceFiles.map((file) => rewriteFile(files, file.relativePath, write)),
  );
  const changes = maybeChanges.filter(isCodemodChange);

  return Object.freeze({
    roots: Object.freeze([...roots]),
    write,
    changes: Object.freeze(changes),
  });
}

async function rewriteFile(
  files: ProjectFiles,
  path: string,
  write: boolean,
): Promise<CodemodSagaImportsChange | undefined> {
  const content = await files.readTextFile(path);
  if (content === undefined) {
    return undefined;
  }

  const initial: ReplacementAccumulator = Object.freeze({ content, replacements: 0 });
  const result = IMPORT_REPLACEMENTS.reduce<ReplacementAccumulator>(
    (current, replacement) => replaceSpecifier(current, replacement.from, replacement.to),
    initial,
  );
  if (result.replacements === 0) {
    return undefined;
  }
  if (write) {
    await files.writeTextFile(path, result.content);
  }

  return Object.freeze({ path, replacements: result.replacements, written: write });
}

function replaceSpecifier(
  current: ReplacementAccumulator,
  from: string,
  to: string,
): ReplacementAccumulator {
  const pieces = current.content.split(from);
  const replacements = pieces.length - 1;
  return Object.freeze({
    content: pieces.join(to),
    replacements: current.replacements + replacements,
  });
}

function isCodemodChange(
  change: CodemodSagaImportsChange | undefined,
): change is CodemodSagaImportsChange {
  return change !== undefined;
}
