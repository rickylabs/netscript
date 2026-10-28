/**
 * @component Switch
 * @layer 2
 * @depends theme-seed
 * @description CSS-first toggle switch built on a native checkbox input.
 */

import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface SwitchProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
  description?: ComponentChildren;
  error?: boolean;
}

export function Switch(
  { children, class: className, description, disabled = false, error = false, ...props }:
    SwitchProps,
): VNode {
  return (
    <label
      class={cn('ns-choice', className)}
      data-disabled={disabled ? ('true') : undefined}
      data-invalid={error ? 'true' : undefined}
      data-state={disabled ? 'disabled' : error ? 'invalid' : 'rest'}
      data-checked={(props.checked ?? props.defaultChecked) ? 'true' : 'false'}
      data-part='root'
      data-scope='switch'
    >
      <span class='ns-choice__control' data-part='control' data-scope='switch'>
        <input
          {...props}
          type='checkbox'
          role='switch'
          disabled={disabled}
          class='ns-switch'
          data-part='control'
          data-scope='switch'
        />
        <span aria-hidden='true' class='ns-switch__track' data-part='track' data-scope='switch'>
          <span class='ns-switch__thumb' data-part='thumb' data-scope='switch' />
        </span>
      </span>
      <span class='ns-choice__body' data-part='body' data-scope='switch'>
        <span class='ns-choice__label' data-part='label' data-scope='switch'>{children}</span>
        {description
          ? (
            <span class='ns-choice__description' data-part='description' data-scope='switch'>
              {description}
            </span>
          )
          : null}
      </span>
    </label>
  );
}
