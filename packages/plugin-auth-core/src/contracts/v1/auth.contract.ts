import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ContractProcedureBuilderWithOutput,
  ErrorMap,
  MergedErrorMap,
  Schema,
} from '@orpc/contract';
import { implement } from '@orpc/server';
import type { NetScriptProcedureMeta } from '@netscript/contracts';
import { z } from 'zod';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  BASE_PLUGIN_ERRORS,
  type BasePluginContract,
  type BasePluginDescribeRoute,
} from '@netscript/plugin/contract-base';
import { toContractErrorDefinition } from './base-error-adapter.ts';
import { AUTH_SESSIONS_REVOKE_SCOPE } from './auth.contract-types.ts';
import {
  CallbackInputZodSchema,
  CallbackResponseZodSchema,
  MeResponseZodSchema,
  meRouteInput,
  RevokeSessionInputZodSchema,
  RevokeSessionResponseZodSchema,
  SessionResponseZodSchema,
  sessionRouteInput,
  SigninInputZodSchema,
  SigninResponseZodSchema,
  SignoutInputZodSchema,
  SignoutResponseZodSchema,
} from './auth.contract-schemas.ts';
export { AUTH_SESSION_STATES } from '../../domain/mod.ts';
export type { AuthSchema, AuthSchemaResult } from '../../domain/mod.ts';
export * from './auth.contract-types.ts';
export {
  AuthSessionResponseSchema,
  AuthUserResponseSchema,
  CallbackInputSchema,
  CallbackResponseSchema,
  MeResponseSchema,
  RevokeSessionInputSchema,
  RevokeSessionResponseSchema,
  SessionInputSchema,
  SessionResponseSchema,
  SigninInputSchema,
  SigninResponseSchema,
  SignoutInputSchema,
  SignoutResponseSchema,
} from './auth.contract-schemas.ts';

// Auth extends the shared errors with provider failures and authorization; its
// final VALIDATION_ERROR retains the 422 spelling. Shared `unknown` data crosses
// the boundary only through the Standard Schema adapter below.

const CONTRACT_BASE_ERRORS = {
  NOT_FOUND: toContractErrorDefinition(BASE_PLUGIN_ERRORS.NOT_FOUND),
  VALIDATION_ERROR: toContractErrorDefinition(BASE_PLUGIN_ERRORS.VALIDATION_ERROR),
  INTERNAL: toContractErrorDefinition(BASE_PLUGIN_ERRORS.INTERNAL),
} satisfies ErrorMap;

const validationErrorDataSchema: z.ZodObject<{
  formErrors: z.ZodArray<z.ZodString>;
  fieldErrors: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodArray<z.ZodString>>>;
}> = z.object({
  formErrors: z.array(z.string()),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
});

/** Auth-specific oRPC error entries merged onto the base plugin vocabulary. */
const AUTH_SPECIFIC_ERRORS: Readonly<{
  UNAUTHORIZED: { status: number; message: string; data: z.ZodType<{ reason: string }> };
  FORBIDDEN: { status: number; message: string; data: z.ZodType<{ reason: string }> };
  AUTH_TRANSPORT_ERROR: {
    status: number;
    message: string;
    data: z.ZodType<{ providerId?: string; reason: string }>;
  };
  AUTH_CONFIGURATION_ERROR: {
    status: number;
    message: string;
    data: z.ZodType<{ providerId?: string; reason: string }>;
  };
  AUTH_PROVIDER_ERROR: {
    status: number;
    message: string;
    data: z.ZodType<{ providerId?: string; reason: string }>;
  };
  VALIDATION_ERROR: { status: number; message: string; data: typeof validationErrorDataSchema };
}> = {
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: z.object({ reason: z.string() }),
  },
  FORBIDDEN: {
    status: 403,
    message: 'Forbidden',
    data: z.object({ reason: z.string() }),
  },
  AUTH_TRANSPORT_ERROR: {
    status: 400,
    message: 'Auth request requires secure transport',
    data: z.object({ providerId: z.string().optional(), reason: z.string() }),
  },
  AUTH_CONFIGURATION_ERROR: {
    status: 400,
    message: 'Auth configuration refused',
    data: z.object({ providerId: z.string().optional(), reason: z.string() }),
  },
  AUTH_PROVIDER_ERROR: {
    status: 502,
    message: 'Auth provider failed',
    data: z.object({
      providerId: z.string().optional(),
      reason: z.string(),
    }),
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: validationErrorDataSchema,
  },
};

const baseContract = oc.$meta<NetScriptProcedureMeta>({}).errors(
  { ...CONTRACT_BASE_ERRORS, ...AUTH_SPECIFIC_ERRORS } satisfies ErrorMap,
);

/**
 * Error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the merged
 * vocabulary onto an empty map.
 */
type BaseErrors = MergedErrorMap<Record<never, never>, ErrorMap>;

/**
 * Precise type of a route built via `baseContract.route(...).input(...).output(...)`.
 *
 * Parameterized on the input and output schemas so `typeof <inputConst>` and
 * `typeof <outputConst>` (each an explicitly-annotated Zod schema) flow through
 * to {@link implement}, keeping every handler's input/output precisely typed.
 */
type Route<TIn extends AnySchema, TOut extends AnySchema> = ContractProcedureBuilderWithInputOutput<
  TIn,
  TOut,
  BaseErrors,
  NetScriptProcedureMeta
>;

const AUTHENTICATION_NONE_META = {
  access: { authentication: 'none' },
} as const satisfies NetScriptProcedureMeta;

const AUTHENTICATION_REQUIRED_META = {
  access: { authentication: 'required' },
} as const satisfies NetScriptProcedureMeta;

const SESSIONS_REVOKE_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: [AUTH_SESSIONS_REVOKE_SCOPE] },
  },
} as const satisfies NetScriptProcedureMeta;

type AuthDescribeRoute = ContractProcedureBuilderWithOutput<
  Schema<unknown, unknown>,
  NonNullable<BasePluginDescribeRoute['~orpc']['outputSchema']>,
  BasePluginDescribeRoute['~orpc']['errorMap'],
  NetScriptProcedureMeta
>;

const authDescribeRoute: AuthDescribeRoute = BASE_PLUGIN_CONTRACT_ROUTES.describe.meta(
  AUTHENTICATION_NONE_META,
);

/**
 * Explicit, precise type of the auth v1 contract definition.
 *
 * Every member is a real oRPC contract procedure typed against its input and
 * output Zod schemas. The interface `extends BasePluginContract`, so the
 * mandatory `describe` route is enforced by the seam and any additional route
 * must be a real contract router (the `[route: string]: AnyContractRouter`
 * constraint inherited from {@link BasePluginContract}). Spelling the type
 * explicitly is required by `--isolatedDeclarations` (the JSR slow-types bar);
 * because each member derives from a named, annotated schema via `typeof`, the
 * contract type can never silently drift from the schemas.
 */
interface AuthContractDefinitionShape extends Omit<BasePluginContract, 'describe'> {
  readonly describe: typeof authDescribeRoute;
  readonly signin: Route<typeof SigninInputZodSchema, typeof SigninResponseZodSchema>;
  readonly callback: Route<typeof CallbackInputZodSchema, typeof CallbackResponseZodSchema>;
  readonly signout: Route<typeof SignoutInputZodSchema, typeof SignoutResponseZodSchema>;
  readonly revokeSession: Route<
    typeof RevokeSessionInputZodSchema,
    typeof RevokeSessionResponseZodSchema
  >;
  readonly session: Route<typeof sessionRouteInput, typeof SessionResponseZodSchema>;
  readonly me: Route<typeof meRouteInput, typeof MeResponseZodSchema>;
}

/**
 * The auth v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route and layers the 6
 * plugin-specific routes. The explicit {@link AuthContractDefinitionShape}
 * annotation makes the precise contract type available to
 * `--isolatedDeclarations` without erasing it; because the base seam `describe`
 * is a real oRPC `ContractProcedure` (no phantom marker) and every route is
 * precisely typed, this object is handed to `implement()` WITHOUT any erasure
 * cast and every `router.<route>.handler(...)` is checked against the
 * contract's IO.
 */
const authContractDefinition: AuthContractDefinitionShape = {
  // Mandatory base seam route: every feature plugin contract carries the typed
  // `describe` route (GET /describe) returning a `PluginCapabilities` document.
  describe: authDescribeRoute,

  signin: baseContract
    .route({ method: 'POST', path: '/signin' })
    .meta(AUTHENTICATION_NONE_META)
    .input(SigninInputZodSchema)
    .output(SigninResponseZodSchema),

  callback: baseContract
    .route({ method: 'POST', path: '/callback' })
    .meta(AUTHENTICATION_NONE_META)
    .input(CallbackInputZodSchema)
    .output(CallbackResponseZodSchema),

  signout: baseContract
    .route({ method: 'POST', path: '/signout' })
    .meta(AUTHENTICATION_REQUIRED_META)
    .input(SignoutInputZodSchema)
    .output(SignoutResponseZodSchema),

  revokeSession: baseContract
    .route({ method: 'POST', path: '/sessions/revoke' })
    .meta(SESSIONS_REVOKE_META)
    .input(RevokeSessionInputZodSchema)
    .output(RevokeSessionResponseZodSchema),

  session: baseContract
    .route({ method: 'GET', path: '/session' })
    .meta(AUTHENTICATION_REQUIRED_META)
    .input(sessionRouteInput)
    .output(SessionResponseZodSchema),

  me: baseContract
    .route({ method: 'GET', path: '/me' })
    .meta(AUTHENTICATION_REQUIRED_META)
    .input(meRouteInput)
    .output(MeResponseZodSchema),
};

/**
 * The fully-typed auth v1 contract definition type.
 *
 * Re-exported so {@link AuthContract} and {@link AuthContractV1} derive from it
 * instead of hand-authoring a parallel structural shape.
 */
export type AuthContractDefinition = AuthContractDefinitionShape;

/**
 * Auth service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const authContract: AuthContractDefinition = authContractDefinition;

/**
 * The implemented (context-bindable) auth v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const authContractV1: ReturnType<typeof implement<AuthContractDefinition>> = implement(
  authContractDefinition,
);

/**
 * Public contract shape for auth service clients.
 *
 * Derived directly from {@link AuthContractDefinition} — the real,
 * fully-inferred oRPC contract router. Carries the precise per-route
 * input/output/error types, so client generation and `implement(...)` stay
 * sound and can never drift from the Zod schemas.
 */
export type AuthContract = AuthContractDefinition;

/**
 * Context-binding implementer for the v1 auth contract.
 *
 * Derived from the {@link authContractV1} value (`implement(definition)`), so
 * `AuthContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO.
 */
export type AuthContractV1 = typeof authContractV1;

/**
 * The context-bound auth router implementer.
 *
 * Derived from {@link AuthContractV1} by binding an opaque request context, so
 * each `AuthRouter[route]` is the real oRPC procedure implementer. Connectors
 * bind their own concrete context via `authContractV1.$context<TheirContext>()`.
 */
export type AuthRouter = ReturnType<
  typeof authContractV1.$context<Record<never, never>>
>;
