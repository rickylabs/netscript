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
    <div {...props} class={cn('ns-field', className)} data-part='root' data-scope='field'>
      <Label data-part='label' data-scope='field' htmlFor={name} required={required}>{label}</Label>
      {children}
      {error
        ? (
          <div class='ns-field__error-row' data-part='error-row' data-scope='field'>
            <span
              aria-hidden='true'
              class='ns-field__error-icon'
              data-part='error-icon'
              data-scope='field'
            >
              ≠
            </span>
            <p class='ns-error-text' data-part='error' data-scope='field'>{error}</p>
          </div>
        )
        : helpText
        ? <p class='ns-help-text' data-part='description' data-scope='field'>{helpText}</p>
        : null}
    </div>
  );
}

/** Canonical Field name; FormField remains a compatibility export. */
export const Field: typeof FormField = FormField;
