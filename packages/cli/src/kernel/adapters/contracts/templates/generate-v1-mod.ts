/**
 * @module infra/contracts/templates/generate-v1-mod
 *
 * Tier 1 generator for `contracts/versions/v1/mod.ts`.
 */

import { toCamelCase, toPascalCase } from '@std/text';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../templates/template-asset.ts';
import type { ContractVersion } from '../types.ts';

/** Options for generating the v1 aggregate module. */
export interface GenerateV1ModOptions {
  /** Contract service names to include in the aggregate. */
  readonly serviceNames?: readonly string[];
}

/** Options for generating any version aggregate module. */
export interface GenerateVersionModOptions extends GenerateV1ModOptions {
  /** Version identifier used in symbols and the aggregate object. */
  readonly version: ContractVersion;
}

/**
 * Generate the contents of `contracts/versions/v1/mod.ts`.
 *
 * @param options - Service contract names to aggregate.
 * @returns TypeScript source with trailing newline.
 */
export function generateV1Mod(options: GenerateV1ModOptions = {}): string {
  return generateVersionMod({ ...options, version: 'v1' });
}

/** Generate a version aggregate with version-specific symbols. */
export function generateVersionMod(options: GenerateVersionModOptions): string {
  const serviceNames = [...(options.serviceNames ?? [])].sort();
  const versionNumber = options.version.slice(1);
  const symbolSuffix = `V${versionNumber}`;

  if (serviceNames.length === 0) {
    return readTemplateAssetSync(TEMPLATE_KEYS.workspaceContractsV1Empty)
      .replaceAll('versions/v1', `versions/${options.version}`)
      .replaceAll('Version 1', `Version ${versionNumber}`)
      .replaceAll('`v1`', `\`${options.version}\``)
      .replace('export const v1', `export const ${options.version}`);
  }

  const imports = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `import { ${pascal}Contract${symbolSuffix}, ${pascal}${symbolSuffix} } from './${serviceName}.contract.ts';`;
  });

  const exports = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `  ${pascal}Contract${symbolSuffix},`;
  });

  const typeExports = serviceNames.map((serviceName) => {
    return `export type * from './${serviceName}.contract.ts';`;
  });

  const aggregateEntries = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `  ${toCamelCase(serviceName)}: ${pascal}${symbolSuffix},`;
  });

  return readTemplateAssetSync(TEMPLATE_KEYS.workspaceContractsV1Aggregate)
    .replace('{{imports}}', imports.join('\n'))
    .replace('{{exports}}', exports.join('\n'))
    .replace('{{typeExports}}', typeExports.join('\n'))
    .replace('{{aggregateEntries}}', aggregateEntries.join('\n'))
    .replaceAll('versions/v1', `versions/${options.version}`)
    .replaceAll('Version 1', `Version ${versionNumber}`)
    .replace('export const v1', `export const ${options.version}`);
}
