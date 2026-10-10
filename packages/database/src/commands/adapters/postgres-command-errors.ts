import { CommandStoreError } from '../../../ports/command-store-error.ts';

// Prisma errors are matched by shape, never `instanceof`, and nothing is imported from Prisma:
// a consumer's generated client may load its own `@prisma/client` / driver-adapter instance,
// whose classes differ from any copy this package could resolve.
type KnownRequestError = Readonly<{ code: string; meta?: Readonly<Record<string, unknown>> }>;

// Prisma request codes are `P` plus four digits; every known-request error carries a client
// version. Callback errors that only borrow the name stay unclassified and pass through.
const PRISMA_REQUEST_CODE = /^P\d{4}$/;

function isKnownRequestError(error: object): error is KnownRequestError {
  const code: unknown = Reflect.get(error, 'code');
  return Reflect.get(error, 'name') === 'PrismaClientKnownRequestError' &&
    typeof code === 'string' && PRISMA_REQUEST_CODE.test(code) &&
    typeof Reflect.get(error, 'clientVersion') === 'string';
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
