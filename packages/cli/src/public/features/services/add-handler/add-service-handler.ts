import { join } from '@std/path';
import { inspectContractSource } from '../../../../kernel/adapters/contracts/contract-source.ts';
import type { ContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { appendServiceHandler } from '../../../../kernel/adapters/service/router-source.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';

/** Request for binding a contract procedure in a service router. */
export interface AddServiceHandlerRequest {
  readonly service: string;
  readonly procedure: string;
  readonly version: ContractVersion;
  readonly projectRoot: string;
}

/** Append a compiling handler stub after verifying the contract procedure. */
export async function addServiceHandler(
  request: AddServiceHandlerRequest,
  fs: FileSystemPort,
): Promise<string> {
  validateResourceName(request.service, 'service');
  const contractPath = join(
    request.projectRoot,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_DIRS.VERSIONS,
    request.version,
    `${request.service}.contract.ts`,
  );
  const routerPath = join(
    request.projectRoot,
    SCAFFOLD_DIRS.SERVICES,
    request.service,
    'src',
    'routers',
    `${request.version}.ts`,
  );
  if (!await fs.exists(contractPath)) {
    throw new ScaffoldValidationError(
      `Contract "${request.service}" was not found in ${request.version}.`,
    );
  }
  if (!await fs.exists(routerPath)) {
    throw new ScaffoldValidationError(
      `Service router for "${request.service}" ${request.version} was not found.`,
    );
  }
  const procedures = inspectContractSource(await fs.readFile(contractPath));
  if (!procedures.some((procedure) => procedure.name === request.procedure)) {
    throw new ScaffoldValidationError(
      `Procedure "${request.procedure}" was not found in ${request.service} ${request.version}.`,
    );
  }
  const source = await fs.readFile(routerPath);
  await fs.writeFile(routerPath, appendServiceHandler(
    source,
    request.service,
    request.procedure,
    request.version,
  ));
  return routerPath;
}
