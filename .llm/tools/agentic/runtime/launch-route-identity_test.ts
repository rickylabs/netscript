import {
  compareLaunchIdentity,
  enforceLaunchIdentity,
  requestedLaunchIdentity,
} from './launch-route-identity.ts';
import { assertEquals as equal } from '@std/assert';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const requested = requestedLaunchIdentity({
  provider: 'openai',
  model: 'gpt-test',
  effort: 'medium',
});

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
  equal(
    compareLaunchIdentity(requested, {
      provider: 'openai',
      model: 'gpt-test',
      effort: 'Medium',
    }),
    {
      requested,
      observed: { provider: 'openai', model: 'gpt-test', effort: 'Medium' },
      status: 'matched',
      mismatches: [],
    },
  );
});

Deno.test('launch evidence exposes mismatch fields without provider output or credentials', () => {
  equal(
    compareLaunchIdentity(requested, {
      provider: 'openrouter',
      model: 'other',
      effort: 'high',
    }).mismatches,
    ['provider', 'model', 'effort'],
  );
});

Deno.test('route mismatch escalation blocks with explicit operator action by default', () => {
  const evidence = compareLaunchIdentity(requested, {
    provider: 'openai',
    model: 'gpt-test',
    effort: 'low',
  });
  const enforcement = enforceLaunchIdentity(evidence, false);
  assert(!enforcement.allowed, 'mismatch should fail closed');
  assert(
    enforcement.operatorAction?.startsWith('BLOCKED:') ?? false,
    'operator action is required',
  );
});

Deno.test('route mismatch escalation has an explicit opt-out', () => {
  const evidence = compareLaunchIdentity(requested, {
    provider: 'openai',
    model: 'gpt-test',
    effort: 'low',
  });
  assert(
    enforceLaunchIdentity(evidence, true).allowed,
    'explicit opt-out should allow continuation',
  );
});
