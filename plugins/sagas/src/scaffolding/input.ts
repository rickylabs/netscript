/** Durability tiers accepted by saga scaffolding templates. */
export const SAGAS_SCAFFOLD_DURABILITY_TIERS = ['t1', 't2', 't3'] as const;

/** Durability tier accepted by generated saga definitions. */
export type SagasScaffoldDurabilityTier = typeof SAGAS_SCAFFOLD_DURABILITY_TIERS[number];

/** Input accepted by sagas item scaffolders. */
export interface SagasScaffoldInput {
  /** Stable saga identifier. */
  readonly id: string;
  /** Optional output directory relative to the project root. */
  readonly directory?: string;
  /** Message type handled by the generated saga. */
  readonly messageType?: string;
  /** Optional initial status label for the generated state shape. */
  readonly initialStatus?: string;
  /** Optional completed status label for the generated state shape. */
  readonly completedStatus?: string;
  /** Optional durability tier. Defaults to T1. */
  readonly durability?: SagasScaffoldDurabilityTier;
  /** Optional queue/topic name for generated config entries. */
  readonly topic?: string;
  /** Optional human-readable description. */
  readonly description?: string;
  /** Optional tags for generated config entries. */
  readonly tags?: readonly string[];
}

/** Return true when the input can identify a saga item. */
export function isSagasScaffoldInput(input: unknown): input is SagasScaffoldInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const candidate = input as { readonly id?: unknown };
  return typeof candidate.id === 'string' && candidate.id.trim().length > 0;
}

/** Convert a saga identifier into a stable file stem. */
export function toSagaFileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Create a relative entrypoint path for generated saga items. */
export function createSagaEntrypoint(input: SagasScaffoldInput): string {
  const directory = input.directory?.replace(/\\/g, '/') ?? 'sagas';
  return `${directory}/${toSagaFileStem(input.id)}-saga.ts`;
}

/** Convert a saga identifier into a stable exported symbol prefix. */
export function toSagaExportName(id: string): string {
  const pascal = toSagaFileStem(id)
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('');
  return pascal.length > 0 ? pascal : 'Generated';
}

/** Render an array literal for generated TypeScript source. */
export function renderStringArray(values: readonly string[] = []): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

/** Resolve the generated event type for a saga scaffold input. */
export function resolveMessageType(input: SagasScaffoldInput): string {
  return input.messageType?.trim() || `${toSagaFileStem(input.id)}.requested`;
}

/** Resolve the generated initial state status label. */
export function resolveInitialStatus(input: SagasScaffoldInput): string {
  return input.initialStatus?.trim() || 'pending';
}

/** Resolve the generated completed state status label. */
export function resolveCompletedStatus(input: SagasScaffoldInput): string {
  return input.completedStatus?.trim() || 'completed';
}
