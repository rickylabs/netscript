/** Shared input helpers for sagas adapter resources.
 *
 * @module
 */

import type { PluginCliArgs } from '@netscript/plugin/adapter';

/** Durability tiers accepted by generated saga definitions. */
export const SAGAS_DURABILITY_TIERS = ['t1', 't2', 't3'] as const;

/** Durability tier accepted by the sagas resource. */
export type SagasDurabilityTier = typeof SAGAS_DURABILITY_TIERS[number];

/** Input accepted by the sagas saga resource. */
export interface SagaInput {
  /** Stable saga identifier supplied by the user. */
  readonly id: string;
  /** Optional output directory relative to the project root. */
  readonly directory?: string;
  /** Message type handled by the generated saga. */
  readonly messageType?: string;
  /** Initial state status label. */
  readonly initialStatus?: string;
  /** Completed state status label. */
  readonly completedStatus?: string;
  /** Durability tier for the generated saga. */
  readonly durability: SagasDurabilityTier;
  /** Optional queue or stream topic for generated config entries. */
  readonly topic?: string;
  /** Optional human-readable description for generated config entries. */
  readonly description?: string;
  /** Optional config tags. */
  readonly tags?: readonly string[];
}

/** Convert a saga identifier into a stable file stem. */
export function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a saga identifier into a PascalCase exported symbol stem. */
export function exportStem(id: string): string {
  const pascal = fileStem(id)
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('');
  return pascal.length > 0 ? pascal : 'Generated';
}

/** Parse saga resource input from adapter CLI args. */
export function parseSagaInput(args: PluginCliArgs): SagaInput {
  return {
    id: requiredResourceId(args),
    directory: stringFlag(args, 'dir') ?? stringFlag(args, 'directory'),
    messageType: stringFlag(args, 'message-type'),
    initialStatus: stringFlag(args, 'initial-status'),
    completedStatus: stringFlag(args, 'completed-status'),
    durability: parseDurability(stringFlag(args, 'durability')),
    topic: stringFlag(args, 'topic'),
    description: stringFlag(args, 'description'),
    tags: stringFlag(args, 'tags')?.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

/** Read the resource id from either adapter-form or legacy command-form args. */
export function requiredResourceId(args: PluginCliArgs): string {
  const [, adapterId] = args.values ?? [];
  const legacyId = args.values?.[0];
  const id = args.command === 'add' || args.command === 'generate' ? adapterId : legacyId;
  if (!id || id.trim().length === 0) {
    throw new Error('Missing sagas resource id.');
  }
  return id;
}

/** Resolve the generated event type for saga input. */
export function messageType(input: SagaInput): string {
  return input.messageType?.trim() || `${fileStem(input.id)}.requested`;
}

/** Resolve the generated initial state status label. */
export function initialStatus(input: SagaInput): string {
  return input.initialStatus?.trim() || 'pending';
}

/** Resolve the generated completed state status label. */
export function completedStatus(input: SagaInput): string {
  return input.completedStatus?.trim() || 'completed';
}

/** Resolve the directory where saga userland files are emitted. */
export function sagaDirectory(input: SagaInput): string {
  return input.directory?.replace(/\\/g, '/') ?? 'sagas';
}

/** Render an array literal for generated TypeScript source. */
export function stringArrayLiteral(values: readonly string[] = []): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

/** Convert a saga id into a human-readable display name. */
export function displayName(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

/** Parse and validate a saga durability tier. */
export function parseDurability(value: string | undefined): SagasDurabilityTier {
  if (value === undefined) {
    return 't1';
  }
  if (isSagasDurabilityTier(value)) {
    return value;
  }
  throw new Error(`Unsupported sagas durability tier: ${value}`);
}

function isSagasDurabilityTier(value: string): value is SagasDurabilityTier {
  return SAGAS_DURABILITY_TIERS.some((tier) => tier === value);
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
