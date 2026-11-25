/**
 * Runtime-free Durable Streams SSE endpoint contracts and canonical offset grammar.
 *
 * Declare parameterized stream proxy routes beside oRPC procedures without importing any
 * runtime, server, or oRPC dependency, build validated stream URLs, and validate opaque
 * Durable Streams offsets under one canonical grammar shared across client and server.
 *
 * @example
 * ```ts
 * import {
 *   buildStreamEndpointUrl,
 *   defineStreamEndpoint,
 *   isValidStreamOffset,
 * } from '@netscript/contracts/streams';
 * import { z } from 'zod';
 *
 * const projectFeed = defineStreamEndpoint({
 *   id: 'projects.feed',
 *   path: '/api/streams/projects/{projectId}',
 *   params: z.object({ projectId: z.string().min(1) }),
 *   query: z.object({ view: z.enum(['summary', 'full']).optional() }),
 *   clientAuth: 'bearer-or-cookie',
 *   access: {
 *     authentication: 'required',
 *     authorization: { scopes: ['projects:read'] },
 *   },
 * });
 *
 * const url = buildStreamEndpointUrl(projectFeed, {
 *   baseUrl: 'https://api.example.test',
 *   params: { projectId: 'proj-1' },
 *   query: { view: 'summary' },
 *   offset: isValidStreamOffset('-1') ? '-1' : undefined,
 * });
 * void url;
 * ```
 *
 * @module
 */
export { buildStreamEndpointUrl, defineStreamEndpoint } from './src/application/stream-endpoint.ts';
export type {
  NetScriptAuthenticationRequirement,
  NetScriptProcedureAudience,
  NetScriptProcedureMeta,
} from './src/domain/procedure-meta.ts';
export type {
  ContractObjectSchemaLike,
  ContractSchemaInput,
  ContractSchemaLike,
  ContractSchemaOutput,
} from './src/domain/schema-types.ts';
export {
  isValidStreamOffset,
  RESERVED_STREAM_QUERY_PARAMS,
  STREAM_ENDPOINT_CLIENT_AUTH_MODES,
  STREAM_ENDPOINT_PROTOCOL_V1,
  STREAM_OFFSET_MAX_BYTES,
  type StreamEndpointClientAuthMode,
  type StreamEndpointContract,
  type StreamEndpointDefinition,
  type StreamEndpointProtocol,
  type StreamEndpointUrlInput,
} from './src/domain/stream-endpoint.ts';
