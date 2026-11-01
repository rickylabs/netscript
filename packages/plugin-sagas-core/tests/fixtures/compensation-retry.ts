import { assert, assertEquals, assertRejects } from '@std/assert';
import { defineSaga, sagaCompensate } from '../../mod.ts';
import { sagaCommandDigest } from '../../src/application/produce-worker-commands.ts';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaTransitionRecord,
} from '../../src/domain/mod.ts';
import type { SagaTransitionStore } from '../../src/ports/saga-transition-commit-port.ts';
import { type SagaCompensationOutcome, SagaEngine } from '../../src/runtime/saga-engine.ts';
import { MemorySagaAppliedKeyStore } from '../../src/runtime/saga-applied-keys.ts';

/** Fault positions for the compensation commit, including an ambiguous successful write. */
export type CompensationFault = 'before-commit' | 'after-commit';

/** Terminal success, terminal handler failure and a pending sibling compensation. */
export const COMPENSATION_RETRY_STATUSES = ['compensated', 'failed', 'compensating'] as const;

/** Canonical store plus the adapters' read-only history inspection surface. */
export type CompensationTestStore =
  & SagaTransitionStore
  & Readonly<{
    transitions(
      instanceId: SagaInstanceId,
    ): readonly SagaTransitionRecord[] | Promise<readonly SagaTransitionRecord[]>;
  }>;

/** Provider seams shared by real KV, Redis and both PostgreSQL saga adapters. */
export type CompensationRetryFixture = Readonly<{
  store: CompensationTestStore;
  fault: CompensationFault;
  status: typeof COMPENSATION_RETRY_STATUSES[number];
  armFault(): void;
  faultCount(): number;
  /** Reopen the same persistence, never clear it, before retrying the outcome. */
  reopen(): Promise<CompensationTestStore>;
}>;

/** Prove compensation rollback/retry and committed replay against canonical provider reads. */
export async function assertCompensationRetry(fixture: CompensationRetryFixture): Promise<void> {
  const correlationKey = 'order-1' as SagaCorrelationKey;
  const definition = defineSaga('compensation-retry')
    .state({ payment: 'captured' })
    .correlate(() => correlationKey)
    .on('FulfillmentFailed', () => [sagaCompensate({ type: 'RefundPayment', payload: {} })])
    .build();
  // Preserve a legacy reservation across engine recreation so the broken path cannot pass
  // merely because its process-local applied-key store was cleared during the retry.
  const appliedKeys = new MemorySagaAppliedKeyStore();
  let store = fixture.store;
  let engine = new SagaEngine({ store, appliedKeys });
  await engine.register([definition]);
  await engine.start();
  try {
    const [requested] = await engine.handle({ type: 'FulfillmentFailed', payload: {} });
    assertEquals(requested.version, 1);
    assert(requested.version !== undefined);
    const outcome: SagaCompensationOutcome = {
      sagaId: requested.sagaId,
      instanceId: requested.instanceId,
      correlationKey,
      version: requested.version,
      message: { type: 'RefundPayment', payload: {} },
      state: { payment: 'refunded' },
      cascaded: fixture.status === 'compensating'
        ? [sagaCompensate({ type: 'ReleaseStock', payload: {} })]
        : [],
      ...(fixture.status === 'failed' ? { error: new Error('refund rejected') } : {}),
    };
    const digest = await sagaCommandDigest([
      'saga-compensation-v1',
      outcome.sagaId,
      outcome.instanceId,
      String(outcome.version),
    ]);
    const original = await store.load(outcome.instanceId);
    const history = await store.transitions(outcome.instanceId);
    fixture.armFault();
    await assertRejects(
      () => engine.commitCompensation(outcome),
      Error,
      'injected compensation persistence failure',
    );
    assertEquals(fixture.faultCount(), 1, 'the intended storage fault must actually execute');
    await engine.stop();
    store = await fixture.reopen();
    assert(store.hasAppliedTransition, 'the provider must expose its committed replay lookup');
    engine = new SagaEngine({ store, appliedKeys });
    await engine.register([definition]);
    await engine.start();

    if (fixture.fault === 'before-commit') {
      assertEquals(await store.load(outcome.instanceId), original);
      assertEquals(await store.transitions(outcome.instanceId), history);
      assertEquals(await store.hasAppliedTransition(outcome.instanceId, digest), false);
    } else {
      assertEquals((await store.load(outcome.instanceId))?.metadata.version, 2);
      assertEquals(await store.hasAppliedTransition(outcome.instanceId, digest), true);
    }
    assertEquals(
      await store.findByCorrelation(outcome.sagaId, correlationKey),
      outcome.instanceId,
    );
    assertEquals(await engine.commitCompensation(outcome), {
      committed: fixture.fault === 'before-commit',
      status: fixture.status,
      version: 2,
    });
    const committed = await store.load(outcome.instanceId);
    assert(committed);
    assertEquals(committed.metadata.status, fixture.status);
    assertEquals(committed.metadata.version, 2);
    assertEquals(committed.state, { payment: 'refunded' });
    assertEquals(
      committed.metadata.compensationError,
      fixture.status === 'failed' ? { name: 'Error', message: 'refund rejected' } : undefined,
    );
    assertEquals(await store.hasAppliedTransition(outcome.instanceId, digest), true);
    assertEquals(
      (await store.transitions(outcome.instanceId)).map((row) => ({
        version: row.version,
        status: row.transition.status,
      })),
      [{ version: 1, status: 'compensating' }, { version: 2, status: fixture.status }],
    );

    assertEquals(await engine.commitCompensation(outcome), {
      committed: false,
      status: fixture.status,
      version: 2,
    });
    assertEquals(await store.load(outcome.instanceId), committed);
    assertEquals((await store.transitions(outcome.instanceId)).length, 2);
  } finally {
    await engine.stop();
  }
}
