/** One legacy Utility selector and its orthogonal attribute. */
export interface VariantRule {
  readonly base: string;
  readonly attribute: string;
  readonly value: string;
}
/** Versioned 0.0.8 CSS vocabulary. Element and custom classes are retained. */
export const variantRules: Readonly<Record<string, VariantRule>> = {
  'ns-separator--vertical': {
    'base': 'ns-separator',
    'attribute': 'data-orientation',
    'value': 'vertical',
  },
  'ns-choice--disabled': {
    'base': 'ns-choice',
    'attribute': 'data-disabled',
    'value': 'true',
  },
  'ns-toast--success': {
    'base': 'ns-toast',
    'attribute': 'data-type',
    'value': 'success',
  },
  'ns-toast--error': {
    'base': 'ns-toast',
    'attribute': 'data-type',
    'value': 'error',
  },
  'ns-toast--warning': {
    'base': 'ns-toast',
    'attribute': 'data-type',
    'value': 'warning',
  },
  'ns-toast--info': {
    'base': 'ns-toast',
    'attribute': 'data-type',
    'value': 'info',
  },
  'ns-btn--loading': {
    'base': 'ns-btn',
    'attribute': 'data-state',
    'value': 'loading',
  },
  'ns-btn--primary': {
    'base': 'ns-btn',
    'attribute': 'data-variant',
    'value': 'primary',
  },
  'ns-btn--secondary': {
    'base': 'ns-btn',
    'attribute': 'data-variant',
    'value': 'secondary',
  },
  'ns-btn--ghost': {
    'base': 'ns-btn',
    'attribute': 'data-variant',
    'value': 'ghost',
  },
  'ns-btn--outline': {
    'base': 'ns-btn',
    'attribute': 'data-variant',
    'value': 'outline',
  },
  'ns-btn--destructive': {
    'base': 'ns-btn',
    'attribute': 'data-variant',
    'value': 'destructive',
  },
  'ns-btn--sm': {
    'base': 'ns-btn',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-btn--lg': {
    'base': 'ns-btn',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-btn--icon': {
    'base': 'ns-btn',
    'attribute': 'data-icon',
    'value': 'true',
  },
  'ns-choice--error': {
    'base': 'ns-choice',
    'attribute': 'data-invalid',
    'value': 'true',
  },
  'ns-skeleton__line--xs': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-size',
    'value': 'xs',
  },
  'ns-skeleton__line--sm': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-skeleton__line--md': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-size',
    'value': 'md',
  },
  'ns-skeleton__line--lg': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-skeleton__box--card': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-shape',
    'value': 'card',
  },
  'ns-skeleton__box--input': {
    'base': 'ns-skeleton__block',
    'attribute': 'data-shape',
    'value': 'input',
  },
  'ns-skeleton--stats': {
    'base': 'ns-skeleton',
    'attribute': 'data-variant',
    'value': 'stats',
  },
  'ns-skeleton--table': {
    'base': 'ns-skeleton',
    'attribute': 'data-variant',
    'value': 'table',
  },
  'ns-skeleton__table-row--head': {
    'base': 'ns-skeleton__table-row',
    'attribute': 'data-type',
    'value': 'header',
  },
  'ns-badge--primary': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'primary',
  },
  'ns-badge--secondary': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'secondary',
  },
  'ns-badge--success': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'success',
  },
  'ns-badge--warning': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'warning',
  },
  'ns-badge--destructive': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'destructive',
  },
  'ns-badge--muted': {
    'base': 'ns-badge',
    'attribute': 'data-variant',
    'value': 'muted',
  },
  'ns-spinner--sm': {
    'base': 'ns-spinner',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-spinner--md': {
    'base': 'ns-spinner',
    'attribute': 'data-size',
    'value': 'md',
  },
  'ns-spinner--lg': {
    'base': 'ns-spinner',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-desktop-window-chrome__action--close': {
    'base': 'ns-desktop-window-chrome__action',
    'attribute': 'data-action',
    'value': 'close',
  },
  'ns-progress--sm': {
    'base': 'ns-progress',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-progress--md': {
    'base': 'ns-progress',
    'attribute': 'data-size',
    'value': 'md',
  },
  'ns-progress--lg': {
    'base': 'ns-progress',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-progress--secondary': {
    'base': 'ns-progress',
    'attribute': 'data-variant',
    'value': 'secondary',
  },
  'ns-progress--success': {
    'base': 'ns-progress',
    'attribute': 'data-variant',
    'value': 'success',
  },
  'ns-progress--warning': {
    'base': 'ns-progress',
    'attribute': 'data-variant',
    'value': 'warning',
  },
  'ns-progress--destructive': {
    'base': 'ns-progress',
    'attribute': 'data-variant',
    'value': 'destructive',
  },
  'ns-progress--indeterminate': {
    'base': 'ns-progress',
    'attribute': 'data-state',
    'value': 'loading',
  },
  'ns-panel--muted': {
    'base': 'ns-panel',
    'attribute': 'data-variant',
    'value': 'muted',
  },
  'ns-panel--raised': {
    'base': 'ns-panel',
    'attribute': 'data-variant',
    'value': 'raised',
  },
  'ns-label--required': {
    'base': 'ns-label',
    'attribute': 'data-required',
    'value': 'true',
  },
  'ns-input--error': {
    'base': 'ns-input',
    'attribute': 'data-invalid',
    'value': 'true',
  },
  'ns-select--error': {
    'base': 'ns-select',
    'attribute': 'data-invalid',
    'value': 'true',
  },
  'ns-textarea--error': {
    'base': 'ns-textarea',
    'attribute': 'data-invalid',
    'value': 'true',
  },
  'ns-message--user': {
    'base': 'ns-message',
    'attribute': 'data-role',
    'value': 'user',
  },
  'ns-message--system': {
    'base': 'ns-message',
    'attribute': 'data-role',
    'value': 'system',
  },
  'ns-card--interactive': {
    'base': 'ns-card',
    'attribute': 'data-interactive',
    'value': 'true',
  },
  'ns-avatar--sm': {
    'base': 'ns-avatar',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-avatar--md': {
    'base': 'ns-avatar',
    'attribute': 'data-size',
    'value': 'md',
  },
  'ns-avatar--lg': {
    'base': 'ns-avatar',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-avatar--agent': {
    'base': 'ns-avatar',
    'attribute': 'data-content',
    'value': 'agent',
  },
  'ns-alert--info': {
    'base': 'ns-alert',
    'attribute': 'data-variant',
    'value': 'info',
  },
  'ns-inline-notice--info': {
    'base': 'ns-inline-notice',
    'attribute': 'data-variant',
    'value': 'info',
  },
  'ns-alert--success': {
    'base': 'ns-alert',
    'attribute': 'data-variant',
    'value': 'success',
  },
  'ns-inline-notice--success': {
    'base': 'ns-inline-notice',
    'attribute': 'data-variant',
    'value': 'success',
  },
  'ns-alert--warning': {
    'base': 'ns-alert',
    'attribute': 'data-variant',
    'value': 'warning',
  },
  'ns-inline-notice--warning': {
    'base': 'ns-inline-notice',
    'attribute': 'data-variant',
    'value': 'warning',
  },
  'ns-alert--destructive': {
    'base': 'ns-alert',
    'attribute': 'data-variant',
    'value': 'destructive',
  },
  'ns-inline-notice--destructive': {
    'base': 'ns-inline-notice',
    'attribute': 'data-variant',
    'value': 'destructive',
  },
  'ns-shell--wide': {
    'base': 'ns-shell',
    'attribute': 'data-width',
    'value': 'wide',
  },
  'ns-shell--narrow': {
    'base': 'ns-shell',
    'attribute': 'data-width',
    'value': 'narrow',
  },
  'ns-stack--xs': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': 'xs',
  },
  'ns-stack--sm': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': 'sm',
  },
  'ns-stack--md': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': 'md',
  },
  'ns-stack--lg': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': 'lg',
  },
  'ns-stack--xl': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': 'xl',
  },
  'ns-stack--2xl': {
    'base': 'ns-stack',
    'attribute': 'data-gap',
    'value': '2xl',
  },
  'ns-cluster--xs': {
    'base': 'ns-cluster',
    'attribute': 'data-gap',
    'value': 'xs',
  },
  'ns-cluster--sm': {
    'base': 'ns-cluster',
    'attribute': 'data-gap',
    'value': 'sm',
  },
  'ns-cluster--md': {
    'base': 'ns-cluster',
    'attribute': 'data-gap',
    'value': 'md',
  },
  'ns-cluster--lg': {
    'base': 'ns-cluster',
    'attribute': 'data-gap',
    'value': 'lg',
  },
  'ns-cluster--between': {
    'base': 'ns-cluster',
    'attribute': 'data-align',
    'value': 'between',
  },
  'ns-cluster--end': {
    'base': 'ns-cluster',
    'attribute': 'data-align',
    'value': 'end',
  },
  'ns-cluster--start': {
    'base': 'ns-cluster',
    'attribute': 'data-align',
    'value': 'start',
  },
  'ns-section--sm': {
    'base': 'ns-section',
    'attribute': 'data-size',
    'value': 'sm',
  },
  'ns-section--lg': {
    'base': 'ns-section',
    'attribute': 'data-size',
    'value': 'lg',
  },
  'ns-scroll-region--x': {
    'base': 'ns-scroll-region',
    'attribute': 'data-variant',
    'value': 'x',
  },
  'ns-scroll-region--y': {
    'base': 'ns-scroll-region',
    'attribute': 'data-variant',
    'value': 'y',
  },
  'ns-grid--2': {
    'base': 'ns-grid',
    'attribute': 'data-variant',
    'value': '2',
  },
  'ns-grid--3': {
    'base': 'ns-grid',
    'attribute': 'data-variant',
    'value': '3',
  },
  'ns-grid--4': {
    'base': 'ns-grid',
    'attribute': 'data-variant',
    'value': '4',
  },
};

/** Stateful legacy hooks only have meaning on their known component base. */
export function stateRule(token: string, classes: string): VariantRule | undefined {
  if (!/^is-(active|selected|open|visible)$/.test(token)) return undefined;
  const base = classes.match(
    /ns-(?:citation-chip|model-selector__option|dashboard-nav__link|sidebar-backdrop|sidebar)(?![\w-])/,
  )?.[0];
  if (!base) return undefined;
  return {
    base,
    attribute: 'data-state',
    value: token === 'is-open' || token === 'is-visible'
      ? 'open'
      : base === 'ns-citation-chip'
      ? 'active'
      : 'selected',
  };
}
