/**
 * Testing helpers for `@netscript/cli`.
 *
 * @module
 *
 * @example Create in-memory collaborators for a CLI application test.
 * ```ts
 * import {
 *   buildMinimalScaffoldPlan,
 *   createInMemoryFileSystem,
 *   createInMemoryProcess,
 * } from "@netscript/cli/testing";
 *
 * const fs = createInMemoryFileSystem();
 * const process = createInMemoryProcess();
 * const plan = buildMinimalScaffoldPlan();
 * ```
 */

import { MemoryFileSystemAdapter } from './src/kernel/adapters/scaffold/memory-fs.ts';
import type { ScaffoldResult } from './src/kernel/domain/core-types.ts';
import type {
  InitPromptAnswers,
  InitResult,
} from './src/kernel/domain/scaffold/workspace-config.ts';
import type { LoggerPort } from './src/kernel/ports/logger-port.ts';
import type { ProcessPort, ProcessResult } from './src/kernel/ports/process-port.ts';
import type { PromptPort } from './src/kernel/ports/prompt-port.ts';
import type { ScaffoldPlan, ScaffoldServicePlan } from './src/public/domain/scaffold-plan.ts';

export { MemoryFileSystemAdapter };
export type { ScaffoldResult } from './src/kernel/domain/core-types.ts';
export type { DirEntry, FileInfo, WalkEntry } from './src/kernel/domain/core-types.ts';
export type { DbEngine, DbEngineChoice } from './src/kernel/domain/db-engine.ts';
export type {
  EditorChoice,
  InitPromptAnswers,
  InitResult,
} from './src/kernel/domain/scaffold/workspace-config.ts';
export type { FileSystemPort } from './src/kernel/ports/file-system-port.ts';
export type { LoggerPort } from './src/kernel/ports/logger-port.ts';
export type { ProcessPort, ProcessResult } from './src/kernel/ports/process-port.ts';
export type { PromptPort } from './src/kernel/ports/prompt-port.ts';
export type { ScaffoldPlan, ScaffoldServicePlan } from './src/public/domain/scaffold-plan.ts';

/**
 * One recorded in-memory process invocation.
 *
 * @example
 * ```ts
 * import type { RecordedProcessCall } from "@netscript/cli/testing";
 *
 * const call: RecordedProcessCall = { command: "deno", args: ["fmt"] };
 * ```
 */
export interface RecordedProcessCall {
  /** Executable name. */
  readonly command: string;
  /** Positional arguments passed to the process. */
  readonly args: readonly string[];
  /** Optional working directory. */
  readonly cwd?: string;
  /** Optional environment overrides. */
  readonly env?: Readonly<Record<string, string>>;
}

/**
 * In-memory process port with deterministic queued results.
 *
 * @example
 * ```ts
 * import { createInMemoryProcess } from "@netscript/cli/testing";
 *
 * const process = createInMemoryProcess();
 * process.queueResult({ code: 0, stdout: "ok", stderr: "" });
 * ```
 */
export interface InMemoryProcess extends ProcessPort {
  /** Recorded process invocations in call order. */
  readonly calls: readonly RecordedProcessCall[];
  /** Queue one future process result. */
  queueResult(result: ProcessResult): void;
}

/**
 * Scripted answers used by the in-memory prompt port.
 *
 * @example
 * ```ts
 * import type { PromptScript } from "@netscript/cli/testing";
 *
 * const script: PromptScript = { inputs: ["demo"], confirmations: [true] };
 * ```
 */
export interface PromptScript {
  /** Queued free-form answers. */
  readonly inputs?: readonly string[];
  /** Queued confirmation answers. */
  readonly confirmations?: readonly boolean[];
  /** Queued select answers. */
  readonly selections?: readonly string[];
}

/**
 * Create an in-memory filesystem adapter.
 *
 * @example
 * ```ts
 * import { createInMemoryFileSystem } from "@netscript/cli/testing";
 *
 * const fs = createInMemoryFileSystem();
 * await fs.writeFile("/workspace/README.md", "# demo\n");
 * ```
 */
export function createInMemoryFileSystem(): MemoryFileSystemAdapter {
  return new MemoryFileSystemAdapter();
}

/**
 * Create an in-memory process port with queued results.
 *
 * @example
 * ```ts
 * import { createInMemoryProcess } from "@netscript/cli/testing";
 *
 * const process = createInMemoryProcess([{ code: 0, stdout: "ok", stderr: "" }]);
 * const result = await process.exec("deno", ["fmt"]);
 * console.log(result.stdout); // "ok"
 * ```
 */
export function createInMemoryProcess(
  results: readonly ProcessResult[] = [],
): InMemoryProcess {
  const queued = [...results];
  const calls: RecordedProcessCall[] = [];

  return {
    get calls() {
      return calls;
    },
    queueResult(result) {
      queued.push(result);
    },
    exec(command, args, options) {
      calls.push({
        command,
        args: [...args],
        cwd: options?.cwd,
        env: options?.env,
      });
      return Promise.resolve(queued.shift() ?? { code: 0, stdout: '', stderr: '' });
    },
  };
}

/**
 * Create a scripted prompt port for non-interactive tests.
 *
 * @example
 * ```ts
 * import { createInMemoryPrompt } from "@netscript/cli/testing";
 *
 * const prompt = createInMemoryPrompt({
 *   inputs: ["demo"],
 *   confirmations: [true],
 *   selections: ["postgres"],
 * });
 * ```
 */
export function createInMemoryPrompt(script: PromptScript = {}): PromptPort {
  const inputs = [...(script.inputs ?? [])];
  const confirmations = [...(script.confirmations ?? [])];
  const selections = [...(script.selections ?? [])];

  return {
    input(_message, options) {
      return Promise.resolve(inputs.shift() ?? options?.defaultValue ?? '');
    },
    confirm(_message, options) {
      return Promise.resolve(confirmations.shift() ?? options?.defaultValue ?? false);
    },
    select<T extends string>(
      _message: string,
      _options: readonly T[],
      config?: { readonly defaultValue?: T },
    ) {
      return Promise.resolve((selections.shift() ?? config?.defaultValue ?? '') as T);
    },
  };
}

/**
 * Create a no-op logger.
 *
 * @example
 * ```ts
 * import { createSilentLogger } from "@netscript/cli/testing";
 *
 * const logger = createSilentLogger();
 * logger.info("ignored");
 * ```
 */
export function createSilentLogger(): LoggerPort {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  };
}

/**
 * Build a minimal scaffold plan fixture for tests.
 *
 * @example
 * ```ts
 * import { buildMinimalScaffoldPlan } from "@netscript/cli/testing";
 *
 * const plan = buildMinimalScaffoldPlan({ dbEngines: ["postgres"] });
 * ```
 */
export function buildMinimalScaffoldPlan(
  overrides: Partial<ScaffoldPlan> = {},
): ScaffoldPlan {
  const service = overrides.service === undefined
    ? { name: 'users', port: 3000 } satisfies ScaffoldServicePlan
    : overrides.service;
  return {
    name: 'demo',
    appName: 'dashboard',
    workspaceMembers: ['apps/dashboard', 'contracts', 'plugins'],
    dbEngines: [],
    service,
    useWorkspacePackages: false,
    ...overrides,
  };
}

/**
 * Build a minimal init result fixture for tests.
 *
 * @example
 * ```ts
 * import { buildMinimalInitResult } from "@netscript/cli/testing";
 *
 * const result = buildMinimalInitResult({ targetPath: "/tmp/demo" });
 * ```
 */
export function buildMinimalInitResult(
  overrides: Partial<InitResult> = {},
): InitResult {
  return {
    name: 'demo',
    targetPath: '/tmp/demo',
    phases: [],
    dryRun: false,
    durationMs: 0,
    totalFilesCreated: 0,
    totalDirectoriesCreated: 0,
    ...overrides,
  };
}

/**
 * Build a minimal prompt-answer fixture for tests.
 *
 * @example
 * ```ts
 * import { buildMinimalPromptAnswers } from "@netscript/cli/testing";
 *
 * const answers = buildMinimalPromptAnswers({ dbEngine: "mysql" });
 * ```
 */
export function buildMinimalPromptAnswers(
  overrides: Partial<InitPromptAnswers> = {},
): InitPromptAnswers {
  return {
    name: 'demo',
    appName: 'dashboard',
    includeExampleService: true,
    serviceName: 'users',
    servicePort: 3000,
    dbEngine: 'postgres',
    editor: 'none',
    confirm: true,
    ...overrides,
  };
}

/**
 * Build an empty scaffold result fixture for tests.
 *
 * @example
 * ```ts
 * import { buildEmptyScaffoldResult } from "@netscript/cli/testing";
 *
 * const result = buildEmptyScaffoldResult({ totalOperations: 2 });
 * ```
 */
export function buildEmptyScaffoldResult(
  overrides: Partial<ScaffoldResult> = {},
): ScaffoldResult {
  return {
    filesCreated: [],
    directoriesCreated: [],
    filesSkipped: [],
    totalOperations: 0,
    durationMs: 0,
    ...overrides,
  };
}
