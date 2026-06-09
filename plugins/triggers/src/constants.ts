/** Stable plugin identifier for NetScript triggers. */
export const TRIGGERS_PLUGIN_ID = 'triggers' as const;

/** Initial plugin package version. */
export const TRIGGERS_PLUGIN_VERSION = '0.1.0' as const;

/** Default HTTP service name for trigger ingress and management APIs. */
export const TRIGGERS_API_SERVICE_NAME = 'triggers-api' as const;

/** Default HTTP port for trigger ingress and management APIs. */
export const TRIGGERS_API_DEFAULT_PORT = 8093 as const;

/** Literal type for the triggers plugin id. */
export type TriggersPluginId = typeof TRIGGERS_PLUGIN_ID;
/** Literal type for the triggers plugin version. */
export type TriggersPluginVersion = typeof TRIGGERS_PLUGIN_VERSION;
/** Literal type for the triggers API service name. */
export type TriggersApiServiceName = typeof TRIGGERS_API_SERVICE_NAME;
