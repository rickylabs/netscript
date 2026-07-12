/**
 * @module infra/contracts/types
 *
 * Public contracts for the CLI contract scaffolding capability.
 */

import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';

/** Valid version directory names for workspace contracts. */
export type ContractVersion = `v${number}`;

/** Default version for newly scaffolded contracts. */
export const DEFAULT_CONTRACT_VERSION: ContractVersion = 'v1';

/** Parse and validate a contract version supplied by a user or directory name. */
export function parseContractVersion(value: string): ContractVersion {
  if (!/^v[1-9]\d*$/.test(value)) {
    throw new Error(`Invalid contract version "${value}". Expected v1, v2, and so on.`);
  }
  return value as ContractVersion;
}

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

  /** Whether this contract should target the database-backed CRUD surface. */
  readonly hasDatabase?: boolean;

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

/** Inspectable route metadata for one contract procedure. */
export interface ContractProcedure {
  /** Procedure property name inside the contract object. */
  readonly name: string;
  /** HTTP method declared by the route. */
  readonly method: string;
  /** Explicit REST path, or null when oRPC derives it. */
  readonly path: string | null;
  /** Input schema source summary, or null when omitted. */
  readonly input: string | null;
  /** Output schema source summary, or null when omitted. */
  readonly output: string | null;
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

  /** Get the no-database in-memory service contract template. */
  getMemoryContractTemplate(): string;

  /** Get the root contracts/mod.ts template. */
  getRootModTemplate(): string;
}
