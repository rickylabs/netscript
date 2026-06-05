import {
  type CronExpression,
  DEFAULT_TRIGGER_DURABILITY_TIER,
  type ScheduledTriggerDefinition,
  type ScheduledTriggerPayload,
  type ScheduledTriggerSpec,
  type TriggerContext,
  type TriggerEvent,
  type TriggerHandler,
  type TriggerId,
  TriggersError,
} from '../domain/mod.ts';

/** Scheduled trigger handler signature used by `defineScheduledTrigger`. */
export type ScheduledTriggerHandler = TriggerHandler<
  TriggerEvent<'scheduled', ScheduledTriggerPayload>,
  TriggerContext
>;

/** Scheduled trigger definition fields accepted by `defineScheduledTrigger`. */
export type DefineScheduledTriggerSpec<TId extends string = string> =
  & Readonly<{
    id: TId;
    description?: string;
    tags?: readonly string[];
    metadata?: Readonly<Record<string, unknown>>;
  }>
  & ScheduledTriggerSpec;

/**
 * Define a scheduled trigger from a handler and static cron spec.
 *
 * @param handler - Handler invoked when the scheduler emits a trigger event.
 * @param spec - Static schedule metadata discovered by the walker.
 * @returns Frozen scheduled trigger definition.
 */
export function defineScheduledTrigger<TId extends string>(
  handler: ScheduledTriggerHandler,
  spec: DefineScheduledTriggerSpec<TId>,
): ScheduledTriggerDefinition<
  TId,
  TriggerEvent<'scheduled', ScheduledTriggerPayload>,
  TriggerContext
> {
  assertNonEmpty(spec.id, 'Scheduled trigger id is required.');
  assertNonEmpty(spec.cron, 'Scheduled trigger cron expression is required.');
  if (spec.backfill) {
    assertBackfill(spec.backfill);
  }

  return Object.freeze({
    id: spec.id as TriggerId<TId>,
    kind: 'scheduled',
    durability: DEFAULT_TRIGGER_DURABILITY_TIER,
    handler,
    cron: spec.cron as CronExpression,
    timezone: spec.timezone,
    persistent: spec.persistent,
    backfill: spec.backfill ? Object.freeze({ ...spec.backfill }) : undefined,
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

function assertBackfill(backfill: NonNullable<ScheduledTriggerSpec['backfill']>): void {
  if (backfill.windowMs < 0) {
    throw TriggersError.validationFailed(
      'Scheduled trigger backfill windowMs must be non-negative.',
    );
  }
  if (backfill.maxMissedFires !== undefined && backfill.maxMissedFires < 1) {
    throw TriggersError.validationFailed(
      'Scheduled trigger backfill maxMissedFires must be positive when provided.',
    );
  }
}
