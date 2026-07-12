import { join } from '@std/path';
import { inspectContractSource } from '../../../../kernel/adapters/contracts/contract-source.ts';
import type {
  ContractProcedure,
  ContractVersion,
} from '../../../../kernel/adapters/contracts/types.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Structured contract inspection result consumed by text and JSON output. */
export interface ContractInspection {
  readonly name: string;
  readonly version: ContractVersion;
  readonly filePath: string;
  readonly procedures: readonly ContractProcedure[];
}

/** Inspect route metadata from one generated contract source file. */
export async function inspectContract(
  name: string,
  version: ContractVersion,
  projectRoot: string,
  fs: FileSystemPort,
): Promise<ContractInspection> {
  validateResourceName(name, 'contract');
  const filePath = join(
    projectRoot,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_DIRS.VERSIONS,
    version,
    `${name}.contract.ts`,
  );
  if (!await fs.exists(filePath)) {
    throw new ScaffoldValidationError(`Contract "${name}" was not found in ${version}.`, {
      filePath,
    });
  }
  return {
    name,
    version,
    filePath,
    procedures: inspectContractSource(await fs.readFile(filePath)),
  };
}
