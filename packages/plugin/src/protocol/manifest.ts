import { z } from 'zod';

/** Current published schema version for `scaffold.plugin.json`. */
export const PLUGIN_MANIFEST_SCHEMA_VERSION = 1;

/** Declared Deno permissions required by a plugin-owned scaffolder. */
export interface PluginScaffolderRequiredPermissions {
  /** Network hosts or permission scopes required by the scaffolder. */
  readonly net: readonly string[];
  /** Read paths or permission scopes required by the scaffolder. */
  readonly read: readonly string[];
  /** Write paths or permission scopes required by the scaffolder. */
  readonly write: readonly string[];
}

/** Capability summary statically declared by a plugin manifest. */
export interface PluginManifestCapabilities {
  /** Whether the plugin scaffolder adds database migration or schema files. */
  readonly hasDatabaseMigrations: boolean;
  /** Whether the plugin scaffolder adds service routes or HTTP endpoints. */
  readonly hasRoutes: boolean;
  /** Whether the plugin scaffolder adds background workers or processors. */
  readonly hasBackgroundWorkers: boolean;
}

/** Plugin-owned scaffold entrypoint declared by the manifest. */
export interface PluginManifestScaffolder {
  /** Published export path that implements the scaffold entrypoint. */
  readonly export: string;
  /** Static permission declaration for the scaffold entrypoint. */
  readonly requiredPermissions: PluginScaffolderRequiredPermissions;
}

/** Script export executed after a plugin-owned scaffold succeeds. */
export interface PluginManifestPostScript {
  /** Published export path or local script path to execute. */
  readonly export: string;
  /** Static arguments passed to the post-script. */
  readonly args?: readonly string[];
}

/** Compatibility metadata for existing plugin-kind provider registration. */
export interface PluginManifestProvider {
  /** Plugin kind registered by the provider. */
  readonly kind: string;
  /** Human-readable provider name. */
  readonly displayName: string;
  /** Provider category used by the host plugin registry. */
  readonly category: 'plugin' | 'background-processor';
  /** Port range bucket used by generated services. */
  readonly portRangeKey: string;
  /** Default runtime permissions for generated services. */
  readonly defaultPermissions: readonly string[];
  /** Optional watch flag used by generated dev commands. */
  readonly watchFlag?: string;
  /** Default background or service entrypoint. */
  readonly defaultEntrypoint: string;
  /** Default service entrypoint. */
  readonly defaultServiceEntrypoint: string;
  /** Whether the provider requires database wiring by default. */
  readonly defaultRequiresDb: boolean;
  /** Whether the provider requires Deno KV wiring by default. */
  readonly defaultRequiresKv: boolean;
  /** Plugin category used by runtime tooling. */
  readonly pluginType: 'background-processor' | 'api' | 'frontend' | 'utility';
  /** Whether generated services support configurable concurrency. */
  readonly supportsConcurrency: boolean;
  /** Environment variable used to configure concurrency. */
  readonly concurrencyEnvVar: string | null;
  /** Default concurrency when supported. */
  readonly defaultConcurrency: number | null;
  /** Whether telemetry is enabled by default. */
  readonly defaultTelemetry: boolean;
  /** Required infrastructure capabilities. */
  readonly infrastructureRequires: readonly string[];
  /** Optional infrastructure dependency capabilities. */
  readonly infrastructureOptionalDeps: readonly string[];
}

/** Compatibility metadata for existing first-party source-copy discovery. */
export interface PluginManifestOfficialSource {
  /** Canonical first-party plugin source name. */
  readonly canonicalName: string;
  /** Source plugin directory name. */
  readonly pluginDir?: string;
  /** Optional background source directory name. */
  readonly backgroundDir?: string;
  /** Service entrypoint copied or generated for the plugin. */
  readonly serviceEntrypoint: string;
  /** Optional background entrypoint copied or generated for the plugin. */
  readonly backgroundEntrypoint?: string;
  /** Generated service configuration key. */
  readonly serviceConfigKey: string;
  /** Generated service port. */
  readonly servicePort: number;
  /** Generated background worker port. */
  readonly backgroundPort: number;
  /** Whether the plugin source requires database wiring. */
  readonly requiresDb?: boolean;
  /** Whether the plugin source requires Deno KV wiring. */
  readonly requiresKv?: boolean;
  /** Runtime permissions used by generated plugin services. */
  readonly permissions?: readonly string[];
  /** First-party plugin source dependencies by directory name. */
  readonly dependencies?: readonly string[];
  /** Generated plugin service references. */
  readonly pluginReferences?: readonly string[];
}

/** Published `scaffold.plugin.json` contract consumed by NetScript installers. */
export interface PluginInstallerManifest {
  /** Published protocol schema version. */
  readonly schemaVersion: typeof PLUGIN_MANIFEST_SCHEMA_VERSION;
  /** Published plugin package name. */
  readonly name: string;
  /** Published plugin package version. */
  readonly version: string;
  /** Human-readable plugin name. */
  readonly displayName: string;
  /** Human-readable plugin description. */
  readonly description: string;
  /** Peer package requirements expected by the plugin scaffolder. */
  readonly peerDependencies: Readonly<Record<string, string>>;
  /** Static capability summary used before plugin code executes. */
  readonly capabilities: PluginManifestCapabilities;
  /** Plugin-owned scaffold entrypoint metadata. */
  readonly scaffolder: PluginManifestScaffolder;
  /** Optional plugin-owned scripts executed after a successful scaffold. */
  readonly postScripts?: readonly PluginManifestPostScript[];
  /** Existing provider metadata retained for first-party compatibility. */
  readonly provider?: PluginManifestProvider;
  /** Existing source metadata retained for first-party compatibility. */
  readonly officialSource?: PluginManifestOfficialSource;
}

const permissionValuesSchema: z.ZodType<readonly string[]> = z.array(z.string().min(1)).readonly();

const requiredPermissionsSchema: z.ZodType<PluginScaffolderRequiredPermissions> = z.object({
  net: permissionValuesSchema,
  read: permissionValuesSchema,
  write: permissionValuesSchema,
}).strict();

const capabilitiesSchema: z.ZodType<PluginManifestCapabilities> = z.object({
  hasDatabaseMigrations: z.boolean(),
  hasRoutes: z.boolean(),
  hasBackgroundWorkers: z.boolean(),
}).strict();

const SAFE_EXPORT_PATH_PATTERN =
  '^\\./(?!(?:.*(?:^|/)\\.\\.?)(?:/|$))[^\\\\\\u0000/]+(?:/[^\\\\\\u0000/]+)*$';

const exportPathSchema = z.string().min(1).regex(new RegExp(SAFE_EXPORT_PATH_PATTERN), {
  message: 'Expected a relative package export path such as "./scaffold" without traversal.',
}).refine(isSafeExportPath, {
  message: 'Expected a relative package export path such as "./scaffold" without traversal.',
});

const scaffolderSchema: z.ZodType<PluginManifestScaffolder> = z.object({
  export: exportPathSchema,
  requiredPermissions: requiredPermissionsSchema,
}).strict();

const postScriptSchema: z.ZodType<PluginManifestPostScript> = z.object({
  export: exportPathSchema,
  args: z.array(z.string()).readonly().optional(),
}).strict();

const providerSchema: z.ZodType<PluginManifestProvider> = z.object({
  kind: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(['plugin', 'background-processor']),
  portRangeKey: z.string().min(1),
  defaultPermissions: z.array(z.string().min(1)).readonly(),
  watchFlag: z.string().min(1).optional(),
  defaultEntrypoint: z.string().min(1),
  defaultServiceEntrypoint: z.string().min(1),
  defaultRequiresDb: z.boolean(),
  defaultRequiresKv: z.boolean(),
  pluginType: z.enum(['background-processor', 'api', 'frontend', 'utility']),
  supportsConcurrency: z.boolean(),
  concurrencyEnvVar: z.string().min(1).nullable(),
  defaultConcurrency: z.number().int().positive().nullable(),
  defaultTelemetry: z.boolean(),
  infrastructureRequires: z.array(z.string().min(1)).readonly(),
  infrastructureOptionalDeps: z.array(z.string().min(1)).readonly(),
}).strict();

const officialSourceSchema: z.ZodType<PluginManifestOfficialSource> = z.object({
  canonicalName: z.string().min(1),
  pluginDir: z.string().min(1).optional(),
  backgroundDir: z.string().min(1).optional(),
  serviceEntrypoint: z.string().min(1),
  backgroundEntrypoint: z.string().min(1).optional(),
  serviceConfigKey: z.string().min(1),
  servicePort: z.number().int().nonnegative(),
  backgroundPort: z.number().int().nonnegative(),
  requiresDb: z.boolean().optional(),
  requiresKv: z.boolean().optional(),
  permissions: z.array(z.string().min(1)).readonly().optional(),
  dependencies: z.array(z.string().min(1)).readonly().optional(),
  pluginReferences: z.array(z.string().min(1)).readonly().optional(),
}).strict();

/** Zod schema for the published NetScript plugin installer manifest. */
export const PluginInstallerManifestSchema: z.ZodType<PluginInstallerManifest> = z.object({
  schemaVersion: z.literal(PLUGIN_MANIFEST_SCHEMA_VERSION),
  name: z.string().min(1),
  version: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
  peerDependencies: z.record(z.string().min(1), z.string().min(1)),
  capabilities: capabilitiesSchema,
  scaffolder: scaffolderSchema,
  postScripts: z.array(postScriptSchema).readonly().optional(),
  provider: providerSchema.optional(),
  officialSource: officialSourceSchema.optional(),
}).strict();

/** Single validation issue returned by plugin manifest parsing. */
export interface PluginManifestParseIssue {
  /** Dot-separated path to the invalid manifest field. */
  readonly path: string;
  /** Human-readable validation failure. */
  readonly message: string;
}

/** Validation failure returned when a plugin manifest cannot be parsed. */
export interface PluginManifestParseError {
  /** Human-readable failure summary. */
  readonly message: string;
  /** Structured validation issues suitable for CLI rendering. */
  readonly issues: readonly PluginManifestParseIssue[];
}

/** Result returned by static plugin manifest parsing. */
export type PluginManifestParseResult =
  | { readonly ok: true; readonly manifest: PluginInstallerManifest }
  | { readonly ok: false; readonly error: PluginManifestParseError };

/** Parse and validate a plugin manifest without executing plugin code. */
export function parsePluginManifest(json: unknown): PluginManifestParseResult {
  const schemaVersion = readSchemaVersion(json);
  if (schemaVersion !== undefined && schemaVersion !== PLUGIN_MANIFEST_SCHEMA_VERSION) {
    return invalidManifest(
      `Unsupported plugin manifest schemaVersion ${
        String(schemaVersion)
      }; expected ${PLUGIN_MANIFEST_SCHEMA_VERSION}.`,
      [{ path: 'schemaVersion', message: 'Unsupported schema version.' }],
    );
  }

  const result = PluginInstallerManifestSchema.safeParse(json);
  if (result.success) {
    return { ok: true, manifest: result.data };
  }

  return invalidManifest(
    'Plugin manifest validation failed.',
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.') || '<root>',
      message: issue.message,
    })),
  );
}

/**
 * Return a manifest-shaped value with the editor-only `$schema` key removed.
 *
 * The canonical manifest contract remains strict; callers use this before parsing JSON files that
 * may carry a JSON Schema hint for editor tooling.
 */
export function stripPluginManifestSchemaKey(json: unknown): unknown {
  if (!isRecord(json) || !('$schema' in json)) {
    return json;
  }

  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(json)) {
    if (key !== '$schema') {
      stripped[key] = value;
    }
  }
  return stripped;
}

function readSchemaVersion(json: unknown): unknown {
  if (typeof json !== 'object' || json === null || !('schemaVersion' in json)) {
    return undefined;
  }

  return json.schemaVersion;
}

function isSafeExportPath(value: string): boolean {
  if (!value.startsWith('./') || value.includes('\\') || value.includes('\0')) {
    return false;
  }
  const segments = value.slice(2).split('/');
  if (segments.length === 0) {
    return false;
  }
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidManifest(
  message: string,
  issues: readonly PluginManifestParseIssue[],
): PluginManifestParseResult {
  return { ok: false, error: { message, issues } };
}
