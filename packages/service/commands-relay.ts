/**
 * One decoded command outbox relay with explicit bounded lifecycle and checked sink acceptance.
 * Database owns raw persistence; this surface owns canonical decoding, W3C propagation and supervision.
 * No resource, timer, queue or loop starts on import or construction. Invoke drainOnce from your
 * existing scheduler and await stop at shutdown. Supplied sinks/provider own network permissions.
 * @module
 */
export { createCommandOutboxRelay } from './src/commands/relay/create-command-outbox-relay.ts';
export type {
  CommandOutboxDelivery,
  CommandOutboxRelayOptions,
  CommandOutboxSink,
  CommandRelayTelemetryPort,
  RunningCommandOutboxRelay,
} from './src/commands/relay/relay-ports.ts';
export { CommandRelayError } from './src/commands/relay/command-relay-error.ts';
export { COMMAND_RELAY_FAILURE_CLASSES } from '@netscript/database/commands';
export type {
  ClaimedCommandOutboxRow,
  CommandOutboxAcceptance,
  CommandOutboxClaim,
  CommandOutboxPublication,
  CommandOutboxRelayStore,
  CommandOutboxRelease,
  CommandRelayFailureClass,
  DatabaseProvider,
  IsolationLevel,
} from '@netscript/database/commands';
export type {
  CommandClock,
  CommandIdSource,
  CommandTelemetrySpan,
} from './src/commands/ports/executor-ports.ts';
export type {
  CommandTelemetryResult,
  CommandTelemetryStart,
} from './src/commands/domain/execution.ts';
export type { CommandFailure } from './src/commands/domain/failure.ts';
export type { CommandJson, CommandTraceContext } from './src/commands/domain/values.ts';
