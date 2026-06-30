import {
  DEFAULT_TRIGGER_DURABILITY_TIER,
  type FileWatchDefinition,
  type FileWatchLifecycle,
  type FileWatchStabilityThreshold,
  type FileWatchTriggerPayload,
  type TriggerContext,
  type TriggerEvent,
  type TriggerHandler,
  type TriggerId,
  TriggersError,
} from '../domain/mod.ts';

/** File-watch handler signature used by `defineFileWatch`. */
export type FileWatchHandler = TriggerHandler<
  TriggerEvent<'file-watch', FileWatchTriggerPayload>,
  TriggerContext
>;

/** File-watch definition fields accepted by `defineFileWatch`. */
export type FileWatchSpec<TId extends string = string> = Readonly<{
  id: TId;
  paths: readonly string[];
  patterns: readonly string[];
  ignored?: readonly string[];
  on: readonly FileWatchLifecycle[];
  debounceMs?: number;
  stabilityThreshold?: FileWatchStabilityThreshold;
  name?: string;
  enabled?: boolean;
  description?: string;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

/**
 * Define a file-watch trigger from a handler and static spec.
 *
 * @param handler - Handler invoked after the file watcher emits a stable event.
 * @param spec - Static file-watch metadata discovered by the walker.
 * @returns Frozen file-watch trigger definition.
 */
export function defineFileWatch<TId extends string>(
  handler: FileWatchHandler,
  spec: FileWatchSpec<TId>,
): FileWatchDefinition<TId, TriggerEvent<'file-watch', FileWatchTriggerPayload>, TriggerContext> {
  assertNonEmpty(spec.id, 'File-watch trigger id is required.');
  assertNonEmptyList(spec.paths, 'File-watch paths are required.');
  assertNonEmptyList(spec.patterns, 'File-watch patterns are required.');
  assertNonEmptyList(spec.on, 'File-watch lifecycle events are required.');
  assertPositiveOptional(spec.debounceMs, 'File-watch debounceMs must be positive.');
  if (spec.stabilityThreshold) {
    assertPositive(
      spec.stabilityThreshold.checkIntervalMs,
      'File-watch stability checkIntervalMs must be positive.',
    );
    assertPositive(
      spec.stabilityThreshold.stableChecks,
      'File-watch stability stableChecks must be positive.',
    );
  }

  return Object.freeze({
    id: spec.id as TriggerId<TId>,
    kind: 'file-watch',
    name: spec.name,
    enabled: spec.enabled,
    durability: DEFAULT_TRIGGER_DURABILITY_TIER,
    handler,
    paths: Object.freeze([...spec.paths]),
    patterns: Object.freeze([...spec.patterns]),
    ignored: spec.ignored ? Object.freeze([...spec.ignored]) : undefined,
    on: Object.freeze([...spec.on]),
    debounceMs: spec.debounceMs,
    stabilityThreshold: spec.stabilityThreshold
      ? Object.freeze({ ...spec.stabilityThreshold })
      : undefined,
    description: spec.description,
    tags: spec.tags ? Object.freeze([...spec.tags]) : undefined,
    metadata: spec.metadata ? Object.freeze({ ...spec.metadata }) : undefined,
  });
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw TriggersError.validationFailed(message);
  }
}

function assertNonEmptyList(values: readonly string[], message: string): void {
  if (values.length === 0 || values.some((value) => value.trim().length === 0)) {
    throw TriggersError.validationFailed(message);
  }
}

function assertPositiveOptional(value: number | undefined, message: string): void {
  if (value !== undefined) {
    assertPositive(value, message);
  }
}

function assertPositive(value: number, message: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw TriggersError.validationFailed(message);
  }
}
