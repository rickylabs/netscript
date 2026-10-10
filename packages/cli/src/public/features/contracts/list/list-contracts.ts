/**
 * @module public/features/contracts/list
 *
 * Contract discovery and text formatting for `netscript contract list`.
 */

import type {
  ContractVersion,
  DiscoveredContract,
  DiscoveredVersion,
} from '../../../../kernel/adapters/contracts/types.ts';
import type { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';

/**
 * Labels for the `services/<name>/` directory probe.
 *
 * The probe only checks the filesystem, so the labels describe a directory and never claim that a
 * handler is registered or served.
 */
export const SERVICE_DIRECTORY_LABELS = {
  present: 'service directory present',
  absent: 'no service directory',
} as const;

/** Line printed when a resolved workspace has no contracts. */
export const NO_CONTRACTS_FOUND = 'No contracts found.';

/** Request for listing workspace contracts. */
export interface ListContractsRequest {
  /** Directory to search upward from. Defaults to the current working directory. */
  readonly path?: string;
  /** Only list this contract version. */
  readonly version?: ContractVersion;
}

/** Dependencies for contract listing. */
export interface ListContractsDependencies {
  /** Resolve the workspace root from a start directory, or `null` when none is found. */
  readonly findProjectRoot: (startDir?: string) => Promise<string | null>;
  /** Contracts workspace inspector. */
  readonly resolver: ContractWorkspaceResolver;
}

/**
 * Discover the contracts in each requested version.
 *
 * @throws {ScaffoldValidationError} When the workspace root, its contracts workspace, or the
 *   requested version cannot be resolved. An unresolved workspace is never reported as an empty
 *   or successful listing.
 */
export async function listContracts(
  request: ListContractsRequest,
  dependencies: ListContractsDependencies,
): Promise<readonly DiscoveredVersion[]> {
  const projectRoot = await dependencies.findProjectRoot(request.path);
  if (projectRoot === null) {
    throw new ScaffoldValidationError(
      'NetScript workspace root not found. Run this command inside a workspace or pass --path.',
      { path: request.path },
    );
  }
  const versions = request.version
    ? [request.version]
    : await dependencies.resolver.discoverVersions(projectRoot);
  return await Promise.all(
    versions.map((version) => dependencies.resolver.discoverVersion(projectRoot, version)),
  );
}

/** Describe the service-directory probe result for one contract. */
export function describeServiceDirectory(contract: DiscoveredContract): string {
  return contract.hasServiceDirectory
    ? SERVICE_DIRECTORY_LABELS.present
    : SERVICE_DIRECTORY_LABELS.absent;
}

/** Format discovered versions as the human-readable `contract list` lines. */
export function formatContractList(versions: readonly DiscoveredVersion[]): readonly string[] {
  const lines: string[] = [];
  let count = 0;
  for (const discovered of versions) {
    lines.push(`Contracts (${discovered.version})`);
    for (const contract of discovered.contracts) {
      count++;
      lines.push(`  ${contract.name}  ${describeServiceDirectory(contract)}`);
    }
  }
  if (count === 0) lines.push(NO_CONTRACTS_FOUND);
  return lines;
}
