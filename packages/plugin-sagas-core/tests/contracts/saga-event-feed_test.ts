import { assertEquals, assertInstanceOf } from '@std/assert';
import { SagaEventFeedError, SagasError } from '../../src/domain/mod.ts';
import type { SagaSSEEvent as DomainEvent } from '../../src/domain/mod.ts';
import type { SagaSSEEvent as ContractEvent } from '../../src/contracts/v1/mod.ts';

Deno.test('SSE domain vocabulary preserves the existing contract shape', () => {
  const event: DomainEvent = { type: 'saga:compensating', timestamp: 'now', data: { step: 1 } };
  const contract: ContractEvent = event;
  const domain: DomainEvent = contract;
  assertEquals(domain, event);
});

Deno.test('event feed errors distinguish a replay gap, bad input, and retryable storage', () => {
  const cause = new Error('backend');
  for (const reason of ['invalid-cursor', 'history-lost', 'unavailable'] as const) {
    const error = new SagaEventFeedError('feed failed', {
      reason,
      oldestId: 'oldest',
      latestId: 'latest',
      cause,
    });
    assertInstanceOf(error, SagasError);
    assertEquals(error.reason, reason);
    assertEquals(error.retryable, reason === 'unavailable');
    assertEquals(
      error.code,
      reason === 'unavailable' ? 'SAGA_RETRYABLE' : 'SAGA_VALIDATION_FAILED',
    );
    assertEquals(error.oldestId, 'oldest');
    assertEquals(error.latestId, 'latest');
    assertEquals(error.cause, cause);
  }
});
