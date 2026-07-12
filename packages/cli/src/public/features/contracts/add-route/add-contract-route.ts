import { join } from '@std/path';
import {
  appendContractRoute,
  CONTRACT_HTTP_METHODS,
  type ContractHttpMethod,
} from '../../../../kernel/adapters/contracts/contract-source.ts';
import type { ContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Request for adding one typed contract route. */
export interface AddContractRouteRequest {
  readonly contract: string;
  readonly procedure: string;
  readonly method: string;
  readonly path: string;
  readonly input?: string;
  readonly output?: string;
  readonly version: ContractVersion;
  readonly projectRoot: string;
}

/** Add a typed oRPC route stub to an existing contract. */
export async function addContractRoute(
  request: AddContractRouteRequest,
  fs: FileSystemPort,
): Promise<string> {
  validateResourceName(request.contract, 'contract');
  const method = request.method.toUpperCase();
  if (!CONTRACT_HTTP_METHODS.includes(method as ContractHttpMethod)) {
    throw new ScaffoldValidationError(
      `Unsupported HTTP method "${request.method}". Expected ${CONTRACT_HTTP_METHODS.join(', ')}.`,
    );
  }
  const contractPath = join(
    request.projectRoot,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_DIRS.VERSIONS,
    request.version,
    `${request.contract}.contract.ts`,
  );
  if (!await fs.exists(contractPath)) {
    throw new ScaffoldValidationError(
      `Contract "${request.contract}" was not found in ${request.version}.`,
      { contractPath },
    );
  }
  const source = await fs.readFile(contractPath);
  await fs.writeFile(contractPath, appendContractRoute(
    source,
    request.contract,
    request.version,
    request.procedure,
    method as ContractHttpMethod,
    request.path,
    request.input,
    request.output,
  ));
  return contractPath;
}
