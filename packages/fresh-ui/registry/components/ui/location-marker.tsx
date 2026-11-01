/**
 * @component LocationMarker
 * @layer 2
 * @depends theme-seed
 * @description Decorative square location mark; its parent owns current-location semantics.
 */
import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface LocationMarkerProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'size' | 'class' | 'tabIndex' | 'children'> {
  size?: 'sm' | 'md';
  class?: string;
}

/** A decorative marker never adds a tab stop or duplicates aria-current. */
export function LocationMarker(
  { size = 'md', class: className, ...props }: LocationMarkerProps,
): VNode {
  return (
    <span
      {...props}
      class={cn('ns-location-marker', className)}
      data-scope='location-marker'
      data-part='root'
      data-size={size}
      aria-hidden='true'
      tabIndex={undefined}
    />
  );
}
