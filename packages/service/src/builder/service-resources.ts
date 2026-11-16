/** Signal-owned database disposal for the service builder. @module */
import type { DbContext } from '../types.ts';

/** Minimal Prisma lifecycle contract, independent of a particular provider. */
export interface ServiceDatabaseResource {
  /** Disconnect this already-acquired client. */
  $disconnect(): Promise<void>;
}

/** Record already-acquired clients, deduplicating multi-database aliases by identity. */
export function registerServiceDatabases(
  resources: Set<ServiceDatabaseResource>,
  database: DbContext,
): void {
  if (isDatabaseResource(database)) resources.add(database);
  else {for (const value of Object.values(database)) {
      if (isDatabaseResource(value)) resources.add(value);
    }}
}

/** Attempt every registered disconnect exactly once, including when another fails. */
export async function disconnectServiceDatabases(
  resources: Set<ServiceDatabaseResource>,
): Promise<void> {
  const clients = [...resources];
  resources.clear();
  const results = await Promise.allSettled(
    clients.map(async (client) => await client.$disconnect()),
  );
  const failures = results.filter((result): result is PromiseRejectedResult =>
    result.status === 'rejected'
  );
  if (failures.length) {
    throw new AggregateError(failures.map((result) => result.reason), 'Database cleanup failed.');
  }
}

function isDatabaseResource(value: unknown): value is ServiceDatabaseResource {
  return typeof value === 'object' && value !== null &&
    typeof Reflect.get(value, '$disconnect') === 'function';
}
