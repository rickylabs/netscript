import type { PluginManifest, PluginType } from '@netscript/plugin';

/** Version of the internal child-process JSON contract. */
export const CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION = 1 as const;

/** JSON-safe manifest fields needed by CLI diagnostics and deploy resolution. */
export interface ConfiguredPluginManifestSummary {
  readonly name: string;
  readonly version: string;
  readonly displayName?: string;
  readonly type?: PluginType;
  readonly permissions?: readonly string[];
  readonly service?: {
    readonly entrypoint: string;
    readonly port?: number;
  };
  readonly doctor?: string;
  readonly cli?: {
    readonly doctorChecks?: readonly 'auth-backend'[];
  };
}

/** Successful payload emitted by the bounded configured-module child. */
export interface ResolvedConfiguredPluginManifestPayload {
  readonly schemaVersion: typeof CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION;
  readonly status: 'resolved';
  readonly resolvedSpecifier: string;
  readonly manifest: ConfiguredPluginManifestSummary;
}

/** Reduce a live manifest to the strictly JSON-safe bounded-probe contract. */
export function summarizeConfiguredPluginManifest(
  manifest: PluginManifest,
  resolvedSpecifier: string,
): ResolvedConfiguredPluginManifestPayload {
  const service = manifest.contributions.services?.[0];
  return {
    schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
    status: 'resolved',
    resolvedSpecifier,
    manifest: {
      name: manifest.name,
      version: manifest.version,
      displayName: manifest.displayName,
      type: manifest.type,
      permissions: manifest.permissions ? [...manifest.permissions] : undefined,
      service: service
        ? {
          entrypoint: service.entrypoint,
          port: service.port,
        }
        : undefined,
      doctor: manifest.contributions.doctor,
      cli: manifest.contributions.cli,
    },
  };
}

/** Parse the successful child payload without trusting imported plugin values. */
export function parseResolvedConfiguredPluginManifestPayload(
  value: unknown,
): ResolvedConfiguredPluginManifestPayload | undefined {
  if (!isRecord(value) || value.schemaVersion !== CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION) {
    return undefined;
  }
  if (value.status !== 'resolved' || typeof value.resolvedSpecifier !== 'string') return undefined;
  const manifest = parseManifestSummary(value.manifest);
  return manifest
    ? {
      schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
      status: 'resolved',
      resolvedSpecifier: value.resolvedSpecifier,
      manifest,
    }
    : undefined;
}

function parseManifestSummary(value: unknown): ConfiguredPluginManifestSummary | undefined {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.version !== 'string') {
    return undefined;
  }
  if (value.displayName !== undefined && typeof value.displayName !== 'string') return undefined;
  if (value.type !== undefined && !isPluginType(value.type)) return undefined;
  const permissions = parseStringArray(value.permissions);
  if (value.permissions !== undefined && !permissions) return undefined;
  const service = parseService(value.service);
  if (value.service !== undefined && !service) return undefined;
  if (value.doctor !== undefined && typeof value.doctor !== 'string') return undefined;
  const cli = parseCli(value.cli);
  if (value.cli !== undefined && !cli) return undefined;
  return {
    name: value.name,
    version: value.version,
    displayName: value.displayName,
    type: value.type,
    permissions,
    service,
    doctor: value.doctor,
    cli,
  };
}

function parseService(
  value: unknown,
): ConfiguredPluginManifestSummary['service'] | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || typeof value.entrypoint !== 'string') return undefined;
  if (value.port !== undefined && typeof value.port !== 'number') return undefined;
  return { entrypoint: value.entrypoint, port: value.port };
}

function parseCli(value: unknown): ConfiguredPluginManifestSummary['cli'] | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return undefined;
  if (value.doctorChecks === undefined) return {};
  if (!Array.isArray(value.doctorChecks) || !value.doctorChecks.every((entry) => entry === 'auth-backend')) {
    return undefined;
  }
  return { doctorChecks: [...value.doctorChecks] };
}

function parseStringArray(value: unknown): readonly string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? [...value]
    : undefined;
}

function isPluginType(value: unknown): value is PluginType {
  return value === 'background-processor' || value === 'api' || value === 'frontend' ||
    value === 'utility';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
