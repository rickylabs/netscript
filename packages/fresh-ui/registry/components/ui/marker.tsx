/**
 * @component Marker
 * @layer 2
 * @depends theme-seed
 * @description In-thread event label with optional icon and separator rules.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Presentation variants of a thread event label. */
export type MarkerVariant = 'default' | 'border' | 'separator';

/** Marker adds no live region or keyboard interaction of its own. */
export interface MarkerProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  variant?: MarkerVariant;
  icon?: ComponentChildren;
  label?: ComponentChildren;
  class?: string;
}

/** Native child controls remain in the ordinary document tab order. */
export function Marker({
  variant = 'default',
  icon,
  label,
  children,
  class: className,
  ...props
}: MarkerProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-marker', className)}
      data-scope='marker'
      data-part='root'
      data-variant={variant}
    >
      {icon != null && <span data-scope='marker' data-part='icon' aria-hidden='true'>{icon}</span>}
      <span data-scope='marker' data-part='content'>{label ?? children}</span>
    </div>
  );
}
