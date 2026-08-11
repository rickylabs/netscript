import {
  inspectExportedPluginManifest,
  resolveExportedPluginManifest,
} from '../../application/plugin/exported-plugin-manifest.ts';

const PROBE_RESULT_PREFIX = 'NETSCRIPT_PLUGIN_MANIFEST_PROBE=';
const moduleSpecifier = Deno.args[0];

if (!moduleSpecifier) {
  await writeResult({ status: 'import-failure', message: 'No module specifier was provided.' });
  Deno.exit(70);
}

let imported: unknown;
try {
  imported = await import(moduleSpecifier);
} catch (error) {
  await writeResult({
    status: 'import-failure',
    message: error instanceof Error ? error.message : String(error),
  });
  Deno.exit(71);
}

if (!isRecord(imported)) {
  await writeResult({ status: 'missing' });
  Deno.exit(72);
}

const manifest = resolveExportedPluginManifest(imported);
if (manifest) {
  await writeResult({ status: 'resolved' });
  Deno.exit(0);
}

const inspection = inspectExportedPluginManifest(imported);
await writeResult(
  inspection.status === 'ambiguous'
    ? { status: 'ambiguous', count: inspection.count }
    : { status: 'missing' },
);
Deno.exit(72);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return !!value && typeof value === 'object';
}

async function writeResult(result: Readonly<Record<string, unknown>>): Promise<void> {
  const line = `${PROBE_RESULT_PREFIX}${JSON.stringify(result)}\n`;
  await Deno.stdout.write(new TextEncoder().encode(line));
}
