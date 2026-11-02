import type { ComponentContract } from '../../../packages/fresh-ui/contracts.ts';

/** Build-time metadata; previews and visible examples share the same JSX expression. */
export interface ComponentPage {
  readonly name: string;
  readonly symbol: string;
  readonly source: string;
  readonly importStatement?: string;
  readonly description: string;
  readonly example: string;
  readonly props: readonly PropDoc[];
  readonly signatures: readonly string[];
  readonly contract?: ComponentContract;
  readonly cssTokens: readonly string[];
}

/** One implementation prop extracted from native deno doc JSON, never inferred from design. */
export interface PropDoc {
  readonly owner: string;
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly description: string;
}

/** Client-safe preset choices; effective values come from the shipped token manifest. */
export interface PresetChoice {
  readonly id: string;
  readonly code: string;
  readonly language: string;
  readonly flavor?: string;
  readonly accent: string;
  readonly density: string;
  readonly sourceDensity?: string;
  readonly values: Readonly<Record<string, string>>;
}

/** Rebuilt on every site build; the freshness gate verifies its complete input digest. */
export interface ComponentCatalog {
  readonly inputHash: string;
  readonly componentCssSources: readonly string[];
  readonly components: readonly ComponentPage[];
  readonly presets: readonly PresetChoice[];
}

/** Add an implemented anatomy here when its registry style item is available. */
export const COMPONENT_STYLES = [{ id: 'style-utility', label: 'Utility' }] as const;
export const COMPONENT_ROOT = '/design-system/components/';
export const PREVIEW_ROOT = '/assets/fresh-ui/';
export const DEFAULT_PRESET = 'studio-utility';

/** Browser metadata excludes component documentation and unused token values. */
export interface PresetCatalog {
  readonly presets: readonly PresetChoice[];
}

/** The workspace imports only these examples; other previews load on their own pages. */
export const WORKSPACE_COMPONENTS = [
  'stats-grid',
  'data-table',
  'card',
  'checkbox',
  'switch',
  'alert',
  'chart-block',
] as const;

/** Strip build-only documentation and keep only the effective values shown by the builder. */
export function presetCatalog(catalog: ComponentCatalog): PresetCatalog {
  return {
    presets: catalog.presets.map((preset) => ({
      ...preset,
      values: Object.fromEntries(
        ['radius-control', 'radius-md', 'font-sans', 'font-mono', 'menu-style']
          .filter((key) => key in preset.values).map((key) => [key, preset.values[key]]),
      ),
    })),
  };
}
