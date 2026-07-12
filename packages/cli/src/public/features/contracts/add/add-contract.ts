import { join } from '@std/path';
import type { ContractScaffoldResult } from '../../../../kernel/adapters/contracts/types.ts';
import { DEFAULT_CONTRACT_VERSION } from '../../../../kernel/adapters/contracts/types.ts';
import type { ContractScaffoldService } from '../../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_VALIDATION } from '../../../../kernel/constants/scaffold/scaffold-validation.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';

/** Input for adding a contract to an existing workspace. */
export interface AddContractRequest {
  readonly name: string;
  readonly projectRoot: string;
  readonly force: boolean;
}

/** Dependencies used by the add-contract application flow. */
export interface AddContractDependencies {
  readonly fs: FileSystemPort;
  readonly contractScaffolder: ContractScaffoldService;
}

function assertContractName(name: string): void {
  if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(name)) {
    throw new ScaffoldValidationError(
      `Invalid contract name "${name}". Names must be kebab-case and start with a letter.`,
      { name },
    );
  }
}

async function readProjectName(projectRoot: string, fs: FileSystemPort): Promise<string> {
  const contractsDenoJson = join(
    projectRoot,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_FILES.DENO_JSON,
  );
  const content = await fs.readFile(contractsDenoJson);
  const config = JSON.parse(content) as Record<string, unknown>;
  const packageName = typeof config.name === 'string' ? config.name : undefined;
  const match = packageName?.match(/^@([^/]+)\/contracts$/);
  if (!match) {
    throw new ScaffoldValidationError(
      `Unable to infer project name from ${contractsDenoJson}. Expected @<project>/contracts.`,
      { packageName },
    );
  }
  return match[1];
}

/** Add a v1 contract file and regenerate its version aggregate. */
export async function addContract(
  request: AddContractRequest,
  dependencies: AddContractDependencies,
): Promise<ContractScaffoldResult> {
  assertContractName(request.name);
  const projectName = await readProjectName(request.projectRoot, dependencies.fs);

  return await dependencies.contractScaffolder.addServiceContract(
    {
      projectName,
      targetPath: request.projectRoot,
      importMode: 'jsr',
      force: request.force,
    },
    {
      serviceName: request.name,
      version: DEFAULT_CONTRACT_VERSION,
    },
  );
}
