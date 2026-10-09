import {
  baseContract,
  CursorPaginationInputSchema,
  type NotFoundErrorSchema,
  SuccessSchema,
} from '@netscript/contracts';
import { isDefinedError as orpcIsDefinedError, safe as orpcSafe } from '@orpc/client';
import { assert, assertEquals } from '@std/assert';
import {
  type ContractSchemaOutput,
  createServiceClient,
  isDefinedError,
  safe,
} from '../src/client/mod.ts';
import { createServerServiceEnvKey } from '../src/discovery/service-url.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;
type BaseErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';
type NotFoundData = ContractSchemaOutput<typeof NotFoundErrorSchema>;

const serviceName = 'orpc-defined-error-probe';
const contract = {
  list: baseContract
    .route({ method: 'GET', path: '/defined-error-probe' })
    .input(CursorPaginationInputSchema)
    .output(SuccessSchema),
};

/**
 * Builds the client exactly as an application does: no explicit contract type parameter.
 */
function createProbeClient() {
  return createServiceClient({ contract, serviceName });
}

type _InferredWithoutExplicitContract = Assert<
  Equal<
    ReturnType<typeof createProbeClient>,
    ReturnType<typeof createServiceClient<typeof contract>>
  >
>;

// Every block below carries an `@ts-expect-error` negative control: a defined error is not a
// string, so the assignment must fail. If the arm collapses to `never` again, `never` is assignable
// to `string`, the directive becomes unused, and type-checking this file fails.

async function nativeSafeIsDefinedArm(client: ReturnType<typeof createProbeClient>) {
  const [error, , isDefined] = await orpcSafe(client.list({ limit: 1 }));
  if (isDefined) {
    type _NativeSafeArmCodes = Assert<Equal<typeof error.code, BaseErrorCode>>;
    // @ts-expect-error -- unused if the native safe() arm narrows to never.
    const _notAString: string = error;
    if (error.code === 'NOT_FOUND') {
      type _NativeSafeArmData = Assert<Equal<typeof error.data, NotFoundData>>;
    }
    return { code: error.code, json: error.toJSON() };
  }
  return undefined;
}

async function nativeIsDefinedError(client: ReturnType<typeof createProbeClient>) {
  const result = await orpcSafe(client.list({ limit: 1 }));
  if (result.error && orpcIsDefinedError(result.error)) {
    type _NativeGuardCodes = Assert<Equal<typeof result.error.code, BaseErrorCode>>;
    // @ts-expect-error -- unused if native isDefinedError narrows to never.
    const _notAString: string = result.error;
    return result.error.code;
  }
  return undefined;
}

async function sdkSafeIsDefinedArm(client: ReturnType<typeof createProbeClient>) {
  const result = await safe(client.list({ limit: 1 }));
  if (!result.isSuccess && result.isDefined) {
    type _SdkSafeArmCodes = Assert<Equal<typeof result.error.code, BaseErrorCode>>;
    // @ts-expect-error -- unused if the SDK safe() arm narrows to never.
    const _notAString: string = result.error;
    if (result.error.code === 'NOT_FOUND') {
      type _SdkSafeArmData = Assert<Equal<typeof result.error.data, NotFoundData>>;
    }
    return result.error.code;
  }
  return undefined;
}

async function sdkIsDefinedError(client: ReturnType<typeof createProbeClient>) {
  const result = await safe(client.list({ limit: 1 }));
  if (!result.isSuccess && isDefinedError(result.error)) {
    type _SdkGuardCodes = Assert<Equal<typeof result.error.code, BaseErrorCode>>;
    // @ts-expect-error -- unused if SDK isDefinedError narrows to never.
    const _notAString: string = result.error;
    return result.error.code;
  }
  return undefined;
}

function definedNotFoundResponse(): Response {
  const body = {
    json: {
      defined: true,
      code: 'NOT_FOUND',
      status: 404,
      message: 'Resource not found',
      data: { resourceType: 'probe', resourceId: 'probe-1' },
    },
  };
  return new Response(JSON.stringify(body), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}

async function withDefinedErrorTransport(run: () => Promise<void>): Promise<void> {
  const envKey = createServerServiceEnvKey(serviceName);
  const originalFetch = globalThis.fetch;
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  globalThis.fetch = () => Promise.resolve(definedNotFoundResponse());
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    Deno.env.delete(envKey);
  }
}

Deno.test('native oRPC safe() narrows a createServiceClient defined error', async () => {
  await withDefinedErrorTransport(async () => {
    const narrowed = await nativeSafeIsDefinedArm(createProbeClient());
    assert(narrowed, 'native safe() reports the contract error as defined');
    assertEquals(narrowed.code, 'NOT_FOUND');
    assertEquals(narrowed.json.data, { resourceType: 'probe', resourceId: 'probe-1' });
  });
});

Deno.test('native oRPC isDefinedError narrows a createServiceClient defined error', async () => {
  await withDefinedErrorTransport(async () => {
    assertEquals(await nativeIsDefinedError(createProbeClient()), 'NOT_FOUND');
  });
});

Deno.test('SDK safe() and isDefinedError narrow the same defined error', async () => {
  await withDefinedErrorTransport(async () => {
    const client = createProbeClient();
    assertEquals(await sdkSafeIsDefinedArm(client), 'NOT_FOUND');
    assertEquals(await sdkIsDefinedError(client), 'NOT_FOUND');
  });
});
