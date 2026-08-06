import { assertEquals, assertThrows } from '@std/assert';
import { HYBRID_DELEGATION_DEFAULT_MODEL, OPENROUTER_MODEL_IDS } from '../config/models.ts';
import {
  HYBRID_DELEGATION_LIMITS,
  HybridDelegationError,
  hybridDelegationPrompt,
  validateHybridDelegationRequest,
} from './hybrid-delegation.ts';

Deno.test('hybrid contract applies the centralized DeepSeek default and bounded defaults', () => {
  const request = validateHybridDelegationRequest({ task: 'implement the focused change' });
  assertEquals(request.model, HYBRID_DELEGATION_DEFAULT_MODEL);
  assertEquals(request.model, OPENROUTER_MODEL_IDS.deepseekV4Flash0731);
  assertEquals(request.effort, 'high');
  assertEquals(request.timeoutMs, HYBRID_DELEGATION_LIMITS.defaultTimeoutMs);
});

Deno.test('hybrid contract rejects arbitrary models, efforts, and timeouts', () => {
  for (
    const request of [
      { task: 'work', model: 'unapproved/model' },
      { task: 'work', effort: 'unbounded' },
      { task: 'work', timeoutMs: HYBRID_DELEGATION_LIMITS.maximumTimeoutMs + 1 },
    ]
  ) {
    const error = assertThrows(() => validateHybridDelegationRequest(request));
    assertEquals(error instanceof HybridDelegationError, true);
    assertEquals((error as HybridDelegationError).code, 'invalid_request');
  }
});

Deno.test('hybrid contract rejects malformed non-object inputs', () => {
  for (const request of [null, [], 'task']) {
    const error = assertThrows(() =>
      validateHybridDelegationRequest(request as unknown as { task: string })
    );
    assertEquals((error as HybridDelegationError).code, 'invalid_request');
  }
});

Deno.test('hybrid contract enforces UTF-8 prompt and context byte limits', () => {
  assertThrows(() =>
    validateHybridDelegationRequest({
      task: 'é'.repeat(HYBRID_DELEGATION_LIMITS.taskBytes / 2 + 1),
    })
  );
  assertThrows(() =>
    validateHybridDelegationRequest({
      task: 'work',
      context: 'x'.repeat(HYBRID_DELEGATION_LIMITS.contextBytes + 1),
    })
  );
});

Deno.test('hybrid prompt labels caller context without adding implicit repository content', () => {
  const request = validateHybridDelegationRequest({ task: 'review', context: 'only this diff' });
  assertEquals(
    hybridDelegationPrompt(request),
    'Task:\nreview\n\nCaller-provided context:\nonly this diff',
  );
});
