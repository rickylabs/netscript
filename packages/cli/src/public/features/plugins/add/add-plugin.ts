import { copyPluginSchemasToRootDb } from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { AddPluginResult } from '../../../domain/plugin-add-plan.ts';
import type { AddPluginInput } from './add-plugin-input.ts';
import { planPluginAdd } from './plan-plugin-add.ts';
import { renderPlugin, type RenderPluginDependencies } from './render-plugin.ts';

/** Dependencies used by the public add-plugin flow. */
export interface AddPluginDependencies extends RenderPluginDependencies {
  /** Plugin kind registry. */
  readonly registry?: PluginKindRegistry;

  /** Workspace config mutator for root project updates. */
  readonly workspaceMutator: PluginWorkspaceMutator;

  /** Filesystem used by AppHost helper regeneration. */
  readonly fs: FileSystemPort;

  /** Scaffold writer used by AppHost helper regeneration. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer used by AppHost helper regeneration. */
  readonly templateAdapter: TemplatePort;

  /** Helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
  ) => Promise<readonly string[]>;
}

/** Add a starter plugin workspace to an existing NetScript project. */
export async function addPlugin(
  request: AddPluginInput,
  dependencies: AddPluginDependencies,
): Promise<AddPluginResult> {
  const registry = dependencies.registry ?? new PluginKindRegistry();
  const plan = await planPluginAdd(request, {
    fs: dependencies.fs,
    registry,
  });
  const rendered = await renderPlugin(plan, dependencies);

  const schemaCopies = await copyPluginSchemasToRootDb(
    plan.projectRoot,
    plan.pluginName,
    plan.dbDetection,
    { fs: dependencies.fs, scaffolder: dependencies.scaffolder },
    { overwrite: plan.overwrite },
  );
  await dependencies.workspaceMutator.updateAppsettings(
    plan.projectRoot,
    rendered.plugin,
    plan.provider,
    {
      serviceReferences: plan.serviceReferences,
      pluginReferences: plan.pluginReferences,
    },
  );
  await dependencies.workspaceMutator.ensureNetScriptConfigPlugin(
    plan.projectRoot,
    plan.pluginName,
  );
  const provisionedCache = plan.provider.defaultRequiresKv
    ? await dependencies.workspaceMutator.ensureSharedCache(plan.projectRoot)
    : false;

  await dependencies.workspaceMutator.ensureWorkspaceMember(plan.projectRoot);

  const regenerateHelpers = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerateHelpers(
    plan.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );

  return {
    ...rendered,
    provisionedCache,
    schemaCopies,
    helperFiles,
  };
}
