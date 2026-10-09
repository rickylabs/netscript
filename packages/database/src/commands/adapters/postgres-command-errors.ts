import { CommandStoreError } from '../../../ports/command-store-error.ts';

// Prisma errors are matched by shape, never `instanceof`, and nothing is imported from Prisma:
// a consumer's generated client may load its own `@prisma/client` / driver-adapter instance,
// whose classes differ from any copy this package could resolve.
type KnownRequestError = Readonly<{ code: string; meta?: Readonly<Record<string, unknown>> }>;

function isKnownRequestError(error: object): error is KnownRequestError {
  return Reflect.get(error, 'name') === 'PrismaClientKnownRequestError' &&
    typeof Reflect.get(error, 'code') === 'string';
}

/** Same predicate as `isDriverAdapterError` in `@prisma/driver-adapter-utils`, null-safe. */
function driverAdapterCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return;
  if (Reflect.get(error, 'name') !== 'DriverAdapterError') return;
  const cause: unknown = Reflect.get(error, 'cause');
  if (typeof cause !== 'object' || cause === null) return;
  const code: unknown = Reflect.get(cause, 'originalCode');
  return typeof code === 'string' ? code : undefined;
}

/** SQLSTATE of a Prisma PostgreSQL failure from any module instance, else `undefined`. */
export function postgresCommandCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return;
  if (!isKnownRequestError(error)) return driverAdapterCode(error);
  if (error.code === 'P2034') return '40001';
  const nested = driverAdapterCode(error.meta?.driverAdapterError);
  if (nested) return nested;
  return typeof error.meta?.code === 'string' ? error.meta.code : undefined;
}

export function postgresCommandFailure(
  cause: unknown,
  phase: 'begin' | 'claim' | 'business' | 'flush' | 'complete' | 'commit',
): CommandStoreError {
  const code = postgresCommandCode(cause);
  return new CommandStoreError({
    kind: 'store_failure',
    retryable: code === '40001' || code === '40P01',
    phase,
  }, { cause });
}
