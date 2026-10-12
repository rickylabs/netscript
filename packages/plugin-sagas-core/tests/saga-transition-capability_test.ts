import { assertEquals, assertThrows } from '@std/assert';
import { isSagaTransitionStore } from '../src/ports/mod.ts';
import { requireSagaTransitionStore } from '../src/ports/saga-transition-commit-port.ts';
import { MemorySagaStore } from '../src/testing/memory-saga-store.ts';

Deno.test('atomic capability guard and registration requirement agree on every guarantee', () => {
  const delegate = new MemorySagaStore();
  assertEquals(isSagaTransitionStore(delegate), true);
  assertEquals(requireSagaTransitionStore(delegate), delegate);
  for (
    const candidate of [
      undefined,
      Object.assign(Object.create(delegate), { transitionCommitCapabilities: undefined }),
      Object.assign(Object.create(delegate), {
        transitionCommitCapabilities: {
          ...delegate.transitionCommitCapabilities,
          transitionOutbox: 'separate',
        },
      }),
      Object.assign(Object.create(delegate), {
        transitionCommitCapabilities: {
          ...delegate.transitionCommitCapabilities,
          optimisticVersion: false,
        },
      }),
      Object.assign(Object.create(delegate), {
        transitionCommitCapabilities: {
          ...delegate.transitionCommitCapabilities,
          replay: 'separate',
        },
      }),
      Object.assign(Object.create(delegate), { commitTransition: undefined }),
    ]
  ) {
    assertEquals(isSagaTransitionStore(candidate), false);
    assertThrows(
      () => requireSagaTransitionStore(candidate),
      TypeError,
      'lacks atomic transition/outbox and replay capability.',
    );
  }
});
