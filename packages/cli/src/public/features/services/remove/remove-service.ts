import { join } from '@std/path';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import {
  regenerateAspireHelpers,
  removeServiceAppsettingsEntry,
  removeServiceWorkspaceMember,
} from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { findServiceClientPath } from '../../../../kernel/adapters/service/client-scaffolder.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Request for removing a service and optionally retaining its contracts. */
export interface RemoveServiceRequest {
  readonly name: string;
  readonly projectRoot: string;
  readonly keepContract: boolean;
}

/** Dependencies for reversing service-add workspace mutations. */
export interface RemoveServiceDependencies {
  readonly fs: FileSystemPort;
  readonly scaffolder: ScaffolderPort;
  readonly templateAdapter: TemplatePort;
  readonly regenerateHelpers?: typeof regenerateAspireHelpers;
}

/** Result of removing a service workspace. */
export interface RemoveServiceResult {
  readonly serviceDir: string;
  readonly removedContracts: readonly string[];
  readonly helperFiles: readonly string[];
}

/** Remove service files, config, workspace membership, and paired contracts. */
export async function removeService(
  request: RemoveServiceRequest,
  dependencies: RemoveServiceDependencies,
): Promise<RemoveServiceResult> {
  validateResourceName(request.name, 'service');
  const serviceDir = join(request.projectRoot, SCAFFOLD_DIRS.SERVICES, request.name);
  const removedConfig = await removeServiceAppsettingsEntry(
    request.projectRoot,
    request.name,
    dependencies.fs,
  );
  if (!await dependencies.fs.exists(serviceDir) && !removedConfig) {
    throw new ScaffoldValidationError(`Service "${request.name}" was not found.`);
  }
  if (await dependencies.fs.exists(serviceDir)) await dependencies.fs.remove(serviceDir);
  await removeServiceWorkspaceMember(request.projectRoot, request.name, dependencies.fs);
  const clientPath = await findServiceClientPath(
    request.projectRoot,
    request.name,
    dependencies.fs,
  );
  if (clientPath && await dependencies.fs.exists(clientPath)) {
    await dependencies.fs.remove(clientPath);
  }

  const removedContracts: string[] = [];
  if (!request.keepContract) {
    const resolver = new ContractWorkspaceResolver(dependencies.fs);
    const registry = new ContractVersionRegistry(dependencies.fs);
    const contractsRoot = join(request.projectRoot, SCAFFOLD_DIRS.CONTRACTS);
    for (const version of await resolver.discoverVersions(request.projectRoot)) {
      const contractPath = join(
        contractsRoot,
        SCAFFOLD_DIRS.VERSIONS,
        version,
        `${request.name}.contract.ts`,
      );
      if (!await dependencies.fs.exists(contractPath)) continue;
      await dependencies.fs.remove(contractPath);
      removedContracts.push(contractPath);
      await registry.regenerate(contractsRoot, version);
    }
    await registry.regenerateRoot(contractsRoot);
  }

  const regenerate = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerate(
    request.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );
  return { serviceDir, removedContracts, helperFiles };
}
