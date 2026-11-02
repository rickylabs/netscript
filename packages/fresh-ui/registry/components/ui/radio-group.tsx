/**
 * @component RadioGroup
 * @layer 2
 * @depends theme-seed
 * @description Native grouped radio controls with a fieldset/legend and token styling.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** A native radio value and its visible content. */
export interface RadioOption {
  value: string;
  label: ComponentChildren;
  description?: ComponentChildren;
  disabled?: boolean;
}

/** Native name/required semantics work both before and after hydration. */
export interface RadioGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLFieldSetElement>, 'class' | 'onChange'> {
  name: string;
  legend: ComponentChildren;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  state?: 'rest' | 'hover' | 'focus' | 'disabled' | 'invalid';
  disabled?: boolean;
  required?: boolean;
  class?: string;
}

/** Arrow/Space and form participation belong to the browser's named radio group. */
export function RadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = 'vertical',
  state = 'rest',
  disabled = false,
  required = false,
  class: className,
  ...props
}: RadioGroupProps): VNode {
  const [local, setLocal] = useState(defaultValue);
  const [, refresh] = useState(0);
  const chosen = value ?? local;
  const unavailable = disabled || state === 'disabled';
  return (
    <fieldset
      {...props}
      disabled={unavailable}
      class={cn('ns-radio-group', className)}
      data-scope='radio-group'
      data-part='root'
      data-orientation={orientation}
      data-state={unavailable ? 'disabled' : state}
      aria-invalid={state === 'invalid' || undefined}
    >
      <legend>{legend}</legend>
      <div class='ns-radio-group__options'>
        {options.map((option) => (
          <label key={option.value} class='ns-radio-group__option'>
            <span class='ns-radio-group__control'>
              <input
                type='radio'
                name={name}
                value={option.value}
                checked={chosen === option.value}
                disabled={unavailable || option.disabled}
                required={required}
                aria-invalid={state === 'invalid' || undefined}
                aria-describedby={props['aria-describedby']}
                data-scope='radio-group'
                data-part='control'
                data-checked={String(chosen === option.value)}
                data-state={unavailable || option.disabled ? 'disabled' : state}
                onChange={(event) => {
                  if (value === undefined) setLocal(event.currentTarget.value);
                  else refresh((revision) => revision + 1);
                  onValueChange?.(event.currentTarget.value);
                }}
              />
              <span data-scope='radio-group' data-part='indicator' aria-hidden='true' />
            </span>
            <span data-scope='radio-group' data-part='body'>
              <span data-scope='radio-group' data-part='label'>{option.label}</span>
              {option.description != null && (
                <span data-scope='radio-group' data-part='description'>{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
