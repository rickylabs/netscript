/** Stable plugin identifier used by manifests and runtime ownership checks. */
export const AUTH_PLUGIN_ID = 'auth' as const;

/** Plugin manifest version advertised to the NetScript host. */
export const AUTH_PLUGIN_VERSION = '0.0.1-alpha.0' as const;

/** Service contribution name for the auth API process. */
export const AUTH_API_SERVICE_NAME = 'auth-api' as const;

/** Default HTTP port for the auth API process. */
export const AUTH_API_DEFAULT_PORT = 8094 as const;

/** Literal type for the auth plugin identifier. */
export type AuthPluginId = typeof AUTH_PLUGIN_ID;
/** Literal type for the auth plugin manifest version. */
export type AuthPluginVersion = typeof AUTH_PLUGIN_VERSION;
/** Literal type for the auth API service name. */
export type AuthApiServiceName = typeof AUTH_API_SERVICE_NAME;
