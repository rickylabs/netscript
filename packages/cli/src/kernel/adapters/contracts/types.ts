/**
 * @module infra/contracts/types
 *
 * Public contracts for the CLI contract scaffolding capability.
 */

import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';

/** Supported contract versions. */
export type ContractVersion = 'v1';

/** Default version for newly scaffolded contracts. */
export const DEFAULT_CONTRACT_VERSION: ContractVersion = 'v1';

/** Base options shared by contract scaffold operations. */
export interface ContractScaffoldOptions {
  /** Project name used to derive the scoped contracts package. */
  readonly projectName: string;

  /** Absolute path to the project root. */
  readonly targetPath: string;

  /** Import mode for generated package dependency maps. */
  readonly importMode: PackageSourceMode;

  /** Depth-adjusted local base path for local import mode. */
  readonly localBase?: string;

  /** Whether existing files may be overwritten. */
  readonly force?: boolean;

  /** Additional import-map entries for generated contracts. */
  readonly imports?: Readonly<Record<string, string>>;
}

/** Options for a service-paired contract file. */
export interface ServiceContractOptions {
  /** Service name in kebab-case. */
  readonly serviceName: string;

  /** Prisma domain model name associated with the service. */
  readonly modelName?: string;

  /** Version directory to target. */
  readonly version: ContractVersion;
}

/** Request for a contract scaffold operation. */
export interface ContractScaffoldRequest {
  /** Base scaffold options. */
  readonly options: ContractScaffoldOptions;

  /** Optional service-paired contract to create. */
  readonly serviceContract?: ServiceContractOptions;
}

/** Result of a contract scaffold operation. */
export interface ContractScaffoldResult {
  /** Standard scaffold result for file tracking. */
  readonly scaffoldResult: ScaffoldResult;

  /** Absolute path to the contracts root directory. */
  readonly contractsRoot: string;

  /** Package name written to contracts/deno.json. */
  readonly packageName: string;

  /** Version directories created or updated. */
  readonly versions: readonly ContractVersion[];

  /** Service contract files created by the operation. */
  readonly serviceContracts: readonly string[];
}

/** A discovered contract file in a version directory. */
export interface DiscoveredContract {
  /** File name without `.contract.ts`. */
  readonly name: string;

  /** Contract version directory. */
  readonly version: ContractVersion;

  /** Absolute path to the contract file. */
  readonly filePath: string;

  /** Whether a matching service directory exists. */
  readonly hasService: boolean;
}

/** Discovered contracts for one version directory. */
export interface DiscoveredVersion {
  /** Version identifier. */
  readonly version: ContractVersion;

  /** Contracts discovered in that version. */
  readonly contracts: readonly DiscoveredContract[];

  /** Absolute path to the version aggregate module. */
  readonly modPath: string;
}

/** Registry for static contract template content. */
export interface ContractTemplateRegistry {
  /** Get the service contract template. */
  getContractTemplate(): string;

  /** Get the root contracts/mod.ts template. */
  getRootModTemplate(): string;
}
