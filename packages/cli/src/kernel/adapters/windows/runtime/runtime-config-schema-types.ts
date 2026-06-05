/** Schema contribution metadata collected from plugin runtime config declarations. */
/**
 * A plugin-contributed schema entry collected from `runtimeConfig.schemas`
 * in a plugin's `definePlugin()` call. Passed to `writeRuntimeConfig` by
 * `strategy.ts` so the deploy schema.json is generated from plugin code
 * rather than hardcoded definitions.
 */
export interface PluginRuntimeSchemaEntry {
  /** Topic name (e.g. 'triggers', 'workers', 'sagas') */
  topic: string;
  /** Human-readable description */
  description?: string;
  /** Complete JSON Schema object — definitions are extracted and merged */
  schema: Record<string, unknown>;
  /** Name of the plugin that contributed this entry (for logging) */
  pluginName: string;
}

/** Runtime topic contribution collected from registered plugin metadata. */
export interface PluginRuntimeContribution {
  topic: string;
  description?: string;
  schemaDefinitions?: Record<string, unknown>;
  generate: (config: Record<string, unknown>) => Record<string, unknown>;
}
