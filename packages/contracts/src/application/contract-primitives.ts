import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ContractProcedureBuilderWithOutput,
  ErrorMap,
  MergedErrorMap,
  Schema,
} from '@orpc/contract';
import {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  rateLimitErrorSchema,
  serviceUnavailableErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '../domain/schemas.ts';

type OrpcErrorMap = Parameters<typeof oc.errors>[0];

const commonErrorMap = {
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
} as const satisfies OrpcErrorMap;

/**
 * Common oRPC contract primitive with NetScript's standard error map applied.
 *
 * Built with the real oRPC **contract** builder (`oc`) and wired to the shared
 * {@link commonErrorMap}. Because {@link commonErrorMap} uses real Zod schemas,
 * `oc.errors(...)` type-checks with no cast — the builder's `~orpc` marker is
 * genuinely typed rather than erased to `any`. Every route composed from this
 * value (`baseContract.route(...).input(...).output(...)`) therefore carries its
 * precise input/output schema types through to `implement<typeof contract>()`,
 * so handler bodies are type-checked against the contract.
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
 *   .input(z.object({ limit: z.number() }))
 *   .output(z.object({ items: z.array(z.unknown()) }));
 * ```
 */
export const baseContract: ReturnType<typeof oc.errors> = oc.errors(commonErrorMap);

/**
 * Concrete type of {@link baseContract} — the real oRPC contract builder with
 * NetScript's standard error map applied. Exposed so downstream packages can
 * reference the base contract's type without re-deriving `ReturnType<typeof
 * oc.errors>`.
 */
export type BaseContract = typeof baseContract;

/**
 * Error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the base
 * vocabulary merged onto an empty map. Mirrors the `BaseErrors` alias used by
 * the first-party `@netscript/plugin-*-core` contract definitions.
 */
type BaseContractErrors = MergedErrorMap<Record<never, never>, ErrorMap>;

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
    Record<never, never>
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
  Record<never, never>
>;
