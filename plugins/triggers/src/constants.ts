import { PLUGIN_PACKAGE_VERSION } from './package-metadata.generated.ts';

/** Stable plugin identifier for NetScript triggers. */
export const TRIGGERS_PLUGIN_ID = 'triggers' as const;

/** Plugin package version, single-sourced from the package `deno.json`. */
export const TRIGGERS_PLUGIN_VERSION: string = PLUGIN_PACKAGE_VERSION;

/** Default HTTP service name for trigger ingress and management APIs. */
export const TRIGGERS_API_SERVICE_NAME = 'triggers-api' as const;

/**
 * @deprecated Not a runtime fallback; removed in 0.0.8 — see
 * "chore(plugins): remove deprecated default-port compatibility exports in 0.0.8".
 */
export const TRIGGERS_API_DEFAULT_PORT = 8093 as const;

/** Literal type for the triggers plugin id. */
export type TriggersPluginId = typeof TRIGGERS_PLUGIN_ID;
/** Literal type for the triggers plugin version. */
export type TriggersPluginVersion = typeof TRIGGERS_PLUGIN_VERSION;
/** Literal type for the triggers API service name. */
export type TriggersApiServiceName = typeof TRIGGERS_API_SERVICE_NAME;
