/**
 * @component Select
 * @layer 2
 * @depends theme-seed
 * @description Native select wrapper with token-driven focus and error states.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * Native select option metadata.
 */
export interface SelectOption {
  /** Serialized option value. */
  value: string;
  /** Visible option label. */
  label: string;
  /** Disables selection for this option. */
  disabled?: boolean;
}

interface SelectProps
  extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'class' | 'children'> {
  class?: string;
  error?: boolean;
  options: readonly SelectOption[];
  placeholder?: string;
  selectedValues?: readonly string[];
  readonly [key: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Renders a token-aware native select control.
 */
export function Select({
  class: className,
  error = false,
  options,
  placeholder,
  value,
  defaultValue,
  selectedValues,
  ...props
}: SelectProps): VNode {
  const resolvedSelectedValues = new Set(
    normalizeSelectedValues(
      selectedValues ?? value ?? defaultValue,
      props.multiple === true,
    ),
  );

  return (
    <select
      {...props}
      value={value}
      defaultValue={defaultValue}
      class={cn('ns-select', error && 'ns-select--error', className)}
    >
      {
        /* Keep option-level selected attributes for SSR so the initial HTML is correct
          before hydration or browser reconciliation touches the control. */
      }
      {placeholder
        ? <option value='' selected={resolvedSelectedValues.size === 0}>{placeholder}</option>
        : null}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          selected={resolvedSelectedValues.has(option.value)}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

function normalizeSelectedValues(
  value: unknown,
  multiple: boolean,
): string[] {
  if (Array.isArray(value)) {
    return multiple ? [...value] : value.length > 0 ? [value[0] ?? ''] : [];
  }

  if (typeof value === 'string') {
    return value.length > 0 ? [value] : [];
  }

  return [];
}
