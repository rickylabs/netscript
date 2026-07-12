import { join } from '@std/path';
import { promoteContractSource } from '../../../../kernel/adapters/contracts/contract-source.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { AddContractVersionRequest } from './add-contract-version-input.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Dependencies for promoting a contract version. */
export interface AddContractVersionDependencies {
  readonly fs: FileSystemPort;
  readonly registry: ContractVersionRegistry;
}

/** Result of promoting one contract file. */
export interface AddContractVersionResult {
  readonly contractPath: string;
  readonly aggregatePath: string;
  readonly rootModPath: string;
}

/** Copy a contract to a new version and regenerate both aggregate levels. */
export async function addContractVersion(
  request: AddContractVersionRequest,
  dependencies: AddContractVersionDependencies,
): Promise<AddContractVersionResult> {
  validateResourceName(request.name, 'contract');
  if (request.from === request.to) {
    throw new ScaffoldValidationError('--from and --to must name different versions.');
  }
  const contractsRoot = join(request.projectRoot, SCAFFOLD_DIRS.CONTRACTS);
  const sourcePath = join(
    contractsRoot,
    SCAFFOLD_DIRS.VERSIONS,
    request.from,
    `${request.name}.contract.ts`,
  );
  const targetDir = join(contractsRoot, SCAFFOLD_DIRS.VERSIONS, request.to);
  const targetPath = join(targetDir, `${request.name}.contract.ts`);
  if (!await dependencies.fs.exists(sourcePath)) {
    throw new ScaffoldValidationError(
      `Contract "${request.name}" was not found in ${request.from}.`,
      { sourcePath },
    );
  }
  if (await dependencies.fs.exists(targetPath) && !request.force) {
    throw new ScaffoldValidationError(
      `Contract "${request.name}" already exists in ${request.to}. Pass --force to replace it.`,
      { targetPath },
    );
  }
  await dependencies.fs.createDir(targetDir);
  const source = await dependencies.fs.readFile(sourcePath);
  await dependencies.fs.writeFile(
    targetPath,
    promoteContractSource(source, request.from, request.to),
  );
  const aggregatePath = await dependencies.registry.regenerate(contractsRoot, request.to);
  const rootModPath = await dependencies.registry.regenerateRoot(contractsRoot);
  return { contractPath: targetPath, aggregatePath, rootModPath };
}
