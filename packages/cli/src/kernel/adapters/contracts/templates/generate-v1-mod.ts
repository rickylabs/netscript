/**
 * @module infra/contracts/templates/generate-v1-mod
 *
 * Tier 1 generator for `contracts/versions/v1/mod.ts`.
 */

import { toCamelCase, toPascalCase } from '@std/text';

const EMPTY_V1_MOD_TEMPLATE = new URL(
  '../../../assets/workspace/contracts/v1-empty.ts.template',
  import.meta.url,
);
const AGGREGATE_V1_MOD_TEMPLATE = new URL(
  '../../../assets/workspace/contracts/v1-aggregate.ts.template',
  import.meta.url,
);

/** Options for generating the v1 aggregate module. */
export interface GenerateV1ModOptions {
  /** Contract service names to include in the aggregate. */
  readonly serviceNames?: readonly string[];
}

/**
 * Generate the contents of `contracts/versions/v1/mod.ts`.
 *
 * @param options - Service contract names to aggregate.
 * @returns TypeScript source with trailing newline.
 */
export function generateV1Mod(options: GenerateV1ModOptions = {}): string {
  const serviceNames = [...(options.serviceNames ?? [])].sort();

  if (serviceNames.length === 0) {
    return Deno.readTextFileSync(EMPTY_V1_MOD_TEMPLATE);
  }

  const imports = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `import { ${pascal}ContractV1, ${pascal}V1 } from './${serviceName}.contract.ts';`;
  });

  const exports = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `  ${pascal}ContractV1,`;
  });

  const typeExports = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `export type {
  ${pascal}HealthV1,
  ${pascal}ListItemV1,
  ${pascal}ListInputV1,
  ${pascal}ListResponseV1,
  ${pascal}UpdateStatusInputV1,
  ${pascal}UpdateStatusResponseV1,
} from './${serviceName}.contract.ts';`;
  });

  const aggregateEntries = serviceNames.map((serviceName) => {
    const pascal = toPascalCase(serviceName);
    return `  ${toCamelCase(serviceName)}: ${pascal}V1,`;
  });

  return Deno.readTextFileSync(AGGREGATE_V1_MOD_TEMPLATE)
    .replace('{{imports}}', imports.join('\n'))
    .replace('{{exports}}', exports.join('\n'))
    .replace('{{typeExports}}', typeExports.join('\n'))
    .replace('{{aggregateEntries}}', aggregateEntries.join('\n'));
}
