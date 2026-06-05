/**
 * @module infra/contracts/workspace-resolver
 *
 * Workspace discovery and membership helpers for contracts.
 */

import { join } from '@std/path';
import { addWorkspaceMember } from '../../adapters/scaffold/workspace-writer.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ContractVersion, DiscoveredContract, DiscoveredVersion } from './types.ts';

/** Resolve and inspect a workspace's contracts area. */
export class ContractWorkspaceResolver {
  /** Create a new resolver. */
  constructor(private readonly fs: FileSystemPort) {}

  /**
   * Ensure `contracts` is present in root `deno.json` workspace members.
   *
   * @param rootPath - Absolute project root.
   */
  async ensureContractsWorkspaceMember(rootPath: string): Promise<void> {
    const denoJsonPath = join(rootPath, SCAFFOLD_FILES.DENO_JSON);
    const content = await this.fs.readFile(denoJsonPath);
    const config = JSON.parse(content) as Record<string, unknown>;
    const workspace = (config.workspace ?? []) as string[];
    const normalized = `./${SCAFFOLD_DIRS.CONTRACTS}`;

    if (!workspace.includes(normalized) && !workspace.includes(SCAFFOLD_DIRS.CONTRACTS)) {
      await addWorkspaceMember(rootPath, SCAFFOLD_DIRS.CONTRACTS, this.fs);
    }
  }

  /**
   * Discover contracts for a supported version.
   *
   * @param rootPath - Absolute project root.
   * @param version - Contract version to inspect.
   * @returns Discovered version details.
   */
  async discoverVersion(
    rootPath: string,
    version: ContractVersion,
  ): Promise<DiscoveredVersion> {
    const contractsRoot = join(rootPath, SCAFFOLD_DIRS.CONTRACTS);
    const versionDir = join(contractsRoot, SCAFFOLD_DIRS.VERSIONS, version);

    if (!await this.fs.exists(versionDir)) {
      throw new ScaffoldValidationError(
        `Contracts workspace not found at ${versionDir}. Run netscript init first.`,
        { rootPath, version },
      );
    }

    const entries = await this.fs.readDir(versionDir);
    const contracts: DiscoveredContract[] = [];
    for (const entry of entries) {
      if (!entry.isFile || !entry.name.endsWith('.contract.ts')) continue;
      const name = entry.name.slice(0, -'.contract.ts'.length);
      contracts.push({
        name,
        version,
        filePath: join(versionDir, entry.name),
        hasService: await this.fs.exists(join(rootPath, SCAFFOLD_DIRS.SERVICES, name)),
      });
    }

    contracts.sort((left, right) => left.name.localeCompare(right.name));
    return {
      version,
      contracts,
      modPath: join(versionDir, SCAFFOLD_FILES.MOD),
    };
  }
}
