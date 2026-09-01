import { assert, assertEquals, assertFalse, assertRejects, assertThrows } from '@std/assert';
import { os } from '@orpc/server';
import { SdkClientContributionError } from '../src/client/errors.ts';
import { createServiceClient } from '../src/client/service-client.ts';
import { createDesktopServiceClient } from '../src/desktop/application/desktop-rpc-client.ts';
import {
  createPreparedOutboundHeadersPort,
  resolveSdkClientCachePartition,
  validateSdkClientContributions,
} from '../src/internal/client-contributions/prepared-call.ts';
import type { SdkClientContributionErrorCode } from '../src/client/errors.ts';
import type { SdkClientLogicalCall } from '../src/internal/client-contributions/adapter-ports.ts';

const contract = {
  echo: os.handler(({ input }: { input: unknown }) => input),
};

function descriptor(
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:valid',
    context: { tenant: 'required' },
    headerKeys: ['x-tenant'],
    responseCache: { mode: 'invariant' },
    prepare: () => ({ headers: { 'x-tenant': 'safe' } }),
    ...overrides,
  };
}

function constructionError(
  contributions: unknown,
): SdkClientContributionError {
  try {
    Reflect.apply(createServiceClient, undefined, [{
      contract,
      serviceName: 'invalid-contribution',
      contributions,
    }]);
  } catch (error) {
    assert(error instanceof SdkClientContributionError);
    return error;
  }
  throw new Error('Expected construction to reject the contribution tuple');
}

function assertConstructionCode(
  contributions: unknown,
  code: SdkClientContributionErrorCode,
): void {
  const error = constructionError(contributions);
  assertEquals(error.code, code);
  assertEquals(error.phase, 'construction');
  assertFalse('cause' in error);
}

function procedureDescriptor(path: readonly string[] = ['echo']) {
  return Object.freeze({
    path: Object.freeze([...path]),
    meta: Object.freeze({}),
  });
}

function logicalCall(context: Readonly<Record<string, unknown>>): SdkClientLogicalCall<object> {
  const procedure = procedureDescriptor();
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
      rpcPath: '/api/rpc/v1/test',
      secure: true,
    }),
    input: Object.freeze({ secretInput: 'input-secret' }),
  });
}

function preparationPort(contributions: unknown) {
  return createPreparedOutboundHeadersPort(contributions);
}

Deno.test('unknown construction rejects invalid protocol, ids, shapes, and forbidden extras', () => {
  assertConstructionCode([
    descriptor({ protocol: { family: 'other', major: 1 } }),
  ], 'SDK_CONTRIBUTION_VERSION');
  assertConstructionCode([
    descriptor({ protocol: { family: 'netscript.sdk-client', major: 2 } }),
  ], 'SDK_CONTRIBUTION_VERSION');
  assertConstructionCode([descriptor({ id: 'INVALID' })], 'SDK_CONTRIBUTION_INVALID');
  assertConstructionCode([new Date()], 'SDK_CONTRIBUTION_INVALID');
  assertConstructionCode([descriptor({ context: [] })], 'SDK_CONTRIBUTION_INVALID');

  for (const extra of ['dependsOn', 'before', 'after', 'order', 'priority', 'environment']) {
    assertConstructionCode([
      descriptor({ [extra]: extra === 'priority' ? 1 : ['test:other'] }),
    ], 'SDK_CONTRIBUTION_INVALID');
  }
});

Deno.test('unknown construction rejects ownership conflicts and reserved names', () => {
  const first = descriptor({ id: 'test:first' });
  assertConstructionCode([first, descriptor({ id: 'test:first' })], 'SDK_CONTRIBUTION_CONFLICT');
  assertConstructionCode([
    first,
    descriptor({ id: 'test:second', headerKeys: ['x-tenant'] }),
  ], 'SDK_CONTRIBUTION_CONFLICT');
  assertConstructionCode([
    first,
    descriptor({ id: 'test:second', context: { tenant: 'optional' } }),
  ], 'SDK_CONTRIBUTION_CONFLICT');
  assertConstructionCode([
    descriptor({ context: { retry: 'optional' } }),
  ], 'SDK_CONTRIBUTION_CONFLICT');
  assertConstructionCode([
    descriptor({ headerKeys: ['content-type'] }),
  ], 'SDK_CONTRIBUTION_INVALID');
  assertConstructionCode([
    descriptor({ headerKeys: ['X-Tenant'] }),
  ], 'SDK_CONTRIBUTION_INVALID');
  assertConstructionCode([
    descriptor({ headerKeys: ['sec-private'] }),
  ], 'SDK_CONTRIBUTION_INVALID');
});

Deno.test('unknown construction enforces tuple, context, and header budgets', () => {
  const tuple = Array.from(
    { length: 17 },
    (_, index) => descriptor({ id: `test:item-${index}`, context: {}, headerKeys: [] }),
  );
  assertConstructionCode(tuple, 'SDK_CONTRIBUTION_LIMIT');
  assertConstructionCode([
    descriptor({
      context: Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => [`key${index}`, 'optional']),
      ),
    }),
  ], 'SDK_CONTRIBUTION_LIMIT');
  assertConstructionCode([
    descriptor({
      headerKeys: Array.from({ length: 17 }, (_, index) => `x-key-${index}`),
    }),
  ], 'SDK_CONTRIBUTION_LIMIT');
});

Deno.test('Desktop construction rejects even an empty contributions field at runtime', () => {
  const error = assertThrows(() =>
    Reflect.apply(createDesktopServiceClient, undefined, [{
      contract,
      contributions: [],
    }])
  );
  assert(error instanceof SdkClientContributionError);
  assertEquals(error.code, 'SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED');
  assertEquals(error.phase, 'construction');
});

Deno.test('preparation rejects missing context and every invalid header form', async () => {
  const missing = await assertRejects(() =>
    preparationPort([descriptor()]).prepare(logicalCall({}))
  );
  assert(missing instanceof SdkClientContributionError);
  assertEquals(missing.code, 'SDK_CONTEXT_MISSING');

  const cases: readonly [string, unknown][] = [
    ['undeclared', { 'x-other': 'value' }],
    ['forbidden', { 'content-type': 'text/plain' }],
    ['mixed-case', { 'X-Tenant': 'value' }],
    ['non-string', { 'x-tenant': 42 }],
    ['crlf', { 'x-tenant': 'value\r\ninjected: yes' }],
  ];
  for (const [name, headers] of cases) {
    const contribution = descriptor({
      prepare: () => ({ headers }),
    });
    const error = await assertRejects(
      () => preparationPort([contribution]).prepare(logicalCall({ tenant: name })),
    );
    assert(error instanceof SdkClientContributionError);
    assertEquals(error.code, 'SDK_HEADER_INVALID');
  }
});

Deno.test('preparation failures are deterministic and redact source, context, input, and headers', async () => {
  const first = descriptor({
    id: 'test:first',
    prepare: () => {
      throw new Error('source-secret');
    },
  });
  const second = descriptor({
    id: 'test:second',
    context: {},
    headerKeys: [],
    prepare: () => {
      throw new Error('second-secret');
    },
  });
  const error = await assertRejects(() =>
    preparationPort([first, second]).prepare(logicalCall({
      tenant: 'context-secret',
      token: 'token-secret',
    }))
  );
  assert(error instanceof SdkClientContributionError);
  assertEquals(error.code, 'SDK_PREPARATION_FAILED');
  assertEquals(error.contributionId, 'test:first');
  assertFalse('cause' in error);
  for (
    const secret of [
      'source-secret',
      'second-secret',
      'context-secret',
      'token-secret',
      'input-secret',
    ]
  ) {
    assertFalse(error.message.includes(secret));
    assertFalse(JSON.stringify(error).includes(secret));
  }
});

Deno.test('partition failures are redacted and canonical valid pairs sort by id', () => {
  const invalid = validateSdkClientContributions([
    descriptor({
      responseCache: {
        mode: 'partitioned',
        partition: () => {
          throw new Error('partition-source-secret');
        },
      },
    }),
  ]);
  const error = assertThrows(() =>
    resolveSdkClientCachePartition(
      invalid,
      { tenant: 'partition-context-secret' },
      procedureDescriptor(),
    )
  );
  assert(error instanceof SdkClientContributionError);
  assertEquals(error.code, 'SDK_CACHE_PARTITION_INVALID');
  assertFalse(error.message.includes('partition-source-secret'));
  assertFalse(error.message.includes('partition-context-secret'));

  const valid = validateSdkClientContributions([
    descriptor({
      id: 'test:zulu',
      responseCache: { mode: 'partitioned', partition: () => 'z' },
    }),
    descriptor({
      id: 'test:alpha',
      context: { locale: 'required' },
      headerKeys: ['accept-language'],
      responseCache: { mode: 'partitioned', partition: () => 'a' },
      prepare: () => ({}),
    }),
  ]);
  const partition = resolveSdkClientCachePartition(
    valid,
    { tenant: 'tenant', locale: 'en' },
    procedureDescriptor(),
  );
  assertEquals(partition.pairs, [
    ['test:alpha', 'a'],
    ['test:zulu', 'z'],
  ]);
  assertEquals(partition.serverSuffix, [
    '$netscript.sdk-context',
    '[["test:alpha","a"],["test:zulu","z"]]',
  ]);
  assertEquals(partition.querySuffix, [
    '$netscript.sdk-context',
    ['test:alpha', 'a'],
    ['test:zulu', 'z'],
  ]);
});

Deno.test('partitions reject empty, overlong, non-printable, and non-string results', () => {
  const invalidValues: readonly unknown[] = [
    '',
    'x'.repeat(65),
    'line\nbreak',
    Promise.resolve('async-is-not-supported'),
  ];
  for (const value of invalidValues) {
    const contribution = validateSdkClientContributions([
      descriptor({
        responseCache: { mode: 'partitioned', partition: () => value },
      }),
    ]);
    const error = assertThrows(() =>
      resolveSdkClientCachePartition(
        contribution,
        { tenant: 'partition-context-secret' },
        procedureDescriptor(),
      )
    );
    assert(error instanceof SdkClientContributionError);
    assertEquals(error.code, 'SDK_CACHE_PARTITION_INVALID');
    assertFalse(error.message.includes('partition-context-secret'));
  }
});

Deno.test('an already-aborted call invokes no contribution and propagates the abort reason', async () => {
  let preparations = 0;
  const controller = new AbortController();
  const reason = new Error('stop-before-preparation');
  controller.abort(reason);
  const contribution = descriptor({
    prepare: () => {
      preparations += 1;
      return {};
    },
  });
  const call = { ...logicalCall({ tenant: 'tenant' }), signal: controller.signal };
  try {
    await preparationPort([contribution]).prepare(call);
    throw new Error('Expected preparation to abort');
  } catch (error) {
    assertEquals(error, reason);
  }
  assertEquals(preparations, 0);
});
