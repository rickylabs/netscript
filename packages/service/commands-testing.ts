/**
 * Command fault, semantic and finite determinism fixtures; no real database certification.
 *
 * Every instance owns its state. Bound writes commit together, while explicit testing
 * controls allow corrupt fixtures and outside-transaction negative controls. Imports and in-memory
 * fixtures need no permissions; supplied provider operations use their own permissions.
 *
 * @example
 * ```ts
 * import { createMemoryCommandStore } from '@netscript/service/commands/testing';
 * const store = createMemoryCommandStore();
 * await store.transaction({ receiptClaimWaitMs: 0 }, async ({ business }) => {
 *   business.set('counter', '1');
 * });
 * store.snapshot();
 * ```
 * @module
 */
export { createMemoryCommandStore } from './src/commands/testing/memory-command-store.ts';
export type {
  CommandStoreBarrier,
  MemoryCommandBusiness,
  MemoryCommandSnapshot,
  MemoryCommandStore,
  MemoryCommandStoreOptions,
} from './src/commands/testing/memory-command-store.ts';
export type {
  CommandReceiptRow,
  CommandStoreCapabilities,
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  DatabaseProvider,
  IsolationLevel,
  ReceiptClaim,
  ReceiptClaimResult,
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
  StoredCommandReceipt,
  TransactionOptions,
} from '@netscript/database/commands';

export {
  createCommandFaultController,
  createTestingCommandExecutor,
} from './src/commands/testing/command-fault-controller.ts';
export type { CommandFaultController } from './src/commands/testing/command-fault-controller.ts';
export type { CommandFaultBoundary } from './src/commands/application/executor-boundary.ts';
export { assertCommandDeterminism } from './src/commands/testing/command-determinism.ts';
export type { CommandDeterminismReport } from './src/commands/testing/command-determinism.ts';
export { createMemoryCommandConformanceFixture } from './src/commands/testing/command-conformance-fixture.ts';
export type {
  CommandConformanceFixture,
  CommandConformanceInspection,
} from './src/commands/testing/command-conformance-fixture.ts';
export {
  assertCommandFaultBoundary,
  runCommandConformance,
} from './src/commands/testing/command-conformance.ts';
export type {
  CommandConformanceFactory,
  CommandConformanceReport,
} from './src/commands/testing/command-conformance.ts';
export type {
  CommandActor,
  CommandCodec,
  CommandDefinition,
  CommandEnvelope,
  CommandIdempotency,
  CommandIdempotencyMode,
  CommandJson,
  CommandRecordRequirement,
} from './commands.ts';
export type {
  CommandClock,
  CommandExecution,
  CommandExecutor,
  CommandExecutorOptions,
  CommandIdSource,
  CommandRecordLimits,
  CommandTelemetryPort,
  CommandTelemetryResult,
  CommandTelemetrySpan,
  CommandTelemetryStart,
} from './commands.ts';

export type {
  CommandContext,
  commandDefinitionBinding,
  commandExecutorCapability,
  CommandFailure,
  CommandTraceContext,
} from './commands.ts';

export type { CommandAuditInput, CommandOutboxInput } from './commands.ts';
