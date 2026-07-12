/** Shared input helpers for workers adapter resources.
 *
 * @module
 */

import type { PluginCliArgs } from '@netscript/plugin/adapter';

/** Task runtimes supported by workers generated userland tasks. */
export const WORKERS_TASK_RUNTIMES = ['deno', 'python', 'shell', 'powershell'] as const;

/** Task runtime accepted by the workers task resource. */
export type WorkersTaskRuntime = typeof WORKERS_TASK_RUNTIMES[number];

/** Common workers resource input. */
export interface WorkersResourceInput {
  /** Stable resource identifier supplied by the user. */
  readonly id: string;
}

/** Input accepted by the workers job resource. */
export interface JobInput extends WorkersResourceInput {
  /** Optional stream topic emitted by the job. */
  readonly topic?: string;
  /** Optional cron schedule for the job. */
  readonly schedule?: string;
  /** Optional job timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Optional retry count for generated metadata. */
  readonly maxRetries?: number;
  /** Optional classification tags. */
  readonly tags?: readonly string[];
}

/** Input accepted by the workers task resource. */
export interface TaskInput extends WorkersResourceInput {
  /** Task runtime for generated task source. */
  readonly runtime: WorkersTaskRuntime;
  /** Optional generated script entrypoint. */
  readonly entrypoint?: string;
  /** Optional task timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Optional retry count for generated metadata. */
  readonly maxRetries?: number;
}

/** Input accepted by the workers workflow resource. */
export interface WorkflowInput extends WorkersResourceInput {}

/** Convert a resource identifier into a stable file stem. */
export function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a resource identifier into a stable exported symbol stem. */
export function exportStem(id: string): string {
  const cleaned = id
    .trim()
    .replace(/^[^a-zA-Z_]+/, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned.length > 0 ? cleaned : 'worker';
}

/** Parse job resource input from adapter CLI args. */
export function parseJobInput(args: PluginCliArgs): JobInput {
  const id = requiredResourceId(args);
  return {
    id,
    topic: stringFlag(args, 'topic'),
    schedule: stringFlag(args, 'schedule'),
    timeoutMs: numberFlag(args, 'timeout'),
    maxRetries: numberFlag(args, 'max-retries'),
    tags: stringFlag(args, 'tags')?.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

/** Parse task resource input from adapter CLI args. */
export function parseTaskInput(args: PluginCliArgs): TaskInput {
  return {
    id: requiredResourceId(args),
    runtime: parseTaskRuntime(stringFlag(args, 'runtime')),
    entrypoint: stringFlag(args, 'entrypoint'),
    timeoutMs: numberFlag(args, 'timeout'),
    maxRetries: numberFlag(args, 'max-retries'),
  };
}

/** Parse workflow resource input from adapter CLI args. */
export function parseWorkflowInput(args: PluginCliArgs): WorkflowInput {
  return { id: requiredResourceId(args) };
}

/** Read the resource id from either adapter-form or legacy command-form args. */
export function requiredResourceId(args: PluginCliArgs): string {
  const [, adapterId] = args.values ?? [];
  const legacyId = args.values?.[0];
  const id = args.command === 'add' || args.command === 'generate' ? adapterId : legacyId;
  if (!id || id.trim().length === 0) {
    throw new Error('Missing workers resource id.');
  }
  return id;
}

/** Parse and validate a task runtime. */
export function parseTaskRuntime(value: string | undefined): WorkersTaskRuntime {
  if (value === undefined) {
    return 'deno';
  }
  if (isWorkersTaskRuntime(value)) {
    return value;
  }
  throw new Error(`Unsupported workers task runtime: ${value}`);
}

function isWorkersTaskRuntime(value: string): value is WorkersTaskRuntime {
  return WORKERS_TASK_RUNTIMES.some((runtime) => runtime === value);
}

function stringFlag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function numberFlag(args: PluginCliArgs, name: string): number | undefined {
  const value = stringFlag(args, name);
  if (value === undefined) {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Flag --${name} must be a number.`);
  }
  return number;
}
