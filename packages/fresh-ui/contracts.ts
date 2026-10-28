/**
 * Style-independent component contracts for anatomy, props and accessibility.
 *
 * @example
 * ```ts
 * import type { ComponentContract } from '@netscript/fresh-ui/contracts';
 * ```
 * @module
 */
export type {
  ComponentContract,
  ComponentContractCatalog,
  ContractAttribute,
  ContractKey,
  ContractPart,
  ContractProp,
  ContractSlot,
  ContractValue,
} from './src/contracts/component-contract.ts';
export { serializeComponentContracts } from './src/contracts/serialization.ts';
export { componentContracts } from './src/contracts/catalog.ts';
