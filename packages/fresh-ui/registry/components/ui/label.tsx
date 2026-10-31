/**
 * @component Label
 * @layer 2
 * @depends theme-seed
 * @description Accessible form label with optional required-state styling.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface LabelProps extends Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: Renderable;
  variant?: 'default' | 'eyebrow';
  /** Presentation only; the associated input owns disabled/invalid semantics. */
  state?: 'rest' | 'disabled' | 'invalid';
  'data-part'?: string;
  'data-scope'?: string;
  srOnly?: boolean;
}

/**
 * Renders a field label with optional required and screen-reader-only states.
 */
export function Label({
  children,
  class: className,
  required = false,
  optional = false,
  optionalText = '(optional)',
  variant = 'default',
  state = 'rest',
  srOnly = false,
  ...props
}: LabelProps): VNode {
  return (
    <label
      {...props}
      class={cn(srOnly ? 'sr-only' : 'ns-label', className)}
      data-required={(required && !srOnly) ? ('true') : undefined}
      data-variant={variant}
      data-state={state}
      data-sr-only={String(srOnly)}
      data-part={props['data-part'] ?? 'root'}
      data-scope={props['data-scope'] ?? 'label'}
    >
      <span
        data-part='text'
        data-scope='label'
      >
        {children}
      </span>
      {optional && !required && (
        <span data-part='optional-hint' data-scope='label'>{optionalText}</span>
      )}
    </label>
  );
}
