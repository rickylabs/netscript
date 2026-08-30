import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractBuilder,
  ContractProcedureBuilderWithInputOutput,
  ContractProcedureBuilderWithOutput,
  MergedErrorMap,
  Schema,
} from '@orpc/contract';
import type { NetScriptProcedureMeta } from '../domain/procedure-meta.ts';
import {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  rateLimitErrorSchema,
  serviceUnavailableErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '../domain/schemas.ts';

type CommonErrorMap = Readonly<{
  NOT_FOUND: Readonly<{
    status: 404;
    message: 'Resource not found';
    data: typeof notFoundErrorSchema;
  }>;
  VALIDATION_ERROR: Readonly<{
    status: 422;
    message: 'Validation failed';
    data: typeof validationErrorSchema;
  }>;
  UNAUTHORIZED: Readonly<{
    status: 401;
    message: 'Authentication required';
    data: typeof unauthorizedErrorSchema;
  }>;
  FORBIDDEN: Readonly<{
    status: 403;
    message: 'Access denied';
    data: typeof forbiddenErrorSchema;
  }>;
  RATE_LIMITED: Readonly<{
    status: 429;
    message: 'Too many requests';
    data: typeof rateLimitErrorSchema;
  }>;
  SERVICE_UNAVAILABLE: Readonly<{
    status: 503;
    message: 'Service temporarily unavailable';
    data: typeof serviceUnavailableErrorSchema;
  }>;
}>;

/**
 * NetScript's standard error definitions for contracts built from {@link baseContract}.
 *
 * The map is owned by NetScript and remains concretely typed so inferred oRPC builders preserve
 * the exact error codes, status literals, messages, and data schemas.
 */
export const commonErrorMap: CommonErrorMap = {
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: notFoundErrorSchema,
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: validationErrorSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: unauthorizedErrorSchema,
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied',
    data: forbiddenErrorSchema,
  },
  RATE_LIMITED: {
    status: 429,
    message: 'Too many requests',
    data: rateLimitErrorSchema,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: 'Service temporarily unavailable',
    data: serviceUnavailableErrorSchema,
  },
};

/**
 * Metadata carried by {@link baseContract} and every route derived from it.
 *
 * The empty-record intersection is the exact public type produced by oRPC's metadata initializer.
 * NetScript owns {@link NetScriptProcedureMeta}; the upstream representation is not re-exported.
 */
export type BaseContractMeta = NetScriptProcedureMeta & Record<never, never>;

/**
 * NetScript-owned error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the base vocabulary merged
 * onto an empty map. This public alias names the adapter boundary without re-exporting the upstream
 * oRPC builder types it composes. It mirrors the `BaseErrors` alias used by the first-party
 * `@netscript/plugin-*-core` contract definitions.
 */
export type BaseContractErrors = MergedErrorMap<Record<never, never>, typeof commonErrorMap>;

/**
 * Common oRPC contract primitive with NetScript's standard error map applied.
 *
 * Built with the real oRPC **contract** builder (`oc`), initialized with the
 * NetScript-owned {@link BaseContractMeta}, and wired to the shared
 * {@link commonErrorMap}. Because {@link commonErrorMap} uses real Zod schemas,
 * `oc.errors(...)` type-checks with no cast — the builder's `~orpc` marker is genuinely typed rather
 * than erased to `any`. Every route composed from this value
 * (`baseContract.route(...).input(...).output(...)`) therefore carries its precise metadata,
 * input/output schemas, and error map through to `implement<typeof contract>()`, so handler bodies
 * are type-checked against the contract.
 *
 * Annotate composed routes with {@link BaseContractRoute} (input + output) or
 * {@link BaseContractOutputRoute} (output only) to keep JSR
 * `--isolatedDeclarations` able to emit the route type without inferring the
 * builder chain.
 *
 * @example
 * ```typescript
 * import { baseContract } from '@netscript/contracts';
 * import { z } from 'zod';
 *
 * export const listItems = baseContract
 *   .route({ method: 'GET', path: '/items' })
 *   .meta({ access: { authentication: 'required' } })
 *   .input(z.object({ limit: z.number() }))
 *   .output(z.object({ items: z.array(z.unknown()) }));
 * ```
 */
export const baseContract: ContractBuilder<
  Schema<unknown, unknown>,
  Schema<unknown, unknown>,
  BaseContractErrors,
  BaseContractMeta
> = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap);

/**
 * Concrete type of {@link baseContract} — the real oRPC contract builder with
 * NetScript's standard error map applied. Exposed so downstream packages can
 * reference the base contract's type without re-deriving `ReturnType<typeof
 * oc.errors>`.
 */
export type BaseContract = typeof baseContract;

/**
 * Sound type of a route built via
 * `baseContract.route(...).input(TIn).output(TOut)`.
 *
 * Parameterized on the input and output schemas so `typeof <inputConst>` and
 * `typeof <outputConst>` (each an explicitly-annotated Zod schema) flow through
 * to `implement`, keeping every handler's input and output precisely typed.
 * This is the sound annotation for input + output routes; it superseded the
 * former erasing procedure alias whose `~orpc` marker was `any`.
 *
 * @example
 * ```typescript
 * import { baseContract, type BaseContractRoute } from '@netscript/contracts';
 * import { z } from 'zod';
 *
 * const InputSchema = z.object({ id: z.string() });
 * const OutputSchema = z.object({ ok: z.boolean() });
 *
 * const getItem: BaseContractRoute<typeof InputSchema, typeof OutputSchema> =
 *   baseContract
 *     .route({ method: 'GET', path: '/items/{id}' })
 *     .input(InputSchema)
 *     .output(OutputSchema);
 * ```
 */
export type BaseContractRoute<TIn extends AnySchema, TOut extends AnySchema> =
  ContractProcedureBuilderWithInputOutput<
    TIn,
    TOut,
    BaseContractErrors,
    BaseContractMeta
  >;

/**
 * Sound type of an output-only route built via
 * `baseContract.route(...).output(TOut)` (no `.input(...)`).
 *
 * The input schema defaults to the open `Schema<unknown, unknown>` the builder
 * carries before `.input(...)` is applied. This is the sound annotation for
 * routes that declare only an output schema (for example plugin `status` and
 * `health` routes); it superseded the former erasing procedure alias.
 *
 * @example
 * ```typescript
 * import { baseContract, type BaseContractOutputRoute } from '@netscript/contracts';
 * import { z } from 'zod';
 *
 * const StatusSchema = z.object({ status: z.literal('ready') });
 *
 * const status: BaseContractOutputRoute<typeof StatusSchema> = baseContract
 *   .route({ method: 'GET', path: '/status' })
 *   .output(StatusSchema);
 * ```
 */
export type BaseContractOutputRoute<TOut extends AnySchema> = ContractProcedureBuilderWithOutput<
  Schema<unknown, unknown>,
  TOut,
  BaseContractErrors,
  BaseContractMeta
>;
