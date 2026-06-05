import { os } from '@orpc/server';
import {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  rateLimitErrorSchema,
  serviceUnavailableErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '../domain/schemas.ts';
import type { SharedSchema } from '../domain/schema-types.ts';

type OrpcErrorMap = Parameters<typeof os.errors>[0];

const commonErrorMap = {
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: notFoundErrorSchema,
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: validationErrorSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: unauthorizedErrorSchema,
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied',
    data: forbiddenErrorSchema,
  },
  RATE_LIMITED: {
    status: 429,
    message: 'Too many requests',
    data: rateLimitErrorSchema,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: 'Service temporarily unavailable',
    data: serviceUnavailableErrorSchema,
  },
} as const satisfies OrpcErrorMap;

/** HTTP route options accepted by the shared oRPC base contract. */
export type BaseContractRouteOptions = Readonly<{
  method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}>;

/** Opaque procedure returned by oRPC after contract composition. */
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
export const baseContract: BaseContract = os.errors(commonErrorMap) as BaseContract;
