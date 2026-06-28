import { dirname } from '@std/path/posix';
import type { PluginLogger } from '../domain/mod.ts';
import type { FileSystemPort } from '../ports/mod.ts';
import type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';

/** Argv flag carrying the JSON-encoded scaffolder context. */
const CONTEXT_JSON_FLAG = '--context-json';

/**
 * The subset of a scaffolder context parsed from the `--context-json` argv contract.
 *
 * The host installer passes `workspaceRoot`, `options`, and `dryRun`; the logger is supplied by the
 * CLI runner, not by the wire format.
 */
export interface ParsedScaffolderContext {
  /** Absolute path to the target workspace root. */
  readonly workspaceRoot: string;
  /** Plugin-specific scaffold options passed by the installer. */
  readonly options: Readonly<Record<string, unknown>>;
  /** Whether the scaffolder must report planned changes without writing files. */
  readonly dryRun: boolean;
}

/**
 * Parse a scaffolder context from process argv following the `--context-json` contract.
 *
 * The installer invokes a plugin's `./scaffold` export as
 * `deno run <perms> <target> --context-json '<json>'`, where `<json>` encodes
 * `{ workspaceRoot, options, dryRun }`. This parser locates the flag, JSON-parses its value, and
 * validates the shape.
 *
 * @param args The process arguments, typically `Deno.args`.
 * @returns The parsed and validated context fields.
 * @throws {Error} When the flag is missing, its value is absent, or the JSON shape is invalid.
 * @example
 * ```ts
 * import { parseScaffolderContextArgs } from '@netscript/plugin/scaffold';
 *
 * const context = parseScaffolderContextArgs(Deno.args);
 * ```
 */
export function parseScaffolderContextArgs(args: readonly string[]): ParsedScaffolderContext {
  const index = args.indexOf(CONTEXT_JSON_FLAG);
  const raw = index >= 0 ? args[index + 1] : undefined;
  if (raw === undefined) {
    throw new Error(`Missing ${CONTEXT_JSON_FLAG}.`);
  }
  return parseContext(JSON.parse(raw));
}

/** Options accepted by {@linkcode runScaffoldCli}. */
export interface RunScaffoldCliOptions {
  /** The scaffold entrypoint to invoke. */
  readonly entrypoint: PluginScaffoldEntrypoint;
  /** Process arguments. Defaults to `Deno.args`. */
  readonly args?: readonly string[];
  /** Logger supplied to the scaffolder. Defaults to a no-op logger. */
  readonly logger?: PluginLogger;
}

/**
 * Run a plugin scaffold entrypoint using the `--context-json` argv contract.
 *
 * This is the composition edge: it parses the context from argv, invokes the entrypoint with a
 * logger, and writes the {@linkcode ScaffoldResult} as a single JSON line to stdout (which the host
 * installer reads back as the last non-empty stdout line).
 *
 * @param options The entrypoint to run plus optional argv and logger overrides.
 * @returns A promise that resolves once the result has been written to stdout.
 * @example
 * ```ts
 * import { createPluginScaffold, runScaffoldCli } from '@netscript/plugin/scaffold';
 *
 * const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });
 * if (import.meta.main) {
 *   await runScaffoldCli({ entrypoint: scaffold });
 * }
 * ```
 */
export async function runScaffoldCli(options: RunScaffoldCliOptions): Promise<void> {
  const parsed = parseScaffolderContextArgs(options.args ?? Deno.args);
  const context: ScaffolderContext = {
    workspaceRoot: parsed.workspaceRoot,
    options: parsed.options,
    dryRun: parsed.dryRun,
    logger: options.logger ?? noopLogger,
  };
  const result = await options.entrypoint(context);
  await writeResult(result);
}

/**
 * Create a {@linkcode FileSystemPort} backed by the real Deno file system.
 *
 * Writes create parent directories as needed; reads of missing files surface as a thrown error, so
 * callers should guard with {@linkcode FileSystemPort.exists} first. This adapter is constructed at
 * the CLI composition edge so the scaffold factory never references a concrete adapter.
 *
 * @returns A file system port that reads, writes, and probes paths via `Deno.*`.
 * @example
 * ```ts
 * import { createDenoFileSystem } from '@netscript/plugin/scaffold';
 *
 * const fileSystem = createDenoFileSystem();
 * ```
 */
export function createDenoFileSystem(): FileSystemPort {
  return {
    readText: (path) => Deno.readTextFile(path),
    writeText: async (path, text) => {
      await Deno.mkdir(dirname(path), { recursive: true });
      await Deno.writeTextFile(path, text);
    },
    exists: async (path) => {
      try {
        await Deno.lstat(path);
        return true;
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return false;
        }
        throw error;
      }
    },
  };
}

/** A logger that discards every message. */
const noopLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/** Write the scaffold result to stdout as a single JSON line. */
function writeResult(result: ScaffoldResult): Promise<number> {
  return Deno.stdout.write(new TextEncoder().encode(`${JSON.stringify(result)}\n`));
}

/** Validate and narrow a parsed JSON value into a {@linkcode ParsedScaffolderContext}. */
function parseContext(value: unknown): ParsedScaffolderContext {
  if (value === null || typeof value !== 'object') {
    throw new Error('Scaffolder context must be an object.');
  }
  const workspaceRoot = Reflect.get(value, 'workspaceRoot');
  const options = Reflect.get(value, 'options');
  const dryRun = Reflect.get(value, 'dryRun');

  if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
    throw new Error('Scaffolder context requires workspaceRoot.');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Scaffolder context requires options.');
  }
  if (typeof dryRun !== 'boolean') {
    throw new Error('Scaffolder context requires dryRun.');
  }
  return { workspaceRoot, options, dryRun };
}
