import type { TriggerId } from './ids.ts';

/** Context passed to trigger handlers by the processor. */
export type TriggerContext = Readonly<{
  triggerId: TriggerId;
  signal?: AbortSignal;
  now: () => Date;
}>;
