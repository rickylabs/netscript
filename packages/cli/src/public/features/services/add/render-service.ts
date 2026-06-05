import type { ContractScaffoldService } from '../../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { DEFAULT_CONTRACT_VERSION } from '../../../../kernel/adapters/contracts/types.ts';
import { ServiceScaffolder } from '../../../../kernel/adapters/service/scaffolder.ts';
import type { ServiceAddPlan, ServiceRenderResult } from '../../../domain/service-add-plan.ts';

/** Dependencies used to render service and contract workspaces. */
export interface RenderServiceDependencies {
  /** Service-paired contract scaffolder. */
  readonly contractScaffolder: ContractScaffoldService;

  /** Service workspace scaffolder. */
  readonly serviceScaffolder: ServiceScaffolder;
}

/** Render the service workspace and matching v1 contract. */
export async function renderService(
  plan: ServiceAddPlan,
  dependencies: RenderServiceDependencies,
): Promise<ServiceRenderResult> {
  const contract = await dependencies.contractScaffolder.addServiceContract(
    {
      projectName: plan.projectName,
      targetPath: plan.projectRoot,
      importMode: 'jsr',
      force: plan.overwrite,
    },
    {
      serviceName: plan.serviceName,
      version: DEFAULT_CONTRACT_VERSION,
    },
  );
  const service = await dependencies.serviceScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    serviceName: plan.serviceName,
    servicePort: plan.allocation.port,
    importMode: 'jsr',
    serviceReferences: plan.serviceReferences,
    force: plan.overwrite,
  });

  return { contract, service };
}
