/**
 * Portable JSON registry protocol, validation and static publishing for Fresh UI.
 *
 * @example
 * ```ts
 * import { validateRegistryItem } from '@netscript/fresh-ui/registry-v2';
 * const item = validateRegistryItem({ name: 'welcome', type: 'registry:block' });
 * ```
 * @module
 */
export { REGISTRY_ITEM_TYPES } from './src/registry/registry-contract.ts';
export type {
  Registry,
  RegistryCss,
  RegistryFile,
  RegistryFont,
  RegistryItem,
  RegistryItemType,
} from './src/registry/registry-contract.ts';
export {
  REGISTRY_ITEM_SCHEMA_URL,
  REGISTRY_SCHEMA_URL,
  validateRegistry,
  validateRegistryItem,
} from './src/registry/validate-registry.ts';
