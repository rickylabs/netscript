import type { CascadedMessage } from './cascaded-message.ts';
import type { SagaContext } from './saga-context.ts';
import type { SagaMessage } from './saga-message.ts';

/** Distinct worker effect tags; legacy cascade tags retain their existing meanings. */
export const WORKER_COMMAND_EFFECT_KINDS: readonly ['worker-job', 'worker-task'] = Object.freeze([
  'worker-job',
  'worker-task',
]);

/** Pure selected-definition worker intent; data and validator are privately bound by constructors. */
export type WorkerCommandEffect = Readonly<{
  kind: typeof WORKER_COMMAND_EFFECT_KINDS[number];
  targetId: string;
  destination: string;
  topic: string;
}>;

/** Only ordinary transition handlers may emit worker commands. */
export type SagaTransitionEffect = CascadedMessage | WorkerCommandEffect;

/** Synchronous projection returning a declarative transition ledger. */
export type SagaTransitionHandler<TState = unknown, TMessage extends SagaMessage = SagaMessage> = (
  saga: { state: TState },
  event: TMessage,
  context: SagaContext<TState, TMessage>,
) => readonly SagaTransitionEffect[];
