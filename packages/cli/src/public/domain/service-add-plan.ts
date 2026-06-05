import type { ContractScaffoldResult } from '../../kernel/adapters/contracts/types.ts';
import type { PortAllocation, ServiceScaffoldResult } from '../../kernel/domain/service-shape.ts';

/** User request for adding one service workspace. */
export interface ServiceAddRequest {
  /** Service name in kebab-case. */
  readonly serviceName: string;

  /** Optional explicit service port. */
  readonly port?: number;

  /** Peer service references. */
  readonly serviceReferences: readonly string[];

  /** Absolute project root. */
  readonly projectRoot: string;

  /** Whether existing generated files may be overwritten. */
  readonly overwrite: boolean;
}

/** Planned service addition with project metadata resolved. */
export interface ServiceAddPlan extends ServiceAddRequest {
  /** Project name used for generated package names. */
  readonly projectName: string;

  /** Allocated service port. */
  readonly allocation: PortAllocation;
}

/** Files produced while rendering a service workspace. */
export interface ServiceRenderResult {
  /** Contract files generated for the service. */
  readonly contract: ContractScaffoldResult;

  /** Service workspace files generated for the service. */
  readonly service: ServiceScaffoldResult;
}

/** Result of the public add-service application flow. */
export interface AddServiceResult extends ServiceRenderResult {
  /** AppHost helper files regenerated after config mutation. */
  readonly helperFiles: readonly string[];
}
