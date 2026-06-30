/**
 * CLI bridge for plugin-owned scaffold entrypoints.
 *
 * @module
 */

import type { PluginLogger } from '../domain/mod.ts';
import type { PluginScaffoldEntrypoint, ScaffolderContext } from '../protocol/mod.ts';

interface ScaffoldCliContextPayload {
  readonly workspaceRoot: string;
  readonly options: Readonly<Record<string, unknown>>;
  readonly dryRun: boolean;
}

/**
 * Run a plugin scaffold entrypoint from the host CLI subprocess protocol.
 *
 * The host passes `--context-json <json>` and reads the final non-empty stdout
 * line as a JSON `ScaffoldResult`. Lifecycle logs therefore go to stderr.
 *
 * @param entrypoint Plugin scaffold entrypoint to invoke.
 * @param argv Command-line arguments carrying `--context-json`.
 *
 * @example
 * ```ts
 * if (import.meta.main) {
 *   await runPluginScaffoldCli(scaffold);
 * }
 * ```
 */
export async function runPluginScaffoldCli(
  entrypoint: PluginScaffoldEntrypoint,
  argv: readonly string[] = Deno.args,
): Promise<void> {
  try {
    const payload = parseScaffoldCliContextPayload(argv);
    const context: ScaffolderContext = {
      workspaceRoot: payload.workspaceRoot,
      options: payload.options,
      dryRun: payload.dryRun,
      logger: createStderrPluginLogger(),
    };
    const result = await entrypoint(context);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(formatError(error));
    Deno.exitCode = 1;
  }
}

function parseScaffoldCliContextPayload(argv: readonly string[]): ScaffoldCliContextPayload {
  const contextFlagIndex = argv.indexOf('--context-json');
  if (contextFlagIndex < 0) {
    throw new TypeError('Missing required --context-json argument.');
  }

  const rawContext = argv[contextFlagIndex + 1];
  if (rawContext === undefined || rawContext.trim().length === 0) {
    throw new TypeError('Missing JSON payload after --context-json.');
  }

  const value: unknown = JSON.parse(rawContext);
  if (!isScaffoldCliContextPayload(value)) {
    throw new TypeError(
      'Invalid --context-json payload; expected workspaceRoot, options, and dryRun.',
    );
  }
  return value;
}

function isScaffoldCliContextPayload(value: unknown): value is ScaffoldCliContextPayload {
  if (!isRecord(value)) return false;
  return typeof value.workspaceRoot === 'string' &&
    isRecord(value.options) &&
    typeof value.dryRun === 'boolean';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function createStderrPluginLogger(): PluginLogger {
  return {
    debug: (message, fields) => writeLog('debug', message, fields),
    info: (message, fields) => writeLog('info', message, fields),
    warn: (message, fields) => writeLog('warn', message, fields),
    error: (message, fields) => writeLog('error', message, fields),
  };
}

function writeLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  fields?: Record<string, unknown>,
): void {
  const suffix = fields === undefined ? '' : ` ${formatFields(fields)}`;
  console.error(`[plugin-scaffold:${level}] ${message}${suffix}`);
}

function formatFields(fields: Record<string, unknown>): string {
  try {
    return JSON.stringify(fields);
  } catch {
    return '[unserializable fields]';
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return `Plugin scaffold failed: ${formatUnknown(error)}`;
}

function formatUnknown(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
