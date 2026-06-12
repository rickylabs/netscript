/**
 * @component Label
 * @layer 2
 * @depends theme-seed
 * @description Accessible form label with optional required-state styling.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface LabelProps
  extends Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  required?: boolean;
  srOnly?: boolean;
}

/**
 * Renders a field label with optional required and screen-reader-only states.
 */
export function Label({
  children,
  class: className,
  required = false,
  srOnly = false,
  ...props
}: LabelProps): VNode {
  return (
    <label
      {...props}
      class={cn(
        srOnly ? 'sr-only' : 'ns-label',
        required && !srOnly && 'ns-label--required',
        className,
      )}
    >
      {children}
    </label>
  );
}
