import { componentContracts } from '../../../packages/fresh-ui/contracts.ts';
import { freshUiRegistryJson } from '../../../packages/fresh-ui/registry.ts';
import { assertFigmaTokenNames } from '../../../packages/fresh-ui/src/tokens/adapters/figma/figma-token-names.ts';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';
import type { LibraryInput } from './contract.ts';

/** Identity-only joins documented by existing Utility render fixtures; no anatomy/style data. */
export const CONTRACT_ALIASES: Readonly<Record<string, string>> = {
  'form-field': 'field',
  'markdown': 'prose',
  'sidebar-shell': 'sidebar',
  'responsive-table': 'table',
  'desktop-tray-menu': 'tray-menu',
  'desktop-window-chrome': 'window-chrome',
  'desktop-update-prompt': 'update-prompt',
};

/** Load the same code-owned registry, contract and token identities used by the shipped toolchain. */
export function defaultLibraryInput(): LibraryInput {
  assertFigmaTokenNames(collections);
  return {
    catalog: componentContracts,
    registry: freshUiRegistryJson,
    collections,
    style: 'style-utility',
    aliases: CONTRACT_ALIASES,
  };
}
