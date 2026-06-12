/**
 * @component FormField
 * @layer 2
 * @depends Label
 * @description Composed field wrapper for labels, help text, and error messaging.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';
import { Label } from './label.tsx';

interface FormFieldProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class'> {
  label: Renderable;
  name: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  class?: string;
  children: Renderable;
}

/**
 * Renders a labeled form field wrapper with help and error messaging.
 */
export function FormField({
  label,
  name,
  required = false,
  error,
  helpText,
  class: className,
  children,
  ...props
}: FormFieldProps): VNode {
  return (
    <div {...props} class={cn('ns-field', className)}>
      <Label htmlFor={name} required={required}>{label}</Label>
      {children}
      {error
        ? (
          <div class='ns-field__error-row'>
            <span aria-hidden='true' class='font-mono text-xs leading-none text-ns-destructive'>
              ≠
            </span>
            <p class='ns-error-text'>{error}</p>
          </div>
        )
        : helpText
        ? <p class='ns-help-text'>{helpText}</p>
        : null}
    </div>
  );
}
