/** Cross-package consumer compilation; no provider, scheduler or producer starts. */
import {
  createPostgresCommandOutboxRelayStore,
  type PostgresCommandClient,
  type TransactionClientPort,
} from '../../../database/commands-postgres.ts';
import {
  type CommandOutboxRelayOptions,
  type CommandOutboxSink,
  createCommandOutboxRelay,
  type RunningCommandOutboxRelay,
} from '../../commands-relay.ts';
import {
  createWorkerCommandOutboxSink,
  type WorkerCommandSinkOptions,
} from '../../../plugin-workers-core/commands.ts';
import {
  createSagaCommandOutboxSink,
  type SagaPublisherPort,
} from '../../../plugin-sagas-core/commands.ts';
import {
  createStreamCommandOutboxSink,
  type StreamProducerPort,
} from '../../../plugin-streams-core/commands.ts';
/** Explicit consumer dependencies retained at the composition root. */
export type ConsumerFixtureOptions = Readonly<{
  root: TransactionClientPort<PostgresCommandClient>;
  worker: WorkerCommandSinkOptions;
  saga: SagaPublisherPort;
  stream: StreamProducerPort;
  policy: Omit<CommandOutboxRelayOptions, 'store' | 'sinks'>;
}>;
/** Bind the true-callback database store and all checked core sinks to one generic relay. */
export function composeCommandRelayFixture(
  options: ConsumerFixtureOptions,
): RunningCommandOutboxRelay {
  const store = createPostgresCommandOutboxRelayStore(options.root, { transactionTimeoutMs: 5000 });
  const worker = createWorkerCommandOutboxSink(options.worker);
  const saga = createSagaCommandOutboxSink({ id: 'sagas', publisher: options.saga });
  const stream = createStreamCommandOutboxSink({ id: 'streams', producer: options.stream });
  const sinks = new Map<string, CommandOutboxSink>([[worker.id, worker], [saga.id, saga], [
    stream.id,
    stream,
  ]]);
  return createCommandOutboxRelay({ ...options.policy, store, sinks });
}
