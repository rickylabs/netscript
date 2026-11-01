/**
 * @component Checkbox
 * @layer 2
 * @depends theme-seed
 * @description Styled checkbox with inline label and optional helper copy.
 */

import type { ComponentChildren, JSX, VNode } from 'preact';
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
): VNode {
  return (
    <label
      class={cn('ns-choice', className)}
      data-disabled={disabled ? ('true') : undefined}
      data-invalid={error ? 'true' : undefined}
      data-state={disabled ? 'disabled' : error ? 'invalid' : 'rest'}
      data-checked={(props.checked ?? props.defaultChecked) ? 'true' : 'false'}
      data-part='root'
      data-scope='checkbox'
    >
      <span class='ns-choice__control' data-part='control' data-scope='checkbox'>
        <input
          {...props}
          type='checkbox'
          disabled={disabled}
          class='ns-checkbox'
          data-part='control'
          data-scope='checkbox'
        />
        <span
          aria-hidden='true'
          class='ns-checkbox__indicator'
          data-part='indicator'
          data-scope='checkbox'
        >
          ✓
        </span>
      </span>
      <span class='ns-choice__body' data-part='body' data-scope='checkbox'>
        <span class='ns-choice__label' data-part='label' data-scope='checkbox'>{children}</span>
        {description
          ? (
            <span class='ns-choice__description' data-part='description' data-scope='checkbox'>
              {description}
            </span>
          )
          : null}
      </span>
    </label>
  );
}
