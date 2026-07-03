// arch:barrel-ok Root mod.ts delegates to this curated public package surface.
export { type BaseContract, baseContract } from '../application/contract-primitives.ts';
export type {
  BaseContractOutputRoute,
  BaseContractRoute,
} from '../application/contract-primitives.ts';
export type {
  BaseContractOutputBuilder,
  BaseContractProcedure,
  BaseContractRouteBuilder,
  BaseContractRouteOptions,
} from '../application/contract-primitives.ts';
export {
  boundedString,
  type BoundedStringSchemaOptions,
  type DefaultedIntegerSchemaOptions,
  type IntegerSchemaOptions,
  nonNegativeInt,
  nonNegativeNumber,
  paginationLimit,
  paginationOffset,
  positiveInt,
  positiveNumber,
  type StringSchemaOptions,
  stringToInt,
  stringToNumber,
} from '../application/zod-helpers.ts';
export {
  COMMON_ERROR_CODES,
  DEFAULT_INTEGER_MAX,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_LIMIT_MAX,
  DEFAULT_PAGINATION_OFFSET,
} from '../domain/constants.ts';
export {
  getResourceType,
  notFound,
  type NotFoundOptions,
  validationFailed,
  type ValidationFailedOptions,
} from '../domain/errors.ts';
export type { ErrorResult, OkResult, Result } from '../domain/result.ts';
export type {
  ContractDefaultableSchema,
  ContractNumberSchema,
  ContractObjectSchema,
  ContractParseResult,
  ContractSchema,
  ContractStringSchema,
} from '../domain/schema-types.ts';
export {
  type CursorPaginationInput,
  CursorPaginationInputSchema,
  type CursorPaginationMeta,
  CursorPaginationMetaSchema,
  type CursorPaginationQuery,
  CursorPaginationQuerySchema,
  type ForbiddenError,
  ForbiddenErrorSchema,
  type NotFoundError,
  NotFoundErrorSchema,
  type OffsetPaginationInput,
  OffsetPaginationInputSchema,
  type OffsetPaginationMeta,
  OffsetPaginationMetaSchema,
  type OffsetPaginationQuery,
  OffsetPaginationQuerySchema,
  type RateLimitError,
  RateLimitErrorSchema,
  type ServiceUnavailableError,
  ServiceUnavailableErrorSchema,
  type SuccessResponse,
  SuccessSchema,
  type UnauthorizedError,
  UnauthorizedErrorSchema,
  type ValidationError,
  ValidationErrorSchema,
} from '../domain/schemas.ts';
export {
  type ContractsInspectionTarget,
  inspectContracts,
  type InspectionReport,
  type InspectionStatus,
} from '../diagnostics/inspection.ts';
