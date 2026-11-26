import type { NetScriptProcedureMeta } from './procedure-meta.ts';
import type { ContractObjectSchemaLike } from './schema-types.ts';

/** Maximum accepted ASCII/UTF-8 byte length for an opaque stream offset or cursor token. */
export const STREAM_OFFSET_MAX_BYTES = 512 as const;

/** Accepted client credential transports for a declared stream proxy endpoint. */
export type StreamEndpointClientAuthMode =
  | 'bearer'
  | 'cookie'
  | 'bearer-or-cookie';

/** Finite set of valid client credential transport modes for stream endpoints. */
export const STREAM_ENDPOINT_CLIENT_AUTH_MODES: readonly [
  'bearer',
  'cookie',
  'bearer-or-cookie',
] = Object.freeze(['bearer', 'cookie', 'bearer-or-cookie']);

/** Query parameter names reserved by the Durable Streams SSE proxy protocol. */
export const RESERVED_STREAM_QUERY_PARAMS: readonly ['offset', 'live', 'cursor'] = Object.freeze([
  'offset',
  'live',
  'cursor',
]);

/** Protocol discriminator identifying a NetScript Durable Streams SSE endpoint contract. */
export interface StreamEndpointProtocol {
  /** Protocol family identifier. */
  readonly family: 'netscript.durable-stream-sse';
  /** Major protocol contract version. */
  readonly major: 1;
}

/** Canonical protocol version metadata for v1 Durable Streams SSE endpoints. */
export const STREAM_ENDPOINT_PROTOCOL_V1: StreamEndpointProtocol = Object.freeze({
  family: 'netscript.durable-stream-sse',
  major: 1,
});

/** Input definition accepted by {@link defineStreamEndpoint}. */
export interface StreamEndpointDefinition<
  TParams extends ContractObjectSchemaLike | undefined = ContractObjectSchemaLike | undefined,
  TQuery extends ContractObjectSchemaLike | undefined = ContractObjectSchemaLike | undefined,
> {
  /** Stable identifier (e.g. `'projects.feed'`). Must match `/^[a-z0-9][a-z0-9._-]*$/i`. */
  readonly id: string;
  /** Absolute route path using OpenAPI `{param}` templates (e.g. `'/api/streams/projects/{projectId}'`). */
  readonly path: `/${string}`;
  /** Standard Schema validating path parameters extracted from `{param}` segments (required when path has params). */
  readonly params?: TParams;
  /** Optional Standard Schema validating application query parameters (excluding reserved protocol keys). */
  readonly query?: TQuery;
  /** Client credential transports accepted by this endpoint. Defaults to `'bearer-or-cookie'`. */
  readonly clientAuth?: StreamEndpointClientAuthMode;
  /**
   * Access-control metadata reusing NetScript's canonical `NetScriptProcedureMeta['access']`.
   * Defaults to `{ authentication: 'required' }`.
   */
  readonly access?: NetScriptProcedureMeta['access'];
  /** Optional short summary reserved for docs and future projection metadata. */
  readonly summary?: string;
  /** Optional long description reserved for docs and future projection metadata. */
  readonly description?: string;
  /** Optional grouping tags reserved for docs and future projection metadata. */
  readonly tags?: readonly string[];
}

/** Frozen runtime-free contract for an authorizing Durable Streams SSE endpoint. */
export interface StreamEndpointContract<
  TParamsOutput = Record<never, never>,
  TQueryOutput = Record<never, never>,
  TParamsInput = TParamsOutput,
  TQueryInput = TQueryOutput,
> {
  /** Protocol discriminator (`netscript.durable-stream-sse` major 1). */
  readonly protocol: StreamEndpointProtocol;
  /** Stream endpoints are served exclusively over HTTP `GET`. */
  readonly method: 'GET';
  /** Stable endpoint identifier. */
  readonly id: string;
  /** Normalized absolute route path template. */
  readonly path: `/${string}`;
  /** Ordered parameter names declared in `{param}` path segments. */
  readonly paramNames: readonly string[];
  /** Path parameter validator when declared. */
  readonly params?: ContractObjectSchemaLike;
  /** Application query parameter validator when declared. */
  readonly query?: ContractObjectSchemaLike;
  /** Client credential transports accepted by this endpoint. */
  readonly clientAuth: StreamEndpointClientAuthMode;
  /** Normalized access-control metadata enforced by mounted services. */
  readonly access: NonNullable<NetScriptProcedureMeta['access']>;
  /** Optional short summary metadata. */
  readonly summary?: string;
  /** Optional description metadata. */
  readonly description?: string;
  /** Optional tags metadata. */
  readonly tags?: readonly string[];
  /** Type-only carrier for inferred params and query input/output types; never populated at runtime. */
  readonly '~types'?: {
    readonly params: TParamsOutput;
    readonly query: TQueryOutput;
    readonly paramsInput: TParamsInput;
    readonly queryInput: TQueryInput;
  };
}

/** Input options accepted by {@link buildStreamEndpointUrl}. */
export interface StreamEndpointUrlInput<
  TParamsInput = Record<never, never>,
  TQueryInput = Record<never, never>,
> {
  /** Target HTTP(S) origin or base URL. */
  readonly baseUrl: string;
  /** Path parameters matching the endpoint schema's wire input type. */
  readonly params?: TParamsInput;
  /** Application query parameters matching the endpoint schema's wire input type. */
  readonly query?: TQueryInput;
  /** Optional opaque Durable Streams offset validated by {@link isValidStreamOffset}. */
  readonly offset?: string;
  /** Optional opaque Durable Streams cursor validated by {@link isValidStreamOffset}. */
  readonly cursor?: string;
}

const PRINTABLE_NON_WHITESPACE_ASCII = /^[\x21-\x7E]+$/;
const FORBIDDEN_OFFSET_DELIMITERS = /[?#&]/;

/**
 * Validate an opaque Durable Streams offset (or cursor) token under the single canonical grammar:
 * - non-empty string with length in `1..512` bytes;
 * - printable non-whitespace ASCII only (`0x21..0x7E`, rejecting all control chars CR/LF/NUL,
 *   spaces, tabs, and non-ASCII bytes);
 * - excludes URL query/fragment delimiters `?`, `#`, and `&`.
 */
export function isValidStreamOffset(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= STREAM_OFFSET_MAX_BYTES &&
    PRINTABLE_NON_WHITESPACE_ASCII.test(value) &&
    !FORBIDDEN_OFFSET_DELIMITERS.test(value);
}
