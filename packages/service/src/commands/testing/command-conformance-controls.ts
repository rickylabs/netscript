import type { CommandContext } from '../domain/definition.ts';
import type { CommandStorePort } from '@netscript/database/commands';
import { createCommandExecutor } from '../application/create-command-executor.ts';
import { defineCommand } from '../application/define-command.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandConformanceFactory } from './command-conformance.ts';
import {
  applied,
  codec,
  empty,
  ensure,
  envelope,
  harness,
  rejects,
} from './command-conformance-helpers.ts';

/** Remaining portable controls; no provider-specific driver behavior is inferred. */
export async function commandConformanceControls<TTx>(
  create: CommandConformanceFactory<TTx>,
): Promise<readonly string[]> {
  const cases: string[] = [];
  {
    const fixture = await create();
    const h = harness(fixture);
    let attempts = 0;
    const store: CommandStorePort<TTx> = {
      capabilities: fixture.store.capabilities,
      transaction: (request, work, signal) =>
        fixture.store.transaction(request, async (tx) => {
          attempts++;
          const value = await work(tx);
          attempts++;
          await work(tx);
          return value;
        }, signal),
    };
    const executor = createCommandExecutor({ ...h.options, store });
    await rejects(executor.execute(h.definition(), envelope), 'store_failure');
    ensure(
      attempts === 2 && h.counts().handlers === 1 && empty(await fixture.inspect()),
      'callback re-entry refusal rollback',
    );
    cases.push('callback_reentry');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    let queries = 0;
    let rolledBack = false;
    const store: CommandStorePort<TTx> = {
      capabilities: fixture.store.capabilities,
      async transaction(request, work, signal) {
        try {
          return await fixture.store.transaction(request, (tx) =>
            work({
              business: tx.business,
              claimReceipt: async () => {
                await fixture.write(tx.business, 'one');
                queries++;
                return {
                  kind: 'busy',
                  retryAfterMs: fixture.store.capabilities.receiptClaimWait.minimumMs,
                };
              },
              appendAudit: (rows, signal) => {
                queries++;
                return tx.appendAudit(rows, signal);
              },
              appendOutbox: (rows, signal) => {
                queries++;
                return tx.appendOutbox(rows, signal);
              },
              completeReceipt: (completion, signal) => {
                queries++;
                return tx.completeReceipt(completion, signal);
              },
            }), signal);
        } catch (error) {
          ensure(
            !(error instanceof CommandError && error.failure.kind === 'in_progress'),
            'busy remains private before rollback',
          );
          rolledBack = true;
          throw error;
        }
      },
    };
    await rejects(
      createCommandExecutor({ ...h.options, store }).execute(h.definition(), envelope),
      'in_progress',
    );
    ensure(
      rolledBack && queries === 1 && h.counts().handlers === 0 && empty(await fixture.inspect()),
      'terminal busy whole-callback rollback',
    );
    await h.executor.execute(h.definition(), envelope);
    ensure(h.counts().handlers === 1, 'clean transaction after busy');
    cases.push('terminal_busy');
  }
  {
    const fixture = await create();
    let begins = 0;
    const store: CommandStorePort<TTx> = {
      capabilities: {
        ...fixture.store.capabilities,
        selectableIsolationLevels: [],
        defaultIsolation: 'provider_configured',
      },
      transaction: (request, work, signal) => {
        begins++;
        return fixture.store.transaction(request, work, signal);
      },
    };
    const definition = (explicit: boolean) =>
      defineCommand({
        name: 'conformance.isolation',
        definitionVersion: 1,
        ...(explicit
          ? {
            isolationLevel: fixture.store.capabilities.defaultIsolation === 'provider_configured'
              ? 'Serializable'
              : fixture.store.capabilities.defaultIsolation,
          }
          : {}),
        idempotency: {
          scope: () => 'isolation',
          fingerprint: (input: { value: string }) => input,
          response: codec,
        },
        records: { audit: 'optional', outbox: 'optional' },
        handle: async ({ tx }: CommandContext<{ value: string }, TTx>) => {
          await fixture.write(tx, 'one');
          return 'one';
        },
      });
    const executor = createCommandExecutor({ store });
    await rejects(executor.execute(definition(true), envelope), 'unsupported_capability');
    ensure(begins === 0 && empty(await fixture.inspect()), 'unsupported isolation before begin');
    await executor.execute(definition(false), envelope);
    ensure(begins === 1, 'omitted isolation default');
    cases.push('isolation_default');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const controller = new AbortController();
    let outbox = 0;
    const store: CommandStorePort<TTx> = {
      capabilities: fixture.store.capabilities,
      transaction: (request, work, signal) =>
        fixture.store.transaction(request, (tx) =>
          work({
            business: tx.business,
            claimReceipt: (claim, signal) => tx.claimReceipt(claim, signal),
            completeReceipt: (completion, signal) => tx.completeReceipt(completion, signal),
            appendAudit: async (rows, signal) => {
              await tx.appendAudit(rows, signal);
              controller.abort();
            },
            appendOutbox: (rows, signal) => {
              outbox++;
              return tx.appendOutbox(rows, signal);
            },
          }), signal),
    };
    await rejects(
      createCommandExecutor({ ...h.options, store }).execute(h.definition(), envelope, {
        signal: controller.signal,
      }),
      'aborted',
    );
    ensure(
      outbox === 0 && h.counts().handlers === 1 && empty(await fixture.inspect()),
      'between-flush cancellation rollback',
    );
    cases.push('flush_cancellation');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const command = h.definition({
      handle: async (ctx) => {
        await fixture.write(ctx.tx, 'one');
        for (let index = 0; index < 3; index++) {
          ctx.audit({ action: 'updated', subject: { type: 'value', id: `value-${index}` } });
          ctx.publish({
            destination: 'events',
            topic: 'conformance.updated',
            payload: 'one',
            codec,
          });
        }
        return 'one';
      },
    });
    await h.executor.execute(command, envelope);
    const state = await fixture.inspect();
    ensure(
      state.audit.length === 3 && state.outbox.length === 3 && state.receipts.length === 1,
      'many side rows same commit',
    );
    const invalid = await create();
    const hi = harness(invalid);
    await rejects(
      hi.executor.execute(
        hi.definition({
          handle: (ctx) => {
            ctx.publish({
              destination: 'events',
              topic: 'conformance.updated',
              payload: 'one',
              codec: {
                encode: () => {
                  throw new Error('codec fixture');
                },
                decode: codec.decode,
              },
            });
            return Promise.resolve('one');
          },
        }),
        envelope,
      ),
      'codec_failure',
    );
    ensure(empty(await invalid.inspect()), 'payload codec rollback');
    cases.push('many_records_codec');
  }
  {
    const fixture = await create();
    const secondClaim = Promise.withResolvers<void>();
    let claimAttempts = 0;
    const store: CommandStorePort<TTx> = {
      capabilities: fixture.store.capabilities,
      transaction: (request, work, signal) =>
        fixture.store.transaction(request, (tx) =>
          work({
            business: tx.business,
            claimReceipt: (claim, signal) => {
              const pending = tx.claimReceipt(claim, signal);
              if (++claimAttempts === 2) secondClaim.resolve();
              return pending;
            },
            appendAudit: (rows, signal) => tx.appendAudit(rows, signal),
            appendOutbox: (rows, signal) => tx.appendOutbox(rows, signal),
            completeReceipt: (completion, signal) => tx.completeReceipt(completion, signal),
          }), signal),
    };
    const h = harness({
      store,
      write: (tx, value) => fixture.write(tx, value),
      compareAndSet: (tx, expected, value) => fixture.compareAndSet(tx, expected, value),
      inspect: () => fixture.inspect(),
      seedReceipt: (row) => fixture.seedReceipt(row),
      outsideWrite: (value) => fixture.outsideWrite(value),
    });
    const reached = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const command = h.definition({
      handle: async (ctx) => {
        await fixture.write(ctx.tx, 'one');
        ctx.audit({ action: 'updated', subject: { type: 'value', id: 'conformance' } });
        ctx.publish({ destination: 'events', topic: 'conformance.updated', payload: 'one', codec });
        reached.resolve();
        await release.promise;
        return 'one';
      },
    });
    const leader = h.executor.execute(command, envelope);
    await reached.promise;
    const follower = h.executor.execute(command, envelope).then(
      (result) => result,
      (error: unknown) => error,
    );
    await secondClaim.promise;
    release.resolve();
    await leader;
    const duplicate = await follower;
    if (duplicate instanceof CommandError && duplicate.failure.kind === 'in_progress') {
      ensure(
        (await h.executor.execute(command, envelope)).outcome === 'replayed',
        'busy follower replay after leader commit',
      );
    } else {
      ensure(
        typeof duplicate === 'object' && duplicate !== null && 'outcome' in duplicate &&
          duplicate.outcome === 'replayed',
        'waiting follower replays',
      );
    }
    ensure(
      claimAttempts >= 2 && h.counts().handlers === 1 && applied(await fixture.inspect()),
      'concurrent duplicate no handler retry or side duplication',
    );
    cases.push('concurrent_replay');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const failed = h.definition({
      handle: async (ctx) => {
        await fixture.write(ctx.tx, 'one');
        return ctx.conflict();
      },
    });
    await rejects(h.executor.execute(failed, envelope), 'optimistic_conflict');
    ensure(empty(await fixture.inspect()), 'leader rollback releases claim');
    await h.executor.execute(h.definition(), envelope);
    ensure(
      (await fixture.inspect()).receipts.length === 1 && h.counts().handlers === 2,
      'follower executes after leader rollback',
    );
    cases.push('leader_rollback_recovery');
  }
  return Object.freeze(cases);
}
