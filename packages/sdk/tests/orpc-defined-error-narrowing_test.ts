import {
  baseContract,
  CursorPaginationInputSchema,
  type NotFoundErrorSchema,
  SuccessSchema,
} from '@netscript/contracts';
import { isDefinedError as orpcIsDefinedError, ORPCError, safe as orpcSafe } from '@orpc/client';
import { assert, assertEquals } from '@std/assert';
import {
  type ContractSchemaOutput,
  createServiceClient,
  getErrorHttpStatus,
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
    type _SdkSafeArmV1StatusPreserved = Assert<Equal<typeof result.error.status, number>>;
    // @ts-expect-error -- unused if the SDK safe() arm narrows to never.
    const _notAString: string = result.error;
    if (result.error.code === 'NOT_FOUND') {
      type _SdkSafeArmData = Assert<Equal<typeof result.error.data, NotFoundData>>;
    }
    return result.error.code;
  }
  return undefined;
}

type V2DefinedOrderLockedError = Error & {
  readonly defined: true;
  readonly code: 'ORDER_LOCKED';
  readonly data: { readonly orderId: string };
};

async function sdkV2StatuslessDefinedErrorNarrowing(
  promise: Promise<{ readonly ok: true }> & {
    __error?: { type: Error | V2DefinedOrderLockedError };
  },
) {
  const result = await safe(promise);
  if (!result.isSuccess && result.isDefined) {
    type _V2CodeNarrowed = Assert<Equal<typeof result.error.code, 'ORDER_LOCKED'>>;
    type _V2StatusOptional = Assert<Equal<typeof result.error.status, number | undefined>>;
    // @ts-expect-error -- unused if v2 statusless defined errors collapse to never.
    const _notAString: string = result.error;
    return result.error.data.orderId;
  }
  if (!result.isSuccess && isDefinedError(result.error)) {
    // Already excluded from the non-defined arm; verifies isDefinedError accepts statusless unions.
    return undefined;
  }
  return undefined;
}
void sdkV2StatuslessDefinedErrorNarrowing;

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
  const originalAddress = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  globalThis.fetch = () => Promise.resolve(definedNotFoundResponse());
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAddress === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, originalAddress);
    }
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

Deno.test('getErrorHttpStatus extracts HTTP status across v1 ORPCError, v2 ResponseError/MalformedResponseError, and returns undefined on non-HTTP transports', () => {
  // v1 ORPCError carries `.status` directly.
  const v1Error = new ORPCError('NOT_FOUND', { status: 404, message: 'Missing' });
  assertEquals(getErrorHttpStatus(v1Error), 404);

  // Outer explicit HTTP status takes precedence over inner cause status.
  const v1WithInnerCause = new ORPCError('CLIENT_UPGRADE_REQUIRED', {
    status: 426,
    cause: { response: new Response(null, { status: 500 }) },
  });
  assertEquals(getErrorHttpStatus(v1WithInnerCause), 426);

  // v2 ResponseError / MalformedResponseError thrown directly carries `.response.status`.
  const directMalformed = Object.assign(new Error('Malformed response'), {
    name: 'MalformedResponseError',
    response: new Response('upgrade required', { status: 426 }),
  });
  assertEquals(getErrorHttpStatus(directMalformed), 426);

  // v2 ORPCError (no `.status`) wrapping ResponseError via `.cause`.
  const v2HttpWrapped = Object.assign(
    new Error('Order locked', {
      cause: Object.assign(new Error('HTTP 409'), {
        name: 'ResponseError',
        response: new Response(null, { status: 409 }),
      }),
    }),
    { defined: true, code: 'ORDER_LOCKED', data: { orderId: 'ord-1' } },
  );
  assertEquals(getErrorHttpStatus(v2HttpWrapped), 409);

  // Non-HTTP transports (MessagePort, in-process router client) carry no HTTP status.
  const messagePortError = Object.assign(new Error('Order locked'), {
    defined: true,
    code: 'ORDER_LOCKED',
    data: { orderId: 'ord-1' },
  });
  assertEquals(getErrorHttpStatus(messagePortError), undefined);

  // Plain errors, primitives, out-of-range statuses, and cyclic cause chains return undefined.
  assertEquals(getErrorHttpStatus(new Error('network down')), undefined);
  assertEquals(getErrorHttpStatus(null), undefined);
  assertEquals(getErrorHttpStatus(undefined), undefined);
  assertEquals(getErrorHttpStatus('boom'), undefined);
  assertEquals(getErrorHttpStatus({ status: 0 }), undefined);
  assertEquals(getErrorHttpStatus({ status: 999 }), undefined);
  assertEquals(getErrorHttpStatus({ status: 404.5 }), undefined);

  const cyclic: { cause?: unknown } = {};
  cyclic.cause = cyclic;
  assertEquals(getErrorHttpStatus(cyclic), undefined);
});
