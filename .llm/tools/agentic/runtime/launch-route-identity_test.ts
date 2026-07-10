import { compareLaunchIdentity, requestedLaunchIdentity } from './launch-route-identity.ts';

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`actual ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
  }
}

Deno.test('launch identity rejects missing or unsupported provider model and effort', () => {
  for (
    const values of [
      {},
      { provider: 'openai', model: '', effort: 'medium' },
      { provider: 'rival', model: 'gpt', effort: 'medium' },
      { provider: 'openai', model: 'gpt', effort: 'extreme' },
    ]
  ) {
    let rejected = false;
    try {
      requestedLaunchIdentity(values);
    } catch {
      rejected = true;
    }
    equal(rejected, true);
  }
});

Deno.test('launch evidence records matched requested and observed identity', () => {
  const requested = requestedLaunchIdentity({
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  });
  equal(
    compareLaunchIdentity(requested, {
      provider: 'openai',
      model: 'gpt-5.6-sol',
      effort: 'Medium',
    }),
    {
      requested,
      observed: { provider: 'openai', model: 'gpt-5.6-sol', effort: 'Medium' },
      status: 'matched',
      mismatches: [],
    },
  );
});

Deno.test('launch evidence exposes mismatch fields without provider output or credentials', () => {
  const requested = requestedLaunchIdentity({
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  });
  equal(
    compareLaunchIdentity(requested, {
      provider: 'openrouter',
      model: 'other',
      effort: 'high',
    }).mismatches,
    ['provider', 'model', 'effort'],
  );
});
