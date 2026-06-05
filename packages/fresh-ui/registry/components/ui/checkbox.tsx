/**
 * @component Checkbox
 * @layer 2
 * @depends theme-seed
 * @description Styled checkbox with inline label and optional helper copy.
 */

import type { ComponentChildren, JSX } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface CheckboxProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
  description?: ComponentChildren;
  error?: boolean;
}

export function Checkbox(
  { children, class: className, description, disabled = false, error = false, ...props }:
    CheckboxProps,
) {
  return (
    <label
      class={cn(
        'ns-choice',
        disabled && 'ns-choice--disabled',
        error && 'ns-choice--error',
        className,
      )}
    >
      <span class='ns-choice__control'>
        <input {...props} type='checkbox' disabled={disabled} class='ns-checkbox' />
        <span aria-hidden='true' class='ns-checkbox__indicator'>✓</span>
      </span>
      <span class='ns-choice__body'>
        <span class='ns-choice__label'>{children}</span>
        {description ? <span class='ns-choice__description'>{description}</span> : null}
      </span>
    </label>
  );
}
