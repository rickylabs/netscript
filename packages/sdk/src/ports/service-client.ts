/**
 * Service-client contracts for SDK oRPC integration.
 *
 * @module
 */

import type { ValidateSdkClientContributions } from './sdk-client-contribution.ts';

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
  : TSchema extends { parse(value: unknown): infer TOutput } ? TOutput
  : unknown;

/**
 * Public `~orpc` metadata used by NetScript to derive client typing from a
 * contract object without exposing private upstream helper types.
 */
export interface ContractProcedureMetadata<
  TInputSchema = unknown,
  TOutputSchema = unknown,
> {
  /** Input validation schema for the procedure. */
  readonly inputSchema?: TInputSchema;
  /** Output validation schema for the procedure. */
  readonly outputSchema?: TOutputSchema;
}

/**
 * NetScript-owned procedure schema marker for package-generated contract factories.
 */
export interface NetScriptProcedureSchemas<
  TInputSchema = unknown,
  TOutputSchema = unknown,
> {
  /** Input validation schema for the procedure. */
  readonly inputSchema: TInputSchema;
  /** Output validation schema for the procedure. */
  readonly outputSchema: TOutputSchema;
}

/**
 * Minimal structural representation of an oRPC contract procedure.
 */
export interface ContractProcedureLike<
  TInputSchema = unknown,
  TOutputSchema = unknown,
> {
  /** NetScript-owned schema marker used when upstream metadata is intentionally opaque. */
  readonly __netscriptSchemas?: NetScriptProcedureSchemas<TInputSchema, TOutputSchema>;
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
  infer TInputSchema,
  unknown
>
  ? TNode extends { readonly __netscriptSchemas: { readonly inputSchema: infer TSchema } }
    ? ContractSchemaInput<TSchema>
  : ContractSchemaInput<TInputSchema>
  : never;

/**
 * Output payload for a contract procedure node.
 */
export type ProcedureOutputFromNode<TNode> = TNode extends ContractProcedureLike<
  unknown,
  infer TOutputSchema
>
  ? TNode extends { readonly __netscriptSchemas: { readonly outputSchema: infer TSchema } }
    ? ContractSchemaOutput<TSchema>
  : ContractSchemaOutput<TOutputSchema>
  : never;

/**
 * Procedure metadata carried by a contract procedure node.
 */
export type ProcedureMetaFromNode<TNode> = TNode extends {
  readonly '~orpc': { readonly meta: infer TMeta };
} ? TMeta
  : Record<never, never>;

/**
 * Per-call service client context.
 */
export interface ServiceClientContext {
  /** Abort signal forwarded to the underlying HTTP request. */
  signal?: AbortSignal;
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

/** HTTP methods selectable by the NetScript SDK transport policy. */
export type SdkClientHttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT';

/** Immutable inputs supplied to a service-client HTTP method override. */
export interface SdkClientTransportPolicyMethodOptions {
  /** NetScript-owned procedure path and metadata. */
  readonly procedure: import('./sdk-client-contribution.ts').SdkClientProcedureDescriptor;
  /** Borrowed procedure input for this logical call. */
  readonly input: unknown;
  /** Method inferred from the contract before an override is applied. */
  readonly inferredMethod: SdkClientHttpMethod;
}

/** Narrow, upstream-neutral override for SDK-owned transport policy. */
export interface SdkClientTransportPolicy {
  /** Override the contract-derived HTTP method for one logical call. */
  readonly method?: (
    options: Readonly<SdkClientTransportPolicyMethodOptions>,
  ) => SdkClientHttpMethod;
}

/**
 * Optional second argument passed to service-client methods.
 */
export interface ServiceRequestOptions<
  TContext extends object = ServiceClientContext,
> {
  /** Per-request service client context. */
  readonly context?: TContext;
}

/** @internal Required keys used to select the request-options tuple shape. */
export type RequiredKeys<TContext extends object> = {
  [K in keyof TContext]-?: Record<never, never> extends Pick<TContext, K> ? never : K;
}[keyof TContext];

/** Optional or required request-options tuple based on the client context. */
export type ServiceRequestRest<TContext extends object = ServiceClientContext> =
  RequiredKeys<TContext> extends never ? [options?: ServiceRequestOptions<TContext>]
    : [options: { readonly context: TContext }];

/**
 * Typed service-client method derived from a contract procedure.
 */
export type ServiceClientMethod<
  TInput,
  TOutput,
  TError = Error,
  TContext extends object = ServiceClientContext,
> = (
  input: TInput,
  ...request: ServiceRequestRest<TContext>
) => Promise<TOutput> & { __error?: { type: TError } };

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
export type ServiceClientShape<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> = TContract extends ContractProcedureLike ? ServiceClientMethod<
    ProcedureInputFromNode<TContract>,
    ProcedureOutputFromNode<TContract>,
    TContract extends {
      readonly '~orpc': {
        readonly errorMap: infer TErrorMap extends Record<
          string,
          { readonly data?: unknown } | undefined
        >;
      };
    } ?
        | {
          [K in keyof TErrorMap]: K extends string
            ? TErrorMap[K] extends { readonly data?: infer TDataSchema } ? Error & {
                readonly defined: true;
                readonly code: K;
                readonly status: number;
                readonly data: ContractSchemaOutput<TDataSchema>;
              }
            : never
            : never;
        }[keyof TErrorMap]
        | Error
      : Error,
    TContext
  >
  : {
    [K in keyof TContract]: TContract[K] extends ContractLike
      ? ServiceClient<TContract[K], TContext>
      : never;
  };

/**
 * Typed service client derived from a contract router.
 */
export type ServiceClient<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> =
  & ServiceClientShape<TContract, TContext>
  & ServiceClientContract<TContract>;

/**
 * Options for creating a discovered service client.
 *
 * @typeParam TContract - Contract used by the service.
 */
export interface CreateServiceClientOptions<
  TContract extends ContractLike,
  TContributions extends readonly object[] = readonly [],
> {
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
  /**
   * Reserved override for explicit port selection.
   *
   * @deprecated Migrate explicit service addressing to discovery configuration; #1351 owns the
   * transport disposition.
   */
  port?: number;
  /**
   * Reserved request timeout in milliseconds.
   *
   * @deprecated Use an `AbortSignal` for request cancellation; #1351 owns the transport
   * disposition.
   */
  timeout?: number;
  /** Optional HTTP method adaptation resolved before client contributions compose. */
  transportPolicy?: SdkClientTransportPolicy;
  /** Whether to propagate trace context headers automatically. */
  propagateTraceContext?: boolean;
  /** Explicit literal tuple of typed SDK client contributions. */
  contributions?:
    & TContributions
    & ValidateSdkClientContributions<TContributions>;
}
