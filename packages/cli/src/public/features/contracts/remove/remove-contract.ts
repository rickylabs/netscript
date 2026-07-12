import { join } from '@std/path';
import type { ContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Request for removing a contract from one or every version. */
export interface RemoveContractRequest {
  readonly name: string;
  readonly projectRoot: string;
  readonly version?: ContractVersion;
}

/** Dependencies for contract removal. */
export interface RemoveContractDependencies {
  readonly fs: FileSystemPort;
  readonly registry: ContractVersionRegistry;
  readonly resolver: ContractWorkspaceResolver;
}

/** Remove matching contract files and regenerate affected aggregates. */
export async function removeContract(
  request: RemoveContractRequest,
  dependencies: RemoveContractDependencies,
): Promise<readonly string[]> {
  validateResourceName(request.name, 'contract');
  const versions = request.version
    ? [request.version]
    : await dependencies.resolver.discoverVersions(request.projectRoot);
  const contractsRoot = join(request.projectRoot, SCAFFOLD_DIRS.CONTRACTS);
  const removed: string[] = [];
  for (const version of versions) {
    const path = join(
      contractsRoot,
      SCAFFOLD_DIRS.VERSIONS,
      version,
      `${request.name}.contract.ts`,
    );
    if (!await dependencies.fs.exists(path)) continue;
    await dependencies.fs.remove(path);
    removed.push(path);
    await dependencies.registry.regenerate(contractsRoot, version);
  }
  if (removed.length === 0) {
    throw new ScaffoldValidationError(`Contract "${request.name}" was not found.`, {
      name: request.name,
      projectRoot: request.projectRoot,
      version: request.version,
    });
  }
  await dependencies.registry.regenerateRoot(contractsRoot);
  return removed;
}
