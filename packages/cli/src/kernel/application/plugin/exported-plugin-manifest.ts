import type { PluginManifest } from '@netscript/plugin';

/** Result of inspecting one configured module's manifest exports. */
export type ExportedPluginManifestInspection =
  | { readonly status: 'resolved'; readonly manifest: PluginManifest }
  | { readonly status: 'missing' }
  | { readonly status: 'ambiguous'; readonly count: number };

/** Resolve a configured module using the runtime loader's manifest selection semantics. */
export function resolveExportedPluginManifest(
  module: Readonly<Record<string, unknown>>,
): PluginManifest | undefined {
  const inspection = inspectExportedPluginManifest(module);
  return inspection.status === 'resolved' ? inspection.manifest : undefined;
}

/** Inspect why a configured module does or does not yield one plugin manifest. */
export function inspectExportedPluginManifest(
  module: Readonly<Record<string, unknown>>,
): ExportedPluginManifestInspection {
  if (isPluginManifest(module.default)) {
    return { status: 'resolved', manifest: module.default };
  }

  const manifests = Object.values(module).filter(isPluginManifest);
  if (manifests.length === 1) {
    return { status: 'resolved', manifest: manifests[0] };
  }
  return manifests.length === 0
    ? { status: 'missing' }
    : { status: 'ambiguous', count: manifests.length };
}

function isPluginManifest(value: unknown): value is PluginManifest {
  if (!value || typeof value !== 'object') return false;
  return typeof Reflect.get(value, 'name') === 'string' &&
    typeof Reflect.get(value, 'version') === 'string' &&
    !!Reflect.get(value, 'contributions') &&
    typeof Reflect.get(value, 'contributions') === 'object';
}
