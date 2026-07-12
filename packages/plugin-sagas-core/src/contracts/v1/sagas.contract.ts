import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ErrorMap,
  MergedErrorMap,
} from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  BASE_PLUGIN_ERRORS,
  type BasePluginContract,
  type BasePluginDescribeRoute,
} from '@netscript/plugin/contract-base';
import { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../../domain/mod.ts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for saga contracts. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ContractSchemaResult<TOutput>;
}

/** Structural Standard Schema reference used by contract metadata. */
export type StandardSchemaLike<TInput = unknown, TOutput = TInput> = Readonly<{
  '~standard': Readonly<{
    types?: Readonly<{
      input: TInput;
      output: TOutput;
    }>;
  }>;
}>;

const nonNegativeInt = (description: string): z.ZodNumber =>
  z.number().int().nonnegative().describe(description);

const paginationLimit = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().min(1).max(1000).default(50).describe(description);

const paginationOffset = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().nonnegative().default(0).describe(description);

const OffsetPaginationQueryShape: {
  limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
} = {
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
};

const OffsetPaginationQueryZodSchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z
  .object(OffsetPaginationQueryShape);

/** Offset pagination query schema shared by list endpoints. */
export const OffsetPaginationQuerySchema: ContractSchema = OffsetPaginationQueryZodSchema;

// Converge onto the shared plugin error vocabulary: NOT_FOUND, VALIDATION_ERROR,
// and INTERNAL are reported with identical status codes, messages, and payload
// shapes across every NetScript feature plugin. `BASE_PLUGIN_ERRORS` types each
// `data` field as `unknown` (it is a plain error vocabulary, not a builder
// fragment), so it crosses into the oRPC contract builder via the single
// sanctioned centralized-contract boundary cast — the same pattern
// `BASE_PLUGIN_CONTRACT_ROUTES` uses. Everything downstream of `baseContract`
// (routes, input/output schemas, the contract type, `implement`) is genuinely
// typed.
function isContractSchema(value: unknown): value is AnySchema {
  return typeof value === 'object' && value !== null && '~standard' in value;
}

function requireContractSchema(value: unknown, code: string): AnySchema {
  if (!isContractSchema(value)) {
    throw new TypeError(`Base plugin error ${code} does not provide a Standard Schema`);
  }
  return value;
}

const basePluginErrors = {
  NOT_FOUND: {
    ...BASE_PLUGIN_ERRORS.NOT_FOUND,
    data: requireContractSchema(BASE_PLUGIN_ERRORS.NOT_FOUND.data, 'NOT_FOUND'),
  },
  VALIDATION_ERROR: {
    ...BASE_PLUGIN_ERRORS.VALIDATION_ERROR,
    data: requireContractSchema(BASE_PLUGIN_ERRORS.VALIDATION_ERROR.data, 'VALIDATION_ERROR'),
  },
  INTERNAL: {
    ...BASE_PLUGIN_ERRORS.INTERNAL,
    data: requireContractSchema(BASE_PLUGIN_ERRORS.INTERNAL.data, 'INTERNAL'),
  },
} satisfies ErrorMap;

const baseContract: ReturnType<typeof oc.errors> = oc.errors(basePluginErrors);

/**
 * Error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the base
 * vocabulary merged onto an empty map.
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
  Record<never, never>
>;

// --- Public response types ---------------------------------------------------

/** Public response returned for a configured saga definition. */
export type SagaDefinitionResponse = Readonly<{
  id: string;
  name: string;
  description?: string;
  topic: string;
  enabled: boolean;
  entrypoint: string;
  tags?: readonly string[];
  durabilityTier: (typeof SAGA_DURABILITY_TIERS)[number];
  timeout?: Readonly<{
    completionTimeout?: number;
  }>;
  retry?: Readonly<{
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  }>;
}>;

/** Public response returned for a persisted saga instance. */
export type SagaInstanceResponse = Readonly<{
  sagaName: string;
  sagaId?: string;
  instanceId?: string;
  correlationId: string;
  correlationKey?: string;
  state: Readonly<Record<string, unknown>>;
  status: (typeof SAGA_INSTANCE_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number;
  messageCount: number;
  lastMessageType?: string;
}>;

/** Input accepted by the publish endpoint. */
export type PublishMessageInput = Readonly<{
  type: string;
  payload?: Readonly<Record<string, unknown>>;
  correlationId?: string;
  correlationKey?: string;
  idempotencyKey?: string;
  concurrencyKey?: string;
  topic?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Response returned after a saga message publish attempt. */
export type PublishMessageResponse = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
  correlationKey?: string;
  messageId?: string;
}>;

/** Server-sent event kinds emitted by the saga service. */
export type SagaSSEEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';

/** Server-sent event payload emitted by saga subscriptions. */
export type SagaSSEEvent = Readonly<{
  type: SagaSSEEventType;
  timestamp: string;
  sagaName?: string;
  sagaId?: string;
  instanceId?: string;
  correlationId?: string;
  correlationKey?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Query filters accepted by the list-sagas endpoint. */
export type SagaFilters = Readonly<{
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

/** Query filters accepted by the list-instances endpoint. */
export type InstanceFilters = Readonly<{
  sagaName?: string;
  sagaId?: string;
  status?: (typeof SAGA_INSTANCE_STATUSES)[number] | null;
  topic?: string;
}>;

/** Public history entry returned for saga state transitions. */
export type SagaHistoryEntry = Readonly<{
  id: string;
  sagaName: string;
  sagaId: string;
  instanceId?: string;
  correlationId: string;
  correlationKey?: string;
  messageType: string;
  messageId?: string;
  previousState?: Readonly<Record<string, unknown>>;
  newState: Readonly<Record<string, unknown>>;
  outcome: 'success' | 'error' | 'compensated';
  error?: string;
  duration?: number;
  transitionAt: string;
}>;

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 */
export interface SagasCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-sagas`. */
  readonly pluginName: string;
  /** Contract version identifiers served by the plugin. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin. */
  readonly routeGroups: readonly string[];
  /** Capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}

// --- Route output / shared schemas -------------------------------------------
// Every inline `z.object(...)` is named and explicitly annotated with concrete
// Zod constructor types so its `typeof` can feed the `Route<...>` alias under
// `--isolatedDeclarations` and never upcasts to `z.ZodType<T>` (which erases
// `_output` and reopens the soundness hole).

const SagaDefinitionResponseZodSchema: z.ZodObject<{
  id: z.ZodString;
  name: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
  topic: z.ZodString;
  enabled: z.ZodBoolean;
  entrypoint: z.ZodString;
  tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
  durabilityTier: z.ZodDefault<z.ZodEnum<{ t1: 't1'; t2: 't2'; t3: 't3' }>>;
  timeout: z.ZodOptional<
    z.ZodObject<{ completionTimeout: z.ZodOptional<z.ZodNumber> }>
  >;
  retry: z.ZodOptional<
    z.ZodObject<{
      maxAttempts: z.ZodOptional<z.ZodNumber>;
      initialDelay: z.ZodOptional<z.ZodNumber>;
      maxDelay: z.ZodOptional<z.ZodNumber>;
    }>
  >;
}> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  topic: z.string(),
  enabled: z.boolean(),
  entrypoint: z.string(),
  tags: z.array(z.string()).optional(),
  durabilityTier: z.enum(SAGA_DURABILITY_TIERS).default('t1'),
  timeout: z.object({
    completionTimeout: z.number().int().positive().optional(),
  }).optional(),
  retry: z.object({
    maxAttempts: z.number().int().nonnegative().optional(),
    initialDelay: z.number().int().nonnegative().optional(),
    maxDelay: z.number().int().nonnegative().optional(),
  }).optional(),
});

/** Schema for saga definition responses. */
export const SagaDefinitionResponseSchema: ContractSchema<SagaDefinitionResponse> =
  SagaDefinitionResponseZodSchema;

const SagaInstanceResponseZodSchema: z.ZodObject<{
  sagaName: z.ZodString;
  sagaId: z.ZodOptional<z.ZodString>;
  instanceId: z.ZodOptional<z.ZodString>;
  correlationId: z.ZodString;
  correlationKey: z.ZodOptional<z.ZodString>;
  state: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  status: z.ZodEnum<{
    pending: 'pending';
    running: 'running';
    completed: 'completed';
    failed: 'failed';
    compensating: 'compensating';
    cancelled: 'cancelled';
  }>;
  createdAt: z.ZodString;
  updatedAt: z.ZodString;
  completedAt: z.ZodOptional<z.ZodString>;
  version: z.ZodNumber;
  messageCount: z.ZodNumber;
  lastMessageType: z.ZodOptional<z.ZodString>;
}> = z.object({
  sagaName: z.string(),
  sagaId: z.string().optional(),
  instanceId: z.string().optional(),
  correlationId: z.string(),
  correlationKey: z.string().optional(),
  state: z.record(z.string(), z.unknown()),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  version: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  lastMessageType: z.string().optional(),
});

/** Schema for saga instance responses. */
export const SagaInstanceResponseSchema: ContractSchema<SagaInstanceResponse> =
  SagaInstanceResponseZodSchema;

const PublishMessageInputZodSchema: z.ZodObject<{
  type: z.ZodString;
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  correlationId: z.ZodOptional<z.ZodString>;
  correlationKey: z.ZodOptional<z.ZodString>;
  idempotencyKey: z.ZodOptional<z.ZodString>;
  concurrencyKey: z.ZodOptional<z.ZodString>;
  topic: z.ZodOptional<z.ZodString>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
}> = z.object({
  type: z.string().min(1).describe('Message type identifier'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Message payload'),
  correlationId: z.string().optional().describe('Compatibility correlation identifier'),
  correlationKey: z.string().optional().describe('Saga correlation key'),
  idempotencyKey: z.string().optional().describe('Idempotency key for T1 deduplication'),
  concurrencyKey: z.string().optional().describe('Concurrency key for runtime throttling'),
  topic: z.string().optional().describe('Topic override'),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

/** Schema for publish endpoint input. */
export const PublishMessageInputSchema: ContractSchema<PublishMessageInput> =
  PublishMessageInputZodSchema;

const PublishMessageResponseZodSchema: z.ZodObject<{
  published: z.ZodBoolean;
  messageType: z.ZodString;
  correlationId: z.ZodOptional<z.ZodString>;
  correlationKey: z.ZodOptional<z.ZodString>;
  messageId: z.ZodOptional<z.ZodString>;
}> = z.object({
  published: z.boolean(),
  messageType: z.string(),
  correlationId: z.string().optional(),
  correlationKey: z.string().optional(),
  messageId: z.string().optional(),
});

/** Schema for publish endpoint responses. */
export const PublishMessageResponseSchema: ContractSchema<PublishMessageResponse> =
  PublishMessageResponseZodSchema;

const SagaSSEEventTypeZodSchema: z.ZodEnum<{
  'saga:started': 'saga:started';
  'saga:message_received': 'saga:message_received';
  'saga:state_changed': 'saga:state_changed';
  'saga:completed': 'saga:completed';
  'saga:failed': 'saga:failed';
  'saga:compensating': 'saga:compensating';
  heartbeat: 'heartbeat';
}> = z.enum([
  'saga:started',
  'saga:message_received',
  'saga:state_changed',
  'saga:completed',
  'saga:failed',
  'saga:compensating',
  'heartbeat',
]);

/** Schema for saga SSE event type values. */
export const SagaSSEEventTypeSchema: ContractSchema<SagaSSEEventType> = SagaSSEEventTypeZodSchema;

const SagaSSEEventZodSchema: z.ZodObject<{
  type: typeof SagaSSEEventTypeZodSchema;
  timestamp: z.ZodString;
  sagaName: z.ZodOptional<z.ZodString>;
  sagaId: z.ZodOptional<z.ZodString>;
  instanceId: z.ZodOptional<z.ZodString>;
  correlationId: z.ZodOptional<z.ZodString>;
  correlationKey: z.ZodOptional<z.ZodString>;
  data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({
  type: SagaSSEEventTypeZodSchema,
  timestamp: z.string().datetime(),
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  instanceId: z.string().optional(),
  correlationId: z.string().optional(),
  correlationKey: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for saga subscription event payloads. */
export const SagaSSEEventSchema: ContractSchema<SagaSSEEvent> = SagaSSEEventZodSchema;

const SagaFiltersShape: {
  topic: z.ZodOptional<z.ZodString>;
  enabled: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  tags: z.ZodOptional<z.ZodString>;
} = {
  topic: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

const SagaFiltersZodSchema: z.ZodObject<typeof SagaFiltersShape> = z.object(SagaFiltersShape);

/** Schema for list-sagas query filters. */
export const SagaFiltersSchema: ContractSchema<SagaFilters> = SagaFiltersZodSchema;

const InstanceFiltersShape: {
  sagaName: z.ZodOptional<z.ZodString>;
  sagaId: z.ZodOptional<z.ZodString>;
  status: z.ZodOptional<
    z.ZodNullable<
      z.ZodEnum<{
        pending: 'pending';
        running: 'running';
        completed: 'completed';
        failed: 'failed';
        compensating: 'compensating';
        cancelled: 'cancelled';
      }>
    >
  >;
  topic: z.ZodOptional<z.ZodString>;
} = {
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  status: z.enum(SAGA_INSTANCE_STATUSES).nullable().optional(),
  topic: z.string().optional(),
};

const InstanceFiltersZodSchema: z.ZodObject<typeof InstanceFiltersShape> = z.object(
  InstanceFiltersShape,
);

/** Schema for list-instances query filters. */
export const InstanceFiltersSchema: ContractSchema<InstanceFilters> = InstanceFiltersZodSchema;

const SagaHistoryEntryZodSchema: z.ZodObject<{
  id: z.ZodString;
  sagaName: z.ZodString;
  sagaId: z.ZodString;
  instanceId: z.ZodOptional<z.ZodString>;
  correlationId: z.ZodString;
  correlationKey: z.ZodOptional<z.ZodString>;
  messageType: z.ZodString;
  messageId: z.ZodOptional<z.ZodString>;
  previousState: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  newState: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  outcome: z.ZodEnum<{ success: 'success'; error: 'error'; compensated: 'compensated' }>;
  error: z.ZodOptional<z.ZodString>;
  duration: z.ZodOptional<z.ZodNumber>;
  transitionAt: z.ZodString;
}> = z.object({
  id: z.string(),
  sagaName: z.string(),
  sagaId: z.string(),
  instanceId: z.string().optional(),
  correlationId: z.string(),
  correlationKey: z.string().optional(),
  messageType: z.string(),
  messageId: z.string().optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()),
  outcome: z.enum(['success', 'error', 'compensated']),
  error: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  transitionAt: z.string().datetime(),
});

/** Schema for saga transition history entries. */
export const SagaHistoryEntrySchema: ContractSchema<SagaHistoryEntry> = SagaHistoryEntryZodSchema;

// --- Per-route input/output schemas ------------------------------------------

const listSagasInput: z.ZodObject<
  typeof OffsetPaginationQueryShape & typeof SagaFiltersShape
> = OffsetPaginationQueryZodSchema.extend(SagaFiltersShape);

const listSagasOutput: z.ZodObject<{
  sagas: z.ZodArray<typeof SagaDefinitionResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  sagas: z.array(SagaDefinitionResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const getSagaInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const listInstancesInput: z.ZodObject<
  typeof OffsetPaginationQueryShape & typeof InstanceFiltersShape
> = OffsetPaginationQueryZodSchema.extend(InstanceFiltersShape);

const listInstancesOutput: z.ZodObject<{
  instances: z.ZodArray<typeof SagaInstanceResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  instances: z.array(SagaInstanceResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const getInstanceInput: z.ZodObject<{ sagaName: z.ZodString; correlationId: z.ZodString }> = z
  .object({ sagaName: z.string(), correlationId: z.string() });

const getInstanceHistoryInput: z.ZodObject<{
  sagaName: z.ZodString;
  correlationId: z.ZodString;
  limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
  offset: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
}> = z.object({
  sagaName: z.string(),
  correlationId: z.string(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

const getInstanceHistoryOutput: z.ZodObject<{
  history: z.ZodArray<typeof SagaHistoryEntryZodSchema>;
  total: z.ZodNumber;
}> = z.object({
  history: z.array(SagaHistoryEntryZodSchema),
  total: nonNegativeInt('Total count'),
});

const subscribeInput: z.ZodOptional<
  z.ZodObject<{
    sagaName: z.ZodOptional<z.ZodString>;
    sagaId: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    streaming: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  }>
> = z.object({
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  topic: z.string().optional(),
  streaming: z.coerce.boolean().optional(),
}).optional();

// --- subscribe route (built via `oc.route`, not `baseContract`) --------------

/** Output type produced by `eventIterator(SagaSSEEventZodSchema)`. */
type SubscribeOutput = ReturnType<
  typeof eventIterator<
    z.input<typeof SagaSSEEventZodSchema>,
    z.output<typeof SagaSSEEventZodSchema>
  >
>;

/** Precise type of the `subscribe` streaming route. */
type SubscribeRoute = ContractProcedureBuilderWithInputOutput<
  typeof subscribeInput,
  SubscribeOutput,
  Record<never, never>,
  Record<never, never>
>;

/**
 * Explicit, precise type of the sagas v1 contract definition.
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
interface SagasContractDefinitionShape extends BasePluginContract {
  readonly describe: BasePluginDescribeRoute;
  readonly listSagas: Route<typeof listSagasInput, typeof listSagasOutput>;
  readonly getSaga: Route<typeof getSagaInput, typeof SagaDefinitionResponseZodSchema>;
  readonly listInstances: Route<typeof listInstancesInput, typeof listInstancesOutput>;
  readonly getInstance: Route<typeof getInstanceInput, typeof SagaInstanceResponseZodSchema>;
  readonly getInstanceHistory: Route<
    typeof getInstanceHistoryInput,
    typeof getInstanceHistoryOutput
  >;
  readonly publish: Route<
    typeof PublishMessageInputZodSchema,
    typeof PublishMessageResponseZodSchema
  >;
  readonly subscribe: SubscribeRoute;
}

/**
 * The sagas v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route and layers the 7
 * plugin-specific routes. The explicit {@link SagasContractDefinitionShape}
 * annotation makes the precise contract type available to
 * `--isolatedDeclarations` without erasing it; because the base seam `describe`
 * is a real oRPC `ContractProcedure` (no phantom marker) and every route is
 * precisely typed, this object is handed to `implement()` WITHOUT any erasure
 * cast and every `router.<route>.handler(...)` is checked against the
 * contract's IO.
 */
const sagasContractDefinition: SagasContractDefinitionShape = {
  // Mandatory base seam route: every feature plugin contract carries the typed
  // `describe` route (GET /describe) returning a `PluginCapabilities` document.
  ...BASE_PLUGIN_CONTRACT_ROUTES,

  listSagas: baseContract
    .route({ method: 'GET', path: '/sagas' })
    .input(listSagasInput)
    .output(listSagasOutput),

  getSaga: baseContract
    .route({ method: 'GET', path: '/sagas/{id}' })
    .input(getSagaInput)
    .output(SagaDefinitionResponseZodSchema),

  listInstances: baseContract
    .route({ method: 'GET', path: '/instances' })
    .input(listInstancesInput)
    .output(listInstancesOutput),

  getInstance: baseContract
    .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}' })
    .input(getInstanceInput)
    .output(SagaInstanceResponseZodSchema),

  getInstanceHistory: baseContract
    .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}/history' })
    .input(getInstanceHistoryInput)
    .output(getInstanceHistoryOutput),

  publish: baseContract
    .route({ method: 'POST', path: '/publish' })
    .input(PublishMessageInputZodSchema)
    .output(PublishMessageResponseZodSchema),

  subscribe: oc
    .route({ method: 'GET', path: '/subscribe' })
    .input(subscribeInput)
    .output(eventIterator(SagaSSEEventZodSchema)),
};

/**
 * The fully-typed sagas v1 contract definition type.
 *
 * Re-exported so {@link SagasContract} and {@link SagasContractV1} derive from
 * it instead of hand-authoring a parallel structural shape.
 */
export type SagasContractDefinition = SagasContractDefinitionShape;

/**
 * Saga service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const sagasContract: SagasContractDefinition = sagasContractDefinition;

/**
 * The implemented (context-bindable) sagas v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const sagasContractV1: ReturnType<typeof implement<SagasContractDefinition>> = implement(
  sagasContractDefinition,
);

/**
 * Public contract shape for saga service clients.
 *
 * Derived directly from {@link SagasContractDefinition} — the real,
 * fully-inferred oRPC contract router. Carries the precise per-route
 * input/output/error types, so client generation and `implement(...)` stay
 * sound and can never drift from the Zod schemas.
 */
export type SagasContract = SagasContractDefinition;

/**
 * Context-binding implementer for the v1 saga contract.
 *
 * Derived from the {@link sagasContractV1} value (`implement(definition)`), so
 * `SagasContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO.
 */
export type SagasContractV1 = typeof sagasContractV1;

/**
 * The context-bound saga router implementer.
 *
 * Derived from {@link SagasContractV1} by binding an opaque request context, so
 * each `SagasRouter[route]` is the real oRPC procedure implementer. Connectors
 * bind their own concrete context via `sagasContractV1.$context<TheirContext>()`.
 */
export type SagasRouter = ReturnType<
  typeof sagasContractV1.$context<Record<never, never>>
>;
