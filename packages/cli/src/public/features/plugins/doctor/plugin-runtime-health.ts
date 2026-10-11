import { resolve } from '@std/path';
import {
  backgroundProcessorEntrySchema,
  pluginEntrySchema,
} from '@netscript/config/schema/plugins';
import { aggregatePluginHealth, type PluginHealthDeclaration } from '@netscript/plugin/health';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type {
  AppHostInspection,
  AppHostInspector,
  PluginDoctorReport,
} from './doctor-plugin-use-case.ts';

/** Read live declared resources without loading plugin modules or probing static configuration. */
export async function inspectPluginRuntime(
  projectRoot: string,
  fs: FileSystemPort,
  inspector: AppHostInspector,
): Promise<readonly PluginDoctorReport[]> {
  const declarations = await readPluginHealthDeclarations(projectRoot, fs);
  if (declarations.length === 0) return [];
  const snapshot = await inspector.inspect(
    projectRoot,
    declarations.flatMap((declaration) => declaration.childResources),
  );
  if (snapshot.status !== 'running') {
    return [{
      pluginName: 'runtime',
      status: 'error',
      checks: [{
        id: 'runtime-health',
        title: 'Declared plugin runtime health',
        status: 'error',
        message: snapshot.status === 'not-running'
          ? 'The declared plugin runtime is not running.'
          : 'The declared plugin runtime health is unavailable.',
      }],
    }];
  }
  return diagnosePluginRuntime(declarations, snapshot);
}

/** Read generated runtime declarations once; ownership is InstalledFrom, never a plugin-name rule. */
export async function readPluginHealthDeclarations(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly PluginHealthDeclaration[]> {
  const path = resolve(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) return [];
  const document: unknown = JSON.parse(await fs.readFile(path));
  if (!isRecord(document) || !isRecord(document.NetScript)) {
    throw new Error('Invalid NetScript appsettings section.');
  }
  const section = document.NetScript;
  const groups = new Map<
    string,
    { pluginName: string; apiResources: string[]; childResources: string[] }
  >();
  const group = (source: string) => {
    const entry = groups.get(source) ??
      { pluginName: source, apiResources: [], childResources: [] };
    groups.set(source, entry);
    return entry;
  };
  for (const [name, raw] of Object.entries(readEntries(section.Plugins))) {
    const entry = pluginEntrySchema.parse(raw);
    if (entry.Enabled) group(entry.InstalledFrom).apiResources.push(name);
  }
  for (const [name, raw] of Object.entries(readEntries(section.BackgroundProcessors))) {
    const entry = backgroundProcessorEntrySchema.parse(raw);
    if (entry.Enabled && entry.Runtime === 'deno' && entry.RequiresKv) {
      group(entry.InstalledFrom).childResources.push(name);
    }
  }
  return [...groups.values()];
}

/** Adapt the canonical verdict into doctor checks while retaining the complete shared health report. */
export function diagnosePluginRuntime(
  declarations: readonly PluginHealthDeclaration[],
  snapshot: AppHostInspection,
): readonly PluginDoctorReport[] {
  if (snapshot.status !== 'running') return [];
  return aggregatePluginHealth(declarations, snapshot.resources).map((health) => ({
    pluginName: health.pluginName,
    status: health.status === 'unhealthy'
      ? 'error'
      : health.status === 'unknown'
      ? 'warning'
      : health.status,
    checks: [{
      id: 'runtime-health',
      title: 'Plugin runtime health',
      status: health.status === 'unhealthy'
        ? 'error'
        : health.status === 'unknown'
        ? 'warning'
        : health.status,
      runtimeHealth: health,
      message: `${health.status}: ${
        [...health.apis, ...health.children].map((resource) =>
          `${resource.name}=${resource.state}/${resource.status}`
        ).join(', ')
      }`,
    }],
  }));
}

function readEntries(value: unknown): Readonly<Record<string, unknown>> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error('Invalid plugin runtime declarations.');
  return value;
}
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
