import { os } from '@orpc/server';
import {
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  RateLimitErrorSchema,
  ServiceUnavailableErrorSchema,
  UnauthorizedErrorSchema,
  ValidationErrorSchema,
} from '../domain/schemas.ts';
import type { SharedSchema } from '../domain/schema-types.ts';

const commonErrorMap = {
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: NotFoundErrorSchema,
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: ValidationErrorSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: UnauthorizedErrorSchema,
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied',
    data: ForbiddenErrorSchema,
  },
  RATE_LIMITED: {
    status: 429,
    message: 'Too many requests',
    data: RateLimitErrorSchema,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: 'Service temporarily unavailable',
    data: ServiceUnavailableErrorSchema,
  },
} as const;

/** HTTP route options accepted by the shared oRPC base contract. */
export type BaseContractRouteOptions = Readonly<{
  method: string;
  path: string;
}>;

/** Opaque procedure returned by oRPC after contract composition. */
// deno-lint-ignore no-explicit-any
export type BaseContractProcedure = Readonly<{
  /** oRPC procedure marker used by implementers and routers. */
  // deno-lint-ignore no-explicit-any
  '~orpc': any;
}>;

/** Builder returned after binding input to the shared oRPC base contract. */
export type BaseContractOutputBuilder<TInput extends SharedSchema<unknown>> = Readonly<{
  output<TOutput extends SharedSchema<unknown>>(
    schema: TOutput,
  ): BaseContractProcedure;
}>;

/** Builder returned after binding a route to the shared oRPC base contract. */
export type BaseContractRouteBuilder = Readonly<{
  input<TInput extends SharedSchema<unknown>>(
    schema: TInput,
  ): BaseContractOutputBuilder<TInput>;
  output<TOutput extends SharedSchema<unknown>>(
    schema: TOutput,
  ): BaseContractProcedure;
}>;

/** Common oRPC contract primitive with NetScript's shared error map applied. */
export type BaseContract = Readonly<{
  route(options: BaseContractRouteOptions): BaseContractRouteBuilder;
}>;

/** Common oRPC contract primitive with NetScript's shared error map applied. */
export const baseContract: BaseContract = os.errors(
  commonErrorMap as never,
) as unknown as BaseContract;
