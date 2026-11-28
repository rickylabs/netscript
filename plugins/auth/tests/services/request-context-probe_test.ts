import { assert, assertEquals, assertRejects } from '@std/assert';
import { withAuthRequest } from '../../services/src/request-context.ts';

const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');

interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}

function findAuthRequestProbe(): ActiveAsyncStoreProbe | undefined {
  const probes: unknown = Reflect.get(globalThis, ACTIVE_STORE_PROBES_SYMBOL);
  if (!(probes instanceof Set)) return undefined;
  for (const probe of probes) {
    if (
      probe !== null &&
      typeof probe === 'object' &&
      'name' in probe &&
      probe.name === '@netscript/plugin-auth.requestContext'
    ) {
      return probe as ActiveAsyncStoreProbe;
    }
  }
  return undefined;
}

Deno.test('auth request-context probe reports active only inside withAuthRequest scopes', async () => {
  const probe = findAuthRequestProbe();
  assert(
    probe !== undefined,
    'Expected @netscript/plugin-auth.requestContext active-store probe to be registered',
  );
  assertEquals(probe.isActive(), false);

  const context = {
    req: { raw: new Request('https://auth.example.test/api/rpc/v1/auth/me') },
    res: new Response(null, { status: 200 }),
  };

  let insideNormal = false;
  await withAuthRequest(context, async () => {
    await Promise.resolve();
    insideNormal = probe.isActive();
  });
  assertEquals(insideNormal, true);
  assertEquals(probe.isActive(), false);

  let insideThrow = false;
  await assertRejects(
    () =>
      withAuthRequest(context, async () => {
        await Promise.resolve();
        insideThrow = probe.isActive();
        throw new Error('auth-handler-failure');
      }),
    Error,
    'auth-handler-failure',
  );
  assertEquals(insideThrow, true);
  assertEquals(probe.isActive(), false);
});
