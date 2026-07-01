import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { DatabaseScaffolder } from '../../adapters/database/scaffolder.ts';
import { createContractScaffolder } from '../../adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../adapters/contracts/templates/contract-template-registry.ts';
import { ServiceScaffolder } from '../../adapters/service/scaffolder.ts';
import { PluginRegistryScaffolder } from '../../adapters/plugin/registry-scaffolder.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitPipelineContext } from './context.ts';
import { adjustLocalBase, emptyScaffoldResult, isDbEngine } from './support/helpers.ts';

function contractDatabaseImports(options: ValidatedInitOptions): Record<string, string> | undefined {
  if (!isDbEngine(options.dbEngine)) {
    return undefined;
  }
  return {
    '@database/zod':
      `../${SCAFFOLD_DIRS.DATABASE}/${options.dbEngine}/schema/.generated/zod/crud.ts`,
  };
}

export async function scaffoldDatabase(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  if (!isDbEngine(options.dbEngine)) {
    return emptyScaffoldResult();
  }

  const databaseScaffolder = new DatabaseScaffolder(
    context.scaffolder,
    context.fs,
    context.templateAdapter,
  );
  const result = await databaseScaffolder.scaffold({
    projectName: options.name,
    targetPath: options.targetPath,
    engine: options.dbEngine,
    modelName: options.modelName,
    importMode: options.importMode,
    localBase: options.localBase,
    overwrite: options.force,
  });

  return result.scaffoldResult;
}

export async function scaffoldContracts(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  const contractScaffolder = createContractScaffolder({
    scaffolder: context.scaffolder,
    templateAdapter: context.templateAdapter,
    templateRegistry: new DefaultContractTemplateRegistry(),
  });
  const result = await contractScaffolder.scaffoldFull({
    options: {
      projectName: options.name,
      targetPath: options.targetPath,
      importMode: options.importMode,
      localBase: options.localBase ? adjustLocalBase(options.localBase, 1) : undefined,
      force: options.force,
      imports: contractDatabaseImports(options),
    },
    serviceContract: options.includeExampleService && options.serviceName
      ? { serviceName: options.serviceName, modelName: options.modelName, version: SCAFFOLD_DIRS.V1 }
      : undefined,
  });

  return result.scaffoldResult;
}

export async function scaffoldServices(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  if (!options.includeExampleService || !options.serviceName || !options.servicePort) {
    return {
      filesCreated: [],
      directoriesCreated: [],
      filesSkipped: [],
      totalOperations: 0,
      durationMs: 0,
    };
  }

  const result = await new ServiceScaffolder(
    context.scaffolder,
    context.fs,
    context.templateAdapter,
  ).scaffold({
    projectName: options.name,
    targetPath: options.targetPath,
    serviceName: options.serviceName,
    servicePort: options.servicePort,
    importMode: options.importMode,
    localBase: options.localBase ? adjustLocalBase(options.localBase, 2) : undefined,
    packagesAsWorkspaceMembers: context.packagesAsWorkspaceMembers(options),
    force: options.force,
  });

  return result.scaffoldResult;
}

export function scaffoldPlugins(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  return new PluginRegistryScaffolder(context.scaffolder).scaffold({
    projectName: options.name,
    targetPath: options.targetPath,
    importMode: options.importMode,
    localBase: options.localBase,
    force: options.force,
  });
}
