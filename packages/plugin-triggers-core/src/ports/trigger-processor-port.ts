import type { TriggerDefinition, TriggerEvent } from '../domain/mod.ts';

/** Trigger definition accepted by runtime processor ports. */
export type ProcessableTriggerDefinition = TriggerDefinition<string, never, never>;

/** Result returned after processing a trigger event. */
export type TriggerProcessResult = Readonly<{
  event: TriggerEvent;
  status: 'completed' | 'deferred' | 'failed' | 'dlq';
  actionsDispatched: number;
}>;

/** Stop options for processor drain. */
export type TriggerProcessorStopOptions = Readonly<{
  drainTimeoutMs?: number;
}>;

/** Processes unified trigger events through the T1 dispatch pipeline. */
export interface TriggerProcessorPort {
  process<TDefinition extends ProcessableTriggerDefinition>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult>;
  stop(options?: TriggerProcessorStopOptions): Promise<void>;
}
