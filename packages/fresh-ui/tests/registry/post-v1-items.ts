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
];

/** Non-component support items added after the frozen v1 baseline. */
export const POST_V1_SUPPORT: readonly string[] = ['calendar-date', 'menu-items'];

/** Existing copies missing only their actual package runtime dependency. */
export const LEGACY_RUNTIME_DEPENDENCY_REPAIRS = [
  'alert',
  'command-palette',
  'code-block',
  'pagination',
] as const;

/** The registry and its package-owned runtime must install at the same release. */
export const FRESH_UI_RUNTIME_DEPENDENCY: string =
  `jsr:@netscript/fresh-ui@${FRESH_UI_PACKAGE_VERSION}`;

/** Updated baseline copies also receive real consumer install/type-check coverage. */
export const AUDITED_BASELINE_COMPONENTS: readonly string[] = [
  'alert',
  'code-block',
  'label',
  'card',
  'pagination',
];
