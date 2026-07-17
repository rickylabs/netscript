import { PLUGIN_PACKAGE_VERSION } from './package-metadata.generated.ts';

/** Stable plugin identifier used by manifests and runtime ownership checks. */
export const AUTH_PLUGIN_ID = 'auth' as const;

/** Plugin manifest version advertised to the NetScript host, single-sourced from `deno.json`. */
export const AUTH_PLUGIN_VERSION: string = PLUGIN_PACKAGE_VERSION;

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
