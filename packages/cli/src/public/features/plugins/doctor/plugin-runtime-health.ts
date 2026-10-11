import { resolve } from '@std/path';
import {
  BackgroundProcessorEntrySchema,
  type PluginEntry,
  PluginEntrySchema,
} from '@netscript/aspire/config';
import { aggregatePluginHealth, type PluginHealthDeclaration } from '@netscript/plugin/health';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type {
  AppHostInspection,
  AppHostInspector,
  PluginDoctorReport,
} from './doctor-plugin-use-case.ts';

/** Valid runtime declarations and visible diagnostics for entries that could not be declared. */
export interface PluginRuntimeDeclarations {
  readonly declarations: readonly PluginHealthDeclaration[];
  readonly warnings: readonly PluginDoctorReport[];
}

/** Read live declared resources without loading plugin modules or probing static configuration. */
export async function inspectPluginRuntime(
  projectRoot: string,
  fs: FileSystemPort,
  inspector: AppHostInspector,
): Promise<readonly PluginDoctorReport[]> {
  const { declarations, warnings } = await readPluginRuntimeDeclarations(projectRoot, fs);
  if (declarations.length === 0) return warnings;
  const snapshot = await inspector.inspect(
    projectRoot,
    declarations.flatMap((declaration) => declaration.childResources),
  );
  if (snapshot.status !== 'running') {
    return [...warnings, {
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
  return [...warnings, ...diagnosePluginRuntime(declarations, snapshot)];
}

/** Read the declarations used by the shared health aggregator. */
export async function readPluginHealthDeclarations(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly PluginHealthDeclaration[]> {
  return (await readPluginRuntimeDeclarations(projectRoot, fs)).declarations;
}

/** Read the AppHost's schema and reconciled reference links, retaining malformed-entry warnings. */
export async function readPluginRuntimeDeclarations(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<PluginRuntimeDeclarations> {
  const path = resolve(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) return { declarations: [], warnings: [] };
  const document: unknown = JSON.parse(await fs.readFile(path));
  if (!isRecord(document) || !isRecord(document.NetScript)) {
    throw new Error('Invalid NetScript appsettings section.');
  }
  const section = document.NetScript;
  const warnings: PluginDoctorReport[] = [];
  const apis = new Map<
    string,
    { entry: PluginEntry; owner?: string; dependencies: ReadonlySet<string> }
  >();
  const apiOwners = new Map<string, string>();
  const children: { name: string; owner: string }[] = [];
  for (const [name, raw] of Object.entries(readEntries(section.Plugins))) {
    const parsed = PluginEntrySchema.safeParse(raw);
    if (!parsed.success) {
      if (isRecord(raw) && raw.Enabled !== false) {
        warnings.push(declarationWarning('Plugins', name, 'Invalid API entry was skipped.'));
      }
      continue;
    }
    const owner = installationOwner(raw);
    apis.set(name, {
      entry: parsed.data,
      owner,
      dependencies: new Set(parsed.data.PluginReferences ?? []),
    });
    apiOwners.set(name, owner ?? name);
  }
  const linkedApiOwners = new Map<string, string>();
  for (const [name, raw] of Object.entries(readEntries(section.BackgroundProcessors))) {
    const parsed = BackgroundProcessorEntrySchema.safeParse(raw);
    if (!parsed.success) {
      if (
        isRecord(raw) && raw.Enabled !== false &&
        (raw.Runtime === undefined || raw.Runtime === 'deno') && raw.RequiresKv === true
      ) {
        warnings.push(declarationWarning(
          'BackgroundProcessors',
          name,
          'Invalid health-capable child entry was skipped.',
        ));
      }
      continue;
    }
    const entry = parsed.data;
    if (!entry.Enabled || entry.Runtime !== 'deno' || !entry.RequiresKv) continue;
    // Reconciliation adds the owning API to its dependencies, which are also on the API entry.
    // This distinguishes the owning API from other PluginReferences without resource-name rules.
    const references = new Set(entry.PluginReferences ?? []);
    const candidates = [...references].filter((reference) => {
      const api = apis.get(reference);
      if (!api) return false;
      const dependencies = api.dependencies;
      return dependencies.size === references.size - 1 &&
        [...dependencies].every((dependency) =>
          dependency !== reference && references.has(dependency)
        );
    });
    const apiName = candidates.length === 1 ? candidates[0] : undefined;
    if (candidates.length > 1) {
      warnings.push(declarationWarning(
        'BackgroundProcessors',
        name,
        'Ambiguous API ownership; child health is reported separately.',
      ));
    }
    const owner = installationOwner(raw) ??
      (apiName ? apis.get(apiName)?.owner ?? linkedApiOwners.get(apiName) : undefined) ?? name;
    if (apiName) {
      linkedApiOwners.set(apiName, owner);
      apiOwners.set(apiName, owner);
    }
    children.push({ name, owner });
  }
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
  for (const [name, api] of apis) {
    if (api.entry.Enabled) group(apiOwners.get(name) ?? name).apiResources.push(name);
  }
  for (const child of children) {
    group(child.owner).childResources.push(child.name);
  }
  return {
    declarations: [...groups.values()].sort((left, right) =>
      left.pluginName.localeCompare(right.pluginName)
    ),
    warnings,
  };
}

function installationOwner(raw: unknown): string | undefined {
  return isRecord(raw) && typeof raw.InstalledFrom === 'string' && raw.InstalledFrom.trim()
    ? raw.InstalledFrom
    : undefined;
}

function declarationWarning(section: string, name: string, message: string): PluginDoctorReport {
  return {
    pluginName: 'runtime',
    status: 'warning',
    checks: [{
      id: `runtime-health:declaration:${section}:${name}`,
      title: 'Runtime declaration',
      status: 'warning',
      message: `NetScript.${section}.${name}: ${message}`,
    }],
  };
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
