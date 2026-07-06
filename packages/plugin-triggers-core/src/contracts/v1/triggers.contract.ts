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
import {
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
} from '../../domain/mod.ts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for trigger contracts. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ContractSchemaResult<TOutput>;
}

/** Trigger kinds represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_KINDS: readonly [
  'webhook',
  'file-watch',
  'scheduled',
  'queue',
  'stream',
  'manual',
] = TRIGGER_KINDS;

/** Durability tiers represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_DURABILITY_TIERS: readonly ['t1', 't2', 't3'] =
  TRIGGER_DURABILITY_TIERS;

/** Event statuses represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_EVENT_STATUSES: readonly [
  'pending',
  'in-flight',
  'deferred',
  'completed',
  'failed',
  'dlq',
] = TRIGGER_EVENT_STATUSES;

/** Trigger kind returned by v1 contract responses. */
export type TriggerContractKind = (typeof TRIGGER_CONTRACT_KINDS)[number];

/** Durability tier returned by v1 contract responses. */
export type TriggerContractDurabilityTier = (typeof TRIGGER_CONTRACT_DURABILITY_TIERS)[number];

/** Event status returned by v1 contract responses. */
export type TriggerContractEventStatus = (typeof TRIGGER_CONTRACT_EVENT_STATUSES)[number];

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

/** Offset pagination query accepted by list endpoints. */
export type OffsetPaginationQuery = Readonly<{
  limit: number;
  offset: number;
}>;

const offsetPaginationQuerySchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z.object(
  OffsetPaginationQueryShape,
);

/** Offset pagination query schema accepted by list endpoints. */
export const OffsetPaginationQuerySchema: ContractSchema<OffsetPaginationQuery> =
  offsetPaginationQuerySchema;

// Converge onto the shared plugin error vocabulary: NOT_FOUND, VALIDATION_ERROR,
// and INTERNAL are reported with identical status codes, messages, and payload
// shapes across every NetScript feature plugin. `BASE_PLUGIN_ERRORS` types each
// `data` field as `unknown` (it is a plain error vocabulary, not a builder
// fragment), so it crosses into the oRPC contract builder via the single
// sanctioned centralized-contract boundary cast — the same pattern
// `BASE_PLUGIN_CONTRACT_ROUTES` uses. Everything downstream of `baseContract`
// (routes, input/output schemas, the contract type, `implement`) is genuinely
// typed.
const baseContract: ReturnType<typeof oc.errors> = oc.errors(
  { ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0],
);

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

/** Trigger definition returned by v1 contract endpoints. */
export type TriggerDefinitionResponse = Readonly<{
  id: string;
  kind: TriggerContractKind;
  name?: string;
  description?: string;
  enabled: boolean;
  durabilityTier: TriggerContractDurabilityTier;
  entrypoint?: string;
  tags?: readonly string[];
}>;

/** Trigger event returned by v1 contract endpoints. */
export type TriggerEventResponse = Readonly<{
  id: string;
  triggerId: string;
  kind: TriggerContractKind;
  status: TriggerContractEventStatus;
  attempt: number;
  detectedAt: string;
  updatedAt: string;
  idempotencyKey?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Manual trigger fire request body. */
export type TriggerFireInput = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Manual trigger fire response body. */
export type TriggerFireResponse = Readonly<{
  accepted: boolean;
  eventId: string;
  triggerId: string;
  status: 'pending' | 'deferred';
}>;

/** Schedule preview response body. */
export type TriggerPreviewResponse = Readonly<{
  triggerId: string;
  nextFireAt: readonly string[];
  timezone?: string;
  persistent: boolean;
}>;

/** Server-sent event names emitted by trigger streams. */
export type TriggerSSEEventType =
  | 'trigger:accepted'
  | 'trigger:started'
  | 'trigger:completed'
  | 'trigger:failed'
  | 'trigger:dlq'
  | 'heartbeat';

/** Server-sent event payload emitted by trigger streams. */
export type TriggerSSEEvent = Readonly<{
  type: TriggerSSEEventType;
  timestamp: string;
  triggerId?: string;
  eventId?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Query filters accepted by trigger definition list endpoints. */
export type TriggerFilters = Readonly<{
  kind?: TriggerContractKind | null;
  enabled?: boolean;
  tags?: string;
}>;

/** Query filters accepted by trigger event list endpoints. */
export type EventFilters = Readonly<{
  triggerId?: string;
  kind?: TriggerContractKind | null;
  status?: TriggerContractEventStatus | null;
}>;

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 *
 * Package-owned shape returned by the triggers describe route.
 */
export interface TriggersCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-triggers`. */
  readonly pluginName: string;
  /** Contract version identifiers the plugin serves, for example `["v1"]`. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin, for example `["triggers"]`. */
  readonly routeGroups: readonly string[];
  /** Free-form capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}

// --- Route output / shared schemas -------------------------------------------
// Every inline `z.object(...)` / `z.enum(...)` is named and explicitly annotated
// with concrete Zod constructor types so its `typeof` can feed the `Route<...>`
// alias under `--isolatedDeclarations` and never upcasts to `z.ZodType<T>`
// (which erases `_output` and reopens the soundness hole).

const triggerDefinitionResponseSchema: z.ZodObject<{
  id: z.ZodString;
  kind: z.ZodEnum<{
    webhook: 'webhook';
    'file-watch': 'file-watch';
    scheduled: 'scheduled';
    queue: 'queue';
    stream: 'stream';
    manual: 'manual';
  }>;
  name: z.ZodOptional<z.ZodString>;
  description: z.ZodOptional<z.ZodString>;
  enabled: z.ZodBoolean;
  durabilityTier: z.ZodDefault<z.ZodEnum<{ t1: 't1'; t2: 't2'; t3: 't3' }>>;
  entrypoint: z.ZodOptional<z.ZodString>;
  tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}> = z.object({
  id: z.string(),
  kind: z.enum(TRIGGER_KINDS),
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean(),
  durabilityTier: z.enum(TRIGGER_DURABILITY_TIERS).default('t1'),
  entrypoint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/** Trigger definition response schema. */
export const TriggerDefinitionResponseSchema: ContractSchema<TriggerDefinitionResponse> =
  triggerDefinitionResponseSchema;

const triggerEventResponseSchema: z.ZodObject<{
  id: z.ZodString;
  triggerId: z.ZodString;
  kind: z.ZodEnum<{
    webhook: 'webhook';
    'file-watch': 'file-watch';
    scheduled: 'scheduled';
    queue: 'queue';
    stream: 'stream';
    manual: 'manual';
  }>;
  status: z.ZodEnum<{
    pending: 'pending';
    'in-flight': 'in-flight';
    deferred: 'deferred';
    completed: 'completed';
    failed: 'failed';
    dlq: 'dlq';
  }>;
  attempt: z.ZodNumber;
  detectedAt: z.ZodString;
  updatedAt: z.ZodString;
  idempotencyKey: z.ZodOptional<z.ZodString>;
  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({
  id: z.string(),
  triggerId: z.string(),
  kind: z.enum(TRIGGER_KINDS),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  attempt: z.number().int().nonnegative(),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Trigger event response schema. */
export const TriggerEventResponseSchema: ContractSchema<TriggerEventResponse> =
  triggerEventResponseSchema;

const triggerFireInputSchema: z.ZodObject<{
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  idempotencyKey: z.ZodOptional<z.ZodString>;
  reason: z.ZodOptional<z.ZodString>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
}> = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  reason: z.string().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

/** Trigger fire request schema. */
export const TriggerFireInputSchema: ContractSchema<TriggerFireInput> = triggerFireInputSchema;

const triggerFireResponseSchema: z.ZodObject<{
  accepted: z.ZodBoolean;
  eventId: z.ZodString;
  triggerId: z.ZodString;
  status: z.ZodEnum<{ pending: 'pending'; deferred: 'deferred' }>;
}> = z.object({
  accepted: z.boolean(),
  eventId: z.string(),
  triggerId: z.string(),
  status: z.enum(['pending', 'deferred']),
});

/** Trigger fire response schema. */
export const TriggerFireResponseSchema: ContractSchema<TriggerFireResponse> =
  triggerFireResponseSchema;

const triggerPreviewResponseSchema: z.ZodObject<{
  triggerId: z.ZodString;
  nextFireAt: z.ZodArray<z.ZodString>;
  timezone: z.ZodOptional<z.ZodString>;
  persistent: z.ZodBoolean;
}> = z.object({
  triggerId: z.string(),
  nextFireAt: z.array(z.string().datetime()),
  timezone: z.string().optional(),
  persistent: z.boolean(),
});

/** Trigger schedule preview response schema. */
export const TriggerPreviewResponseSchema: ContractSchema<TriggerPreviewResponse> =
  triggerPreviewResponseSchema;

const triggerSSEEventTypeSchema: z.ZodEnum<{
  'trigger:accepted': 'trigger:accepted';
  'trigger:started': 'trigger:started';
  'trigger:completed': 'trigger:completed';
  'trigger:failed': 'trigger:failed';
  'trigger:dlq': 'trigger:dlq';
  heartbeat: 'heartbeat';
}> = z.enum([
  'trigger:accepted',
  'trigger:started',
  'trigger:completed',
  'trigger:failed',
  'trigger:dlq',
  'heartbeat',
]);

/** Trigger SSE event type schema. */
export const TriggerSSEEventTypeSchema: ContractSchema<TriggerSSEEventType> =
  triggerSSEEventTypeSchema;

const triggerSSEEventSchema: z.ZodObject<{
  type: typeof triggerSSEEventTypeSchema;
  timestamp: z.ZodString;
  triggerId: z.ZodOptional<z.ZodString>;
  eventId: z.ZodOptional<z.ZodString>;
  data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({
  type: triggerSSEEventTypeSchema,
  timestamp: z.string().datetime(),
  triggerId: z.string().optional(),
  eventId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Trigger SSE event schema. */
export const TriggerSSEEventSchema: ContractSchema<TriggerSSEEvent> = triggerSSEEventSchema;

const TriggerFiltersShape: {
  kind: z.ZodOptional<
    z.ZodNullable<
      z.ZodEnum<{
        webhook: 'webhook';
        'file-watch': 'file-watch';
        scheduled: 'scheduled';
        queue: 'queue';
        stream: 'stream';
        manual: 'manual';
      }>
    >
  >;
  enabled: z.ZodOptional<ReturnType<typeof z.stringbool>>;
  tags: z.ZodOptional<z.ZodString>;
} = {
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  enabled: z.stringbool().optional(),
  tags: z.string().optional(),
};

const triggerFiltersSchema: z.ZodObject<typeof TriggerFiltersShape> = z.object(TriggerFiltersShape);

/** Trigger list filter schema. */
export const TriggerFiltersSchema: ContractSchema<TriggerFilters> = triggerFiltersSchema;

const EventFiltersShape: {
  triggerId: z.ZodOptional<z.ZodString>;
  kind: z.ZodOptional<
    z.ZodNullable<
      z.ZodEnum<{
        webhook: 'webhook';
        'file-watch': 'file-watch';
        scheduled: 'scheduled';
        queue: 'queue';
        stream: 'stream';
        manual: 'manual';
      }>
    >
  >;
  status: z.ZodOptional<
    z.ZodNullable<
      z.ZodEnum<{
        pending: 'pending';
        'in-flight': 'in-flight';
        deferred: 'deferred';
        completed: 'completed';
        failed: 'failed';
        dlq: 'dlq';
      }>
    >
  >;
} = {
  triggerId: z.string().optional(),
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  status: z.enum(TRIGGER_EVENT_STATUSES).nullable().optional(),
};

const eventFiltersSchema: z.ZodObject<typeof EventFiltersShape> = z.object(EventFiltersShape);

/** Trigger event list filter schema. */
export const EventFiltersSchema: ContractSchema<EventFilters> = eventFiltersSchema;

// --- Per-route input/output schemas ------------------------------------------

const listTriggersInput: z.ZodObject<
  typeof OffsetPaginationQueryShape & typeof TriggerFiltersShape
> = offsetPaginationQuerySchema.extend(TriggerFiltersShape);

const listTriggersOutput: z.ZodObject<{
  triggers: z.ZodArray<typeof triggerDefinitionResponseSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  triggers: z.array(triggerDefinitionResponseSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const getTriggerInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const listEventsInput: z.ZodObject<
  typeof OffsetPaginationQueryShape & typeof EventFiltersShape
> = offsetPaginationQuerySchema.extend(EventFiltersShape);

const listEventsOutput: z.ZodObject<{
  events: z.ZodArray<typeof triggerEventResponseSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  events: z.array(triggerEventResponseSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const getEventInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const fireTriggerInput: z.ZodObject<{
  id: z.ZodString;
  body: z.ZodOptional<typeof triggerFireInputSchema>;
}> = z.object({ id: z.string(), body: triggerFireInputSchema.optional() });

const testWebhookInput: z.ZodObject<{
  id: z.ZodString;
  body: z.ZodOptional<typeof triggerFireInputSchema>;
}> = z.object({ id: z.string(), body: triggerFireInputSchema.optional() });

const previewScheduleInput: z.ZodObject<{
  id: z.ZodString;
  count: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
}> = z.object({
  id: z.string(),
  count: z.coerce.number().int().min(1).max(50).default(5).optional(),
});

const enableTriggerInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const disableTriggerInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const subscribeEventsInput: z.ZodOptional<z.ZodObject<typeof EventFiltersShape>> = z.object(
  EventFiltersShape,
).optional();

// --- subscribeEvents route (built via `oc.route`, not `baseContract`) --------
// `oc.route` carries no `.errors(...)`, so its error map is an empty
// `Record<never, never>` rather than {@link BaseErrors}; its output is an
// `eventIterator` whose type derives from the SSE event schema's input/output.

/** Output type produced by `eventIterator(triggerSSEEventSchema)`. */
type SubscribeEventsOutput = ReturnType<
  typeof eventIterator<
    z.input<typeof triggerSSEEventSchema>,
    z.output<typeof triggerSSEEventSchema>
  >
>;

/** Precise type of the `subscribeEvents` streaming route. */
type SubscribeEventsRoute = ContractProcedureBuilderWithInputOutput<
  typeof subscribeEventsInput,
  SubscribeEventsOutput,
  Record<never, never>,
  Record<never, never>
>;

/**
 * Explicit, precise type of the triggers v1 contract definition.
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
interface TriggersContractDefinitionShape extends BasePluginContract {
  readonly describe: BasePluginDescribeRoute;
  readonly listTriggers: Route<typeof listTriggersInput, typeof listTriggersOutput>;
  readonly getTrigger: Route<typeof getTriggerInput, typeof triggerDefinitionResponseSchema>;
  readonly listEvents: Route<typeof listEventsInput, typeof listEventsOutput>;
  readonly getEvent: Route<typeof getEventInput, typeof triggerEventResponseSchema>;
  readonly fireTrigger: Route<typeof fireTriggerInput, typeof triggerFireResponseSchema>;
  readonly testWebhook: Route<typeof testWebhookInput, typeof triggerFireResponseSchema>;
  readonly previewSchedule: Route<typeof previewScheduleInput, typeof triggerPreviewResponseSchema>;
  readonly enableTrigger: Route<typeof enableTriggerInput, typeof triggerDefinitionResponseSchema>;
  readonly disableTrigger: Route<
    typeof disableTriggerInput,
    typeof triggerDefinitionResponseSchema
  >;
  readonly subscribeEvents: SubscribeEventsRoute;
}

/**
 * The triggers v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route and layers the 10
 * plugin-specific routes. The explicit {@link TriggersContractDefinitionShape}
 * annotation makes the precise contract type available to
 * `--isolatedDeclarations` without erasing it; because the base seam `describe`
 * is a real oRPC `ContractProcedure` (no phantom marker) and every route is
 * precisely typed, this object is handed to `implement()` WITHOUT any erasure
 * cast and every `router.<route>.handler(...)` is checked against the
 * contract's IO.
 */
const triggersContractDefinition: TriggersContractDefinitionShape = {
  // Mandatory base seam route: every feature plugin contract carries the typed
  // `describe` route (GET /describe) returning a `PluginCapabilities` document.
  ...BASE_PLUGIN_CONTRACT_ROUTES,

  listTriggers: baseContract
    .route({ method: 'GET', path: '/triggers' })
    .input(listTriggersInput)
    .output(listTriggersOutput),

  getTrigger: baseContract
    .route({ method: 'GET', path: '/triggers/{id}' })
    .input(getTriggerInput)
    .output(triggerDefinitionResponseSchema),

  listEvents: baseContract
    .route({ method: 'GET', path: '/events' })
    .input(listEventsInput)
    .output(listEventsOutput),

  getEvent: baseContract
    .route({ method: 'GET', path: '/events/{id}' })
    .input(getEventInput)
    .output(triggerEventResponseSchema),

  fireTrigger: baseContract
    .route({ method: 'POST', path: '/triggers/{id}/fire' })
    .input(fireTriggerInput)
    .output(triggerFireResponseSchema),

  testWebhook: baseContract
    .route({ method: 'POST', path: '/webhooks/{id}/test' })
    .input(testWebhookInput)
    .output(triggerFireResponseSchema),

  previewSchedule: baseContract
    .route({ method: 'GET', path: '/triggers/{id}/preview' })
    .input(previewScheduleInput)
    .output(triggerPreviewResponseSchema),

  enableTrigger: baseContract
    .route({ method: 'POST', path: '/triggers/{id}/enable' })
    .input(enableTriggerInput)
    .output(triggerDefinitionResponseSchema),

  disableTrigger: baseContract
    .route({ method: 'POST', path: '/triggers/{id}/disable' })
    .input(disableTriggerInput)
    .output(triggerDefinitionResponseSchema),

  subscribeEvents: oc
    .route({ method: 'GET', path: '/events/subscribe' })
    .input(subscribeEventsInput)
    .output(eventIterator(triggerSSEEventSchema)),
};

/**
 * The fully-typed triggers v1 contract definition type.
 *
 * Re-exported so {@link TriggersContract} and {@link TriggersContractV1} derive
 * from it instead of hand-authoring a parallel structural shape.
 */
export type TriggersContractDefinition = TriggersContractDefinitionShape;

/**
 * Trigger service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const triggersContract: TriggersContractDefinition = triggersContractDefinition;

/**
 * The implemented (context-bindable) triggers v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const triggersContractV1: ReturnType<typeof implement<TriggersContractDefinition>> =
  implement(triggersContractDefinition);

/**
 * Public contract shape for trigger service clients.
 *
 * Derived directly from {@link TriggersContractDefinition} — the real,
 * fully-inferred oRPC contract router. Carries the precise per-route
 * input/output/error types, so client generation and `implement(...)` stay
 * sound and can never drift from the Zod schemas.
 */
export type TriggersContract = TriggersContractDefinition;

/**
 * Context-binding implementer for the v1 trigger contract.
 *
 * Derived from the {@link triggersContractV1} value (`implement(definition)`),
 * so `TriggersContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO.
 */
export type TriggersContractV1 = typeof triggersContractV1;

/**
 * The context-bound trigger router implementer.
 *
 * Derived from {@link TriggersContractV1} by binding an opaque request context,
 * so each `TriggersRouter[route]` is the real oRPC procedure implementer.
 * Connectors bind their own concrete context via
 * `triggersContractV1.$context<TheirContext>()`.
 */
export type TriggersRouter = ReturnType<
  typeof triggersContractV1.$context<Record<never, never>>
>;
