import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { baseContract, type BaseContractErrors, type BaseContractMeta } from '@netscript/contracts';
import {
  commandBaseContract,
  CommandConflictSchema,
  type CommandContractErrors,
  type CommandContractOutputRoute,
  type CommandContractRoute,
  type CommandErrorConstructors,
  commandErrorMap,
  CommandInProgressSchema,
  IdempotencyKeyReuseSchema,
  throwCommandContractError,
} from '@netscript/contracts/commands';
import { isDefinedError, safe, type ServiceClient } from '@netscript/sdk/client';
import { z } from 'zod';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;
type BaseCodes =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';
type CommandCodes = 'COMMAND_CONFLICT' | 'IDEMPOTENCY_KEY_REUSE' | 'COMMAND_IN_PROGRESS';
type ExpectedCodes = BaseCodes | CommandCodes;

type _ExactBaseCodes = Assert<Equal<keyof BaseContractErrors, BaseCodes>>;
type _ExactCommandCodes = Assert<Equal<keyof CommandContractErrors, ExpectedCodes>>;
type _BuilderMeta = Assert<Equal<typeof commandBaseContract['~orpc']['meta'], BaseContractMeta>>;
type _ConflictStatus = Assert<Equal<CommandContractErrors['COMMAND_CONFLICT']['status'], 409>>;
type _ConflictMessage = Assert<
  Equal<
    CommandContractErrors['COMMAND_CONFLICT']['message'],
    'The command no longer matches current state'
  >
>;
type _ReuseMessage = Assert<
  Equal<
    CommandContractErrors['IDEMPOTENCY_KEY_REUSE']['message'],
    'The idempotency key was used for another request'
  >
>;
type _ProgressMessage = Assert<
  Equal<
    CommandContractErrors['COMMAND_IN_PROGRESS']['message'],
    'An identical command is still in progress'
  >
>;
type _BaseNotFound = Assert<
  Equal<CommandContractErrors['NOT_FOUND'], BaseContractErrors['NOT_FOUND']>
>;
type _BaseValidationError = Assert<
  Equal<CommandContractErrors['VALIDATION_ERROR'], BaseContractErrors['VALIDATION_ERROR']>
>;
type _BaseUnauthorized = Assert<
  Equal<CommandContractErrors['UNAUTHORIZED'], BaseContractErrors['UNAUTHORIZED']>
>;
type _BaseForbidden = Assert<
  Equal<CommandContractErrors['FORBIDDEN'], BaseContractErrors['FORBIDDEN']>
>;
type _BaseRateLimited = Assert<
  Equal<CommandContractErrors['RATE_LIMITED'], BaseContractErrors['RATE_LIMITED']>
>;
type _BaseServiceUnavailable = Assert<
  Equal<CommandContractErrors['SERVICE_UNAVAILABLE'], BaseContractErrors['SERVICE_UNAVAILABLE']>
>;

const inputSchema = z.object({ version: z.number().int() });
const outputSchema = z.object({ updated: z.boolean() });
const route: CommandContractRoute<typeof inputSchema, typeof outputSchema> = commandBaseContract
  .route({ method: 'POST', path: '/items/update' })
  .meta({ access: { authentication: 'required' }, policy: { cache: 'no-store' } })
  .input(inputSchema).output(outputSchema);
const outputRoute: CommandContractOutputRoute<typeof outputSchema> = commandBaseContract
  .output(outputSchema);
type _RouteMeta = Assert<Equal<typeof route['~orpc']['meta'], BaseContractMeta>>;
type _RouteErrors = Assert<Equal<typeof route['~orpc']['errorMap'], CommandContractErrors>>;
type _OutputRouteMeta = Assert<Equal<typeof outputRoute['~orpc']['meta'], BaseContractMeta>>;
type _OutputRouteErrors = Assert<
  Equal<typeof outputRoute['~orpc']['errorMap'], CommandContractErrors>
>;

// @ts-expect-error TS2322: a command-only code is absent from ordinary base contracts.
const rejectedBaseCode: keyof BaseContractErrors = 'COMMAND_CONFLICT';
// @ts-expect-error TS2322: command errors have a closed code vocabulary.
const rejectedCommandCode: keyof CommandContractErrors = 'NOT_DECLARED';
// @ts-expect-error TS2322: metadata retains the live authentication literals.
commandBaseContract.meta({ access: { authentication: 'sometimes' } });
const rejectedRetry: typeof CommandInProgressSchema['_output'] = {
  kind: 'in_progress',
  // @ts-expect-error TS2322: in-progress data requires retryable true.
  retryable: false,
};

const contract = { update: route };
declare const client: ServiceClient<typeof contract>;
type ClientError = NonNullable<ReturnType<typeof client.update>['__error']>['type'];
type DefinedClientError = Extract<ClientError, { readonly defined: true }>;
type _ClientCodes = Assert<Equal<DefinedClientError['code'], ExpectedCodes>>;
type _ClientConflictData = Assert<
  Equal<
    Extract<DefinedClientError, { code: 'COMMAND_CONFLICT' }>['data'],
    typeof CommandConflictSchema['_output']
  >
>;
type _ClientReuseData = Assert<
  Equal<
    Extract<DefinedClientError, { code: 'IDEMPOTENCY_KEY_REUSE' }>['data'],
    typeof IdempotencyKeyReuseSchema['_output']
  >
>;
type _ClientProgressData = Assert<
  Equal<
    Extract<DefinedClientError, { code: 'COMMAND_IN_PROGRESS' }>['data'],
    typeof CommandInProgressSchema['_output']
  >
>;

async function proveClientNarrowing(): Promise<void> {
  const result = await safe(client.update({ version: 1 }));
  if (!result.isSuccess && result.isDefined) {
    type _SafeCodes = Assert<Equal<typeof result.error.code, ExpectedCodes>>;
    // @ts-expect-error TS2367: an undeclared error code cannot be discriminated.
    if (result.error.code === 'NOT_DECLARED') throw new Error('undeclared error');
    if (result.error.code === 'COMMAND_CONFLICT') {
      type _SafeConflict = Assert<
        Equal<typeof result.error.data, typeof CommandConflictSchema['_output']>
      >;
    }
    if (result.error.code === 'IDEMPOTENCY_KEY_REUSE') {
      type _SafeReuse = Assert<
        Equal<typeof result.error.data, typeof IdempotencyKeyReuseSchema['_output']>
      >;
    }
    if (result.error.code === 'COMMAND_IN_PROGRESS') {
      type _SafeProgress = Assert<
        Equal<typeof result.error.data, typeof CommandInProgressSchema['_output']>
      >;
    }
  }
  if (!result.isSuccess && isDefinedError(result.error)) {
    type _GuardCodes = Assert<Equal<typeof result.error.code, ExpectedCodes>>;
    if (result.error.code === 'COMMAND_IN_PROGRESS') {
      type _GuardData = Assert<
        Equal<typeof result.error.data, typeof CommandInProgressSchema['_output']>
      >;
      // @ts-expect-error TS2339: no operational payload is available in safe client data.
      void result.error.data.scope;
    }
  }
}
void proveClientNarrowing;
void rejectedBaseCode;
void rejectedCommandCode;
void rejectedRetry;

function capturedThrow(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('expected an error');
}
const constructors: CommandErrorConstructors = {
  COMMAND_CONFLICT: (options) => ({ code: 'COMMAND_CONFLICT', ...options }),
  IDEMPOTENCY_KEY_REUSE: (options) => ({ code: 'IDEMPOTENCY_KEY_REUSE', ...options }),
  COMMAND_IN_PROGRESS: (options) => ({ code: 'COMMAND_IN_PROGRESS', ...options }),
};

Deno.test('command contracts opt in to exact errors and preserve route metadata', () => {
  assertEquals(Object.keys(baseContract['~orpc'].errorMap).sort(), [
    'FORBIDDEN',
    'NOT_FOUND',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'UNAUTHORIZED',
    'VALIDATION_ERROR',
  ]);
  assertEquals(Object.keys(commandBaseContract['~orpc'].errorMap).sort(), [
    'COMMAND_CONFLICT',
    'COMMAND_IN_PROGRESS',
    'FORBIDDEN',
    'IDEMPOTENCY_KEY_REUSE',
    'NOT_FOUND',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'UNAUTHORIZED',
    'VALIDATION_ERROR',
  ]);
  assertEquals(route['~orpc'].meta, {
    access: { authentication: 'required' },
    policy: { cache: 'no-store' },
  });
  assertEquals(Object.values(commandErrorMap).map(({ status, message }) => ({ status, message })), [
    { status: 409, message: 'The command no longer matches current state' },
    { status: 409, message: 'The idempotency key was used for another request' },
    { status: 409, message: 'An identical command is still in progress' },
  ]);
});

Deno.test('command schemas reject malformed retry hints and preserve exact payloads', () => {
  assertEquals(CommandConflictSchema.parse({ kind: 'optimistic_conflict', retryable: false }), {
    kind: 'optimistic_conflict',
    retryable: false,
  });
  assertEquals(
    IdempotencyKeyReuseSchema.parse({ kind: 'idempotency_key_reuse', retryable: false }),
    {
      kind: 'idempotency_key_reuse',
      retryable: false,
    },
  );
  for (const retryAfterMs of [0, 1, 500]) {
    assertEquals(
      CommandInProgressSchema.parse({ kind: 'in_progress', retryable: true, retryAfterMs }),
      {
        kind: 'in_progress',
        retryable: true,
        retryAfterMs,
      },
    );
  }
  for (const retryAfterMs of [-1, 0.5, Infinity, NaN]) {
    assert(
      !CommandInProgressSchema.safeParse({ kind: 'in_progress', retryable: true, retryAfterMs })
        .success,
    );
  }
});

Deno.test('command error mapping forwards only validated safe payloads to declared constructors', () => {
  const cases = [
    { code: 'COMMAND_CONFLICT', failure: { kind: 'optimistic_conflict', retryable: false } },
    { code: 'IDEMPOTENCY_KEY_REUSE', failure: { kind: 'idempotency_key_reuse', retryable: false } },
    { code: 'COMMAND_IN_PROGRESS', failure: { kind: 'in_progress', retryable: true } },
    {
      code: 'COMMAND_IN_PROGRESS',
      failure: { kind: 'in_progress', retryable: true, retryAfterMs: 20 },
    },
  ];
  for (const { code, failure } of cases) {
    const error = Object.assign(new Error('private diagnostic'), {
      failure,
      cause: new Error('private cause'),
    });
    assertEquals(capturedThrow(() => throwCommandContractError(error, constructors)), {
      code,
      data: failure,
    });
  }
});

Deno.test('command error mapping rethrows business operational and unsafe failures unchanged', () => {
  const failures: readonly unknown[] = [
    new Error('business failure'),
    null,
    'business failure',
    { kind: 'optimistic_conflict', retryable: false },
    { failure: { kind: 'invalid_envelope', retryable: false, reason: 'actor' } },
    { failure: { kind: 'unsupported_capability', retryable: false, capability: 'isolation' } },
    { failure: { kind: 'codec_failure', retryable: false, phase: 'fingerprint' } },
    { failure: { kind: 'receipt_corrupt', retryable: false } },
    { failure: { kind: 'store_failure', retryable: true, phase: 'claim' } },
    { failure: { kind: 'aborted', retryable: true } },
    { failure: { kind: 'optimistic_conflict', retryable: true } },
    { failure: { kind: 'idempotency_key_reuse', retryable: false, scope: 'private' } },
    { failure: { kind: 'optimistic_conflict', retryable: false, request: 'private' } },
    { failure: { kind: 'in_progress', retryable: true, retryAfterMs: -1 } },
    { failure: { kind: 'in_progress', retryable: true, retryAfterMs: 0.5 } },
    { failure: { kind: 'in_progress', retryable: true, retryAfterMs: Infinity } },
    { failure: { kind: 'in_progress', retryable: true, retryAfterMs: 'soon' } },
    { failure: { kind: 'in_progress', retryable: false } },
  ];
  for (const error of failures) {
    const actual = capturedThrow(() => throwCommandContractError(error, constructors));
    assert(actual === error, 'unrecognized failure must preserve original identity');
  }
});
