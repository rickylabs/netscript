/** Stable plugin identifier used by manifests, scaffolding, and runtime ownership checks. */
export const SAGAS_PLUGIN_ID = 'sagas' as const;

/** Plugin manifest version advertised to the NetScript host. */
export const SAGAS_PLUGIN_VERSION = '1.0.0' as const;

/** Service contribution name for the sagas API process. */
export const SAGAS_API_SERVICE_NAME = 'sagas-api' as const;

/** Default HTTP port for the sagas API process. */
export const SAGAS_API_DEFAULT_PORT = 8092 as const;

export type SagasPluginId = typeof SAGAS_PLUGIN_ID;
export type SagasPluginVersion = typeof SAGAS_PLUGIN_VERSION;
export type SagasApiServiceName = typeof SAGAS_API_SERVICE_NAME;
