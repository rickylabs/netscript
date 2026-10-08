import type { CommandExecutor } from '../domain/execution.ts';
import type { CommandExecutorOptions } from '../ports/executor-ports.ts';
import type { CommandFaultController } from './command-fault-controller.ts';
import type { CommandStorePort, CommandTransaction } from '@netscript/database/commands';
import { defineCommand } from '../application/define-command.ts';
import type { CommandFaultBoundary } from '../application/executor-boundary.ts';
import type { CommandCodec } from '../domain/codec.ts';
import type { CommandContext, CommandDefinition } from '../domain/definition.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandFailure } from '../domain/failure.ts';
import type { CommandEnvelope } from '../domain/values.ts';
import type {
  CommandConformanceFixture,
  CommandConformanceInspection,
} from './command-conformance-fixture.ts';
import {
  createCommandFaultController,
  createTestingCommandExecutor,
} from './command-fault-controller.ts';

export function ensure(condition: boolean, invariant: string): void {
  if (!condition) throw new Error(`[netscript.command.conformance] ${invariant}`);
}
export const codec: CommandCodec<string> = {
  encode: (value) => value,
  decode(value) {
    if (typeof value !== 'string') throw new TypeError('conformance response');
    return value;
  },
};
export const envelope: CommandEnvelope<{ value: string }> = Object.freeze({
  input: Object.freeze({ value: 'one' }),
  actor: Object.freeze({ kind: 'system', subject: 'conformance' }),
  correlationId: 'conformance-original',
  idempotencyKey: 'conformance-key-0001',
});
export const faultBoundaries: readonly CommandFaultBoundary[] = [
  'after_handler',
  'before_transaction',
  'after_claim',
  'after_audit',
  'after_outbox',
  'after_receipt_complete',
  'after_commit_before_return',
];

type DefinitionSettings<TTx> = Readonly<{
  name?: string;
  version?: number;
  optional?: boolean;
  handle?: (context: CommandContext<{ value: string }, TTx>) => Promise<string>;
  audit?: 'required' | 'optional' | 'forbidden';
  outbox?: 'required' | 'optional' | 'forbidden';
}>;
type Harness<TTx> = Readonly<{
  executor: CommandExecutor<TTx>;
  faults: CommandFaultController;
  options: CommandExecutorOptions<TTx>;
  events: string[];
  definition(
    settings?: DefinitionSettings<TTx>,
  ): CommandDefinition<string, { value: string }, string, TTx>;
  counts(): Readonly<{ callbacks: number; handlers: number }>;
  scope(value: string): void;
}>;
export function harness<TTx>(fixture: CommandConformanceFixture<TTx>): Harness<TTx> {
  let ids = 0;
  let callbacks = 0;
  let handlers = 0;
  let scope = 'conformance';
  const events: string[] = [];
  const faults = createCommandFaultController();
  const store: CommandStorePort<TTx> = {
    capabilities: fixture.store.capabilities,
    async transaction(request, work, signal) {
      events.push('begin');
      try {
        const result = await fixture.store.transaction(request, async (tx) => {
          callbacks++;
          const transaction: CommandTransaction<TTx> = {
            business: tx.business,
            claimReceipt: async (claim, signal) => {
              events.push('claim');
              return await tx.claimReceipt(claim, signal);
            },
            appendAudit: async (rows, signal) => {
              events.push('audit');
              await tx.appendAudit(rows, signal);
            },
            appendOutbox: async (rows, signal) => {
              events.push('outbox');
              await tx.appendOutbox(rows, signal);
            },
            completeReceipt: async (value, signal) => {
              events.push('complete');
              await tx.completeReceipt(value, signal);
            },
          };
          return await work(transaction);
        }, signal);
        events.push('commit');
        return result;
      } catch (error) {
        events.push('rollback');
        throw error;
      }
    },
  };
  const options = {
    store,
    clock: { now: (): Date => new Date('2026-01-01T00:00:00Z') },
    ids: { next: (): string => `conformance-${++ids}` },
  };
  const executor = createTestingCommandExecutor(options, faults);
  const definition = (
    settings: DefinitionSettings<TTx> = {},
  ): CommandDefinition<string, { value: string }, string, TTx> =>
    defineCommand({
      name: settings.name ?? 'conformance.update',
      definitionVersion: settings.version ?? 1,
      idempotency: {
        mode: settings.optional ? 'optional' : 'required',
        scope: () => scope,
        fingerprint: (input: { value: string }) => input,
        response: codec,
      },
      records: { audit: settings.audit ?? 'required', outbox: settings.outbox ?? 'required' },
      async handle(context: CommandContext<{ value: string }, TTx>): Promise<string> {
        handlers++;
        events.push('handler');
        if (settings.handle) return await settings.handle(context);
        await fixture.write(context.tx, context.envelope.input.value);
        context.audit({ action: 'updated', subject: { type: 'value', id: 'conformance' } });
        context.publish({
          destination: 'events',
          topic: 'conformance.updated',
          payload: 'one',
          codec,
        });
        return context.envelope.input.value;
      },
    });
  return {
    executor,
    faults,
    definition,
    options,
    events,
    counts: () => ({ callbacks, handlers }),
    scope: (value: string): void => {
      scope = value;
    },
  };
}
export function empty(snapshot: CommandConformanceInspection): boolean {
  return snapshot.businessValue === undefined && snapshot.receipts.length === 0 &&
    snapshot.audit.length === 0 && snapshot.outbox.length === 0;
}
export function applied(snapshot: CommandConformanceInspection): boolean {
  const receipt = snapshot.receipts[0];
  return snapshot.businessValue === 'one' && snapshot.receipts.length === 1 &&
    snapshot.audit.length === 1 && snapshot.outbox.length === 1 &&
    receipt?.responseJson === '"one"' && receipt.completedAt instanceof Date &&
    snapshot.audit[0]?.executionId === receipt.id && snapshot.outbox[0]?.executionId === receipt.id;
}
export async function rejects(
  operation: Promise<unknown>,
  kind: CommandFailure['kind'],
  retryable?: boolean,
): Promise<void> {
  try {
    await operation;
  } catch (error) {
    ensure(
      error instanceof CommandError && error.failure.kind === kind &&
        (retryable === undefined || error.failure.retryable === retryable),
      `expected ${kind}`,
    );
    return;
  }
  ensure(false, `expected ${kind} rejection`);
}
