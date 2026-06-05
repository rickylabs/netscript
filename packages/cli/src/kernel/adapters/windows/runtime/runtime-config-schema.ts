/** Build JSON Schema for generated Windows runtime override files. */
import type {
  PluginRuntimeContribution,
  PluginRuntimeSchemaEntry,
} from './runtime-config-schema-types.ts';

// ============================================================================
// JSON SCHEMA GENERATOR
// ============================================================================

/**
 * Generate a JSON Schema for the runtime override files.
 * Provides editor auto-complete and validation for operators editing runtime configs.
 *
 * When `pluginSchemas` are provided (from `runtimeConfig.schemas` in plugins),
 * their `definitions` are extracted and merged **over** the hardcoded fallback
 * definitions. This means the plugin-defined schemas are the source of truth
 * and the hardcoded ones below only serve as a fallback when no plugin
 * contributes a schema for a given topic.
 *
 * @param plugins - Optional custom-topic plugin contributions (from `runtime` field).
 * @param pluginSchemas - Optional plugin-defined schema entries (from `runtimeConfig.schemas`).
 */
export function generateRuntimeSchema(
  plugins: PluginRuntimeContribution[] = [],
  pluginSchemas: PluginRuntimeSchemaEntry[] = [],
): object {
  // Built-in fallback definitions — used when no plugin contributes a schema
  const definitions: Record<string, unknown> = {
    JobOverride: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Job ID (immutable — must match compiled job ID)' },
        enabled: { type: 'boolean', description: 'Toggle job on/off at runtime' },
        schedule: { type: 'string', description: 'Cron expression override (e.g., "0 */6 * * *")' },
        timeout: { type: 'number', description: 'Timeout override in milliseconds' },
        maxRetries: { type: 'number', description: 'Max retry count override' },
        timezone: { type: 'string', description: 'Timezone override (e.g., "Europe/Paris")' },
        concurrency: {
          type: 'number',
          description: 'Concurrency override (1-10)',
          minimum: 1,
          maximum: 10,
        },
      },
      additionalProperties: false,
    },
    JobsConfig: {
      type: 'object',
      required: ['version', 'overrides'],
      properties: {
        $schema: { type: 'string', description: 'JSON Schema reference for editor validation' },
        version: { type: 'string', description: 'Configuration version (semver)' },
        overrides: {
          type: 'array',
          items: { $ref: '#/definitions/JobOverride' },
          description: 'List of job overrides to apply at runtime',
        },
      },
      additionalProperties: false,
    },
    SagaOverride: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Saga ID (immutable)' },
        enabled: { type: 'boolean', description: 'Toggle saga on/off at runtime' },
        timeout: {
          type: 'number',
          description: 'Saga completion timeout in milliseconds',
          minimum: 1000,
        },
        maxRetries: { type: 'number', description: 'Max retry count override', minimum: 0 },
        compensationTimeout: {
          type: 'number',
          description: 'Max time for compensation steps in ms',
          minimum: 1000,
        },
      },
      additionalProperties: false,
    },
    SagasConfig: {
      type: 'object',
      required: ['version', 'overrides'],
      properties: {
        $schema: { type: 'string', description: 'JSON Schema reference for editor validation' },
        version: { type: 'string', description: 'Configuration version (semver)' },
        overrides: {
          type: 'array',
          items: { $ref: '#/definitions/SagaOverride' },
          description: 'List of saga overrides to apply at runtime',
        },
      },
      additionalProperties: false,
    },
    RuntimeTask: {
      type: 'object',
      required: ['id', 'name', 'runtime', 'entrypoint'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique task identifier',
          minLength: 1,
          pattern: '^[a-zA-Z][a-zA-Z0-9_:-]*$',
        },
        name: { type: 'string', description: 'Human-readable task name', minLength: 1 },
        description: { type: 'string', description: 'Detailed description of the task' },
        runtime: {
          type: 'string',
          enum: ['deno', 'python', 'dotnet', 'cmd', 'powershell', 'shell', 'executable'],
          description: 'Task execution runtime',
        },
        entrypoint: { type: 'string', description: 'Path to task script', minLength: 1 },
        schedule: { type: 'string', description: 'Cron expression for scheduled execution' },
        enabled: { type: 'boolean', description: 'Toggle task on/off', default: true },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in milliseconds',
          minimum: 1000,
        },
      },
      additionalProperties: false,
    },
    TasksConfig: {
      type: 'object',
      required: ['version', 'tasks'],
      properties: {
        $schema: { type: 'string', description: 'JSON Schema reference for editor validation' },
        version: { type: 'string', description: 'Configuration version (semver)' },
        tasks: {
          type: 'array',
          items: { $ref: '#/definitions/RuntimeTask' },
          description: 'List of runtime task definitions',
        },
      },
      additionalProperties: false,
    },
    TriggerOverride: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'Trigger ID (immutable — must match registered trigger ID)',
        },
        enabled: { type: 'boolean', description: 'Toggle trigger on/off at runtime' },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Override watch paths at runtime without redeployment. Accepts UNC paths (//SERVER/Share$/folder) or local paths (C:/data/incoming).',
        },
      },
      additionalProperties: false,
    },
    TriggersConfig: {
      type: 'object',
      required: ['version', 'overrides'],
      properties: {
        $schema: { type: 'string', description: 'JSON Schema reference for editor validation' },
        version: { type: 'string', description: 'Configuration version (semver)' },
        overrides: {
          type: 'array',
          items: { $ref: '#/definitions/TriggerOverride' },
          description: 'List of trigger overrides to apply at runtime',
        },
      },
      additionalProperties: false,
    },
    FeatureFlag: {
      type: 'object',
      required: ['id', 'enabled'],
      properties: {
        id: { type: 'string', description: 'Feature flag identifier' },
        enabled: { type: 'boolean', description: 'Whether the feature is enabled' },
        description: { type: 'string', description: 'Human-readable description of the flag' },
        rolloutPercentage: {
          type: 'number',
          description: 'Percentage of traffic to enable (0-100)',
          minimum: 0,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
    FeaturesConfig: {
      type: 'object',
      required: ['version', 'flags'],
      properties: {
        $schema: { type: 'string', description: 'JSON Schema reference for editor validation' },
        version: { type: 'string', description: 'Configuration version (semver)' },
        flags: {
          type: 'array',
          items: { $ref: '#/definitions/FeatureFlag' },
          description: 'List of feature flags',
        },
      },
      additionalProperties: false,
    },
  };

  // Merge plugin-defined schema definitions (from runtimeConfig.schemas).
  // Plugin definitions OVERWRITE the hardcoded fallbacks above — plugins are
  // the source of truth for their owned topics.
  for (const entry of pluginSchemas) {
    const schemaDefs = (entry.schema as Record<string, unknown>).definitions as
      | Record<string, unknown>
      | undefined;
    if (schemaDefs) {
      for (const [key, def] of Object.entries(schemaDefs)) {
        definitions[key] = def; // plugin wins over hardcoded fallback
      }
    }
  }

  // Merge custom-topic plugin schema definitions (from runtime.schemaDefinitions).
  // These are for non-built-in topics so they should NOT overwrite built-in defs.
  for (const plugin of plugins) {
    for (const [key, def] of Object.entries(plugin.schemaDefinitions ?? {})) {
      if (!(key in definitions)) {
        definitions[key] = def;
      }
    }
  }

  // Collect oneOf refs: start with built-in config types, then add any
  // top-level config types contributed by plugin schemas.
  const oneOfRefs: Array<{ $ref: string }> = [
    { $ref: '#/definitions/JobsConfig' },
    { $ref: '#/definitions/SagasConfig' },
    { $ref: '#/definitions/TasksConfig' },
    { $ref: '#/definitions/TriggersConfig' },
    { $ref: '#/definitions/FeaturesConfig' },
  ];

  // If a plugin schema contributed a top-level config definition not already
  // covered by the built-in oneOf refs, add it.
  const builtInConfigNames = new Set([
    'JobsConfig',
    'SagasConfig',
    'TasksConfig',
    'TriggersConfig',
    'FeaturesConfig',
  ]);
  for (const entry of pluginSchemas) {
    const schemaDefs = (entry.schema as Record<string, unknown>).definitions as
      | Record<string, unknown>
      | undefined;
    if (schemaDefs) {
      for (const key of Object.keys(schemaDefs)) {
        if (key.endsWith('Config') && !builtInConfigNames.has(key)) {
          oneOfRefs.push({ $ref: `#/definitions/${key}` });
          builtInConfigNames.add(key);
        }
      }
    }
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'NetScript Runtime Configuration',
    description:
      'Schema for runtime override files in .deploy/windows/config/runtime/. Each file should match one of: JobsConfig, SagasConfig, TasksConfig, TriggersConfig, or FeaturesConfig.',
    oneOf: oneOfRefs,
    definitions,
  };
}
