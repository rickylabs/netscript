/**
 * @module infra/contracts/version-registry
 *
 * Discovery-backed contract version aggregate generation.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ContractVersion } from './types.ts';
import { generateVersionMod } from './templates/contract-template-registry.ts';

/** Generate a version aggregate from explicit service names. */
export function generateVersionAggregate(
  version: ContractVersion,
  serviceNames: readonly string[],
): string {
  return generateVersionMod({ version, serviceNames });
}

/** Manage version aggregate modules under `contracts/versions/`. */
export class ContractVersionRegistry {
  /** Create a new registry. */
  constructor(private readonly fs: FileSystemPort) {}

  /**
   * Discover service contract names in a version directory.
   *
   * @param versionDir - Absolute path to `contracts/versions/<version>`.
   * @returns Sorted service names without `.contract.ts`.
   */
  async discoverServiceNames(versionDir: string): Promise<string[]> {
    const entries = await this.fs.readDir(versionDir);
    return entries
      .filter((entry) => entry.isFile && entry.name.endsWith('.contract.ts'))
      .map((entry) => entry.name.slice(0, -'.contract.ts'.length))
      .sort();
  }

  /**
   * Regenerate `contracts/versions/<version>/mod.ts` from discovered files.
   *
   * @param contractsRoot - Absolute contracts root directory.
   * @param version - Version directory to regenerate.
   * @returns Absolute path to the aggregate module.
   */
  async regenerate(
    contractsRoot: string,
    version: ContractVersion,
  ): Promise<string> {
    const versionDir = join(contractsRoot, SCAFFOLD_DIRS.VERSIONS, version);
    const serviceNames = await this.discoverServiceNames(versionDir);
    const content = generateVersionAggregate(version, serviceNames);
    const modPath = join(versionDir, SCAFFOLD_FILES.MOD);
    await this.fs.writeFile(modPath, content);
    return modPath;
  }

  /** Regenerate the root contract module from discovered version directories. */
  async regenerateRoot(contractsRoot: string): Promise<string> {
    const versionsDir = join(contractsRoot, SCAFFOLD_DIRS.VERSIONS);
    const entries = await this.fs.readDir(versionsDir);
    const versions = entries
      .filter((entry) => entry.isDirectory && /^v[1-9]\d*$/.test(entry.name))
      .map((entry) => entry.name as ContractVersion)
      .sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));
    const content = versions
      .map((version) => `export * from './versions/${version}/mod.ts';`)
      .join('\n');
    const modPath = join(contractsRoot, SCAFFOLD_FILES.MOD);
    await this.fs.writeFile(modPath, `${content}\n`);
    return modPath;
  }
}
