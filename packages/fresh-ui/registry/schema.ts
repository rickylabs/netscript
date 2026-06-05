export type RegistryItemKind = 'theme' | 'component' | 'island' | 'support';

export type RegistryCopyOwnership = 'app-owned-after-copy';

export interface RegistryFileDefinition {
  source: string;
  destination: string;
}

export interface RegistryDependencyDefinition {
  kind: RegistryItemKind;
  name: string;
  optional?: boolean;
}

export interface RegistryItemDefinition {
  name: string;
  kind: RegistryItemKind;
  layer?: 2 | 3;
  description: string;
  copyOwnership: RegistryCopyOwnership;
  tags: string[];
  files: RegistryFileDefinition[];
  dependencies?: RegistryDependencyDefinition[];
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
  model: 'copy-based-registry';
  tokenSourceStrategy: 'css-seed-artifact-now-style-dictionary-later';
  items: RegistryItemDefinition[];
  collections: RegistryCollectionDefinition[];
}