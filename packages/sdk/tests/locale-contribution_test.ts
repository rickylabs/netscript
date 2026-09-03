import { assert, assertEquals, assertFalse, assertRejects, assertThrows } from '@std/assert';
import { os } from '@orpc/server';
import { createLocaleSdkClientContribution } from '../src/client/locale-contribution.ts';
import { defineSdkClientContribution } from '../src/client/sdk-client-contribution.ts';
import { SdkClientContributionError } from '../src/client/errors.ts';
import { createServiceClient } from '../src/client/service-client.ts';
import {
  createPreparedOutboundHeadersPort,
  resolveSdkClientCachePartition,
  validateSdkClientContributions,
} from '../src/internal/client-contributions/prepared-call.ts';
import type { SdkClientLogicalCall } from '../src/internal/client-contributions/adapter-ports.ts';

const contract = {
  echo: os.handler(({ input }: { input: unknown }) => input),
};

function logicalCall(
  context: Readonly<Record<string, unknown>>,
  signal?: AbortSignal,
): SdkClientLogicalCall<object> {
  const procedure = Object.freeze({ path: Object.freeze(['echo']), meta: Object.freeze({}) });
  return Object.freeze({
    context,
    procedurePath: Object.freeze(['echo']),
    procedure,
    transportPolicy: Object.freeze({
      procedure,
      method: 'POST' as const,
      cache: 'default' as const,
    }),
    transport: Object.freeze({
      kind: 'http' as const,
      origin: new URL('https://example.test'),
      rpcPath: '/api/rpc/v1/locale',
      secure: true,
    }),
    input: Object.freeze({}),
    signal,
  });
}

function constructionError(contributions: unknown): SdkClientContributionError {
  try {
    Reflect.apply(createServiceClient, undefined, [{
      contract,
      serviceName: 'locale-conflict',
      contributions,
    }]);
  } catch (error) {
    assert(error instanceof SdkClientContributionError);
    return error;
  }
  throw new Error('Expected contribution construction to fail');
}

Deno.test('locale descriptor owns accept-language and canonicalizes one optional locale', async () => {
  const contribution = createLocaleSdkClientContribution();

  assertEquals(contribution.protocol, { family: 'netscript.sdk-client', major: 1 });
  assertEquals(contribution.id, '@netscript/sdk:locale');
  assertEquals(contribution.context, { locale: 'optional' });
  assertEquals(contribution.headerKeys, ['accept-language']);
  assertEquals(contribution.responseCache.mode, 'partitioned');

  assertEquals(
    await contribution.prepare({
      context: {},
      procedure: logicalCall({}).procedure,
      transport: logicalCall({}).transport,
      input: undefined,
    }),
    {},
  );
  assertEquals(
    await contribution.prepare({
      context: { locale: 'en-us' },
      procedure: logicalCall({}).procedure,
      transport: logicalCall({}).transport,
      input: undefined,
    }),
    { headers: { 'accept-language': 'en-US' } },
  );
  assertEquals(
    contribution.responseCache.partition({ context: {}, procedure: logicalCall({}).procedure }),
    'default',
  );
  assertEquals(
    contribution.responseCache.partition({
      context: { locale: 'iw-il' },
      procedure: logicalCall({}).procedure,
    }),
    'he-IL',
  );
});

Deno.test('locale rejects lists, q-values, blanks, and malformed identifiers without echoing them', async () => {
  const contribution = createLocaleSdkClientContribution();
  const invalid = [
    '',
    ' en-US',
    'en-US,fr-FR',
    'en-US;q=0.9',
    'not_a_locale',
  ];

  for (const value of invalid) {
    const prepareError = await assertRejects(() =>
      createPreparedOutboundHeadersPort([contribution]).prepare(logicalCall({ locale: value }))
    );
    assert(prepareError instanceof SdkClientContributionError);
    assertEquals(prepareError.code, 'SDK_PREPARATION_FAILED');
    assertEquals(prepareError.contributionId, '@netscript/sdk:locale');
    if (value.length > 0) {
      assertFalse(prepareError.message.includes(value));
      assertFalse(JSON.stringify(prepareError).includes(value));
    }
    assertFalse('cause' in prepareError);
  }
});

Deno.test('locale duplicate ownership and reserved headers fail with deterministic descriptor ids', () => {
  const locale = createLocaleSdkClientContribution();
  const otherOwner = defineSdkClientContribution<Record<never, never>>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:other-locale',
    context: {},
    headerKeys: ['accept-language'],
    responseCache: { mode: 'invariant' },
    prepare: () => ({ headers: { 'accept-language': 'fr-FR' } }),
  });

  const localeThenOther = constructionError([locale, otherOwner]);
  assertEquals(localeThenOther.code, 'SDK_CONTRIBUTION_CONFLICT');
  assertEquals(localeThenOther.contributionId, 'test:other-locale');
  assertEquals(localeThenOther.headerName, 'accept-language');

  const otherThenLocale = constructionError([otherOwner, locale]);
  assertEquals(otherThenLocale.code, 'SDK_CONTRIBUTION_CONFLICT');
  assertEquals(otherThenLocale.contributionId, '@netscript/sdk:locale');
  assertEquals(otherThenLocale.headerName, 'accept-language');

  const reserved = constructionError([{
    ...locale,
    id: 'test:reserved-locale',
    headerKeys: ['content-type'],
  }]);
  assertEquals(reserved.code, 'SDK_CONTRIBUTION_INVALID');
  assertEquals(reserved.contributionId, 'test:reserved-locale');
  assertFalse('cause' in reserved);
});

Deno.test('locale composes with auth-shaped headers in either declaration order', async () => {
  const locale = createLocaleSdkClientContribution();
  const authValue = crypto.randomUUID();
  const auth = defineSdkClientContribution<{ auth: string }>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:auth',
    context: { auth: 'required' },
    headerKeys: ['authorization'],
    responseCache: { mode: 'direct-only' },
    prepare: ({ context }) => ({ headers: { authorization: `Bearer ${context.auth}` } }),
  });

  for (const contributions of [[auth, locale], [locale, auth]] as const) {
    const prepared = await createPreparedOutboundHeadersPort(contributions).prepare(
      logicalCall({ auth: authValue, locale: 'fr-fr' }),
    );
    assertEquals(prepared.contributedHeaders.values['accept-language'], 'fr-FR');
    assert(prepared.contributedHeaders.values.authorization === `Bearer ${authValue}`);
  }
});

Deno.test('direct locale calls prepare once across retry and stop before preparation when cancelled', async () => {
  const serviceName = `locale-${crypto.randomUUID()}`;
  const envKey = `services__${serviceName}__http__0`;
  const previous = Deno.env.get(envKey);
  const originalFetch = globalThis.fetch;
  const transportError = new Error('expected locale transport stop');
  const observedHeaders: string[] = [];
  let attempts = 0;
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  globalThis.fetch = (_request, init) => {
    attempts += 1;
    observedHeaders.push(new Headers(init?.headers).get('accept-language') ?? '');
    return Promise.reject(transportError);
  };

  try {
    const canonical = createLocaleSdkClientContribution();
    let preparations = 0;
    const observed = {
      ...canonical,
      prepare: async (options: Parameters<typeof canonical.prepare>[0]) => {
        preparations += 1;
        return await canonical.prepare(options);
      },
    };
    const client = createServiceClient({
      contract,
      serviceName,
      contributions: [observed] as const,
    });

    await assertRejects(() =>
      client.echo('retry', {
        context: { locale: 'de-de', retry: 1, retryDelay: 0 },
      })
    );
    assertEquals(preparations, 1);
    assertEquals(attempts, 2);
    assertEquals(observedHeaders, ['de-DE', 'de-DE']);

    preparations = 0;
    const controller = new AbortController();
    const reason = new Error('locale-cancelled-before-preparation');
    controller.abort(reason);
    const cancelled = await assertRejects(() =>
      client.echo('cancel', {
        context: { locale: 'de-DE', signal: controller.signal },
      })
    );
    assertEquals(cancelled, reason);
    assertEquals(preparations, 0);
    assertEquals(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
});

Deno.test('locale descriptor remains valid at the unknown runtime boundary', () => {
  const [locale] = validateSdkClientContributions([createLocaleSdkClientContribution()]);
  assertEquals(locale.id, '@netscript/sdk:locale');
  assertEquals(locale.headerKeys, ['accept-language']);
  assertEquals(locale.responseCache.mode, 'partitioned');

  const privateValue = 'private-context-value,invalid';
  const error = assertThrows(() =>
    resolveSdkClientCachePartition(
      [locale],
      { locale: privateValue },
      logicalCall({}).procedure,
    )
  );
  assert(error instanceof SdkClientContributionError);
  assertEquals(error.code, 'SDK_CACHE_PARTITION_INVALID');
  assertEquals(error.contributionId, '@netscript/sdk:locale');
  assertFalse(error.message.includes(privateValue));
  assertFalse(JSON.stringify(error).includes(privateValue));
  assertFalse('cause' in error);
});
