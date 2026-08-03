/**
 * @module @netscript/fresh-ui/registry
 *
 * Embedded Fresh UI copy-registry manifest and file content.
 */

import { freshUiRegistryManifest as manifest } from './registry.manifest.ts';

export { FRESH_UI_REGISTRY_CONTENT } from './registry.generated.ts';

/** File entry copied from the Fresh UI registry into an application workspace. */
export type FreshUiRegistryFile = {
  /** Source path inside the Fresh UI registry package. */
  readonly source: string;
  /** Target path or target alias inside the consuming application. */
  readonly target: string;
};

/** CSS contribution appended to the consuming application's style aggregator. */
export type FreshUiRegistryCssContribution = {
  /** Optional CSS cascade layer for the contribution. */
  readonly layer?: 'base' | 'components' | 'utilities';
  /** CSS text, usually an `@import` statement for a copied asset. */
  readonly content: string;
};

/** Fresh UI registry item that can be copied into an application workspace. */
export type FreshUiRegistryItem = {
  /** Stable registry item name. */
  readonly name: string;
  /** Optional item category such as `component`, `style`, `theme`, or `lib`. */
  readonly kind?: string;
  /** Files owned by this registry item. */
  readonly files: readonly FreshUiRegistryFile[];
  /** Other registry items that must be installed first. */
  readonly registryDependencies?: readonly string[];
  /** Runtime import dependencies to merge into the target app's `deno.json`. */
  readonly dependencies?: readonly string[];
  /** Optional CSS aggregator contributions for this item. */
  readonly css?: readonly FreshUiRegistryCssContribution[];
};

/** Named registry collection that expands to multiple item names. */
export type FreshUiRegistryCollection = {
  /** Stable collection name. */
  readonly name: string;
  /** Registry item names included in the collection. */
  readonly items: readonly string[];
};

/** Public embedded Fresh UI registry manifest consumed by the NetScript CLI. */
export type FreshUiRegistryManifest = {
  /** Copyable registry items. */
  readonly items: readonly FreshUiRegistryItem[];
  /** Named groups of registry items. */
  readonly collections: readonly FreshUiRegistryCollection[];
};

/**
 * Embedded Fresh UI copy-registry manifest.
 *
 * Runtime behaviour ships from `/interactive`, `/primitives` and `DataGrid`; visual components and blocks are **copied into your app** — inspect `components/ui/mod.ts` and `/design`, or run `ui:add`.
 *
 * The registry contains 66 items total; enumerate all items via `freshUiRegistryManifest.items`.
 *
 * Collections:
 * - `foundation`: theme-seed, sheet-styles, button, icon-button, input, textarea, checkbox, switch, label, select, form-field, card, panel, badge, separator, alert, inline-notice, spinner, progress, skeleton, breadcrumb, sidebar-shell, page-header, filter-form, stats-grid, detail-layout, data-table, responsive-table, pagination, empty-state, section-divider, sidebar-toggle, theme-toggle, toast-support, toast, avatar, code-block, chart-block, donut, dropzone, desktop-tray-menu, desktop-dialog, desktop-notification, desktop-window-chrome, desktop-update-prompt, desktop-only
 * - `ai`: theme-seed, avatar, citation-chip, code-block, chart-block, model-selector, tool-call-card, prompt-input, message, command-palette, search, markdown, chat-render, mcp-ui-widget, render-ui
 * - `forms-core`: theme-seed, button, icon-button, input, textarea, checkbox, switch, label, select, form-field
 * - `surface-core`: theme-seed, card, panel, badge, separator
 * - `feedback-core`: theme-seed, alert, inline-notice, spinner, progress, skeleton, toast-support, toast
 * - `layout-foundations`: layout-objects
 * - `dashboard-blocks`: theme-seed, breadcrumb, sidebar-shell, sidebar-toggle, page-header, filter-form, stats-grid, detail-layout, data-table, responsive-table, pagination, empty-state, section-divider
 * - `desktop`: theme-seed, desktop-tray-menu, desktop-dialog, desktop-notification, desktop-window-chrome, desktop-update-prompt, desktop-only
 */
export const freshUiRegistryManifest: FreshUiRegistryManifest = manifest;
