/** Minimal plugin manifest shape accepted by the plugin inspector. */
export interface InspectablePluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin version. */
  readonly version?: string;
  /** Contribution groups keyed by contribution axis. */
  readonly contributions?: object;
}

/** Minimal registry shape accepted by the plugin inspector. */
export interface InspectablePluginRegistry {
  /** List registered plugin manifests. */
  readonly list: () => readonly InspectablePluginManifest[];
}

/** JSON-stable diagnostic report returned by plugin inspectors. */
export interface InspectionReport {
  /** Package identifier inspected by this report. */
  readonly package: '@netscript/plugin';
  /** Human-readable target name or path supplied to the inspector. */
  readonly target: string;
  /** Short diagnostic summary suitable for CLI output. */
  readonly summary: string;
  /** JSON-stable detail payload for machine readers. */
  readonly details: Record<string, unknown>;
}

/**
 * Inspect a plugin manifest, registry, or path-like target.
 *
 * @param target - Plugin manifest, registry, or path-like label to inspect.
 * @returns A diagnostic report suitable for CLI rendering.
 */
export function inspectPlugin(
  target: string | InspectablePluginManifest | InspectablePluginRegistry,
): InspectionReport {
  if (typeof target === 'string') {
    return {
      package: '@netscript/plugin',
      target,
      summary: 'Plugin path inspection target',
      details: { kind: 'path' },
    };
  }

  if ('list' in target && typeof target.list === 'function') {
    const plugins = target.list();
    return {
      package: '@netscript/plugin',
      target: 'plugin-registry',
      summary: 'Plugin registry inspection target',
      details: { kind: 'registry', plugins: plugins.length },
    };
  }

  const manifest = target as InspectablePluginManifest;

  return {
    package: '@netscript/plugin',
    target: manifest.name,
    summary: 'Plugin manifest inspection target',
    details: {
      kind: 'manifest',
      version: manifest.version,
      contributionGroups: Object.keys(manifest.contributions ?? {}).length,
    },
  };
}
