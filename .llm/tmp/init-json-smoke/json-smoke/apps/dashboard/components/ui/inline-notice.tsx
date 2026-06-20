/**
 * @component InlineNotice
 * @layer 2
 * @depends theme-seed
 * @description Compact contextual notice for inline guidance inside forms, panels, and cards.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/**
 * Visual variants for the inline notice block.
 */
export type InlineNoticeVariant = 'info' | 'success' | 'warning' | 'destructive';

type InlineNoticeProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & {
  children?: Renderable;
  class?: string;
  icon?: Renderable;
  title?: Renderable;
  variant?: InlineNoticeVariant;
};

const DEFAULT_ICONS: Record<InlineNoticeVariant, string> = {
  info: '⊕',
  success: '◎',
  warning: '⟳',
  destructive: '≠',
};

/**
 * Renders compact contextual guidance within cards, forms, and panels.
 */
export function InlineNotice(
  { children, class: className, icon, role = 'status', title, variant = 'info', ...props }:
    InlineNoticeProps,
): VNode {
  return (
    <div
      {...props}
      role={role}
      class={cn('ns-inline-notice', `ns-inline-notice--${variant}`, className)}
    >
      <span aria-hidden='true' class='ns-inline-notice__icon'>
        {icon ?? DEFAULT_ICONS[variant]}
      </span>
      <div class='ns-inline-notice__body'>
        {title ? <div class='ns-inline-notice__title'>{title}</div> : null}
        {children ? <div class='ns-inline-notice__description'>{children}</div> : null}
      </div>
    </div>
  );
}
