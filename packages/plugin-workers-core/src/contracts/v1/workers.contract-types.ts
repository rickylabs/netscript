import type {
  WorkersContractDefinition,
  workersContractV1,
} from './workers.contract-definition.ts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for worker contracts. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ContractSchemaResult<TOutput>;
}

/** Public response returned for worker job definitions. */
export type JobDefinitionResponse = Readonly<Record<string, unknown>>;

/** Public response returned for worker execution records. */
export type ExecutionRecordResponse = Readonly<Record<string, unknown> & { executionId: string }>;

/** Public response returned for worker task definitions. */
export type TaskDefinitionResponse = Readonly<Record<string, unknown>>;

/** Server-sent event payload emitted by the workers service. */
export type SSEEvent = Readonly<Record<string, unknown>>;

/** Input accepted by the trigger-job procedure. */
export type JobTriggerInput = Readonly<{
  /** Job id, resolved from the `{id}` path segment; optional in the body. */
  id?: string;
  payload?: Record<string, unknown>;
  priority?: number;
  delay?: number;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Output returned by the trigger-job procedure. */
export type JobTriggerOutput = Readonly<{ jobId: string; triggered: boolean }>;

/** Input accepted by the trigger-task procedure. */
export type TaskTriggerInput = Readonly<{
  /** Task id, resolved from the `{id}` path segment; optional in the body. */
  id?: string;
  payload?: Record<string, unknown>;
  priority?: number;
  delay?: number;
  correlationId?: string;
}>;

/** Output returned by the trigger-task procedure. */
export type TaskTriggerOutput = Readonly<{ taskId: string; triggered: boolean }>;

/**
 * Public contract shape for worker service clients.
 *
 * Derived directly from {@link WorkersContractDefinition} — the real,
 * fully-inferred oRPC contract router built in `workers.contract-definition.ts`.
 * This is no longer a hand-authored structural shim: it carries the precise
 * per-route input/output/error types, so client generation and
 * `implement(...)` stay sound and can never drift from the Zod schemas.
 */
export type WorkersContract = WorkersContractDefinition;

/**
 * Context-binding implementer for the v1 worker contract.
 *
 * Derived from the {@link workersContractV1} value (`implement(definition)`),
 * so `WorkersContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO. Replaces the previous `$context: <T>() => WorkersRouter` shim.
 */
export type WorkersContractV1 = typeof workersContractV1;

/**
 * The context-bound worker router implementer.
 *
 * Derived from {@link WorkersContractV1} by binding an opaque request context,
 * so each `WorkersRouter[route]` is the real oRPC procedure implementer (not a
 * `(options: unknown) => unknown` structural stand-in). Connectors bind their own
 * concrete context via `workersContractV1.$context<TheirContext>()`.
 */
export type WorkersRouter = ReturnType<
  typeof workersContractV1.$context<Record<never, never>>
>;

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 */
export interface WorkersCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-workers`. */
  readonly pluginName: string;
  /** Contract version identifiers served by the plugin. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin. */
  readonly routeGroups: readonly string[];
  /** Capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}
