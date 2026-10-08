import { assert, assertEquals } from '@std/assert';
import type {
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  ReceiptClaimResult,
} from '@netscript/database/commands';
import type { MemoryCommandBusiness, MemoryCommandStore } from '../../commands-testing.ts';
import { CommandError, defineCommand } from '../../commands.ts';
import type {
  CommandCodec,
  CommandContext,
  CommandDefinition,
  CommandEnvelope,
  CommandFailure,
} from '../../commands.ts';
export const key = 'fixture-key-00001';
export const date: Date = new Date('2026-01-01T00:00:00Z');
export const envelope: CommandEnvelope<{ value: string }> = {
  input: { value: 'one' },
  actor: { kind: 'principal', subject: 'caller', scheme: 'fixture' },
  correlationId: 'original',
  idempotencyKey: key,
};
export const codec: CommandCodec<string> = {
  encode(value) {
    return value;
  },
  decode(value) {
    if (typeof value !== 'string') throw new TypeError('invalid fixture output');
    return value;
  },
};
export function ports() {
  let id = 0;
  return { clock: { now: (): Date => date }, ids: { next: (): string => `fixture-${++id}` } };
}
export function command(
  handle: (context: CommandContext<{ value: string }, MemoryCommandBusiness>) => Promise<string> = (
    ctx,
  ) => {
    ctx.tx.set('value', ctx.envelope.input.value);
    return Promise.resolve(ctx.envelope.input.value);
  },
  mode: 'required' | 'optional' = 'required',
): CommandDefinition<'values.update', { value: string }, string, MemoryCommandBusiness> {
  return defineCommand({
    name: 'values.update',
    definitionVersion: 1,
    idempotency: { mode, scope: () => 'values', fingerprint: (input) => input, response: codec },
    records: { audit: 'optional', outbox: 'optional' },
    handle,
  });
}
export async function failure(
  operation: Promise<unknown>,
  kind: CommandFailure['kind'],
): Promise<CommandError> {
  try {
    await operation;
  } catch (error) {
    assert(error instanceof CommandError);
    assertEquals(error.failure.kind, kind);
    return error;
  }
  throw new Error('expected bounded failure');
}
export function tracked(
  store: MemoryCommandStore,
  events: string[],
  settings: {
    decision?: () => ReceiptClaimResult;
    afterAudit?: () => void;
    twice?: boolean;
    callbackRejected?: (error: unknown) => void;
    request?: (request: CommandTransactionRequest) => void;
  } = {},
): CommandStorePort<MemoryCommandBusiness> {
  return {
    capabilities: store.capabilities,
    async transaction<T>(
      request: CommandTransactionRequest,
      work: (tx: CommandTransaction<MemoryCommandBusiness>) => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> {
      events.push('begin');
      settings.request?.(request);
      try {
        const value = await store.transaction(request, async (tx) => {
          const bound: CommandTransaction<MemoryCommandBusiness> = {
            business: tx.business,
            async claimReceipt(claim, signal) {
              events.push('claim');
              return settings.decision === undefined
                ? await tx.claimReceipt(claim, signal)
                : settings.decision();
            },
            async appendAudit(rows, signal) {
              events.push('audit');
              await tx.appendAudit(rows, signal);
              settings.afterAudit?.();
            },
            async appendOutbox(rows, signal) {
              events.push('outbox');
              await tx.appendOutbox(rows, signal);
            },
            async completeReceipt(value, signal) {
              events.push('complete');
              await tx.completeReceipt(value, signal);
            },
          };
          let value: T;
          try {
            value = await work(bound);
          } catch (error) {
            settings.callbackRejected?.(error);
            throw error;
          }
          if (settings.twice) await work(bound);
          return value;
        }, signal);
        events.push('commit');
        return value;
      } catch (error) {
        events.push('rollback');
        throw error;
      }
    },
  };
}
export function intents(ctx: CommandContext<{ value: string }, MemoryCommandBusiness>): void {
  ctx.audit({
    action: 'updated',
    subject: { type: 'value', id: 'value' },
    data: { selected: ctx.envelope.input.value },
  });
  ctx.publish({
    destination: 'events',
    topic: 'values.updated',
    payload: ctx.envelope.input.value,
    codec,
  });
}
