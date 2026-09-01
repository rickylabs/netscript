/**
 * Typed SDK client-contribution contracts and tuple validation algebra.
 *
 * @module
 */

/** @internal Publicly nameable alias for the contracts-owned procedure metadata. */
export type NetScriptProcedureMeta = import('@netscript/contracts').NetScriptProcedureMeta;

/** Versioned identifier for an SDK client contribution. */
export type SdkClientContributionId = `${string}:${string}`;

/** Protocol discriminator implemented by SDK client contributions. */
export interface SdkClientContributionProtocol {
  /** Stable protocol family owned by NetScript. */
  readonly family: 'netscript.sdk-client';
  /** Supported protocol major. */
  readonly major: 1;
}

/** Package-owned procedure metadata exposed during request preparation. */
export interface SdkClientProcedureDescriptor {
  /** Procedure path segments from the service contract. */
  readonly path: readonly string[];
  /** NetScript-owned semantic procedure metadata. */
  readonly meta: Readonly<NetScriptProcedureMeta>;
}

/** HTTP transport facts exposed during request preparation. */
export interface SdkClientTransportDescriptor {
  /** Supported transport kind. */
  readonly kind: 'http';
  /** Resolved service origin. */
  readonly origin: URL;
  /** Resolved RPC path. */
  readonly rpcPath: string;
  /** Whether the origin uses a confidential transport. */
  readonly secure: boolean;
}

/** Immutable values supplied to a contribution before request dispatch. */
export interface SdkClientPrepareOptions<
  TContext extends object = Record<never, never>,
> {
  /** Contribution-owned projection of the per-call context. */
  readonly context: Readonly<TContext>;
  /** Call cancellation signal, when present. */
  readonly signal?: AbortSignal;
  /** Package-owned procedure descriptor. */
  readonly procedure: SdkClientProcedureDescriptor;
  /** Resolved HTTP transport descriptor. */
  readonly transport: SdkClientTransportDescriptor;
  /** Borrowed procedure input. */
  readonly input: unknown;
}

/** Header patch returned by an SDK client contribution. */
export interface SdkClientRequestPatch {
  /** Declared lower-case request headers emitted for this call. */
  readonly headers?: Readonly<Record<string, string>>;
}

/** Required/optional runtime declaration for every contribution context key. */
export type SdkClientContextDeclaration<TContext extends object> = {
  readonly [K in Extract<keyof TContext, string>]-?: Record<never, never> extends Pick<TContext, K>
    ? 'optional'
    : 'required';
};

/** Immutable values supplied to a synchronous response-cache partition resolver. */
export interface SdkClientCachePartitionOptions<
  TContext extends object = Record<never, never>,
> {
  /** Contribution-owned projection of the per-call context. */
  readonly context: Readonly<TContext>;
  /** Package-owned procedure descriptor. */
  readonly procedure: SdkClientProcedureDescriptor;
}

/** Response-cache safety declaration for an SDK client contribution. */
export type SdkClientResponseCache<TContext extends object> =
  | { readonly mode: 'invariant' }
  | {
    readonly mode: 'partitioned';
    readonly partition: (
      options: SdkClientCachePartitionOptions<TContext>,
    ) => string;
  }
  | { readonly mode: 'direct-only' };

/**
 * Version-1 SDK client contribution descriptor.
 *
 * The descriptor may prepare declared request headers from its own context projection. Transport,
 * retry, deduplication, tracing, discovery, and dispatch remain SDK-owned.
 */
export interface SdkClientContribution<
  TId extends SdkClientContributionId = SdkClientContributionId,
  TContext extends object = Record<never, never>,
  TContextDeclaration extends SdkClientContextDeclaration<TContext> = SdkClientContextDeclaration<
    TContext
  >,
  THeaderKeys extends readonly string[] = readonly string[],
> {
  /** Contribution protocol version. */
  readonly protocol: SdkClientContributionProtocol;
  /** Globally named contribution identifier. */
  readonly id: TId;
  /** Runtime declaration for every owned context key. */
  readonly context: TContextDeclaration;
  /** Exclusive lower-case request-header ownership. */
  readonly headerKeys: THeaderKeys;
  /** Response-cache safety declaration. */
  readonly responseCache: SdkClientResponseCache<TContext>;
  /** Prepare the contribution's request-header patch for one logical call epoch. */
  readonly prepare: (
    options: SdkClientPrepareOptions<TContext>,
  ) => SdkClientRequestPatch | PromiseLike<SdkClientRequestPatch>;
}

/** @internal Structural fields used by the tuple algebra. */
export type SdkClientContributionLike = {
  readonly id: SdkClientContributionId;
  readonly context: Readonly<Record<string, 'optional' | 'required'>>;
  readonly headerKeys: readonly string[];
  readonly responseCache: { readonly mode: 'invariant' | 'partitioned' | 'direct-only' };
};

/** @internal Extract a contribution's context type. */
export type SdkClientContributionContextOf<TContribution> = TContribution extends
  SdkClientContribution<
    SdkClientContributionId,
    infer TContext extends object,
    SdkClientContextDeclaration<infer TContext extends object>,
    readonly string[]
  > ? TContext
  : never;

/** @internal Extract a contribution's literal id. */
export type SdkClientContributionIdOf<TContribution> = TContribution extends {
  readonly id: infer TId extends SdkClientContributionId;
} ? TId
  : never;

/** @internal Extract the string context keys owned by a contribution. */
export type SdkClientContributionContextKeysOf<TContribution> = Extract<
  keyof SdkClientContributionContextOf<TContribution>,
  string
>;

/** @internal Extract the request-header keys owned by a contribution. */
export type SdkClientContributionHeaderKeysOf<TContribution> = TContribution extends {
  readonly headerKeys: infer THeaderKeys extends readonly string[];
} ? THeaderKeys[number]
  : never;

/** @internal Named tuple-boundary diagnostic. */
export type SdkClientContributionConflict<TKind extends string, TKey extends string> = {
  readonly __netscriptContributionConflict: `${TKind}:${TKey}`;
};

/** @internal Tail-recursive contribution context and ownership merge. */
export type SdkClientContributionMerge<
  TContributions extends readonly object[],
  TContext extends object = Record<never, never>,
  TIds extends string = never,
  TContextKeys extends string =
    | 'signal'
    | 'cache'
    | 'retry'
    | 'retryDelay'
    | 'shouldRetry'
    | 'onRetry'
    | 'traceHeaders',
  THeaderKeys extends string = 'content-type' | 'traceparent' | 'tracestate',
> = TContributions extends readonly [infer THead, ...infer TTail extends readonly object[]]
  ? THead extends SdkClientContributionLike
    ? SdkClientContributionIdOf<THead> extends TIds
      ? SdkClientContributionConflict<'id', SdkClientContributionIdOf<THead>>
    : [Extract<SdkClientContributionContextKeysOf<THead>, TContextKeys>] extends [never]
      ? [Extract<SdkClientContributionHeaderKeysOf<THead>, THeaderKeys>] extends [never]
        ? SdkClientContributionMerge<
          TTail,
          TContext & SdkClientContributionContextOf<THead>,
          TIds | SdkClientContributionIdOf<THead>,
          TContextKeys | SdkClientContributionContextKeysOf<THead>,
          THeaderKeys | SdkClientContributionHeaderKeysOf<THead>
        >
      : SdkClientContributionConflict<
        'header',
        Extract<SdkClientContributionHeaderKeysOf<THead>, THeaderKeys>
      >
    : SdkClientContributionConflict<
      'context',
      Extract<SdkClientContributionContextKeysOf<THead>, TContextKeys>
    >
  : SdkClientContributionConflict<'invalid', 'descriptor'>
  : TContext;

/** @internal Enforce the protocol-major-1 contribution tuple budget. */
export type SdkClientContributionLimit<TContributions extends readonly object[]> =
  TContributions extends readonly [
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    object,
    ...object[],
  ] ? SdkClientContributionConflict<'limit', 'more-than-16'>
    : unknown;

/** Composite context inferred from an SDK client contribution tuple or widened array. */
export type SdkClientContributionContext<TContributions extends readonly object[]> = number extends
  TContributions['length'] ? SdkClientContributionContextOf<TContributions[number]>
  : SdkClientContributionMerge<TContributions> extends infer TResult extends object
    ? TResult extends SdkClientContributionConflict<string, string> ? never
    : TResult
  : never;

/** Static tuple validation applied at service-client construction boundaries. */
export type ValidateSdkClientContributions<TContributions extends readonly object[]> =
  number extends TContributions['length'] ? unknown
    : SdkClientContributionMerge<TContributions> extends SdkClientContributionConflict<
      string,
      string
    > ? SdkClientContributionMerge<TContributions>
    : SdkClientContributionLimit<TContributions>;
