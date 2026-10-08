/**
 * Opaque command definitions, once-only local execution, redacted failures and bounded codecs.
 *
 * Importing, defining and encoding commands require no permissions and start no resource.
 * Execution delegates to the explicitly supplied store and business operations and their
 * permissions. Actor roles/claims stay outside durable envelopes.
 *
 * @example
 * ```ts
 * import { canonicalCommandJson, jsonCodec } from '@netscript/service/commands';
 * import { z } from 'zod';
 * const codec = jsonCodec(z.object({ updated: z.boolean() }));
 * canonicalCommandJson(codec.encode({ updated: true }));
 * ```
 *
 * @module
 */
export { defineCommand } from './src/commands/application/define-command.ts';
export { jsonCodec } from './src/commands/application/json-codec.ts';
export {
  canonicalCommandJson,
  parseCanonicalCommandJson,
} from './src/commands/application/canonical-json.ts';
export type { CommandCodec, CommandJsonLimits } from './src/commands/domain/codec.ts';
export type {
  CommandActor,
  CommandEnvelope,
  CommandJson,
  CommandTraceContext,
} from './src/commands/domain/values.ts';
export type {
  CommandAuditInput,
  CommandContext,
  CommandDefinition,
  commandDefinitionBinding,
  CommandDefinitionSpec,
  commandExecutorCapability,
  CommandIdempotency,
  CommandIdempotencyMode,
  CommandIdempotencySpec,
  CommandOutboxInput,
  CommandRecordRequirement,
} from './src/commands/domain/definition.ts';
export { CommandError, type CommandFailure } from './src/commands/domain/failure.ts';
export type { IsolationLevel } from '@netscript/database';

export { createCommandExecutor } from './src/commands/application/create-command-executor.ts';
export type {
  CommandExecution,
  CommandExecutor,
  CommandRecordLimits,
  CommandTelemetryResult,
  CommandTelemetryStart,
} from './src/commands/domain/execution.ts';
export type {
  CommandClock,
  CommandExecutorOptions,
  CommandIdSource,
  CommandTelemetryPort,
  CommandTelemetrySpan,
} from './src/commands/ports/executor-ports.ts';
export type {
  CommandStoreCapabilities,
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  DatabaseProvider,
  ReceiptClaim,
  ReceiptClaimResult,
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
  StoredCommandReceipt,
  TransactionOptions,
} from '@netscript/database/commands';
