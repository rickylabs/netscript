import { resolveExportedPluginManifest } from '../../application/plugin/exported-plugin-manifest.ts';

const RESULT_PREFIX = 'NETSCRIPT_CONFIGURED_PLUGIN_MANIFESTS=';

const environmentPermission = await Deno.permissions.query({ name: 'env' });
if (environmentPermission.state !== 'denied') {
  throw new Error('Configured plugin manifest loader requires denied environment access.');
}

const rawSpecifiers: unknown = JSON.parse(Deno.args[0] ?? 'null');
if (!Array.isArray(rawSpecifiers) || !rawSpecifiers.every((value) => typeof value === 'string')) {
  throw new Error('Configured plugin manifest loader requires an array of module specifiers.');
}

/** Narrow an imported module to the record shape the shared resolver consumes. */
function isModuleNamespace(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}

const manifests = [];
for (const specifier of rawSpecifiers) {
  const imported: unknown = await import(specifier);
  if (!isModuleNamespace(imported)) {
    throw new Error(`Plugin spec "${specifier}" does not export a plugin manifest.`);
  }
  const manifest = resolveExportedPluginManifest(imported);
  if (!manifest) {
    throw new Error(`Plugin spec "${specifier}" does not export a plugin manifest.`);
  }
  manifests.push(manifest);
}

await Deno.stdout.write(
  new TextEncoder().encode(`${RESULT_PREFIX}${JSON.stringify(manifests)}\n`),
);
