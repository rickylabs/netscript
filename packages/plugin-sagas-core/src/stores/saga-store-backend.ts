/** Durable saga store backend variants supported by the plugin runtime. */
export type DurableSagaStoreBackend = 'kv' | 'prisma';

/** Saga query projection backend, independently selected from canonical state. */
export type SagaProjectionBackend = 'kv' | 'prisma' | 'none';

/** Environment variable used to select saga query projection and hydration. */
export const SAGA_PROJECTION_BACKEND_ENV = 'NETSCRIPT_SAGA_PROJECTION';

/** Supported saga query projection backend values. */
export const SAGA_PROJECTION_BACKENDS: readonly SagaProjectionBackend[] = Object.freeze([
  'kv',
  'prisma',
  'none',
]);

/** Environment variable used to select the durable saga state backend. */
export const SAGA_STORE_BACKEND_ENV = 'NETSCRIPT_SAGA_STORE';

/** Supported durable saga state backend values. */
export const SAGA_STORE_BACKENDS: readonly DurableSagaStoreBackend[] = Object.freeze([
  'kv',
  'prisma',
]);

/** Input accepted by saga store backend resolution. */
export type SagaStoreBackendResolutionInput = Readonly<{
  env?: Readonly<Record<string, string | undefined>>;
  appsettings?: unknown;
}>;

/** Resolve the explicit durable saga state backend from env or appsettings. */
export function resolveSagaStoreBackend(
  input: SagaStoreBackendResolutionInput = {},
): DurableSagaStoreBackend {
  const envValue = input.env?.[SAGA_STORE_BACKEND_ENV];
  if (envValue !== undefined && envValue !== '') {
    return parseSagaStoreBackend(envValue, SAGA_STORE_BACKEND_ENV);
  }

  const appsettingsValue = findAppsettingsBackend(input.appsettings);
  if (appsettingsValue !== undefined && appsettingsValue !== '') {
    return parseSagaStoreBackend(appsettingsValue, 'sagas.store.backend');
  }

  throw new Error(
    `Saga store backend is required. Set ${SAGA_STORE_BACKEND_ENV}=kv|prisma or appsettings sagas.store.backend.`,
  );
}

/** Resolve the query projection independently of durable state; env overrides appsettings. */
export function resolveSagaProjectionBackend(
  input: SagaStoreBackendResolutionInput = {},
): SagaProjectionBackend {
  const value = input.env?.[SAGA_PROJECTION_BACKEND_ENV] ||
    stringAt(input.appsettings, ['sagas', 'projection', 'backend']) ||
    stringAt(input.appsettings, ['Sagas', 'Projection', 'Backend']);
  if (value !== undefined) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'kv' || normalized === 'prisma' || normalized === 'none') {
      return normalized;
    }
    throw new Error(
      `Invalid saga projection backend "${value}"; expected ${
        SAGA_PROJECTION_BACKENDS.join(', ')
      }.`,
    );
  }
  const store = input.env?.[SAGA_STORE_BACKEND_ENV] || findAppsettingsBackend(input.appsettings);
  return store ? parseSagaStoreBackend(store, 'sagas.store.backend') : 'kv';
}

function parseSagaStoreBackend(value: string, source: string): DurableSagaStoreBackend {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'kv' || normalized === 'prisma') {
    return normalized;
  }
  throw new Error(`Invalid saga store backend "${value}" from ${source}; expected kv or prisma.`);
}

function findAppsettingsBackend(appsettings: unknown): string | undefined {
  return stringAt(appsettings, ['sagas', 'store', 'backend']) ??
    stringAt(appsettings, ['Sagas', 'Store', 'Backend']) ??
    stringAt(appsettings, ['SagaStore', 'Backend']) ??
    stringAt(appsettings, ['SagasStore', 'Backend']);
}

function stringAt(value: unknown, path: readonly string[]): string | undefined {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}
