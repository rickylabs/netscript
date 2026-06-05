import { join } from '@std/path';

import { provisionDatabaseIfNeeded } from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../../kernel/adapters/plugin/scaffolder.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { generatePluginServiceContext } from '../../../../kernel/templates/plugins/plugin-generators.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { PluginAddPlan, PluginRenderResult } from '../../../domain/plugin-add-plan.ts';

/** Dependencies used to render starter plugin files. */
export interface RenderPluginDependencies {
  /** Filesystem used for registry bootstrap checks. */
  readonly fs: FileSystemPort;

  /** Scaffold file writer. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer used by database provisioning. */
  readonly templateAdapter: TemplatePort;

  /** Starter plugin scaffolder. */
  readonly pluginScaffolder: PluginScaffolder;

  /** Empty plugin registry scaffolder. */
  readonly registryScaffolder: PluginRegistryScaffolder;
}

/** Render starter plugin workspace files and any required supporting files. */
export async function renderPlugin(
  plan: PluginAddPlan,
  dependencies: RenderPluginDependencies,
): Promise<PluginRenderResult> {
  const provisionedDatabase = await provisionDatabaseIfNeeded(
    plan.projectRoot,
    plan.dbDetection,
    {
      projectName: plan.projectName,
      importMode: 'jsr',
      overwrite: plan.overwrite,
    },
    {
      fs: dependencies.fs,
      scaffolder: dependencies.scaffolder,
      templateAdapter: dependencies.templateAdapter,
    },
  );
  const wroteServiceContext = await ensurePluginServiceContext(
    plan.projectRoot,
    dependencies.scaffolder,
    plan.overwrite,
  );
  const registryFilesCreated = await ensurePluginRegistry(plan, dependencies);
  const plugin = await dependencies.pluginScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    kind: plan.kind,
    pluginName: plan.pluginName,
    importMode: 'jsr',
    port: plan.port,
    serviceReferences: plan.serviceReferences,
    pluginReferences: plan.pluginReferences,
    requiresDb: plan.dbDetection.requiresDb,
    includeSamples: plan.includeSamples,
    force: plan.overwrite,
  });

  return {
    plugin,
    registryFilesCreated,
    wroteServiceContext,
    provisionedDatabase,
  };
}

async function ensurePluginRegistry(
  plan: PluginAddPlan,
  dependencies: RenderPluginDependencies,
): Promise<number> {
  if (!await needsRegistryBootstrap(plan.projectRoot, dependencies.fs)) {
    return 0;
  }

  const registryResult = await dependencies.registryScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    importMode: 'jsr',
    force: false,
  });
  return registryResult.filesCreated.length;
}

async function needsRegistryBootstrap(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<boolean> {
  const pluginsRoot = join(projectRoot, SCAFFOLD_DIRS.PLUGINS);
  const requiredFiles = [
    join(pluginsRoot, SCAFFOLD_FILES.DENO_JSON),
    join(pluginsRoot, SCAFFOLD_FILES.MOD),
  ];

  if (!await fs.exists(pluginsRoot)) {
    return true;
  }

  for (const path of requiredFiles) {
    if (!await fs.exists(path)) {
      return true;
    }
  }

  return false;
}

async function ensurePluginServiceContext(
  projectRoot: string,
  scaffolder: ScaffolderPort,
  overwrite: boolean,
): Promise<boolean> {
  const sharedDir = join(projectRoot, SCAFFOLD_DIRS.SERVICES, '_shared');
  await scaffolder.createDir(sharedDir);
  return await scaffolder.writeFile(
    join(sharedDir, 'plugin-service-context.ts'),
    generatePluginServiceContext(),
    overwrite,
  );
}
