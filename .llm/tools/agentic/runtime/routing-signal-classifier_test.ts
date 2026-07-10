import { classifyRoutingSignal } from './routing-signal-classifier.ts';

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`actual ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
  }
}

Deno.test('structured diagnostics take precedence over compatibility text', () => {
  equal(
    classifyRoutingSignal({
      diagnostic: {
        code: 'provider_unavailable',
        category: 'provider',
        retryable: true,
        message: 'bounded structured incident',
      },
      tool: 'claude',
      version: '1.0.33',
      text: 'usage limit reached',
      resetAt: '2026-07-11T00:00:00.000Z',
    }),
    {
      reason: 'provider_outage',
      source: 'structured',
      diagnosticCode: 'provider_unavailable',
      resetAt: '2026-07-11T00:00:00.000Z',
    },
  );
});

Deno.test('exact pinned versions classify known compatibility text', () => {
  equal(classifyRoutingSignal({ tool: 'claude', version: '1.0.33', text: 'Usage limit reached' }), {
    reason: 'plan_limit',
    source: 'version_pinned_text',
  });
  equal(
    classifyRoutingSignal({ tool: 'codex', version: '0.91.0', text: 'session limit reached' }),
    {
      reason: 'session_limit',
      source: 'version_pinned_text',
    },
  );
});

Deno.test('unknown versions, unknown text, and unrelated diagnostics fail closed', () => {
  equal(
    classifyRoutingSignal({ tool: 'claude', version: '1.0.34', text: 'usage limit reached' }),
    null,
  );
  equal(
    classifyRoutingSignal({ tool: 'claude', version: '1.0.33', text: 'some other failure' }),
    null,
  );
  equal(
    classifyRoutingSignal({
      diagnostic: {
        code: 'auth_required',
        category: 'authentication',
        retryable: false,
        message: 'x',
      },
    }),
    null,
  );
});
