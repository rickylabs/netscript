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
export type { OperationAccessSummary } from './src/domain/openapi/operation-access.ts';
export { resolveCanonicalOperation } from './src/domain/openapi/canonical-identity.ts';
export type {
  AmbiguousOperation,
  OperationIdentityKind,
  OperationResolution,
  ResolvedOperation,
  UnknownOperation,
} from './src/domain/openapi/canonical-identity.ts';
export { describeOpenApiOperation } from './src/domain/openapi/description-ladder.ts';
export {
  projectOperationSchemaViews,
  SCHEMA_VIEW_NAMES,
} from './src/domain/openapi/schema-views.ts';
export type {
  CommonErrorResponse,
  ErrorSchemaView,
  OperationSchemaAllView,
  OperationSchemaViews,
  ProjectedParameter,
  ProjectedRequestBody,
  ProjectedResponse,
  RequestSchemaView,
  ResponseSchemaView,
  SchemaViewName,
} from './src/domain/openapi/schema-views.ts';
