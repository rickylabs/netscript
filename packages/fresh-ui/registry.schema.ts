export type RegistryItemKind =
  | 'theme'
  | 'style'
  | 'component'
  | 'island'
  | 'block'
  | 'lib'
  | 'hook'
  | 'support';

export type RegistryCopyOwnership = 'app-owned-after-copy';

export interface RegistryFileDefinition {
  source: string;
  target: string;
}

export interface RegistryCssContribution {
  layer?: 'base' | 'components' | 'utilities';
  content: string;
}

export interface RegistryCssVars {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export interface RegistryItemDefinition {
  name: string;
  kind: RegistryItemKind;
  layer?: 2 | 3;
  title?: string;
  description: string;
  author?: string;
  copyOwnership: RegistryCopyOwnership;
  tags: string[];
  files: RegistryFileDefinition[];
  registryDependencies?: string[];
  dependencies?: string[];
  css?: RegistryCssContribution[];
  cssVars?: RegistryCssVars;
  docs?: string;
  categories?: string[];
  meta?: Record<string, unknown>;
}

export interface RegistryCollectionDefinition {
  name: string;
  description: string;
  items: string[];
}

export interface RegistryManifest {
  name: string;
  version: string;
  packageName: string;
  homepage?: string;
  model: 'copy-based-registry';
  schemaVersion?: 2;
  tokenSourceStrategy: 'style-dictionary-dtcg-source';
  items: RegistryItemDefinition[];
  collections: RegistryCollectionDefinition[];
}
