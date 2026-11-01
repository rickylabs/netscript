/** Explicit new identities; never infer strictness from a mutable shipped flag. */
export const STRICT_NEW_COMPONENTS: readonly string[] = [
  'scroll-area',
  'resizable',
  'aspect-ratio',
  'direction',
  'message-scroller',
  'marker',
  'trace',
  'questionnaire',
  'attachment',
  'file-path-chip',
  'attribute-chip',
  'toc',
  'file-tree',
  'figure',
  'anchor-nav',
  'ruled-grid',
  'hero',
  'window-chrome',
  'tray-menu',
];

/** A deliberately reviewed private binding; public axes must always use canonical validation. */
export interface PrivateDataBinding {
  readonly component: string;
  readonly part: string;
  readonly attribute: `data-${string}`;
  readonly purpose: string;
}

/** Existing private bindings will be classified here in the all-style slice, never inferred. */
export const privateDataBindings: readonly PrivateDataBinding[] = [
  {
    component: 'window-chrome',
    part: 'action',
    attribute: 'data-desktop-action',
    purpose: 'Legacy native operation callback payload; never read by CSS.',
  },
  {
    component: 'tray-menu',
    part: 'action',
    attribute: 'data-action-id',
    purpose: 'Caller stable command callback payload; never read by CSS.',
  },
];
