/**
 * Service-client contracts for SDK oRPC integration.
 *
 * @module
 */

/**
 * Minimal structural representation of a standard-schema-compatible type.
 */
export interface ContractSchema {
  /** Standard-schema metadata used for type inference. */
  readonly '~standard': {
    /** Optional inferred input/output types exposed by the schema library. */
    readonly types?: {
      /** Procedure input type. */
      readonly input: unknown;
      /** Procedure output type. */
      readonly output: unknown;
    };
  };
}

/**
 * Infer the input type from a standard schema.
 */
export type ContractSchemaInput<TSchema> = TSchema extends {
  readonly '~standard': {
    readonly types?: {
      readonly input: infer TInput;
    };
  };
} ? TInput
  : unknown;

/**
 * Infer the output type from a standard schema.
 */
export type ContractSchemaOutput<TSchema> = TSchema extends {
  readonly '~standard': {
    readonly types?: {
      readonly output: infer TOutput;
    };
  };
} ? TOutput
  : unknown;

/**
 * Public `~orpc` metadata used by NetScript to derive client typing from a
 * contract object without exposing private upstream helper types.
 */
export interface ContractProcedureMetadata<
  TInputSchema extends ContractSchema | undefined = ContractSchema | undefined,
  TOutputSchema extends ContractSchema | undefined = ContractSchema | undefined,
> {
  /** Input validation schema for the procedure. */
  readonly inputSchema?: TInputSchema;
  /** Output validation schema for the procedure. */
  readonly outputSchema?: TOutputSchema;
}

/**
 * Minimal structural representation of an oRPC contract procedure.
 */
export interface ContractProcedureLike<
  TInputSchema extends ContractSchema | undefined = ContractSchema | undefined,
  TOutputSchema extends ContractSchema | undefined = ContractSchema | undefined,
> {
  /** Public oRPC metadata container. */
  readonly '~orpc': ContractProcedureMetadata<TInputSchema, TOutputSchema>;
}

/**
 * Recursive structural representation of an oRPC contract router.
 */
export type ContractLike = ContractProcedureLike | { readonly [key: string]: ContractLike };

/**
 * Procedure names available on a contract router.
 */
export type ContractProcedureNames<TContract> =
  & {
    [K in keyof TContract]: TContract[K] extends ContractProcedureLike ? K : never;
  }[keyof TContract]
  & string;

/**
 * Input payload for a contract procedure node.
 */
export type ProcedureInputFromNode<TNode> = TNode extends ContractProcedureLike<
  infer TInputSchema extends ContractSchema | undefined,
  ContractSchema | undefined
> ? ContractSchemaInput<TInputSchema>
  : never;

/**
 * Output payload for a contract procedure node.
 */
export type ProcedureOutputFromNode<TNode> = TNode extends ContractProcedureLike<
  ContractSchema | undefined,
  infer TOutputSchema extends ContractSchema | undefined
> ? ContractSchemaOutput<TOutputSchema>
  : never;

/**
 * Per-call service client context.
 */
export interface ServiceClientContext {
  /** Fetch cache mode forwarded to `fetch`. */
  cache?: RequestCache;
  /** Retry count or resolver for stream-style subscriptions. */
  retry?: number | Promise<number> | ((attempt: number) => number | Promise<number>);
  /** Retry delay or resolver. */
  retryDelay?:
    | number
    | Promise<number>
    | ((attempt: number, error: unknown) => number | Promise<number>);
  /** Retry decision or resolver. */
  shouldRetry?:
    | boolean
    | Promise<boolean>
    | ((attempt: number, error: unknown) => boolean | Promise<boolean>);
  /** Retry callback hook. */
  onRetry?: (attempt: number, error: unknown) => void | Promise<void>;
  /** Explicit trace headers used when auto-detection cannot cross async boundaries. */
  traceHeaders?: {
    /** W3C `traceparent` header value. */
    traceparent?: string;
    /** Optional W3C `tracestate` header value. */
    tracestate?: string;
  } | null;
}

/**
 * Optional second argument passed to service-client methods.
 */
export interface ServiceRequestOptions {
  /** Per-request service client context. */
  context?: ServiceClientContext;
}

/**
 * Typed service-client method derived from a contract procedure.
 */
export type ServiceClientMethod<TInput, TOutput> = (
  input: TInput,
  options?: ServiceRequestOptions,
) => Promise<TOutput>;

/**
 * Compile-time marker that preserves the source contract for inference.
 */
export interface ServiceClientContract<TContract extends ContractLike> {
  /** Contract marker used only by TypeScript inference. */
  readonly __netscriptServiceContract?: TContract;
}

/**
 * Recursive callable/router shape for a typed service client.
 */
export type ServiceClientShape<TContract extends ContractLike> = TContract extends
  ContractProcedureLike
  ? ServiceClientMethod<ProcedureInputFromNode<TContract>, ProcedureOutputFromNode<TContract>>
  : {
    [K in keyof TContract]: TContract[K] extends ContractLike ? ServiceClient<TContract[K]> : never;
  };

/**
 * Typed service client derived from a contract router.
 */
export type ServiceClient<TContract extends ContractLike> =
  & ServiceClientShape<TContract>
  & ServiceClientContract<TContract>;

/**
 * Options for creating a discovered service client.
 *
 * @typeParam TContract - Contract used by the service.
 */
export interface CreateServiceClientOptions<TContract extends ContractLike> {
  /** Contract definition used for client typing and HTTP method inference. */
  contract: TContract;
  /** Service name registered in Aspire / NetScript config. */
  serviceName: string;
  /** Optional router name used for URL path construction. */
  routerName?: string;
  /** Resolved protocol for service discovery. */
  protocol?: 'http' | 'https';
  /** Base API RPC path. */
  apiPath?: string;
  /** API version segment. */
  apiVersion?: string;
  /** Reserved override for explicit port selection. */
  port?: number;
  /** Reserved request timeout in milliseconds. */
  timeout?: number;
  /** Whether to propagate trace context headers automatically. */
  propagateTraceContext?: boolean;
}
