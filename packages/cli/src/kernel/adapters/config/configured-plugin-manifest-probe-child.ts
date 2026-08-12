import {
  inspectExportedPluginManifest,
  resolveExportedPluginManifest,
} from '../../application/plugin/exported-plugin-manifest.ts';
import {
  CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
  summarizeConfiguredPluginManifest,
} from './configured-plugin-manifest-summary.ts';

const PROBE_RESULT_PREFIX = 'NETSCRIPT_PLUGIN_MANIFEST_PROBE=';
const moduleSpecifier = Deno.args[0];

if (!moduleSpecifier) {
  await writeResult({
    schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
    status: 'import-failure',
    message: 'No module specifier was provided.',
  });
  Deno.exit(70);
}

let imported: unknown;
let resolvedSpecifier: string;
try {
  resolvedSpecifier = import.meta.resolve(moduleSpecifier);
  imported = await import(moduleSpecifier);
} catch (error) {
  await writeResult({
    schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
    status: 'import-failure',
    message: error instanceof Error ? error.message : String(error),
  });
  Deno.exit(71);
}

if (!isRecord(imported)) {
  await writeResult({ schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION, status: 'missing' });
  Deno.exit(72);
}

const manifest = resolveExportedPluginManifest(imported);
if (manifest) {
  await writeResult(summarizeConfiguredPluginManifest(manifest, resolvedSpecifier));
  Deno.exit(0);
}

const inspection = inspectExportedPluginManifest(imported);
await writeResult(
  inspection.status === 'ambiguous'
    ? {
      schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
      status: 'ambiguous',
      count: inspection.count,
    }
    : { schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION, status: 'missing' },
);
Deno.exit(72);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return !!value && typeof value === 'object';
}

async function writeResult(result: Readonly<Record<string, unknown>>): Promise<void> {
  const line = `${PROBE_RESULT_PREFIX}${JSON.stringify(result)}\n`;
  await Deno.stdout.write(new TextEncoder().encode(line));
}
