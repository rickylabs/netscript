import { join } from '@std/path';

import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';
import { detectPluginDbRequirement } from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import type { PluginKind, SagaStoreBackend } from '../../../../kernel/domain/plugin-kind.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { PluginInstallPlan, PluginInstallRequest } from '../../../domain/plugin-install-plan.ts';

interface ExistingPluginConfigShape {
  NetScript?: {
    Plugins?: Record<string, unknown>;
    BackgroundProcessors?: Record<string, unknown>;
  };
}

/** Dependencies used while planning a plugin-install flow. */
export interface PlanPluginInstallDependencies {
  /** Filesystem used to read project metadata. */
  readonly fs: FileSystemPort;

  /** Plugin kind registry. */
  readonly registry?: PluginKindRegistry;
}

/** Resolve and validate the starter plugin install request. */
export async function planPluginInstall(
  request: PluginInstallRequest,
  dependencies: PlanPluginInstallDependencies,
): Promise<PluginInstallPlan> {
  const registry = dependencies.registry ?? new PluginKindRegistry();
  const kind = parsePluginKind(request.kind, registry);
  const provider = registry.get(kind);

  if (request.db && request.noDb) {
    throw new ScaffoldValidationError('Cannot combine --db and --no-db.');
  }

  await assertPluginNameAvailable(
    request.projectRoot,
    request.pluginName,
    provider,
    dependencies.fs,
    request.overwrite,
  );

  const projectName = await readProjectName(dependencies.fs, request.projectRoot);
  const dbDetection = await detectPluginDbRequirement(
    request.projectRoot,
    provider,
    { db: request.db, noDb: request.noDb },
    dependencies.fs,
  );
  const sagaStoreBackend = resolveSagaStoreBackendOption(provider.kind, request.sagaStoreBackend);

  return {
    ...request,
    kind,
    provider,
    projectName,
    dbDetection,
    sagaStoreBackend,
  };
}

function parsePluginKind(rawKind: string, registry: PluginKindRegistry): PluginKind {
  if (!registry.has(rawKind as PluginKind)) {
    throw new ScaffoldValidationError(
      `Unsupported plugin kind "${rawKind}". Supported kinds: ${registry.kinds().join(', ')}.`,
      { kind: rawKind, supportedKinds: registry.kinds() },
    );
  }

  return rawKind as PluginKind;
}

function resolveSagaStoreBackendOption(
  kind: PluginKind,
  backend: SagaStoreBackend | undefined,
): SagaStoreBackend | undefined {
  if (kind !== 'saga') {
    if (backend !== undefined) {
      throw new ScaffoldValidationError('--saga-store-backend can only be used with saga plugins.', {
        kind,
      });
    }
    return undefined;
  }
  return backend ?? 'kv';
}

async function assertPluginNameAvailable(
  projectRoot: string,
  pluginName: string,
  provider: PluginInstallPlan['provider'],
  fs: FileSystemPort,
  overwrite: boolean,
): Promise<void> {
  validateResourceName(pluginName, 'plugin');

  const pluginDir = join(projectRoot, SCAFFOLD_DIRS.PLUGINS, pluginName);
  if (!overwrite && await fs.exists(pluginDir)) {
    throw new ScaffoldValidationError(
      `Plugin "${pluginName}" already exists at ${pluginDir}.`,
      { pluginName, pluginDir },
    );
  }

  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(appsettingsPath)) {
    return;
  }

  const raw = JSON.parse(await fs.readFile(appsettingsPath)) as ExistingPluginConfigShape;
  const companionServiceKey = provider.category === 'background-processor' &&
      provider.defaultServiceEntrypoint
    ? `${pluginName}-api`
    : pluginName;
  const plugins = raw.NetScript?.Plugins ?? {};
  const existsInPlugins = pluginName in plugins || companionServiceKey in plugins;
  const existsInBackground = pluginName in (raw.NetScript?.BackgroundProcessors ?? {});

  if (!overwrite && (existsInPlugins || existsInBackground)) {
    throw new ScaffoldValidationError(
      `Plugin "${pluginName}" is already registered in ${SCAFFOLD_FILES.APPSETTINGS}.`,
      { pluginName, companionServiceKey, existsInPlugins, existsInBackground },
    );
  }
}

async function readProjectName(fs: FileSystemPort, projectRoot: string): Promise<string> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (await fs.exists(appsettingsPath)) {
    const parsed = JSON.parse(await fs.readFile(appsettingsPath)) as unknown;
    const name = asRecord(asRecord(parsed).NetScript).Name;
    if (typeof name === 'string') {
      return name;
    }
  }
  return projectRoot.split(/[\\/]/).pop() ?? 'app';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
