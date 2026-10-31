import { FRESH_UI_PACKAGE_VERSION } from '../../src/package-metadata.generated.ts';

/** Deliberately reviewed additions; the historical v1 compatibility snapshot stays frozen. */
export const POST_V1_COMPONENTS: readonly string[] = [
  'button-group',
  'toggle',
  'toggle-group',
  'radio-group',
  'input-group',
  'input-otp',
  'slider',
  'calendar',
  'date-picker',
  'location-marker',
  'navigation-menu',
  'stepper',
  'menubar',
  'alert-dialog',
  'hover-card',
  'context-menu',
  'item',
  'kbd',
  'collapsible',
  'chart',
  'carousel',
  'scroll-area',
  'aspect-ratio',
  'direction',
  'resizable',
  'marker',
  'trace',
  'attachment',
  'message-scroller',
  'questionnaire',
];

/** Non-component support items added after the frozen v1 baseline. */
export const POST_V1_SUPPORT: readonly string[] = [
  'calendar-date',
  'menu-items',
  'sidebar-support',
];

/** Existing copies missing only their actual package runtime dependency. */
export const LEGACY_RUNTIME_DEPENDENCY_REPAIRS = [
  'alert',
  'command-palette',
  'code-block',
  'pagination',
  'sidebar-shell',
] as const;

/** Explicit new copied dependencies for audited existing components. */
export const LEGACY_REGISTRY_DEPENDENCY_REPAIRS: Readonly<Record<string, readonly string[]>> = {
  'command-palette': ['kbd', 'spinner'],
  'sidebar-shell': ['sidebar-support'],
  'sidebar-toggle': ['sidebar-support'],
};

/** The registry and its package-owned runtime must install at the same release. */
export const FRESH_UI_RUNTIME_DEPENDENCY: string =
  `jsr:@netscript/fresh-ui@${FRESH_UI_PACKAGE_VERSION}`;

/** Updated baseline copies also receive real consumer install/type-check coverage. */
export const AUDITED_BASELINE_COMPONENTS: readonly string[] = [
  'data-table',
  'stats-grid',
  'sidebar-shell',
  'page-header',
  'command-palette',
  'alert',
  'code-block',
  'label',
  'card',
  'pagination',
];
