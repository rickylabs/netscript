/**
 * @component Switch
 * @layer 2
 * @depends theme-seed
 * @description CSS-first toggle switch built on a native checkbox input.
 */

import type { ComponentChildren, JSX } from 'preact';
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
        <input {...props} type='checkbox' role='switch' disabled={disabled} class='ns-switch' />
        <span aria-hidden='true' class='ns-switch__track'>
          <span class='ns-switch__thumb' />
        </span>
      </span>
      <span class='ns-choice__body'>
        <span class='ns-choice__label'>{children}</span>
        {description ? <span class='ns-choice__description'>{description}</span> : null}
      </span>
    </label>
  );
}
