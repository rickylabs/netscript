/**
 * @module infra/contracts/templates
 *
 * Static and programmatic templates owned by the contract capability.
 */

import type { ContractTemplateRegistry } from '../types.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../templates/template-asset.ts';

export { generateContractsDenoJson } from './generate-deno-json.ts';
export { generateV1Mod } from './generate-v1-mod.ts';
export type { GenerateV1ModOptions } from './generate-v1-mod.ts';

/** Default in-package registry for contract Tier 2 templates. */
export class DefaultContractTemplateRegistry implements ContractTemplateRegistry {
  /** Get the service contract template. */
  getContractTemplate(): string {
    return readTemplateAssetSync(TEMPLATE_KEYS.serviceContract);
  }

  /** Get the no-database in-memory service contract template. */
  getMemoryContractTemplate(): string {
    return readTemplateAssetSync(TEMPLATE_KEYS.serviceContractMemory);
  }

  /** Get the root contracts/mod.ts template. */
  getRootModTemplate(): string {
    return readTemplateAssetSync(TEMPLATE_KEYS.workspaceContractsMod);
  }
}
