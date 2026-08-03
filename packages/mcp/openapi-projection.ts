/**
 * Pure OpenAPI operation indexing and projection contracts for NetScript.
 *
 * This entrypoint performs no discovery, filesystem, network, or runtime work.
 * @module
 */

export { HTTP_METHODS, indexOpenApiOperations } from './src/domain/openapi/operation-index.ts';
export type {
  HttpMethod,
  IndexedOpenApiOperation,
  OpenApiObject,
  OpenApiOperationIndex,
} from './src/domain/openapi/operation-index.ts';
