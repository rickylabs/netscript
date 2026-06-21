/**
 * @component Alert
 * @layer 2
 * @depends theme-seed
 * @description Persistent section-level feedback banner for success, warning, info, or error states.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/**
 * Visual variants for the alert banner.
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

type AlertProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & {
  children?: Renderable;
  class?: string;
  icon?: Renderable;
  title?: Renderable;
  variant?: AlertVariant;
};

const DEFAULT_ICONS: Record<AlertVariant, string> = {
  info: '⊕',
  success: '◎',
  warning: '⟳',
  destructive: '≠',
};

/**
 * Renders a persistent inline banner for section-level feedback.
 */
export function Alert(
  { children, class: className, icon, role, title, variant = 'info', ...props }: AlertProps,
): VNode {
  const resolvedRole = role ??
    (variant === 'warning' || variant === 'destructive' ? 'alert' : 'status');

  return (
    <div
      {...props}
      role={resolvedRole}
      class={cn('ns-alert', `ns-alert--${variant}`, className)}
    >
      <span aria-hidden='true' class='ns-alert__icon'>{icon ?? DEFAULT_ICONS[variant]}</span>
      <div class='ns-alert__body'>
        {title ? <div class='ns-alert__title'>{title}</div> : null}
        {children ? <div class='ns-alert__description'>{children}</div> : null}
      </div>
    </div>
  );
}
