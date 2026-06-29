/** Shared input helpers for triggers adapter resources.
 *
 * @module
 */

import type { PluginCliArgs } from '@netscript/plugin/adapter';

/** Trigger resource kinds supported by the triggers adapter. */
export const TRIGGER_RESOURCE_KINDS = ['webhook', 'file-watch', 'scheduled'] as const;

/** Trigger resource kind supported by the triggers adapter. */
export type TriggerResourceKind = typeof TRIGGER_RESOURCE_KINDS[number];

/** Common trigger resource input. */
export interface TriggerInput {
  /** Stable trigger identifier supplied by the user. */
  readonly id: string;
  /** Optional output file stem override used by install starter resources. */
  readonly fileName?: string;
  /** Whether an existing generated file may be overwritten by local CLI commands. */
  readonly force?: boolean;
}

/** Input accepted by the webhook trigger resource. */
export interface WebhookInput extends TriggerInput {
  /** Webhook route path. */
  readonly path?: string;
  /** Optional environment variable containing the webhook secret. */
  readonly secretEnv?: string;
}

/** Input accepted by the file-watch trigger resource. */
export interface FileWatchInput extends TriggerInput {
  /** Directories watched by the generated trigger. */
  readonly paths?: readonly string[];
  /** File glob patterns included by the generated trigger. */
  readonly patterns?: readonly string[];
  /** File glob patterns ignored by the generated trigger. */
  readonly ignored?: readonly string[];
}

/** Input accepted by the scheduled trigger resource. */
export interface ScheduledInput extends TriggerInput {
  /** Five-field cron expression. */
  readonly cron?: string;
  /** Optional IANA timezone. */
  readonly timezone?: string;
}

/** Convert a trigger id into a stable file stem. */
export function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a trigger id into a stable exported symbol stem. */
export function exportStem(id: string): string {
  const words = id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const [first = 'trigger', ...rest] = words;
  return [
    first.slice(0, 1).toLowerCase() + first.slice(1),
    ...rest.map((word) => word.slice(0, 1).toUpperCase() + word.slice(1)),
  ].join('');
}

/** Return the generated trigger path for the given input. */
export function triggerPath(input: TriggerInput): string {
  return `triggers/${input.fileName ?? `${fileStem(input.id)}-trigger`}.ts`;
}

/** Render an array literal for generated TypeScript source. */
export function stringArrayLiteral(values: readonly string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

/** Parse webhook resource input from adapter CLI args. */
export function parseWebhookInput(args: PluginCliArgs): WebhookInput {
  return {
    id: requiredResourceId(args),
    path: stringFlag(args, 'path'),
    secretEnv: stringFlag(args, 'secret-env'),
    force: booleanFlag(args, 'force'),
  };
}

/** Parse file-watch resource input from adapter CLI args. */
export function parseFileWatchInput(args: PluginCliArgs): FileWatchInput {
  return {
    id: requiredResourceId(args),
    paths: listFlag(args, 'path', 'paths'),
    patterns: listFlag(args, 'pattern', 'patterns'),
    ignored: listFlag(args, 'ignored'),
    force: booleanFlag(args, 'force'),
  };
}

/** Parse scheduled resource input from adapter CLI args. */
export function parseScheduledInput(args: PluginCliArgs): ScheduledInput {
  return {
    id: requiredResourceId(args),
    cron: stringFlag(args, 'cron'),
    timezone: stringFlag(args, 'timezone'),
    force: booleanFlag(args, 'force'),
  };
}

/** Read the resource id from either adapter-form or legacy command-form args. */
export function requiredResourceId(args: PluginCliArgs): string {
  const [, adapterId] = args.values ?? [];
  const legacyId = args.values?.[0];
  const id = args.command === 'add' || args.command === 'generate' ? adapterId : legacyId;
  if (!id || id.trim().length === 0) {
    throw new Error('Missing triggers resource id.');
  }
  return id;
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

function booleanFlag(args: PluginCliArgs, name: string): boolean {
  const value = args.flags?.[name];
  return value === true || value === 'true' || value === 1 || value === '1';
}

function listFlag(args: PluginCliArgs, ...names: readonly string[]): readonly string[] | undefined {
  const value = names.map((name) => stringFlag(args, name)).find((item) => item !== undefined);
  return value === undefined
    ? undefined
    : Object.freeze(value.split(',').map((item) => item.trim()).filter(Boolean));
}
