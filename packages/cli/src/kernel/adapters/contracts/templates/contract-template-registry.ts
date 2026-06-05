/**
 * @module infra/contracts/templates
 *
 * Static and programmatic templates owned by the contract capability.
 */

import type { ContractTemplateRegistry } from '../types.ts';

const CONTRACT_TEMPLATE = new URL(
  '../../../assets/service/contract.ts.template',
  import.meta.url,
);
const CONTRACTS_MOD_TEMPLATE = new URL(
  '../../../assets/workspace/contracts/mod.ts.template',
  import.meta.url,
);

export { generateContractsDenoJson } from './generate-deno-json.ts';
export { generateV1Mod } from './generate-v1-mod.ts';
export type { GenerateV1ModOptions } from './generate-v1-mod.ts';

/** Default in-package registry for contract Tier 2 templates. */
export class DefaultContractTemplateRegistry implements ContractTemplateRegistry {
  /** Get the service contract template. */
  getContractTemplate(): string {
    return Deno.readTextFileSync(CONTRACT_TEMPLATE);
  }

  /** Get the root contracts/mod.ts template. */
  getRootModTemplate(): string {
    return Deno.readTextFileSync(CONTRACTS_MOD_TEMPLATE);
  }
}
