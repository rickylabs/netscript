import type { ComponentContractCatalog } from './component-contract.ts';

/** Serialize the public data without IO, callbacks or implementation imports. */
export function serializeComponentContracts(catalog: ComponentContractCatalog): string {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}
