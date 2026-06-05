/**
 * @module infra/contracts/contract-scaffolder
 *
 * Reusable contract scaffolding functions for init and contract commands.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import {
  type ContractScaffoldOptions,
  type ContractScaffoldRequest,
  type ContractScaffoldResult,
  type ContractTemplateRegistry,
  DEFAULT_CONTRACT_VERSION,
  type ServiceContractOptions,
} from './types.ts';
import {
  generateContractsDenoJson,
  generateV1Mod,
} from './templates/contract-template-registry.ts';
import { ContractVersionRegistry } from './version-registry.ts';
import { ContractWorkspaceResolver } from './workspace-resolver.ts';

/** Dependencies required to scaffold and extend contract workspaces. */
export interface ContractScaffoldDependencies {
  /** Filesystem-backed scaffold operations. */
  readonly scaffolder: ScaffolderPort;
  /** Template renderer used for service contract files. */
  readonly templateAdapter: TemplatePort;
  /** Static contract template registry. */
  readonly templateRegistry: ContractTemplateRegistry;
  /** Optional version aggregate registry. */
  readonly versionRegistry?: ContractVersionRegistry;
  /** Optional workspace membership resolver. */
  readonly workspaceResolver?: ContractWorkspaceResolver;
}

/** Contract workspace operations used by public application flows. */
export interface ContractScaffoldService {
  /** Scaffold the full contracts directory tree for `netscript init`. */
  scaffoldFull(request: ContractScaffoldRequest): Promise<ContractScaffoldResult>;

  /** Add a service contract to an existing contracts workspace. */
  addServiceContract(
    options: ContractScaffoldOptions,
    serviceContract: ServiceContractOptions,
  ): Promise<ContractScaffoldResult>;
}

/** Create contract workspace operations from explicit ports and registries. */
export function createContractScaffolder(
  dependencies: ContractScaffoldDependencies,
): ContractScaffoldService {
  const {
    scaffolder,
    templateAdapter,
    templateRegistry,
    versionRegistry,
    workspaceResolver,
  } = dependencies;

  async function writeTracked(
    path: string,
    content: string,
    force: boolean | undefined,
    filesCreated: string[],
    filesSkipped: string[],
  ): Promise<void> {
    if (await scaffolder.writeFile(path, content, force ?? false)) {
      filesCreated.push(path);
    } else {
      filesSkipped.push(path);
    }
  }

  async function writeServiceContract(
    versionDir: string,
    serviceContract: ServiceContractOptions,
    force: boolean | undefined,
    filesCreated: string[],
    filesSkipped: string[],
  ): Promise<string> {
    const contractContent = await templateAdapter.render(
      templateRegistry.getContractTemplate(),
      { serviceName: serviceContract.serviceName },
    );
    const contractPath = join(versionDir, `${serviceContract.serviceName}.contract.ts`);
    await writeTracked(contractPath, contractContent, force, filesCreated, filesSkipped);
    return contractPath;
  }

  function result(
    filesCreated: string[],
    directoriesCreated: string[],
    filesSkipped: string[],
    start: number,
  ): ScaffoldResult {
    return {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: performance.now() - start,
    };
  }

  return {
    async scaffoldFull(
      request: ContractScaffoldRequest,
    ): Promise<ContractScaffoldResult> {
      const start = performance.now();
      const { options, serviceContract } = request;
      const contractsRoot = join(options.targetPath, SCAFFOLD_DIRS.CONTRACTS);
      const versionsDir = join(contractsRoot, SCAFFOLD_DIRS.VERSIONS);
      const v1Dir = join(versionsDir, SCAFFOLD_DIRS.V1);
      const filesCreated: string[] = [];
      const directoriesCreated: string[] = [];
      const filesSkipped: string[] = [];
      const serviceContracts: string[] = [];

      for (const dir of [contractsRoot, versionsDir, v1Dir]) {
        await scaffolder.createDir(dir);
        directoriesCreated.push(dir);
      }

      const packageName = `@${options.projectName}/contracts`;
      await writeTracked(
        join(contractsRoot, SCAFFOLD_FILES.DENO_JSON),
        generateContractsDenoJson({
          packageName,
          importMode: options.importMode,
          localBase: options.localBase,
        }),
        options.force,
        filesCreated,
        filesSkipped,
      );

      await writeTracked(
        join(contractsRoot, SCAFFOLD_FILES.MOD),
        templateRegistry.getRootModTemplate(),
        options.force,
        filesCreated,
        filesSkipped,
      );

      await writeTracked(
        join(v1Dir, SCAFFOLD_FILES.MOD),
        generateV1Mod({
          serviceNames: serviceContract ? [serviceContract.serviceName] : [],
        }),
        options.force,
        filesCreated,
        filesSkipped,
      );

      if (serviceContract) {
        const contractPath = await writeServiceContract(
          v1Dir,
          serviceContract,
          options.force,
          filesCreated,
          filesSkipped,
        );
        serviceContracts.push(contractPath);
      }

      return {
        scaffoldResult: result(filesCreated, directoriesCreated, filesSkipped, start),
        contractsRoot,
        packageName,
        versions: [DEFAULT_CONTRACT_VERSION],
        serviceContracts,
      };
    },

    async addServiceContract(
      options: ContractScaffoldOptions,
      serviceContract: ServiceContractOptions,
    ): Promise<ContractScaffoldResult> {
      const start = performance.now();
      const contractsRoot = join(options.targetPath, SCAFFOLD_DIRS.CONTRACTS);
      const versionDir = join(
        contractsRoot,
        SCAFFOLD_DIRS.VERSIONS,
        serviceContract.version,
      );
      const filesCreated: string[] = [];
      const filesSkipped: string[] = [];
      const serviceContracts: string[] = [];

      await workspaceResolver?.ensureContractsWorkspaceMember(options.targetPath);

      const contractPath = await writeServiceContract(
        versionDir,
        serviceContract,
        options.force,
        filesCreated,
        filesSkipped,
      );
      serviceContracts.push(contractPath);

      if (versionRegistry) {
        const modPath = await versionRegistry.regenerate(
          contractsRoot,
          serviceContract.version,
        );
        filesCreated.push(modPath);
      } else {
        await writeTracked(
          join(versionDir, SCAFFOLD_FILES.MOD),
          generateV1Mod({ serviceNames: [serviceContract.serviceName] }),
          true,
          filesCreated,
          filesSkipped,
        );
      }

      return {
        scaffoldResult: result(filesCreated, [], filesSkipped, start),
        contractsRoot,
        packageName: `@${options.projectName}/contracts`,
        versions: [serviceContract.version],
        serviceContracts,
      };
    },
  };
}
