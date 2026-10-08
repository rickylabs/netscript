import { commandConformanceControls } from './command-conformance-controls.ts';
import {
  applied,
  empty,
  ensure,
  envelope,
  faultBoundaries,
  harness,
  rejects,
} from './command-conformance-helpers.ts';
import { CommandStoreError } from '@netscript/database/commands';
import type { CommandStorePort } from '@netscript/database/commands';
import { canonicalCommandJson } from '../application/canonical-json.ts';
import type { CommandFaultBoundary } from '../application/executor-boundary.ts';
import type { CommandConformanceFixture } from './command-conformance-fixture.ts';
import {
  createCommandFaultController,
  createTestingCommandExecutor,
} from './command-fault-controller.ts';

/** Fresh fixture factory; provider setup and cleanup remain the caller's responsibility. */
export type CommandConformanceFactory<TTx> = () =>
  | CommandConformanceFixture<TTx>
  | Promise<CommandConformanceFixture<TTx>>;

/** Completed finite semantic cases; provider-specific SQL/driver controls belong to its adapter suite. */
export type CommandConformanceReport = Readonly<
  { cases: readonly string[]; assurance: 'semantic_fixture' }
>;

/**
 * Qualify one named fault on the actual executor path, rollback/recovery and handler counts.
 * Postcommit response loss retains all rows and same-key retry must replay without new effects.
 */
export async function assertCommandFaultBoundary<TTx>(
  create: CommandConformanceFactory<TTx>,
  boundary: CommandFaultBoundary,
): Promise<void> {
  const fixture = await create();
  ensure(empty(await fixture.inspect()), 'fixture must start empty');
  const h = harness(fixture);
  const command = h.definition();
  h.faults.failNext(boundary);
  await rejects(h.executor.execute(command, envelope), 'store_failure');
  ensure(h.faults.visited().at(-1) === boundary, 'named fault reached');
  const postcommit = boundary === 'after_commit_before_return';
  ensure(
    postcommit ? applied(await fixture.inspect()) : empty(await fixture.inspect()),
    'same-commit fault atomicity',
  );
  ensure(
    h.counts().callbacks === (boundary === 'before_transaction' ? 0 : 1),
    'one callback per attempt',
  );
  ensure(
    h.counts().handlers ===
      (boundary === 'before_transaction' || boundary === 'after_claim' ? 0 : 1),
    'handler boundary count',
  );
  const retry = await h.executor.execute(command, {
    ...envelope,
    correlationId: 'conformance-retry',
  });
  ensure(retry.outcome === (postcommit ? 'replayed' : 'applied'), 'fault recovery outcome');
  ensure(applied(await fixture.inspect()), 'one committed effect after recovery');
  ensure(
    h.counts().handlers ===
      (postcommit || boundary === 'before_transaction' || boundary === 'after_claim' ? 1 : 2),
    'no handler retry or replay duplication',
  );
  ensure(
    retry.correlationId === (postcommit ? envelope.correlationId : 'conformance-retry'),
    'durable replay correlation',
  );
}

/**
 * Run the portable command semantic matrix, using fresh instances and actual executor logic.
 * This finite fixture does not certify provider-specific locking, SQL errors or real cancellation.
 * Provider-specific controls and pooled session restoration belong to the owning adapter suite.
 */
export async function runCommandConformance<TTx>(
  create: CommandConformanceFactory<TTx>,
): Promise<CommandConformanceReport> {
  const cases: string[] = [];
  for (const boundary of faultBoundaries) {
    await assertCommandFaultBoundary(create, boundary);
    cases.push(boundary);
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const command = h.definition();
    ensure((await h.executor.execute(command, envelope)).outcome === 'applied', 'applied outcome');
    ensure(
      h.events.join(',') === 'begin,claim,handler,audit,outbox,complete,commit',
      'bound flush ordering',
    );
    const before = canonicalCommandJson(await fixtureInspection(fixture));
    ensure(
      (await h.executor.execute(command, envelope)).outcome === 'replayed',
      'sequential replay',
    );
    await rejects(
      h.executor.execute(command, { ...envelope, input: { value: 'different' } }),
      'idempotency_key_reuse',
    );
    await rejects(
      h.executor.execute(h.definition({ version: 2 }), envelope),
      'idempotency_key_reuse',
    );
    ensure(h.counts().handlers === 1, 'replay/mismatch/version never invoke handler');
    ensure(
      canonicalCommandJson(await fixtureInspection(fixture)) === before,
      'replay/mismatch do not write',
    );
    h.scope('second-scope');
    await h.executor.execute(command, envelope);
    await h.executor.execute(h.definition({ name: 'conformance.renamed' }), envelope);
    ensure(
      h.counts().handlers === 3 && (await fixture.inspect()).receipts.length === 3,
      'scope/name namespace separation',
    );
    cases.push('identity_replay_namespaces');
  }
  for (const corruption of ['incomplete', 'noncanonical', 'invalid_response', 'invalid_metadata']) {
    const fixture = await create();
    const h = harness(fixture);
    const command = h.definition();
    await h.executor.execute(command, envelope);
    const row = (await fixture.inspect()).receipts[0];
    ensure(row !== undefined, 'completed receipt available');
    if (row === undefined) throw new Error('unreachable missing receipt');
    await fixture.seedReceipt({
      ...row,
      responseJson: corruption === 'incomplete'
        ? null
        : corruption === 'noncanonical'
        ? ' "one" '
        : corruption === 'invalid_metadata'
        ? '"one"'
        : '1',
      correlationId: corruption === 'invalid_metadata' ? '' : row.correlationId,
      completedAt: corruption === 'incomplete' ? null : row.completedAt,
    });
    await rejects(
      h.executor.execute(command, envelope),
      corruption === 'invalid_response' ? 'codec_failure' : 'receipt_corrupt',
    );
    ensure(h.counts().handlers === 1, 'corrupt replay never invokes handler');
    cases.push(corruption);
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const controller = new AbortController();
    controller.abort();
    await rejects(
      h.executor.execute(h.definition(), envelope, { signal: controller.signal }),
      'aborted',
    );
    ensure(h.counts().callbacks === 0, 'abort before begin');
    const during = new AbortController();
    await rejects(
      h.executor.execute(
        h.definition({
          handle: async (ctx) => {
            await fixture.write(ctx.tx, 'one');
            during.abort();
            return 'one';
          },
        }),
        envelope,
        { signal: during.signal },
      ),
      'aborted',
    );
    ensure(empty(await fixture.inspect()), 'handler cancellation rollback');
    await rejects(
      h.executor.execute(
        h.definition({
          handle: async (ctx) => {
            if (!await fixture.compareAndSet(ctx.tx, 'missing', 'one')) ctx.conflict();
            return 'one';
          },
        }),
        envelope,
      ),
      'optimistic_conflict',
    );
    ensure(empty(await fixture.inspect()), 'CAS zero-match rollback');
    cases.push('cancellation_cas');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    const raw = new Error('business fixture failure');
    try {
      await h.executor.execute(
        h.definition({
          handle: async (ctx) => {
            await fixture.write(ctx.tx, 'one');
            throw raw;
          },
        }),
        envelope,
      );
      ensure(false, 'business failure surfaced');
    } catch (error) {
      ensure(error === raw, 'business error identity');
    }
    ensure(
      h.counts().callbacks === 1 && h.counts().handlers === 1 && empty(await fixture.inspect()),
      'no automatic business retry',
    );
    const provider = new CommandStoreError({
      kind: 'store_failure',
      retryable: true,
      phase: 'commit',
    });
    const store: CommandStorePort<TTx> = {
      capabilities: fixture.store.capabilities,
      transaction: async (request, work, signal) => {
        await fixture.store.transaction(request, async (tx) => {
          await work(tx);
          throw provider;
        }, signal);
        throw provider;
      },
    };
    const executor = createTestingCommandExecutor(
      { ...h.options, store },
      createCommandFaultController(),
    );
    await rejects(executor.execute(h.definition(), envelope), 'store_failure', true);
    ensure(
      h.counts().handlers === 2 && empty(await fixture.inspect()),
      'provider retryable failure without callback retry',
    );
    cases.push('business_provider_failure');
  }
  {
    const fixture = await create();
    const h = harness(fixture);
    for (
      const settings of [{ audit: 'forbidden', outbox: 'required' }, {
        audit: 'required',
        outbox: 'forbidden',
      }]
    ) {
      if (settings.audit === 'forbidden') {
        await rejects(
          h.executor.execute(h.definition({ audit: 'forbidden' }), envelope),
          'codec_failure',
        );
      } else {await rejects(
          h.executor.execute(h.definition({ outbox: 'forbidden' }), envelope),
          'codec_failure',
        );}
      ensure(empty(await fixture.inspect()), 'forbidden record policy rollback');
    }
    await rejects(
      h.executor.execute(h.definition({ handle: () => Promise.resolve('one') }), envelope),
      'codec_failure',
    );
    ensure(empty(await fixture.inspect()), 'required record policy rollback');
    const command = h.definition({
      optional: true,
      audit: 'optional',
      outbox: 'optional',
      handle: async (ctx) => {
        await fixture.write(ctx.tx, 'one');
        return 'one';
      },
    });
    const noKey = {
      input: envelope.input,
      actor: envelope.actor,
      correlationId: envelope.correlationId,
    };
    ensure(
      (await h.executor.execute(command, noKey)).idempotency === 'not_requested',
      'optional no-key path',
    );
    const state = await fixture.inspect();
    ensure(
      state.businessValue === 'one' && state.receipts.length === 0 && state.audit.length === 0 &&
        state.outbox.length === 0,
      'zero side rows allowed',
    );
    cases.push('policies_optional');
  }
  cases.push(...await commandConformanceControls(create));
  return Object.freeze({ cases: Object.freeze(cases), assurance: 'semantic_fixture' });
}

async function fixtureInspection<TTx>(fixture: CommandConformanceFixture<TTx>) {
  const state = await fixture.inspect();
  return {
    businessValue: state.businessValue ?? null,
    receipts: state.receipts.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    })),
    audit: state.audit.map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() })),
    outbox: state.outbox.map((row) => ({ ...row, availableAt: row.availableAt.toISOString() })),
  };
}
