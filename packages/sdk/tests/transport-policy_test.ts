import { assertEquals, assertThrows } from '@std/assert';
import { baseContract } from '@netscript/contracts';
import {
  type ResolvedTransportPolicy,
  resolveTransportPolicy,
} from '../src/internal/transport-policy.ts';

const contract = {
  cached: baseContract
    .route({ method: 'GET', path: '/cached' })
    .meta({ policy: { cache: 'force-cache' } }),
  submitted: baseContract.route({ method: 'POST', path: '/submitted' }),
  headed: baseContract.route({ method: 'HEAD', path: '/headed' }),
};

function resolveUnknown(options: unknown): ResolvedTransportPolicy {
  return Reflect.apply(resolveTransportPolicy, undefined, [contract, options]);
}

Deno.test('transport policy resolves method and cache from the contract-owned descriptor', () => {
  const policy = resolveTransportPolicy(contract);
  const cached = policy.resolveCall(['cached'], { page: 1 }, {});
  const submitted = policy.resolveCall(['submitted'], undefined, {});
  const headed = policy.resolveCall(['headed'], undefined, {});

  assertEquals(cached.method, 'GET');
  assertEquals(cached.cache, 'force-cache');
  assertEquals(cached.procedure.meta.policy, { cache: 'force-cache' });
  assertEquals(policy.method(cached), 'GET');
  assertEquals(policy.dedupePredicate(cached), true);
  assertEquals(policy.cacheGroups[0].condition(cached), true);
  assertEquals(policy.cacheGroups[1].condition(cached), true);
  assertEquals(submitted.method, 'POST');
  assertEquals(policy.dedupePredicate(submitted), false);
  assertEquals(headed.method, 'GET');
  assertEquals(policy.fallbackMethod, 'POST');
  assertEquals(policy.maxUrlLength, 2083);
});

Deno.test('explicit supported call cache overrides metadata without redefining other modes', () => {
  const policy = resolveTransportPolicy(contract);

  assertEquals(policy.resolveCall(['cached'], undefined, { cache: 'no-store' }).cache, 'no-store');
  assertEquals(policy.resolveCall(['cached'], undefined, { cache: 'default' }).cache, 'default');
  assertEquals(policy.resolveCall(['cached'], undefined, { cache: 'reload' }).cache, 'force-cache');
});

Deno.test('method override is contract-derived, validated, and resolved per logical call', () => {
  const observations: unknown[] = [];
  const policy = resolveTransportPolicy(contract, {
    transportPolicy: {
      method: (options) => {
        observations.push(options);
        return 'POST';
      },
    },
  });
  const call = policy.resolveCall(['cached'], { secret: 'borrowed' }, {});

  assertEquals(call.method, 'POST');
  assertEquals(policy.dedupePredicate(call), false);
  assertEquals(observations.length, 1);
  assertEquals(observations[0], {
    procedure: {
      path: ['cached'],
      meta: { policy: { cache: 'force-cache' } },
    },
    input: { secret: 'borrowed' },
    inferredMethod: 'GET',
  });
});

Deno.test('transport policy rejects invalid paths, option fields, and method results', () => {
  assertThrows(
    () => resolveTransportPolicy(contract).resolveCall(['missing'], undefined, {}),
    TypeError,
    'does not exist',
  );
  assertThrows(
    () => resolveTransportPolicy({ nested: contract }).resolveCall(['nested'], undefined, {}),
    TypeError,
    'not a procedure',
  );
  assertThrows(
    () => resolveUnknown({ transportPolicy: { extra: true } }),
    TypeError,
    'only the optional method override',
  );
  assertThrows(
    () => resolveUnknown({ transportPolicy: { method: 'GET' } }),
    TypeError,
    'must be a function',
  );
  const invalid = resolveUnknown({ transportPolicy: { method: () => 'HEAD' } });
  assertThrows(
    () => invalid.resolveCall(['cached'], undefined, {}),
    TypeError,
    'invalid HTTP method',
  );
});
