import { join } from '@std/path';

import { provisionDatabaseIfNeeded } from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { generatePluginServiceContext } from '../../../../kernel/templates/plugins/plugin-generators.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type {
  PluginInstallPlan,
  PluginRenderSupportResult,
} from '../../../domain/plugin-install-plan.ts';

/** Dependencies used to render starter plugin files. */
export interface RenderPluginDependencies {
  /** Filesystem used for registry bootstrap checks. */
  readonly fs: FileSystemPort;

  /** Scaffold file writer. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer used by database provisioning. */
  readonly templateAdapter: TemplatePort;

  /** Empty plugin registry scaffolder. */
  readonly registryScaffolder: PluginRegistryScaffolder;
}

/** Render CLI-owned plugin workspace support files without rendering plugin artifacts. */
export async function renderPluginSupport(
  plan: PluginInstallPlan,
  dependencies: RenderPluginDependencies,
  options: {
    readonly importMode: 'jsr' | 'local';
    readonly localBase?: string;
  },
): Promise<PluginRenderSupportResult> {
  const provisionedDatabase = await provisionDatabaseIfNeeded(
    plan.projectRoot,
    plan.dbDetection,
    {
      projectName: plan.projectName,
      importMode: options.importMode,
      localBase: options.localBase,
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

  return {
    registryFilesCreated,
    wroteServiceContext,
    provisionedDatabase,
  };
}

async function ensurePluginRegistry(
  plan: PluginInstallPlan,
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
