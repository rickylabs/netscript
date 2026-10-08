import { CommandStoreError } from '../../../ports/command-store-error.ts';

import { PrismaClientKnownRequestError } from 'npm:@prisma/client@^7.8.0/runtime/client';
import { DriverAdapterError } from 'npm:@prisma/driver-adapter-utils@^7.8.0';

export function postgresCommandCode(error: unknown): string | undefined {
  if (error instanceof DriverAdapterError) return error.cause.originalCode;
  if (!(error instanceof PrismaClientKnownRequestError)) return;
  if (error.code === 'P2034') return '40001';
  const nested = error.meta?.driverAdapterError;
  if (nested instanceof DriverAdapterError) return nested.cause.originalCode;
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
